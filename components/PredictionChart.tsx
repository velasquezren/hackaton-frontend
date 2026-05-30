"use client";

import React from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from "recharts";
import { ClimatePrediction } from "@/lib/api";

interface ChartProps {
  predictions: ClimatePrediction[];
}

/**
 * Gráfico interactivo que representa la evolución del riesgo de anomalías climáticas 
 * y la certeza del modelo predictivo a lo largo de un horizonte de 12 meses.
 */
export default function PredictionChart({ predictions }: ChartProps) {
  // Mapeamos y ordenamos cronológicamente de menor a mayor fecha objetivo
  const data = predictions
    .map(pred => ({
      fecha: new Date(pred.target_date).toLocaleDateString("es-BO", { 
        month: "short", 
        year: "numeric" 
      }),
      "Nivel de Severidad (1-5)": pred.severity_level,
      "Certeza de Predicción (%)": Math.round(pred.confidence_score * 100),
      anomalia: pred.anomaly_type === "SEQUIA" 
        ? "Sequía" 
        : pred.anomaly_type === "INUNDACION" 
        ? "Inundación" 
        : "Normal",
    }))
    .reverse();

  if (predictions.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-card border border-card-border rounded-2xl text-slate-500 font-medium">
        No hay datos históricos o predictivos cargados para esta región.
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-card p-6 rounded-2xl border border-card-border shadow-2xl flex flex-col justify-between">
      <div>
        <h3 className="text-white text-md font-semibold flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse"></span>
          Proyección del Modelo Climático a 12 Meses
        </h3>
        <p className="text-slate-500 text-xs mt-1">
          Evolución del nivel de alerta y precisión probabilística mensual del modelo.
        </p>
      </div>

      <div className="flex-1 min-h-[290px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSeveridad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorConfianza" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis 
              dataKey="fecha" 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11} 
              tickLine={false} 
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "#0f172a", 
                borderColor: "rgba(255,255,255,0.08)", 
                borderRadius: "12px", 
                color: "#fff",
                fontSize: "12px"
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            <Area 
              type="monotone" 
              name="Nivel de Severidad (1-5)"
              dataKey="Nivel de Severidad (1-5)" 
              stroke="#f97316" 
              fillOpacity={1} 
              fill="url(#colorSeveridad)" 
              strokeWidth={2.5}
            />
            <Area 
              type="monotone" 
              name="Certeza de Predicción (%)"
              dataKey="Certeza de Predicción (%)" 
              stroke="#10b981" 
              fillOpacity={1} 
              fill="url(#colorConfianza)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
