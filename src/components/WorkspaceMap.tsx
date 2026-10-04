import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import L from "leaflet";
import type { AddressRow } from "@/hooks/useStore";
import type { GeocodeCandidate } from "@/types";

interface Props {
  rows: AddressRow[];
  activeId: number | null;
  editing: boolean;
  dark?: boolean;
  onSelect: (id: number) => void;
  onCandidate: (candidate: GeocodeCandidate) => void;
  onManual: (lat: number, lon: number) => void;
}

export function WorkspaceMap({ rows, activeId, editing, dark = false, onSelect, onCandidate, onManual }: Props) {
  const [light, setLight] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layers = useRef<L.LayerGroup | null>(null);
  const lastView = useRef("");
  const callbacks = useRef({ onSelect, onCandidate, onManual, editing });
  callbacks.current = { onSelect, onCandidate, onManual, editing };

  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, { zoomControl: false, fadeAnimation: false }).setView([-33.4489, -70.6693], 13);
    L.control.zoom({ position: "bottomright", zoomInTitle: "Acercar", zoomOutTitle: "Alejar" }).addTo(map);
    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19,
    }).addTo(map);
    layers.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    map.on("click", (event: L.LeafletMouseEvent) => {
      if (callbacks.current.editing) callbacks.current.onManual(event.latlng.lat, event.latlng.lng);
    });
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container.current);
    return () => { observer.disconnect(); map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current, group = layers.current;
    if (!map || !group) return;
    group.clearLayers();
    const active = rows.find(row => row.id === activeId);
    for (const row of rows) {
      if (!row.geocode?.found) continue;
      const { lat, lon } = row.geocode;
      const selected = row.id === activeId;
      const marker = L.marker([lat, lon], { keyboard: true, title: `${row.id}. ${row.normalized.normalized}`, draggable: selected && editing,
        icon: L.divIcon({ className: "survey-marker", html: `<span class="${selected ? "selected" : ""}">${row.id}</span>`, iconSize: [32, 32], iconAnchor: [16, 16] }) });
      marker.on("click", () => callbacks.current.onSelect(row.id));
      marker.on("dragend", () => { const point = marker.getLatLng(); callbacks.current.onManual(point.lat, point.lng); });
      group.addLayer(marker);
    }
    if (active?.geocode?.found) {
      const result = active.geocode;
      if (result.geometry) group.addLayer(L.polyline(result.geometry.map(p => [p[1], p[0]]), { color: "#FF3000", className: "street-evidence", weight: 4, opacity: 0.85 }));
      for (const candidate of result.candidates || []) {
        if (Math.abs(candidate.lat - result.lat) + Math.abs(candidate.lon - result.lon) < 0.00001) continue;
        const marker = L.circleMarker([candidate.lat, candidate.lon], { color: "#000", fillColor: "#fff", fillOpacity: 1, radius: 6, weight: 2, bubblingMouseEvents: false });
        const label = document.createElement("span");
        label.textContent = `${candidate.source} · ${candidate.label}`;
        marker.bindTooltip(label).on("click", () => callbacks.current.onCandidate(candidate));
        group.addLayer(marker);
      }
      const viewKey = `${active.id}:${result.lat}:${result.lon}`;
      if (lastView.current !== viewKey) {
        const bounds = result.geometry?.map(p => [p[1], p[0]] as L.LatLngTuple) || [[result.lat, result.lon] as L.LatLngTuple];
        map.fitBounds(L.latLngBounds(bounds), { padding: [48, 48], maxZoom: 17, animate: false });
        lastView.current = viewKey;
      }
    }
  }, [rows, activeId, editing]);

  return <div className={`map-frame ${editing ? "map-editing" : ""} ${dark && !light ? "map-dark" : "map-light"}`}>
    <div ref={container} className="workspace-map" aria-label="Mapa de ubicaciones. Usa las flechas para desplazarte y los controles para ampliar." />
    <div className="map-caption"><span className="signal-square" /> {editing ? "HAZ CLIC PARA FIJAR LA POSICIÓN" : "CARTOGRAFÍA / OPENSTREETMAP"}</div>
    <div className="map-north" aria-hidden="true"><span>N</span><svg width="24" height="34" viewBox="0 0 24 34"><path d="M12 1L23 31L12 24L1 31Z" fill="black" /><path d="M12 1V24L1 31Z" fill="white" stroke="black" /></svg></div>
    {dark && <button className="map-tone-toggle" onClick={() => setLight(!light)}>{light ? <Moon size={15} /> : <Sun size={15} />}{light ? "Mapa oscuro" : "Mapa claro"}</button>}
    {!rows.some(row => row.geocode?.found) && <div className="map-empty">Explora una dirección.<span>Introduce calle, número y comuna para situarla en el mapa.</span></div>}
  </div>;
}
