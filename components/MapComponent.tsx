"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Popup, Marker, LayersControl } from "react-leaflet";
import L from "leaflet";
import { useQuery, useQueries } from "@tanstack/react-query";
import { fetchRegions, fetchRegionPredictions } from "@/lib/api";
import { ShieldAlert, Sprout, Layers, Sun, CloudRain } from "lucide-react";

// Estilo CSS inline para inyectar animaciones de pulso personalizadas si no están en Tailwind
const pulseStyles = `
  @keyframes markerPulse {
    0% { transform: scale(0.9); opacity: 0.9; }
    50% { transform: scale(1.3); opacity: 0.4; }
    100% { transform: scale(0.9); opacity: 0.9; }
  }
  .marker-ping-orange {
    animation: markerPulse 2s infinite ease-in-out;
    background-color: rgba(249, 115, 22, 0.4);
  }
  .marker-ping-blue {
    animation: markerPulse 2s infinite ease-in-out;
    background-color: rgba(59, 130, 246, 0.4);
  }
`;

// Crear marcador HTML premium e interactivo
const createCustomMarker = (anomaly: string, severity: number) => {
  const color = anomaly === "SEQUIA" ? "#f97316" : anomaly === "INUNDACION" ? "#3b82f6" : "#10b981";
  const pingClass = anomaly === "SEQUIA" ? "marker-ping-orange" : anomaly === "INUNDACION" ? "marker-ping-blue" : "";

  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        ${anomaly !== "NORMAL" ? `
          <div class="${pingClass}" style="position: absolute; width: 20px; height: 20px; border-radius: 50%;"></div>
        ` : ""}
        <div style="
          position: relative; 
          width: 12px; 
          height: 12px; 
          background-color: ${color}; 
          border: 2px solid #060a10; 
          border-radius: 50%; 
          box-shadow: 0 0 8px ${color};
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10]
  });
};

