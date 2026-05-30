"use client";

import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Circle, Popup, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useQuery, useQueries } from "@tanstack/react-query";
import { fetchRegions, fetchRegionPredictions } from "@/lib/api";
import { ShieldAlert, Sprout, Layers, Sun, CloudRain, Maximize2, Minimize2, Search, CheckCircle, Crosshair } from "lucide-react";

// Estilos de animación CSS inline para pulsos del mapa
const pulseStyles = `
  @keyframes markerPulse {
    0% { transform: scale(0.9); opacity: 0.9; }
    50% { transform: scale(1.4); opacity: 0.3; }
    100% { transform: scale(0.9); opacity: 0.9; }
  }
  .marker-ping-orange {
    animation: markerPulse 1.8s infinite ease-in-out;
    background-color: rgba(249, 115, 22, 0.4);
  }
  .marker-ping-blue {
    animation: markerPulse 1.8s infinite ease-in-out;
    background-color: rgba(59, 130, 246, 0.4);
  }
`;

// Controlador del mapa para animar vuelos de cámara (Fly-To)
function MapController({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [center, zoom, map]);
  return null;
}

// Crear marcador personalizado
const createCustomMarker = (anomaly: string, isFocused: boolean) => {
  const color = anomaly === "SEQUIA" ? "#f97316" : anomaly === "INUNDACION" ? "#3b82f6" : "#10b981";
  const pingClass = anomaly === "SEQUIA" ? "marker-ping-orange" : anomaly === "INUNDACION" ? "marker-ping-blue" : "";
  const size = isFocused ? "18px" : "12px";
  const pingSize = isFocused ? "26px" : "20px";

  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        ${anomaly !== "NORMAL" ? `
          <div class="${pingClass}" style="position: absolute; width: ${pingSize}; height: ${pingSize}; border-radius: 50%;"></div>
        ` : ""}
        <div style="
          position: relative; 
          width: ${size}; 
          height: ${size}; 
          background-color: ${color}; 
          border: 2px solid #060a10; 
          border-radius: 50%; 
          box-shadow: 0 0 10px ${color};
          transition: all 0.3s ease;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10]
  });
};

