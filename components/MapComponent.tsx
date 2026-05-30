"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Popup, Marker } from "react-leaflet";
import L from "leaflet";
import { useQuery, useQueries } from "@tanstack/react-query";
import { fetchRegions, fetchRegionPredictions } from "@/lib/api";

const setupLeafletMarkers = () => {
  if (typeof window !== "undefined") {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }
};

export default function MapComponent() {
  useEffect(() => {
    setupLeafletMarkers();
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

  const centerPosition: [number, number] = [-17.95, -61.20];
  const defaultZoom = 6.5;

  if (loadingRegions) {
    return (
      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-3" style={{ minHeight: "500px" }}>
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-slate-500 text-xs">Cargando mapa...</p>
      </div>
    );
  }

  const mapRegions = (regions || []).map((region, index) => {
    const predictionsQuery = regionQueries[index];
    const predictions = predictionsQuery?.data?.predictions || [];
    const latest = predictions.length > 0 ? predictions[0] : null;
    const anomaly = latest ? latest.anomaly_type : "NORMAL";
    const severity = latest ? latest.severity_level : 1;

    // Usa las coordenadas reales de la base de datos
    const coords: [number, number] = [
      region.latitude || -17.78,
      region.longitude || -63.18,
    ];

    return { id: region.id, name: region.name, coords, anomaly, severity, description: region.description, latestPred: latest, main_crops: region.main_crops, area_hectares: region.area_hectares };
  });

  return (
    <div className="w-full h-full relative" style={{ minHeight: "500px" }}>
      <MapContainer center={centerPosition} zoom={defaultZoom} scrollWheelZoom={true} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {mapRegions.map((region) => {
          const color = region.anomaly === "SEQUIA" ? "#f97316" : region.anomaly === "INUNDACION" ? "#3b82f6" : "#10b981";
          const radius = region.severity * 15000;

          return (
            <React.Fragment key={region.id}>
              <Circle
                center={region.coords}
                radius={radius}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 1.5, dashArray: region.anomaly !== "NORMAL" ? "5, 5" : undefined }}
              />
              <Marker position={region.coords}>
                <Popup>
                  <div className="p-2 max-w-[260px]">
                    <h5 className="font-bold text-sm mb-1">{region.name}</h5>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                        region.anomaly === "SEQUIA" ? "bg-orange-950 text-orange-400" : region.anomaly === "INUNDACION" ? "bg-blue-950 text-blue-400" : "bg-emerald-950 text-emerald-400"
                      }`}>
                        {region.anomaly === "SEQUIA" ? "Sequía" : region.anomaly === "INUNDACION" ? "Inundación" : "Normal"}
                      </span>
                      {region.anomaly !== "NORMAL" && <span className="text-slate-400 text-[10px] font-bold">Sev: {region.severity}/5</span>}
                    </div>
                    {region.main_crops && <p className="text-slate-400 text-[10px] mb-1">🌱 {region.main_crops}</p>}
                    {region.area_hectares && <p className="text-slate-400 text-[10px] mb-2">{region.area_hectares.toLocaleString()} ha monitoreadas</p>}
                    {region.latestPred && (
                      <div className="bg-slate-950/60 p-2 rounded border border-slate-800 text-[10px] space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span>Objetivo:</span>
                          <strong className="text-white">{new Date(region.latestPred.target_date).toLocaleDateString("es-BO", { month: "long", year: "numeric" })}</strong>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Precisión:</span>
                          <strong className="text-emerald-400">{Math.round(region.latestPred.confidence_score * 100)}%</strong>
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

      {/* Leyenda */}
      <div className="absolute bottom-4 right-4 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3 rounded-lg z-[1000] space-y-1.5">
        <h4 className="text-white text-[10px] font-bold uppercase tracking-wider mb-1">Leyenda</h4>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]"></span>
          <span className="text-slate-300">Sequía</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span>
          <span className="text-slate-300">Inundación</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
          <span className="text-slate-300">Estable</span>
        </div>
      </div>
    </div>
  );
}
