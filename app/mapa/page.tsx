"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Map, Info } from "lucide-react";

// Importación dinámica con Server-Side Rendering (SSR) deshabilitado.
// Esto es obligatorio para Leaflet, ya que hace uso del objeto 'window' del navegador 
// y causaría un crash en el renderizado del servidor de Next.js si se importara normalmente.
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[550px] bg-card border border-card-border rounded-2xl flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-3 border-violet-500/20 border-t-violet-400 rounded-full animate-spin"></div>
      <p className="text-slate-400 text-sm font-medium">Inicializando proyección espacial y lienzos GIS...</p>
    </div>
  ),
});

/**
 * Vista de Monitoreo Geoespacial (GIS) del Departamento de Santa Cruz, Bolivia
 */
export default function MapaPage() {
  return (
    <div className="space-y-6">
      {/* Tarjeta de Encabezado Informativo */}
      <div className="bg-card border border-card-border p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-400/10 border border-violet-400/20 flex items-center justify-center">
            <Map className="text-violet-400 w-4 h-4" />
          </div>
          <div>
            <h3 className="text-white text-md font-semibold">Panel Geoespacial (GIS) de Alerta Temprana</h3>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
              Mapeo de Telemetría Predictiva
            </span>
          </div>
        </div>
        <p className="text-slate-400 text-sm mt-3 leading-relaxed">
          Visualización cartográfica en tiempo real del riesgo proyectado a **12 meses de lead-time** en las principales 
          comunas y zonas agrícolas del Departamento de Santa Cruz, Bolivia. Haz clic sobre los marcadores para 
          desplegar la telemetría e informes climatológicos detallados.
        </p>
      </div>

      {/* Contenedor del Mapa Dinámico */}
      <div className="h-[550px] rounded-2xl overflow-hidden shadow-2xl relative border border-card-border">
        <MapComponent />
      </div>
    </div>
  );
}