export default function MapComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite">("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterAnomaly, setFilterAnomaly] = useState<"ALL" | "SEQUIA" | "INUNDACION" | "NORMAL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [focusRegion, setFocusRegion] = useState<{ coords: [number, number]; zoom: number } | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const styleEl = document.createElement("style");
      styleEl.innerHTML = pulseStyles;
      document.head.appendChild(styleEl);
      return () => {
        document.head.removeChild(styleEl);
      };
    }
  }, []);

  // Escuchar cambios de pantalla completa del navegador
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
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

  // Alternar pantalla completa
  const toggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen().catch((err) => {
        console.error("Error al activar pantalla completa:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const centerPosition: [number, number] = [-17.85, -61.50];
  const defaultZoom = 6.2;

  if (loadingRegions) {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-3 animate-pulse" style={{ minHeight: "600px" }}>
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs">Cargando base de datos geoespacial...</p>
      </div>
    );
  }

  // Mapear regiones con sus predicciones asociadas
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

  // Filtrar regiones según los controles interactivos de usuario
  const filteredRegions = mapRegions.filter((region) => {
    const matchesFilter = filterAnomaly === "ALL" || region.anomaly === filterAnomaly;
    const matchesSearch = region.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (region.main_crops && region.main_crops.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Estadísticas del mapa en tiempo real
  const totalMonitoredHectares = mapRegions.reduce((acc, curr) => acc + (curr.area_hectares || 0), 0);
  const regionsInAlert = mapRegions.filter(r => r.anomaly !== "NORMAL").length;
  const maxSeverityActive = mapRegions.reduce((max, curr) => curr.severity > max ? curr.severity : max, 0);

  const handleFlyToRegion = (coords: [number, number], id: number) => {
    setFocusRegion({ coords, zoom: 8.5 });
    setSelectedRegionId(id);
  };

  const handleResetMap = () => {
    setFocusRegion({ coords: centerPosition, zoom: defaultZoom });
    setSelectedRegionId(null);
  };

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full relative border border-card-border rounded-2xl overflow-hidden flex flex-col md:flex-row bg-slate-950" 
      style={{ minHeight: "600px" }}
    >
      
      {/* PANEL LATERAL DE NAVEGACIÓN Y FILTROS */}
      <div className="w-full md:w-80 bg-slate-950 border-b md:border-b-0 md:border-r border-card-border p-4 flex flex-col justify-between z-[1000] relative">
        <div className="space-y-4">
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-primary" />
              Consola GIS AgriTech
            </h3>
            <span className="text-[10px] text-slate-500 block">Monitoreo Satelital de Santa Cruz</span>
          </div>

          {/* Buscador */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar región o cultivo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-card-border rounded-lg pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          </div>

          {/* Filtros de Peligro Climático */}
          <div className="space-y-1.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Filtro de Peligro</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setFilterAnomaly("ALL")}
                className={`py-1.5 rounded text-[10px] font-bold border transition-all ${
                  filterAnomaly === "ALL" 
                    ? "bg-slate-800 text-white border-slate-700" 
                    : "bg-slate-900/40 text-slate-400 border-card-border hover:bg-slate-900"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterAnomaly("SEQUIA")}
                className={`py-1.5 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                  filterAnomaly === "SEQUIA" 
                    ? "bg-orange-500/10 text-orange-400 border-orange-500/30" 
                    : "bg-slate-900/40 text-slate-400 border-card-border hover:bg-slate-900"
                }`}
              >
                <Sun className="w-3 h-3 text-orange-400" />
                Sequía
              </button>
              <button
                onClick={() => setFilterAnomaly("INUNDACION")}
                className={`py-1.5 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                  filterAnomaly === "INUNDACION" 
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/30" 
                    : "bg-slate-900/40 text-slate-400 border-card-border hover:bg-slate-900"
                }`}
              >
                <CloudRain className="w-3 h-3 text-blue-400" />
                Inundación
              </button>
              <button
                onClick={() => setFilterAnomaly("NORMAL")}
                className={`py-1.5 rounded text-[10px] font-bold border transition-all flex items-center justify-center gap-1 ${
                  filterAnomaly === "NORMAL" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                    : "bg-slate-900/40 text-slate-400 border-card-border hover:bg-slate-900"
                }`}
              >
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                Normal
              </button>
            </div>
          </div>

          {/* Listado de Regiones */}
          <div className="space-y-1.5">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Regiones en Pantalla ({filteredRegions.length})</span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {filteredRegions.length === 0 ? (
                <p className="text-slate-600 text-[10px] text-center py-4">No se hallaron coincidencias.</p>
              ) : (
                filteredRegions.map((r) => {
                  const borderCol = r.anomaly === "SEQUIA" ? "border-orange-500/20 hover:border-orange-500/40" 
                                  : r.anomaly === "INUNDACION" ? "border-blue-500/20 hover:border-blue-500/40" 
                                  : "border-card-border hover:border-primary/30";
                  
                  return (
                    <button
                      key={r.id}
                      onClick={() => handleFlyToRegion(r.coords, r.id)}
                      className={`w-full text-left p-2.5 rounded-lg border bg-slate-900/40 hover:bg-slate-900 transition-all flex flex-col gap-1 ${borderCol} ${
                        selectedRegionId === r.id ? "bg-slate-900 border-primary/50" : ""
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white font-bold">{r.name}</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          r.anomaly === "SEQUIA" ? "bg-orange-500/10 text-orange-400" 
                          : r.anomaly === "INUNDACION" ? "bg-blue-500/10 text-blue-400" 
                          : "bg-emerald-500/10 text-emerald-400"
                        }`}>
                          {r.anomaly}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-slate-500">
                        <span>{r.main_crops || "Cultivos variados"}</span>
                        {r.anomaly !== "NORMAL" && (
                          <span className="text-red-400 font-bold">Sev. {r.severity}</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Resumen Estadístico Rápido */}
        <div className="border-t border-card-border pt-4 mt-4 space-y-2 hidden md:block">
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Total Superficie:</span>
            <strong className="text-slate-300">{totalMonitoredHectares.toLocaleString()} ha</strong>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Zonas en Alerta:</span>
            <strong className="text-orange-400">{regionsInAlert}</strong>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Gravedad Máxima:</span>
            <strong className="text-red-400">{maxSeverityActive}/5</strong>
          </div>
          <button 
            onClick={handleResetMap}
            className="w-full mt-2 bg-slate-900 border border-card-border hover:bg-slate-800 text-slate-300 py-1.5 rounded text-[10px] font-medium transition-all"
          >
            Restaurar Vista Global
          </button>
        </div>
      </div>

      {/* ÁREA DEL MAPA */}
      <div className="flex-1 h-full relative">
        
        {/* Controles Flotantes Superpuestos sobre el Mapa */}
        <div className="absolute top-4 right-4 z-[1000] flex gap-2">
          {/* Selector de capas */}
          <div className="flex bg-slate-950/90 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-xl">
            <button
              onClick={() => setMapStyle("dark")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                mapStyle === "dark" 
                  ? "bg-primary text-slate-950" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Oscuro
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

          {/* Botón Pantalla Completa */}
          <button
            onClick={toggleFullscreen}
            className="bg-slate-950/90 hover:bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-white shadow-xl transition-all"
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Leyenda del Mapa */}
        <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl z-[1000] space-y-2.5 shadow-2xl">
          <h4 className="text-white text-[9px] font-bold uppercase tracking-wider mb-0.5 border-b border-slate-800 pb-1.5">
            Leyenda de Riesgo
          </h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" style={{ boxShadow: "0 0 6px #f97316" }}></span>
              <span className="text-slate-300">Déficit Hídrico (Sequía)</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" style={{ boxShadow: "0 0 6px #3b82f6" }}></span>
              <span className="text-slate-300">Exceso Pluvial (Inundación)</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" style={{ boxShadow: "0 0 6px #10b981" }}></span>
              <span className="text-slate-300">Condición Normal</span>
            </div>
          </div>
        </div>

        {/* Mapa Leaflet */}
        <MapContainer center={centerPosition} zoom={defaultZoom} scrollWheelZoom={true} className="h-full w-full">
          
          {/* Habilita Fly-To dinámicos */}
          {focusRegion && <MapController center={focusRegion.coords} zoom={focusRegion.zoom} />}

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

          {filteredRegions.map((region) => {
            const color = region.anomaly === "SEQUIA" ? "#f97316" : region.anomaly === "INUNDACION" ? "#3b82f6" : "#10b981";
            const radius = region.severity * 16000;
            const isSelected = selectedRegionId === region.id;

            return (
              <React.Fragment key={region.id}>
                <Circle
                  center={region.coords}
                  radius={radius}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.35 : mapStyle === "satellite" ? 0.20 : 0.08,
                    weight: isSelected ? 2 : 1,
                    dashArray: region.anomaly !== "NORMAL" ? "4, 6" : undefined
                  }}
                />
                <Marker
                  position={region.coords}
                  icon={createCustomMarker(region.anomaly, isSelected)}
                  eventHandlers={{
                    click: () => setSelectedRegionId(region.id)
                  }}
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
      </div>
    </div>
  );
}
