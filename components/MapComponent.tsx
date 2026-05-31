"use client";

import React, { useEffect, useState, useRef } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { fetchRegions, fetchRegionPredictions } from "@/lib/api";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import { Maximize2, Minimize2 } from "lucide-react";

// Formateadores profesionales en lenguaje humano (sin emojis, minimalistas)
function humanRisk(severity: number, anomaly: string): { label: string; color: string } {
  if (anomaly === "NORMAL") return { label: "Estable", color: "text-emerald-400" };
  if (severity >= 5) return { label: "Riesgo crítico", color: "text-red-400" };
  if (severity >= 4) return { label: "Riesgo alto", color: "text-red-400" };
  if (severity >= 3) return { label: "Riesgo moderado", color: "text-amber-400" };
  return { label: "Riesgo bajo", color: "text-slate-400" };
}

function humanDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-BO", {
    month: "long",
    year: "numeric",
  });
}

// Creador de iconos minimalistas (pequeños puntos de color)
function createCustomIcon(color: string, isSelected: boolean, isAlert: boolean) {
  const size = isSelected ? 16 : 10;
  const pulseHtml = isAlert && isSelected
    ? `<div class="absolute rounded-full animate-ping opacity-30" style="width: 24px; height: 24px; background-color: ${color}; left: -4px; top: -4px;"></div>`
    : "";

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center" style="width: ${size}px; height: ${size}px;">
        ${pulseHtml}
        <div class="rounded-full border border-slate-950 transition-all duration-300" 
             style="width: ${size}px; height: ${size}px; background-color: ${color}; box-shadow: 0 0 8px ${color};"></div>
      </div>
    `,
    className: "custom-leaflet-marker-wrapper",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Componente para controlar vistas en el mapa
interface MapControllerProps {
  selectedRegionCoords: [number, number] | null;
  resetTrigger: number;
}

function MapController({ selectedRegionCoords, resetTrigger }: MapControllerProps) {
  const map = useMap();
  const initialRef = useRef(true);

  useEffect(() => {
    if (initialRef.current) {
      initialRef.current = false;
      return;
    }

    if (selectedRegionCoords) {
      map.flyTo(selectedRegionCoords, 10, {
        animate: true,
        duration: 1.2,
      });
    } else {
      map.flyTo([-17.78, -63.18], 7.5, {
        animate: true,
        duration: 1.0,
      });
    }
  }, [selectedRegionCoords, resetTrigger, map]);

  return null;
}

export default function MapComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite">("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Carga de regiones
  const { data: regions, isLoading: loadingRegions } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
  });

  // Carga de predicciones en paralelo
  const regionQueries = useQueries({
    queries: (regions || []).map((region) => ({
      queryKey: ["predictions", region.id],
      queryFn: () => fetchRegionPredictions(region.id),
      enabled: !!regions && regions.length > 0,
    })),
  });

  // Detección de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Formatear regiones con sus predicciones
  const mapRegions = (regions || []).map((region, index) => {
    const predictionsQuery = regionQueries[index];
    const predictions = predictionsQuery?.data?.predictions || [];
    const latest = predictions.length > 0 ? predictions[0] : null;
    const anomaly = latest ? latest.anomaly_type : "NORMAL";
    const severity = latest ? latest.severity_level : 1;
    const coords: [number, number] = [region.latitude || -17.78, region.longitude || -63.18];

    return {
      id: region.id,
      name: region.name,
      coords,
      anomaly,
      severity,
      description: region.description,
      latestPred: latest,
      main_crops: region.main_crops,
      area_hectares: region.area_hectares,
    };
  });

  // Filtrado de regiones
  const filteredRegions = mapRegions.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.main_crops && r.main_crops.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const regionsInAlert = mapRegions.filter((r) => r.anomaly !== "NORMAL").length;

  const selectedRegion = mapRegions.find((r) => r.id === selectedRegionId) || null;

  const handleFlyToRegion = (id: number) => {
    setSelectedRegionId(id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleResetMap = () => {
    setSelectedRegionId(null);
    setResetTrigger((prev) => prev + 1);
  };

  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      ref={mapContainerRef}
      className="absolute inset-0 bg-[#020305] overflow-hidden flex flex-col md:flex-row"
    >
      {/* Indicador de carga superpuesto */}
      {loadingRegions && (
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm z-[1010] flex flex-col items-center justify-center gap-3">
          <div className="w-5 h-5 border border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-[10px] font-mono tracking-widest uppercase text-slate-500">Cargando...</p>
        </div>
      )}

      {/* ─── PANEL LATERAL DESLIZANTE/RETRAÍBLE ─── */}
      <div
        className={`
          absolute top-6 bottom-6 left-6 z-[1030] w-[350px] md:w-[420px] max-w-[calc(100vw-3rem)]
          bg-card/95 backdrop-blur-xl border border-white/[0.03] rounded-lg shadow-2xl
          flex flex-col p-6 transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+24px)]"}
        `}
      >
        {/* Botón pestaña deslizante acoplado al borde derecho */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-10 top-1/2 -translate-y-1/2 w-10 h-36 bg-card/95 border border-l-0 border-white/[0.03] rounded-r flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer shadow-lg select-none"
          title={isSidebarOpen ? "Ocultar panel" : "Mostrar panel"}
        >
          <span className="text-[9px] font-mono tracking-[0.2em] uppercase [writing-mode:vertical-lr] text-slate-400 hover:text-white transition-colors">
            {isSidebarOpen ? "CERRAR" : "REGIONES"}
          </span>
        </button>

        {/* Cabecera */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-[11px] font-mono tracking-[0.25em] text-slate-500 uppercase">
            REGIONES
          </span>
        </div>

        {/* Buscador minimalista sin fondo */}
        <div className="relative mb-6 border-b border-white/[0.05] pb-1">
          <input
            type="text"
            placeholder="Buscar región o cultivo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
          />
        </div>

        {/* Resumen simple */}
        <div className="text-xs font-mono tracking-wider mb-6 flex items-center gap-2.5 text-slate-400">
          <span
            className={`w-2 h-2 rounded-full ${
              regionsInAlert > 0 ? "bg-amber-500 animate-pulse" : "bg-primary"
            }`}
          />
          <span>
            {regionsInAlert > 0
              ? `${regionsInAlert} REGIONES EN OBSERVACIÓN`
              : "CONDICIONES ESTABLES"}
          </span>
        </div>

        {/* Lista de regiones */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          {filteredRegions.length === 0 ? (
            <p className="text-slate-600 text-xs font-mono text-center py-4">Sin resultados</p>
          ) : (
            filteredRegions.map((r) => {
              const risk = humanRisk(r.severity, r.anomaly);
              const isSelected = selectedRegionId === r.id;
              const dotColor =
                r.anomaly === "SEQUIA"
                  ? "bg-drought"
                  : r.anomaly === "INUNDACION"
                  ? "bg-flood"
                  : "bg-primary/40";

              return (
                <button
                  key={r.id}
                  onClick={() => handleFlyToRegion(r.id)}
                  className={`w-full text-left py-3 px-4 rounded flex items-center justify-between border border-transparent hover:border-white/[0.02] hover:bg-white/[0.01] transition-all duration-300 hover:translate-x-1 cursor-pointer ${
                    isSelected ? "bg-white/[0.02] border-white/[0.04]" : ""
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-sm text-slate-300 font-medium">{r.name}</p>
                    <p className="text-xs text-slate-500 font-light">{risk.label}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                </button>
              );
            })
          )}
        </div>

        {/* Botón restaurar */}
        <button
          onClick={handleResetMap}
          className="mt-6 w-full border border-white/[0.05] hover:bg-white/[0.01] text-slate-500 hover:text-slate-300 py-3 rounded text-[11px] font-mono tracking-widest uppercase transition-all cursor-pointer"
        >
          [ Restablecer Vista ]
        </button>
      </div>

      {/* ─── CONTROLES DE CAPA / ESTILO ─── */}
      <div className="absolute top-6 right-6 z-[1000] flex gap-3">
        <div className="flex bg-card/90 backdrop-blur-md border border-white/[0.03] p-1.5 rounded">
          <button
            onClick={() => setMapStyle("dark")}
            className={`px-4 py-2 rounded text-[11px] font-mono tracking-wider uppercase transition-all cursor-pointer ${
              mapStyle === "dark" ? "bg-white text-black font-semibold" : "text-slate-500 hover:text-white"
            }`}
          >
            Oscuro
          </button>
          <button
            onClick={() => setMapStyle("satellite")}
            className={`px-4 py-2 rounded text-[11px] font-mono tracking-wider uppercase transition-all cursor-pointer ${
              mapStyle === "satellite" ? "bg-white text-black font-semibold" : "text-slate-500 hover:text-white"
            }`}
          >
            Satélite
          </button>
        </div>

        <button
          onClick={toggleFullscreen}
          className="bg-card/90 hover:bg-card border border-white/[0.03] px-4.5 py-2.5 rounded text-slate-400 hover:text-white text-[11px] font-mono tracking-wider uppercase transition-all cursor-pointer flex items-center gap-1.5"
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
          <span>Pantalla</span>
        </button>
      </div>

      {/* ─── LEYENDA FLOTANTE ─── */}
      <div className="absolute bottom-6 right-6 bg-card/95 backdrop-blur-xl border border-white/[0.03] p-5 rounded z-[1000] min-w-[180px] hidden sm:block">
        <span className="text-slate-500 text-[11px] font-mono tracking-widest uppercase block mb-3.5 border-b border-white/[0.04] pb-1">
          Indicadores
        </span>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#f97316]" />
            <span className="text-slate-400">Sequía</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span className="text-slate-400">Inundación</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="text-slate-400">Estable</span>
          </div>
        </div>
      </div>

      {/* ─── CONTENEDOR DEL MAPA REAL (Leaflet) ─── */}
      <div className="flex-1 h-full w-full relative z-10">
        <MapContainer
          center={[-17.78, -63.18]}
          zoom={7.5}
          scrollWheelZoom={true}
          className="absolute inset-0 w-full h-full"
          zoomControl={false}
        >
          <TileLayer
            attribution={
              mapStyle === "dark"
                ? '&copy; CARTO &copy; OpenStreetMap contributors'
                : 'Tiles &copy; Esri &mdash; Source: Esri'
            }
            url={
              mapStyle === "dark"
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            }
          />

          {/* Controlador de Zoom */}
          <ZoomControl position="topright" />

          {/* Marcadores y Círculos */}
          {mapRegions.map((region) => {
            const isSelected = selectedRegionId === region.id;
            const color =
              region.anomaly === "SEQUIA"
                ? "#f97316"
                : region.anomaly === "INUNDACION"
                ? "#3b82f6"
                : "#10b981";

            const risk = humanRisk(region.severity, region.anomaly);

            return (
              <React.Fragment key={region.id}>
                {region.anomaly !== "NORMAL" && (
                  <Circle
                    center={region.coords}
                    radius={region.severity * 15000}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: isSelected ? 0.2 : 0.05,
                      weight: isSelected ? 1 : 0.5,
                      dashArray: isSelected ? "3, 3" : undefined,
                    }}
                  />
                )}

                <Marker
                  position={region.coords}
                  icon={createCustomIcon(color, isSelected, region.anomaly !== "NORMAL")}
                  eventHandlers={{
                    click: () => setSelectedRegionId(region.id),
                  }}
                >
                  <Popup>
                    <div className="space-y-3 min-w-[220px] text-slate-200 font-sans p-1">
                      <div>
                        <h5 className="font-bold text-xs text-white uppercase tracking-wider">{region.name}</h5>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: color }}>
                          {risk.label}
                        </p>
                      </div>
                      <p className="text-slate-400 text-[10px] leading-relaxed font-light">{region.description || ""}</p>
                      {region.latestPred ? (
                        <div className="bg-white/[0.02] border border-white/[0.03] rounded p-2 space-y-1 text-[9px] font-mono">
                          <div className="flex justify-between text-slate-500">
                            <span>PROYECCIÓN:</span>
                            <span className="text-white">{humanDate(region.latestPred.target_date).toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>CONFIANZA:</span>
                            <span className="text-emerald-400">{Math.round(region.latestPred.confidence_score * 100)}%</span>
                          </div>
                        </div>
                      ) : null}
                      <div className="pt-1">
                        <Link
                          href={`/region/${region.id}`}
                          className="block text-center border border-white/[0.1] hover:border-white text-white font-mono text-[9px] tracking-wider uppercase py-2 rounded transition-all"
                        >
                          [ Detalles ]
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          <MapController selectedRegionCoords={selectedRegion?.coords || null} resetTrigger={resetTrigger} />
        </MapContainer>
      </div>
    </div>
  );
}