export default function MapComponent() {
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite">("dark");

  useEffect(() => {
    // Inyectar estilos de animación
    if (typeof document !== "undefined") {
      const styleEl = document.createElement("style");
      styleEl.innerHTML = pulseStyles;
      document.head.appendChild(styleEl);
      return () => {
        document.head.removeChild(styleEl);
      };
    }
  }, []);

  const { data: regions, isLoading: loadingRegions } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
  });

  const regionQueries = useQueries({
    queries: (regions || []).map((region) => ({
      queryKey: ["predictions", region.id],
      queryFn: () => fetchRegionPredictions(region.id),
      enabled: !!regions && regions.length > 0,
    })),
  });

  const centerPosition: [number, number] = [-17.85, -61.50];
  const defaultZoom = 6.2;

  if (loadingRegions) {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-3" style={{ minHeight: "550px" }}>
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs">Cargando visualización satelital...</p>
      </div>
    );
  }

  // Recopilar regiones y predicciones mapeadas
  const mapRegions = (regions || []).map((region, index) => {
    const predictionsQuery = regionQueries[index];
    const predictions = predictionsQuery?.data?.predictions || [];
    const latest = predictions.length > 0 ? predictions[0] : null;
    const anomaly = latest ? latest.anomaly_type : "NORMAL";
    const severity = latest ? latest.severity_level : 1;

    const coords: [number, number] = [
      region.latitude || -17.78,
      region.longitude || -63.18,
    ];

    return { 
      id: region.id, 
      name: region.name, 
      coords, 
      anomaly, 
      severity, 
      description: region.description, 
      latestPred: latest, 
      main_crops: region.main_crops, 
      area_hectares: region.area_hectares 
    };
  });

  // Estadísticas globales del mapa
  const totalMonitoredHectares = mapRegions.reduce((acc, curr) => acc + (curr.area_hectares || 0), 0);
  const regionsInAlert = mapRegions.filter(r => r.anomaly !== "NORMAL").length;
  const maxSeverityActive = mapRegions.reduce((max, curr) => curr.severity > max ? curr.severity : max, 0);

  return (
    <div className="w-full h-full relative border border-card-border rounded-2xl overflow-hidden" style={{ minHeight: "550px" }}>
      
      {/* Panel flotante de estadísticas premium */}
      <div className="absolute top-4 left-4 z-[1000] bg-slate-950/90 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-2xl max-w-xs space-y-3 pointer-events-auto hidden md:block">
        <div>
          <h3 className="text-white text-xs font-bold uppercase tracking-wider">Centro de Control GIS</h3>
          <span className="text-[10px] text-slate-500">Santa Cruz, Bolivia</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3">
          <div className="bg-slate-900/50 p-2 rounded border border-slate-800/50">
            <span className="text-slate-500 text-[9px] block">Alertas Activas</span>
            <span className="text-sm font-black text-white flex items-center gap-1 mt-0.5">
              <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
              {regionsInAlert}
            </span>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-800/50">
            <span className="text-slate-500 text-[9px] block">Riesgo Máximo</span>
            <span className="text-sm font-black text-red-400 flex items-center gap-1 mt-0.5">
              ⚠️ {maxSeverityActive}/5
            </span>
          </div>
        </div>

        <div className="bg-slate-900/50 p-2 rounded border border-slate-800/50">
          <span className="text-slate-500 text-[9px] block">Superficie Monitoreada Total</span>
          <span className="text-xs font-bold text-slate-300 mt-0.5 block">
            {totalMonitoredHectares.toLocaleString()} Hectáreas
          </span>
        </div>
      </div>

      {/* Selector de capas flotante */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-1 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-xl">
        <button
          onClick={() => setMapStyle("dark")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            mapStyle === "dark" 
              ? "bg-primary text-slate-950" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Mapa Oscuro
        </button>
        <button
          onClick={() => setMapStyle("satellite")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            mapStyle === "satellite" 
              ? "bg-primary text-slate-950" 
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Satelital
        </button>
      </div>

      {/* Contenedor del Mapa Leaflet */}
      <MapContainer center={centerPosition} zoom={defaultZoom} scrollWheelZoom={true} className="h-full w-full">
        {mapStyle === "dark" ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}

        {mapRegions.map((region) => {
          const color = region.anomaly === "SEQUIA" ? "#f97316" : region.anomaly === "INUNDACION" ? "#3b82f6" : "#10b981";
          const radius = region.severity * 16000;

          return (
            <React.Fragment key={region.id}>
              {/* Círculo de cobertura del peligro */}
              <Circle
                center={region.coords}
                radius={radius}
                pathOptions={{ 
                  color, 
                  fillColor: color, 
                  fillOpacity: mapStyle === "satellite" ? 0.20 : 0.08, 
                  weight: 1, 
                  dashArray: region.anomaly !== "NORMAL" ? "4, 6" : undefined 
                }}
              />
              {/* Marcador animado e interactivo */}
              <Marker 
                position={region.coords} 
                icon={createCustomMarker(region.anomaly, region.severity)}
              >
                <Popup>
                  <div className="p-2 max-w-[280px] font-sans">
                    <h5 className="font-bold text-sm text-slate-100 mb-1">{region.name}</h5>
                    
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border ${
                        region.anomaly === "SEQUIA" 
                          ? "bg-orange-500/10 text-orange-400 border-orange-500/20" 
                          : region.anomaly === "INUNDACION" 
                          ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {region.anomaly === "SEQUIA" ? "Sequía Activa" : region.anomaly === "INUNDACION" ? "Inundación Activa" : "Estado Estable"}
                      </span>
                      {region.anomaly !== "NORMAL" && (
                        <span className="text-red-400 text-[10px] font-bold">
                          Severidad: {region.severity}/5
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mb-2.5 text-[10px] text-slate-400">
                      {region.main_crops && (
                        <p className="flex items-center gap-1.5">
                          <Sprout className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span>Cultivos: <strong className="text-slate-300 font-medium">{region.main_crops}</strong></span>
                        </p>
                      )}
                      {region.area_hectares && (
                        <p>
                          Superficie: <strong className="text-slate-300 font-medium">{region.area_hectares.toLocaleString()} ha</strong>
                        </p>
                      )}
                    </div>

                    {region.latestPred && (
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-[10px] space-y-1">
                        <div className="flex justify-between text-slate-500">
                          <span>Objetivo Predicción:</span>
                          <strong className="text-slate-200">
                            {new Date(region.latestPred.target_date).toLocaleDateString("es-BO", { month: "long", year: "numeric" })}
                          </strong>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Confianza del Modelo:</span>
                          <strong className="text-emerald-400">
                            {Math.round(region.latestPred.confidence_score * 100)}%
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Leyenda del Mapa */}
      <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl z-[1000] space-y-2.5 shadow-2xl">
        <h4 className="text-white text-[9px] font-bold uppercase tracking-wider mb-0.5 border-b border-slate-800 pb-1.5">
          Ecosistema Climático
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" style={{ boxShadow: "0 0 6px #f97316" }}></span>
            <span className="text-slate-300">Riesgo de Sequía</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" style={{ boxShadow: "0 0 6px #3b82f6" }}></span>
            <span className="text-slate-300">Riesgo de Inundación</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" style={{ boxShadow: "0 0 6px #10b981" }}></span>
            <span className="text-slate-300">Condición Normal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
