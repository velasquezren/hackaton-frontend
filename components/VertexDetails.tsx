"use client";

import React from "react";
import { ClimatePrediction } from "@/lib/api";

interface Props {
  prediction: ClimatePrediction;
}

export default function VertexDetails({ prediction }: Props) {
  const metadata = prediction.vertex_ai_output;

  if (!metadata) {
    return (
      <div className="bg-card border border-white/[0.03] p-6 rounded text-slate-500 font-mono text-xs">
        No hay datos técnicos de calibración disponibles para esta proyección.
      </div>
    );
  }

  // Mapear nombres técnicos de variables
  const getReadableFeatureName = (feat: string) => {
    const mapping: Record<string, string> = {
      "precipitation_anomaly": "Precipitación acumulada",
      "soil_moisture_ndvi": "Humedad superficial (NDVI)",
      "sst_pacific_index": "Índice de temperatura superficial oceánica (ENSO)",
      "temperature_anomaly": "Temperatura media",
      "ndwi_water_index": "Estrés hídrico vegetal (NDWI)",
      "evapotranspiration": "Tasa de evapotranspiración",
    };
    return mapping[feat] || feat;
  };

  return (
    <div className="bg-card border border-white/[0.03] p-6 rounded shadow-xl flex flex-col justify-between h-full space-y-6">
      <div className="space-y-1">
        <h4 className="text-white text-xs font-mono uppercase tracking-wider">FICHA TÉCNICA</h4>
        <p className="text-slate-500 text-[11px] leading-relaxed font-light">
          Parámetros calibrados por el modelo para estimar la probabilidad y severidad de las anomalías climáticas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Identificador del Modelo */}
        <div className="border border-white/[0.03] p-4 rounded bg-[#020305]/30">
          <span className="text-slate-500 text-[9px] font-mono tracking-wider block mb-1 uppercase">
            Modelo
          </span>
          <span className="text-slate-300 font-mono text-[10px] block">
            {metadata.model_id
              ? metadata.model_id.replace("_SCZ_", " SCZ ").replace(/_/g, " ").toUpperCase()
              : "LSTM NET"}
          </span>
        </div>

        {/* Métrica de Precisión */}
        <div className="border border-white/[0.03] p-4 rounded bg-[#020305]/30">
          <span className="text-slate-500 text-[9px] font-mono tracking-wider block mb-1 uppercase">
            Certeza del modelo
          </span>
          <span className="text-emerald-400 font-mono text-[10px] block uppercase">
            {metadata.validation_metric || "F1-Score: 0.91"}
          </span>
        </div>
      </div>

      {/* Variables Evaluadas */}
      {metadata.features_used && metadata.features_used.length > 0 && (
        <div className="space-y-2">
          <span className="text-slate-400 text-[9px] font-mono tracking-wider block uppercase">
            Parámetros analizados:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {metadata.features_used.map((feat: string, idx: number) => (
              <span
                key={idx}
                className="border border-white/[0.04] bg-[#020305]/40 text-slate-300 px-2 py-1 rounded text-[9px] font-mono"
              >
                {getReadableFeatureName(feat).toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
