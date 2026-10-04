import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight, ListFilter, Crosshair, FileUp, Loader2, MapPin, Pause, Play, Search, Square, X } from "lucide-react";
import { COMUNAS } from "@/data/comunas";
import { useStore } from "@/hooks/useStore";
import type { AddressRow } from "@/hooks/useStore";
import type { GeocodeCandidate } from "@/types";
import { normalize } from "@/engine/normalizer";
import { geocodeAddress, METHOD_LABELS, resultFromCandidate } from "@/engine/geocoder";
import { geocodeBatch, pause, resume, cancel } from "@/engine/geocoder.worker";
import { detectAddressColumn, parseCSV, parseXLSX, validateFile } from "@/engine/parser";
import { exportFormat } from "@/engine/exporter";
import { isSupabaseConfigured } from "@/engine/supabase";
import { WorkspaceMap } from "./WorkspaceMap";
import "./destino.css";

const EXAMPLES = [{ address: "Matucana 501", comuna: "Santiago" }, { address: "José Miguel de la Barra 650", comuna: "Santiago" }, { address: "Maipú 2359", comuna: "Concepción" }];
const COMUNA_OPTIONS = [...new Set(COMUNAS.map(c => c.nombre))];

export function ControlPanel() {
  const [destino, setDestino] = useState(() => new URLSearchParams(window.location.search).get("design") !== "classic");
  const rows = useStore(s => s.rows), setRows = useStore(s => s.setRows), updateRow = useStore(s => s.updateRowGeocode);
  const [mode, setMode] = useState<"search" | "batch">(() => destino ? "batch" : "search");
  const [address, setAddress] = useState(""), [comuna, setComuna] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false), [paused, setPaused] = useState(false);
  const [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false), [filter, setFilter] = useState("all");
  const [rowQuery, setRowQuery] = useState(""), [page, setPage] = useState(0);
  const [entryExpanded, setEntryExpanded] = useState(false);
  const [manualLat, setManualLat] = useState(""), [manualLon, setManualLon] = useState("");
  const [file, setFile] = useState<{ name: string; data: Record<string, string>[]; headers: string[] } | null>(null);
  const [columns, setColumns] = useState<string[]>([]), [comunaColumn, setComunaColumn] = useState("");
  const [fileBusy, setFileBusy] = useState(false), [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [exporting, setExporting] = useState(false), [format, setFormat] = useState<"csv" | "xlsx" | "geojson" | "shp">("geojson");
  const [coverage, setCoverage] = useState<{ segments: number; comunas: Record<string, unknown> } | null>(null);
  const abort = useRef<AbortController | null>(null), fileInput = useRef<HTMLInputElement>(null), searchInput = useRef<HTMLInputElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const active = rows.find(row => row.id === activeId);
  const result = active?.geocode;
  const selected = rows.filter(row => row.selected && row.geocode?.found);
  const completed = rows.filter(row => row.geocode);
  const recorded = rows.filter(row => row.geocode?.method === "address");
  const estimated = rows.filter(row => row.geocode?.method === "interpolated");
  const review = rows.filter(row => row.geocode?.needsReview);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}callejero/manifest.json`, { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(setCoverage).catch(() => {});
    return () => { controller.abort(); abort.current?.abort(); cancel(); };
  }, []);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!address.trim() || busy) return;
    setError(""); setNotice(""); setEditing(false); setBusy(true); setProgress({ current: 0, total: 1 });
    const row: AddressRow = { id: 1, original: { direccion: address, comuna }, normalized: normalize(address, comuna || undefined), selected: true };
    setRows([row]); setActiveId(1); setFilter("all"); setRowQuery(""); setPage(0);
    const controller = new AbortController(); abort.current = controller;
    try {
      const geocode = await geocodeAddress(row.normalized.normalized, controller.signal, row.normalized);
      updateRow(1, geocode); setProgress({ current: 1, total: 1 });
      setNotice(geocode.found ? "Consulta terminada. Revisa el método y la evidencia." : "Sin una ubicación suficiente. Revisa la calle, número o comuna.");
      resultHeading.current?.focus();
    } catch { setNotice(controller.signal.aborted ? "Consulta detenida." : "No se pudo completar la consulta. Puedes intentarlo otra vez."); }
    finally { setBusy(false); abort.current = null; }
  }

  async function readFile(input: File) {
    if (busy || fileBusy) return;
    setError(""); setNotice("");
    const validation = validateFile(input);
    if (validation) { setError(validation.message); return; }
    setFileBusy(true);
    try {
      const parsed = input.name.toLowerCase().endsWith("csv") ? await parseCSV(input) : await parseXLSX(input);
      setFile({ name: parsed.fileName, data: parsed.data, headers: parsed.headers });
      const suggested = detectAddressColumn(parsed.headers);
      setColumns(suggested ? [suggested] : []);
      setComunaColumn(parsed.headers.find(h => /^(comuna|municipalidad)$/i.test(h)) || "");
      setMode("batch");
      setEntryExpanded(true);
    } catch (e) { setError((e as { message?: string }).message || "No se pudo leer el archivo."); }
    finally { setFileBusy(false); if (fileInput.current) fileInput.current.value = ""; }
  }

  function loadExample() {
    if (busy || fileBusy) return;
    setFile({ name: "ejemplo-direcciones.csv", headers: ["dirección", "comuna"], data: EXAMPLES.map(item => ({ dirección: item.address, comuna: item.comuna })) });
    setColumns(["dirección"]); setComunaColumn("comuna"); setMode("batch"); setError("");
    setNotice("Lote de ejemplo: tres direcciones públicas. Pulsa Procesar para consultar las fuentes.");
  }

  const batchPreview = useMemo(() => file?.data.slice(0, 3).map(row => normalize(columns.map(c => row[c]).filter(Boolean).join(" "), row[comunaColumn] || comuna || undefined)) || [], [file, columns, comunaColumn, comuna]);

  async function processBatch() {
    if (!file || !columns.length || busy || fileBusy) return;
    const next: AddressRow[] = file.data.map((original, i) => ({ id: i + 1, original,
      normalized: normalize(columns.map(c => original[c]).filter(Boolean).join(" "), original[comunaColumn] || comuna || undefined), selected: true }));
    setRows(next); setActiveId(1); setBusy(true); setPaused(false); setEditing(false); setError(""); setNotice(""); setFilter("all");
    setEntryExpanded(false);
    setProgress({ current: 0, total: next.length }); setRowQuery(""); setPage(0);
    const controller = new AbortController(); abort.current = controller;
    try {
      await geocodeBatch(next.map(row => row.normalized), p => setProgress({ current: p.current, total: p.total }), controller.signal,
        (index, geocode) => updateRow(index + 1, geocode));
      setNotice(controller.signal.aborted ? "Lote detenido. Se conservaron las filas procesadas." : "Lote terminado. Puedes revisar y exportar los resultados.");
    } catch { setError("El lote se interrumpió. Se conservaron los resultados disponibles."); }
    finally { setBusy(false); setPaused(false); abort.current = null; }
  }

  function stop() { cancel(); abort.current?.abort(); setPaused(false); }
  function selectCandidate(candidate: GeocodeCandidate) {
    if (!active || !result) return;
    updateRow(active.id, resultFromCandidate(candidate, result.candidates || [], result.sources || []));
    setEditing(false);
  }
  function manual(lat: number, lon: number) {
    if (!active) return;
    const candidate: GeocodeCandidate = { id: `manual:${active.id}`, lat, lon, score: 0, source: "Ajuste del usuario", method: "manual", label: active.normalized.normalized,
      evidence: ["Posición indicada manualmente sobre el mapa"], warnings: ["Posición sin validación automática"] };
    updateRow(active.id, resultFromCandidate(candidate, [candidate, ...(result?.candidates || []).filter(c => c.method !== "manual")], result?.sources || []));
    setNotice("Posición manual guardada para esta sesión. Se incluirá en la exportación."); setEditing(false);
  }
  async function exportRows() {
    setExporting(true); setError(""); setNotice("");
    try { await exportFormat(selected, format); setNotice(`${selected.length} ubicaciones exportadas.`); }
    catch (cause) { console.error("Error de exportación", cause); setError("No se pudo exportar. Conservamos tu selección; puedes usar otro formato."); }
    finally { setExporting(false); }
  }
  const unlocated = rows.filter(row => row.geocode && !row.geocode.found);
  function visibleRows(key: string, text: string) {
    const query = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
    return rows.filter(row => key === "all" || key === "review" && row.geocode?.needsReview || key === "unlocated" && row.geocode && !row.geocode.found || key === "address" && row.geocode?.method === "address")
      .filter(row => (row.normalized.normalized + " " + (row.normalized.comuna || "")).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").includes(query));
  }
  const filtered = visibleRows(filter, rowQuery);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 100));
  const currentPage = Math.min(page, pageCount - 1);
  const displayedRows = filtered.slice(currentPage * 100, (currentPage + 1) * 100);
  const compactEntry = destino && mode === "batch" && !!file && completed.length > 0 && !busy;
  function changeRowQuery(text: string) {
    setRowQuery(text); setPage(0);
    const visible = visibleRows(filter, text);
    if (!visible.some(row => row.id === activeId)) { setActiveId(visible[0]?.id ?? null); setEditing(false); }
  }
  function changeFilter(key: string) {
    setFilter(key); setPage(0);
    const visible = visibleRows(key, rowQuery);
    if (!visible.some(row => row.id === activeId)) { setActiveId(visible[0]?.id ?? null); setEditing(false); }
  }
  function nextReview() {
    if (!review.length) return;
    const index = (review.findIndex(row => row.id === activeId) + 1) % review.length;
    setActiveId(review[index].id); setEditing(false); setFilter("review"); setRowQuery(""); setPage(Math.floor(index / 100));
    requestAnimationFrame(() => {
      const target = document.getElementById(`address-row-${review[index].id}`);
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    });
  }
  const pct = progress.total ? Math.round(progress.current / progress.total * 100) : 0;

  function changeDesign(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (busy || fileBusy) return;
    const url = new URL(window.location.href);
    if (destino) url.searchParams.set("design", "classic"); else url.searchParams.delete("design");
    window.history.replaceState(null, "", url);
    setDestino(!destino);
  }

  return <div className={`control-panel ${destino ? "destino-panel tech-panel" : ""}`}>
    <a className="skip-link" href="#query">Ir a la entrada de datos</a>
    <header className="app-header">
      <a className="brand" href="#query" aria-label="Azimut, inicio"><span className="brand-symbol" aria-hidden="true">{destino ? <svg width="30" height="30" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeWidth="1" /><path d="M9 23L23 9M16 4V28M4 16H28" fill="none" stroke="currentColor" strokeWidth="1" /><path d="M16 16L23 9L20 18Z" fill="currentColor" /></svg> : "↗"}</span>{destino ? "Azimut" : "AZIMUT"}<span className="brand-period">.</span></a>
      <span className="header-caption">{destino ? <>Direcciones para GIS</> : <>INTELIGENCIA TERRITORIAL<br />DIRECCIONES / CHILE</>}</span>
      <nav aria-label="Espacio de trabajo" className="mode-nav">
        <button disabled={busy || fileBusy} aria-current={mode === "batch" ? "page" : undefined} onClick={() => { setMode("batch"); setEditing(false); }}>{destino ? <FileUp size={16} /> : "01"}<span>{destino ? "Lotes" : "Procesar lote"}</span></button>
        <button disabled={busy || fileBusy} aria-current={mode === "search" ? "page" : undefined} onClick={() => { setMode("search"); setEditing(false); }}>{destino ? <Search size={16} /> : "02"}<span>{destino ? "Buscar dirección" : "Buscador"}</span></button>
      </nav>
      <div className="backend-indicator"><span className="signal-square" /><span>{destino ? "Rangos oficiales" : isSupabaseConfigured ? "POSTGIS CONFIGURADO" : "ÍNDICE LOCAL"}<small>{coverage ? `${Object.keys(coverage.comunas).length} comunas con rangos` : "Cargando cobertura…"}</small></span></div>
      <a className="design-comparison" href={destino ? `${import.meta.env.BASE_URL}?design=classic` : import.meta.env.BASE_URL} onClick={changeDesign} aria-disabled={busy || fileBusy}>{destino ? "Diseño anterior" : "Ver Destino"}<ArrowRight size={14} /></a>
    </header>

    <main className={rows.length ? "has-results" : "is-empty"}>
      <div className="page-title"><div>{!destino && <p className="eyebrow">ESTACIÓN DE TRABAJO / V.02</p>}<h1>{destino ? mode === "batch" ? "Lotes de direcciones" : "Consulta individual" : "CONTROL GEOGRÁFICO"}{!destino && <span>.</span>}</h1>{destino && <p>{mode === "batch" ? "Importa, revisa las ubicaciones y exporta para GIS." : "Contrasta calle, número y comuna con la evidencia disponible."}</p>}</div>{destino ? rows.length > 0 && <div className="work-summary"><span>{completed.length} de {rows.length} procesadas</span><span className="review-count">{review.length} por revisar</span></div> : <p>De una dirección a una ubicación.<br /><strong>Conoce la evidencia de cada punto.</strong></p>}</div>
      {!destino && <section className="quality-strip" aria-label="Estado de los resultados">
        {[{ label: "DIRECCIONES", value: rows.length, detail: `${completed.length} procesadas` }, { label: "REGISTRADAS", value: recorded.length, detail: "Calle y número en la fuente" },
          { label: "INTERPOLADAS", value: estimated.length, detail: "Estimadas sobre un tramo" }, { label: "POR REVISAR", value: review.length, detail: "Evidencia limitada o ambigua" }].map((metric, i) =>
          <div key={metric.label} className="quality-metric"><span className="metric-index">0{i + 1}</span><div><span className="eyebrow">{metric.label}</span><strong>{metric.value.toString().padStart(2, "0")}</strong><small>{metric.detail}</small></div></div>)}
      </section>}

      <div className="workspace">
        <section className={`query-panel ${compactEntry ? "has-batch" : ""} ${compactEntry && !entryExpanded ? "compact-entry" : ""}`} id="query" aria-labelledby="query-heading">
          <div className="panel-heading"><span>01</span><h2 id="query-heading">{destino ? mode === "search" ? "Dirección a consultar" : "Archivo de entrada" : mode === "search" ? "CONSULTA" : "ENTRADA DE DATOS"}</h2><Search size={17} /></div>
          {compactEntry && <button className="entry-toggle" aria-expanded={entryExpanded} aria-controls="entry-settings" onClick={() => setEntryExpanded(!entryExpanded)}><span>Archivo y columnas<small>{file?.name} · {file?.data.length} filas</small></span><ChevronDown size={18} /></button>}
          <div className="query-body" id="entry-settings">
            <h3>{mode === "search" ? <>BUSCA.<br />UBICA.</> : <>UN ARCHIVO.<br />MUCHOS PUNTOS.</>}</h3>
            <p className="supporting">{mode === "search" ? destino ? "Calle, número y comuna. Empieza por un lugar que conozcas." : "Cruza calle, numeración y comuna con las fuentes disponibles." : "Selecciona las columnas de dirección. La comuna ayuda a evitar coincidencias lejanas."}</p>
            {mode === "search" ? <form onSubmit={search}>
              <label className="field-label" htmlFor="address">{destino ? "Calle y número" : "DIRECCIÓN"}</label>
              <input ref={searchInput} id="address" required maxLength={250} value={address} onChange={e => setAddress(e.target.value)} placeholder="Ej. Matucana 501" autoComplete="street-address" disabled={busy} />
              <label className="field-label" htmlFor="comuna">{destino ? "Comuna" : "COMUNA"}<span>{destino ? "Recomendada" : "RECOMENDADA"}</span></label>
              <input id="comuna" value={comuna} onChange={e => setComuna(e.target.value)} placeholder="Ej. Santiago" list="comunas" autoComplete="address-level3" disabled={busy} aria-describedby="comuna-help" />
              <small id="comuna-help" className="field-help">Puedes escribirla al final de la dirección, separada por una coma.</small>
              <button className="primary-button" type="submit" disabled={busy || !address.trim()}>{busy ? <><Loader2 className="spin" size={18} />{destino ? "Buscando…" : "CONSULTANDO…"}</> : <>{destino ? "Buscar en el mapa" : "LOCALIZAR DIRECCIÓN"}<ArrowRight size={19} /></>}</button>
            </form> : <>
              <div className={`file-drop ${file ? "has-file" : ""} ${dragging ? "is-dragging" : ""}`} onDragOver={e => { e.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const dropped = e.dataTransfer.files[0]; if (dropped) void readFile(dropped); }}>
                <FileUp size={28} /><strong>{file ? file.name : destino ? "Importar direcciones" : "ARRASTRA TU ARCHIVO"}</strong><span>CSV / XLSX · hasta 50 MB</span>
                <button className="secondary-button" disabled={busy || fileBusy} onClick={() => fileInput.current?.click()}>{fileBusy ? "Leyendo archivo…" : file ? "Cambiar archivo" : "Seleccionar archivo"}</button>
                <input ref={fileInput} type="file" accept=".csv,.xlsx,.xls" hidden onChange={e => { const input = e.target.files?.[0]; if (input) void readFile(input); }} />
              </div>
              {!file && destino && <div className="sample-lot"><button className="secondary-button" disabled={busy || fileBusy} onClick={loadExample}>Probar lote de ejemplo <ArrowRight size={16} /></button><p>Tres direcciones públicas. Los resultados se calculan al procesarlas.</p></div>}
              {file && <><fieldset disabled={busy || fileBusy}><legend className="field-label">COLUMNAS DE DIRECCIÓN <span>EN ORDEN</span></legend><div className="column-options">
                {file.headers.map(header => <label key={header}><input type="checkbox" disabled={fileBusy} checked={columns.includes(header)} onChange={() => setColumns(current => current.includes(header) ? current.filter(c => c !== header) : [...current, header])} />{header}<span>{columns.includes(header) ? columns.indexOf(header) + 1 : ""}</span></label>)}
              </div></fieldset>
                <label className="field-label" htmlFor="comuna-column">COLUMNA DE COMUNA</label>
                <select id="comuna-column" value={comunaColumn} onChange={e => setComunaColumn(e.target.value)} disabled={busy || fileBusy}><option value="">Usar una comuna para todo el lote</option>{file.headers.map(h => <option key={h}>{h}</option>)}</select>
                {!comunaColumn && <><label className="field-label" htmlFor="batch-comuna">COMUNA DEL LOTE</label><input id="batch-comuna" list="comunas" value={comuna} onChange={e => setComuna(e.target.value)} placeholder="Ej. Santiago" disabled={busy || fileBusy} /></>}
                <div className="batch-preview"><span className="preview-label">Vista previa · {file.data.length} filas</span>{batchPreview.map((row, i) => <p key={i}><span>{i + 1}</span>{row.normalized || "Selecciona una columna"}</p>)}</div>
                <button className="primary-button" disabled={!columns.length || busy || fileBusy} onClick={processBatch}>PROCESAR {file.data.length} FILAS <ArrowRight size={18} /></button>
              </>}
            </>}
            <datalist id="comunas">{COMUNA_OPTIONS.map(name => <option key={name} value={name} />)}</datalist>
            {busy && <div className="processing-state" role="status"><div><span>{mode === "batch" ? `${progress.current} / ${progress.total} FILAS` : "COMPARANDO FUENTES"}</span><strong>{mode === "batch" ? `${pct}%` : "…"}</strong></div>
              {mode === "batch" && <progress max={progress.total || 1} value={progress.current} aria-label="Filas procesadas" />}
              <div className="processing-actions">{mode === "batch" && <button className="secondary-button" onClick={() => { if (paused) resume(); else pause(); setPaused(!paused); }}>{paused ? <Play size={14} /> : <Pause size={14} />}{paused ? "CONTINUAR" : "PAUSAR"}</button>}
                <button className="secondary-button" onClick={stop}><X size={15} /> DETENER</button></div></div>}
            {mode === "search" && <div className="examples"><p className="eyebrow">{destino ? "O prueba con estos lugares" : "PRUEBA UNA DIRECCIÓN PÚBLICA"}</p>{EXAMPLES.map(example => <button key={example.address} disabled={busy} onClick={() => { setAddress(example.address); setComuna(example.comuna); searchInput.current?.focus(); }}><span>{example.address}{destino && <small>{example.comuna}</small>}</span><ArrowRight size={14} /></button>)}</div>}
            <p className="data-note">Tu archivo se lee localmente. Las consultas de calle y comuna se envían a las fuentes habilitadas.</p>
          </div>
        </section>


      <section className="ledger" aria-labelledby="ledger-heading">
        <div className="ledger-toolbar"><div>{!destino && <p className="eyebrow">04 / REGISTRO DE TRABAJO</p>}<h2 id="ledger-heading">{destino ? "Revisión de direcciones" : "RESULTADOS"}<span> / {rows.length.toString().padStart(2, "0")}</span></h2>{notice && <p className="status-message" role="status" aria-live="polite">{notice}</p>}</div>
          <div className="export-controls"><label className="sr-only" htmlFor="export-format">Formato de exportación</label><select id="export-format" value={format} onChange={e => setFormat(e.target.value as typeof format)}><option value="geojson">GeoJSON</option><option value="csv">CSV</option><option value="xlsx">Excel</option><option value="shp">Shapefile</option></select><button className="black-button" disabled={!selected.length || exporting || busy} onClick={exportRows}><ArrowDownToLine size={16} />{exporting ? "EXPORTANDO…" : `EXPORTAR (${selected.length})`}</button></div>
        </div>
        {error && <div className="workspace-feedback"><p className="inline-error" role="alert">{error}</p></div>}
        <div className="ledger-controls">
          <div className="ledger-filters" aria-label="Filtrar resultados">{[{ key: "all", label: "Todos", count: rows.length }, { key: "review", label: "Por revisar", count: review.length }, { key: "unlocated", label: "Sin ubicación", count: unlocated.length }, { key: "address", label: "Registradas", count: recorded.length }].map(item => <button key={item.key} aria-pressed={filter === item.key} onClick={() => changeFilter(item.key)}>{item.label}<span>{item.count}</span></button>)}<p>Selecciona una fila para inspeccionarla en el mapa.</p></div>
          {destino && rows.length > 0 && <div className="review-tools"><label className="row-search"><Search size={16} /><span className="sr-only">Buscar dentro del lote</span><input value={rowQuery} placeholder="Buscar dirección o comuna" onChange={e => changeRowQuery(e.target.value)} /></label><button className="secondary-button" disabled={!review.length || busy} onClick={nextReview}><ListFilter size={16} />Siguiente por revisar</button></div>}
        </div>
        {rows.length ? <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabla de direcciones; desplázate para ver todas las columnas"><table><thead><tr><th><input type="checkbox" aria-label="Seleccionar todas las filas" checked={rows.every(row => row.selected)} onChange={e => setRows(rows.map(row => ({ ...row, selected: e.target.checked })))} /></th><th>REF.</th><th>DIRECCIÓN / COMUNA</th><th>MÉTODO</th><th title="Indicador de evidencia, no probabilidad de exactitud">EVIDENCIA</th><th>FUENTE</th><th>ESTADO</th></tr></thead><tbody>{displayedRows.map(row => <tr key={row.id} className={activeId === row.id ? "active-row" : ""}><td><input type="checkbox" aria-label={`Seleccionar fila ${row.id} para exportar`} checked={row.selected} onChange={e => setRows(rows.map(current => current.id === row.id ? { ...current, selected: e.target.checked } : current))} /></td><td className="mono">{row.id.toString().padStart(3, "0")}</td><td><button id={`address-row-${row.id}`} className="row-address" onClick={() => { setActiveId(row.id); setEditing(false); }} aria-pressed={activeId === row.id}>{row.normalized.normalized}<small>{row.normalized.comuna || "Comuna sin indicar"}</small></button></td><td>{row.geocode?.method ? METHOD_LABELS[row.geocode.method] : row.geocode ? "Sin resultado" : "Pendiente"}</td><td className="mono">{row.geocode?.found && row.geocode.method !== "manual" ? `${row.geocode.score} / 100` : "—"}</td><td>{row.geocode?.api || "—"}</td><td><span className={`row-status ${!row.geocode ? "status-pending" : !row.geocode.found ? "status-missing" : row.geocode.needsReview ? "status-review" : "status-recorded"}`}>{!row.geocode ? "Pendiente" : !row.geocode.found ? "Sin ubicación" : row.geocode.method === "manual" ? "Manual · revisar" : row.geocode.needsReview ? "Revisar" : "Registrada"}</span></td></tr>)}</tbody></table>{!filtered.length && <p className="empty-table">No hay filas para este filtro.</p>}</div> : <div className="empty-ledger">{destino ? <><div className="empty-table-head"><span>Dirección / comuna</span><span>Método</span><span>Estado</span></div><div className="empty-lot"><FileUp size={32} strokeWidth={1.5} /><h3>{mode === "batch" ? "Tu lote empieza aquí" : "Una dirección, con evidencia"}</h3><p>{mode === "batch" ? "Importa un CSV o Excel y selecciona las columnas. Aquí podrás revisar cada ubicación antes de exportar." : "Consulta una dirección. Aquí aparecerán su método, fuente y estado."}</p>{mode === "batch" && <button className="primary-button" disabled={busy || fileBusy} onClick={() => fileInput.current?.click()}>Importar archivo <ArrowRight size={18} /></button>}<p className="empty-lot-note">Los casos interpolados o ambiguos se marcarán para revisión.</p></div></> : <><span>—</span><p>El registro está listo.<small>Busca una dirección o importa un archivo para comenzar.</small></p><span className="mono">00 / 00</span></>}</div>}
        {rows.length > 0 && <div className="ledger-pagination"><span>{filtered.length ? `${currentPage * 100 + 1}–${Math.min((currentPage + 1) * 100, filtered.length)} de ${filtered.length}` : "0 filas"} · {selected.length} ubicaciones seleccionadas</span><div><button className="secondary-button" aria-label="Página anterior" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span>{currentPage + 1} / {pageCount}</span><button className="secondary-button" aria-label="Página siguiente" disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div></div>}
      </section>
        <section className="map-panel" aria-label="Exploración cartográfica">
          <div className="panel-heading"><span>02</span><h2>{destino ? "Mapa de direcciones" : "EXPLORACIÓN"}</h2><div className="coordinate-system">WGS 84</div></div>
          <WorkspaceMap rows={rows} activeId={activeId} editing={editing} dark={destino} onSelect={id => { setActiveId(id); setEditing(false); }} onCandidate={selectCandidate} onManual={manual} />
          <div className="map-footer"><span><Square size={11} fill="currentColor" />{destino ? active?.normalized.normalized || "Sin ubicación seleccionada" : "UBICACIÓN SELECCIONADA"}</span><span><MapPin size={13} /> {rows.filter(row => row.geocode?.found).length} {destino ? "ubicaciones" : "PUNTOS"}</span></div>
        </section>
        <aside className="evidence-panel" aria-labelledby="evidence-heading">
          <div className="panel-heading"><span>03</span><h2 id="evidence-heading" ref={resultHeading} tabIndex={-1}>{destino ? "Evidencia de la fila" : "EVIDENCIA"}</h2><Crosshair size={18} /></div>
          {active ? <div className="evidence-body">
            <span className="evidence-reference">Fila {active.id.toString().padStart(3, "0")}</span><h3>{active.normalized.normalized}</h3><p className="location-comuna">{active.normalized.comuna || "Comuna sin indicar"}</p>
            {result ? <>
              <div className={`result-method ${result.needsReview ? "requires-review" : ""}`}><span className="signal-square" />{result.found ? METHOD_LABELS[result.method || "area"] : "SIN EVIDENCIA SUFICIENTE"}</div>
              {result.found && <><div className="confidence-readout"><div><span className="eyebrow">COINCIDENCIA</span><strong>{result.method === "manual" ? "—" : result.score}<small>{result.method === "manual" ? "MANUAL" : "/100"}</small></strong></div><p>Indicador de evidencia.<br />No es una probabilidad<br />de exactitud.</p></div>
                <dl className="coordinate-readout"><div><dt>LATITUD</dt><dd>{result.lat.toFixed(6)}</dd></div><div><dt>LONGITUD</dt><dd>{result.lon.toFixed(6)}</dd></div></dl>
                <div className="evidence-list"><p className="eyebrow">QUÉ RESPALDA ESTE PUNTO</p>{result.evidence?.map(item => <p key={item}><Check size={14} />{item}</p>)}</div>
                {result.range && <div className="range-readout"><span className="eyebrow">TRAMO UTILIZADO / {active.normalized.numero}</span><div><strong>{result.range[0]}</strong><span className="range-line" style={{ "--range-position": `${Math.max(0, Math.min(100, result.range[0] === result.range[1] ? 50 : (Number(active.normalized.numero) - result.range[0]) / (result.range[1] - result.range[0]) * 100))}%` } as React.CSSProperties} /><strong>{result.range[1]}</strong></div><small>Numeración en el sentido de la geometría</small></div>}
              </>}
              {!!result.warnings?.length && <div className="warning-block"><span className="eyebrow">{result.needsReview ? "REVISIÓN NECESARIA" : "ALCANCE DE LA FUENTE"}</span>{result.warnings.map(w => <p key={w}>{w}</p>)}</div>}
              <button className="secondary-button manual-button" disabled={busy} aria-pressed={editing} onClick={() => { setManualLat(result.found ? String(result.lat) : ""); setManualLon(result.found ? String(result.lon) : ""); setEditing(!editing); }}><Crosshair size={16} />{editing ? "CANCELAR AJUSTE" : "UBICAR MANUALMENTE"}</button>
              {editing && <form className="manual-coordinates" onSubmit={event => { event.preventDefault(); manual(Number(manualLat), Number(manualLon)); }}><p className="field-help">Indica coordenadas o haz clic en el mapa. La ubicación quedará marcada como ajuste manual.</p><label className="field-label" htmlFor="manual-lat">LATITUD</label><input id="manual-lat" type="number" step="any" min="-56.6" max="-17" required value={manualLat} onChange={event => setManualLat(event.target.value)} /><label className="field-label" htmlFor="manual-lon">LONGITUD</label><input id="manual-lon" type="number" step="any" min="-110" max="-66" required value={manualLon} onChange={event => setManualLon(event.target.value)} /><button className="black-button" type="submit">GUARDAR COORDENADAS</button></form>}
              {!!result.candidates?.length && <details className="candidate-details"><summary>OTROS CANDIDATOS <span>{result.candidates.length}</span><ChevronDown size={14} /></summary><div>{result.candidates.map(candidate => <button key={candidate.id} disabled={busy} onClick={() => selectCandidate(candidate)} aria-label={`Usar ${candidate.source}: ${candidate.label}`}><span>{candidate.source}<small>{METHOD_LABELS[candidate.method]}</small></span><strong>{candidate.method === "manual" ? "—" : candidate.score}</strong></button>)}</div></details>}
              <details className="source-details" open={!destino}><summary>FUENTES CONSULTADAS <ChevronDown size={14} /></summary>{result.sources?.map(source => <div className="source-row" key={source.source}><span className={`source-state state-${source.status}`} aria-hidden="true" /><div><strong>{source.source}</strong><small>{source.detail}</small></div><span>{source.status === "ok" ? "OK" : source.status === "empty" ? "0" : source.status === "disabled" ? "—" : "!"}</span></div>)}</details>
            </> : <div className="pending-evidence"><Loader2 size={24} className={busy ? "spin" : ""} /><p>{busy ? "Buscando evidencia compatible…" : "Esta fila está pendiente de procesar."}</p></div>}
          </div> : <div className="empty-evidence"><div className="survey-graphic" aria-hidden="true"><span /><i /><b /></div><h3>{destino ? "Fuente y método" : <>LA PRECISIÓN<br />SE DEMUESTRA.</>}</h3><p>{destino ? "Aquí verás si encontramos una dirección registrada o estimamos su posición sobre un tramo de calle." : "Consulta una dirección para ver de dónde viene la ubicación y qué se puede afirmar sobre ella."}</p>{!destino && <ol><li><span>01</span>Calle y comuna compatibles</li><li><span>02</span>Número registrado o rango válido</li><li><span>03</span>Fuente, método y alternativas</li></ol>}<div className="source-preview"><span className="eyebrow">{destino ? "Fuentes disponibles" : "FUENTES DEL SISTEMA"}</span><p>IDE Chile <small>Maestro de Calles 2022</small></p><p>OpenStreetMap <small>Direcciones y geometrías</small></p>{!destino && <p>Supabase / PostGIS <small>{isSupabaseConfigured ? "Configurado; pendiente de consultar" : "Integración preparada"}</small></p>}</div></div>}
        </aside>
      </div>

    </main>
    <footer className="app-footer"><strong>AZIMUT / CHILE</strong><span>{coverage ? `${coverage.segments.toLocaleString("es-CL")} segmentos oficiales · ` : ""}Datos IDE Chile y © OpenStreetMap contributors</span><a href="https://github.com/geoidegeoidal/azimut" target="_blank" rel="noreferrer">CÓDIGO ABIERTO ↗</a></footer>
  </div>;
}
