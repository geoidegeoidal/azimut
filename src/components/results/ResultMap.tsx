import { useEffect, useRef, useState } from "react";
import { useStore } from "@/hooks/useStore";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue in Leaflet + bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function getMarkerColor(score: number): string {
  if (score >= 85) return "#10b981";
  if (score >= 60) return "#f59e0b";
  if (score >= 35) return "#f97316";
  if (score > 0) return "#ef4444";
  return "#9ca3af";
}

function createScoreIcon(score: number): L.DivIcon {
  const color = getMarkerColor(score);
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
    ">
      <div style="
        width: 8px; height: 8px;
        background: white;
        border-radius: 50%;
      "></div>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

type FilterLevel = "all" | "excelente" | "bueno" | "regular" | "bajo" | "nulo";

const FILTER_LABELS: Record<FilterLevel, string> = {
  all: "Todos",
  excelente: "Excelente",
  bueno: "Bueno",
  regular: "Regular",
  bajo: "Bajo",
  nulo: "Nulo",
};

export function ResultMap() {
  const rows = useStore((s) => s.rows);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [filter, setFilter] = useState<FilterLevel>("all");

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([-33.4489, -70.6693], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    const found = rows.filter((r) => r.geocode?.found);
    const filtered = found.filter((r) => {
      if (filter === "all") return true;
      return r.geocode?.precision === filter;
    });

    if (filtered.length === 0) return;

    const bounds: L.LatLngTuple[] = [];

    for (const row of filtered) {
      if (!row.geocode) continue;
      const { lat, lon, score, api } = row.geocode;
      const marker = L.marker([lat, lon], {
        icon: createScoreIcon(score),
      });

      const popupContent = `
        <div style="font-family: system-ui; min-width: 220px; max-width: 300px;">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Original</span>
            <p style="margin: 2px 0; font-size: 13px; color: #374151; font-weight: 500;">${row.normalized.original}</p>
          </div>
          <div style="margin-bottom: 8px;">
            <span style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Normalizada</span>
            <p style="margin: 2px 0; font-size: 13px; color: #111827; font-weight: 600;">${row.normalized.normalized}</p>
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <div>
              <span style="font-size: 11px; color: #6b7280;">Score</span>
              <p style="margin: 2px 0; font-size: 16px; font-weight: 700; color: ${getMarkerColor(score)};">${score}</p>
            </div>
            <div>
              <span style="font-size: 11px; color: #6b7280;">API</span>
              <p style="margin: 2px 0; font-size: 13px; color: #374151;">${api}</p>
            </div>
          </div>
          <div style="font-size: 11px; color: #9ca3af; font-family: monospace;">
            ${lat.toFixed(6)}, ${lon.toFixed(6)}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.addLayer(marker);
      bounds.push([lat, lon]);
    }

    if (bounds.length > 0) {
      mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [rows, filter]);

  const counts: Record<FilterLevel, number> = {
    all: rows.filter((r) => r.geocode?.found).length,
    excelente: rows.filter((r) => r.geocode?.precision === "excelente").length,
    bueno: rows.filter((r) => r.geocode?.precision === "bueno").length,
    regular: rows.filter((r) => r.geocode?.precision === "regular").length,
    bajo: rows.filter((r) => r.geocode?.precision === "bajo").length,
    nulo: rows.filter((r) => r.geocode?.precision === "nulo").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FILTER_LABELS) as FilterLevel[]).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === key
                ? "bg-azimut-500 text-white shadow-md"
                : "bg-white/70 dark:bg-gray-900/70 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {FILTER_LABELS[key]} ({counts[key]})
          </button>
        ))}
      </div>

      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden">
        <div ref={mapRef} className="h-96 w-full" />
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Datos © OpenStreetMap contributors · Geocodificado por Nominatim y Photon
      </p>
    </div>
  );
}
