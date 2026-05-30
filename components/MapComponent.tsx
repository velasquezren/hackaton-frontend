"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Popup, Marker } from "react-leaflet";
import L from "leaflet";

// Corrección de los iconos por defecto de Leaflet en Next.js (Webpack / Dynamic Bundling bug fix)
// Al cargar Leaflet dinámicamente, las imágenes de los marcadores pueden fallar si no se reasignan.
const setupLeafletMarkers = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

// Coordenadas geográficas estimadas para los epicentros agrícolas en Santa Cruz, Bolivia
interface MapRegion {
  id: number;
  name: string;
  coords: [number, number]; // [lat, lng]
  anomaly: "SEQUIA" | "INUNDACION" | "NORMAL";
  severity: number;
  description: string;
}

const REGIONS_MAPPING: MapRegion[] = [
  {
    id: 1,
    name: "Norte Integrado",
    coords: [-17.33, -63.25], // Epicentro Montero / Saavedra
    anomaly: "INUNDACION",
    severity: 4,
    description: "Alerta de Inundación a 12 meses: Humedad de suelo proyectada +25% sobre la media histórica."
  },
  {
    id: 2,
    name: "Valles Cruceños",
    coords: [-18.48, -64.10], // Epicentro Vallegrande / Samaipata
    anomaly: "SEQUIA",
    severity: 5,
    description: "Alerta de Sequía crítica a 12 meses: Anomalías de precipitación de -42% proyectadas."
  },
  {
    id: 3,
    name: "Chiquitania",
    coords: [-16.37, -60.95], // Epicentro San Ignacio de Velasco
    anomaly: "NORMAL",
    severity: 1,
    description: "Zona con comportamiento pluvial dentro del umbral normal e histórico."
  }
];

export default function MapComponent() {
  useEffect(() => {
    setupLeafletMarkers();
  }, []);

  // Centro inicial del mapa posicionado en Santa Cruz, Bolivia
  const centerPosition: [number, number] = [-17.65, -62.30];
  const defaultZoom = 7;

  return (
    <div className="w-full h-full relative" style={{ minHeight: "500px" }}>
      <MapContainer 
        center={centerPosition} 
        zoom={defaultZoom} 
        scrollWheelZoom={true}
        className="leaflet-container"
      >
        {/* --- MAP TILES (CartoDB Dark Matter para estética premium oscura) --- */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* --- DIBUJO DE REGIONES Y ALARMAS --- */}
        {REGIONS_MAPPING.map((region) => {
          // Color dinámico según tipo de alerta
          const color = 
            region.anomaly === "SEQUIA" 
              ? "#f97316" // Naranja sequía
              : region.anomaly === "INUNDACION" 
              ? "#3b82f6" // Azul inundación
              : "#10b981"; // Verde normal

          const radius = region.severity * 10000; // El tamaño del círculo refleja la severidad

          return (
            <React.Fragment key={region.id}>
              {/* Círculo de Alerta */}
              <Circle
                center={region.coords}
                radius={radius}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.15,
                  weight: 2,
                  dashArray: region.anomaly !== "NORMAL" ? "6, 6" : undefined
                }}
              />

              {/* Marcador del Epicentro con Información */}
              <Marker position={region.coords}>
                <Popup>
                  <div className="p-1">
                    <h5 className="font-bold text-slate-100 text-sm mb-1">{region.name}</h5>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        region.anomaly === "SEQUIA"
                          ? "bg-orange-950 text-orange-300"
                          : region.anomaly === "INUNDACION"
                          ? "bg-blue-950 text-blue-300"
                          : "bg-emerald-950 text-emerald-300"
                      }`}>
                        {region.anomaly}
                      </span>
                      <span className="text-slate-400 text-xs font-semibold">Severidad: {region.severity}/5</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{region.description}</p>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* --- LEYENDA DEL MAPA HUD --- */}
      <div className="absolute bottom-6 right-6 bg-card/90 backdrop-blur-md border border-card-border p-4 rounded-xl shadow-2xl z-[1000] space-y-2">
        <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-2">Simbología Climatológica</h4>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-3.5 h-3.5 rounded-full bg-[#f97316] opacity-80 block border border-orange-400"></span>
          <span className="text-slate-300">Riesgo de Sequía Severa (12m)</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-3.5 h-3.5 rounded-full bg-[#3b82f6] opacity-80 block border border-blue-400"></span>
          <span className="text-slate-300">Riesgo de Inundación Crítica (12m)</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-3.5 h-3.5 rounded-full bg-[#10b981] opacity-80 block border border-emerald-400"></span>
          <span className="text-slate-300">Condiciones Estables (Normal)</span>
        </div>
      </div>
    </div>
  );
}
