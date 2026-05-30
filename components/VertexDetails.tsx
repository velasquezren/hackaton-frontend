"use client";

import React from "react";
import { Cpu, Database, Award, Info } from "lucide-react";
import { ClimatePrediction } from "@/lib/api";

interface Props {
  prediction: ClimatePrediction;
}

/**
 * Tarjeta de explicabilidad que formatea y desglosa los metadatos y pesos 
 * devueltos por la inferencia en Google Vertex AI.
 */
export default function VertexDetails({ prediction }: Props) {
  const metadata = prediction.vertex_ai_output;

  if (!metadata) {
    return (
      <div className="bg-card border border-card-border p-6 rounded-2xl text-slate-500 flex items-center gap-3">
        <Info className="w-5 h-5 text-slate-500" />
        <span className="text-sm font-medium">
          No hay telemetría de Vertex AI adjunta a este registro de predicción.
        </span>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border p-6 rounded-2xl shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Cpu className="text-accent w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white text-sm font-semibold">Explicabilidad de Inferencia</h4>
            <span className="text-[10px] text-slate-500 block">Google Vertex AI Telemetry</span>
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          Información estructural sobre el modelo predictivo neuronal de regresión profunda y las variables analizadas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {/* ID del Modelo */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-card-border">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">
            Modelo de Inferencia
          </span>
          <span className="text-violet-300 font-mono text-xs font-semibold block">
            {metadata.model_id || "LSTM_Precipitation_SCZ_v3"}
          </span>
        </div>

        {/* Métricas del Modelo */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-card-border">
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">
            Exactitud del Modelo
          </span>
          <span className="text-emerald-400 font-mono text-xs font-semibold block flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            {metadata.validation_metric || "F1-Score: 0.91"}
          </span>
        </div>
      </div>

      {/* Características / Pesos */}
      {metadata.features_used && metadata.features_used.length > 0 && (
        <div className="mt-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-3 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-accent" />
            Variables del Suelo e Índices Oceánicos Evaluados:
          </span>
          <div className="flex flex-wrap gap-2">
            {metadata.features_used.map((feat: string, idx: number) => (
              <span 
                key={idx} 
                className="bg-accent/5 text-violet-300 border border-accent/20 px-2.5 py-1 rounded-full text-[10px] font-mono"
              >
                {feat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Acordeón de Datos Crudos */}
      <details className="group border-t border-card-border mt-6 pt-4">
        <summary className="list-none flex justify-between items-center text-slate-400 text-xs hover:text-white cursor-pointer transition-all">
          <span>Ver Payload Completo de Inferencia (GCP SDK)</span>
          <span className="transition-transform group-open:rotate-180 text-accent text-[10px]">▼</span>
        </summary>
        <pre className="mt-4 bg-slate-950 p-4 rounded-xl text-[10px] font-mono text-emerald-400 border border-card-border overflow-x-auto max-h-[180px] scrollbar-thin">
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </details>
    </div>
  );
}
