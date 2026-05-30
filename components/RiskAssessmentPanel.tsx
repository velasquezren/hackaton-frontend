"use client";

import React from "react";
import { RiskAssessmentResponse } from "@/lib/api";

interface Props {
  riskData: RiskAssessmentResponse;
  compact?: boolean;
}

const riskLevelConfig: Record<string, { color: string; label: string }> = {
  CRITICO: { color: "text-red-400", label: "CRÍTICO" },
  ALTO: { color: "text-orange-400", label: "ALTO" },
  MODERADO: { color: "text-amber-400", label: "MODERADO" },
  BAJO: { color: "text-emerald-400", label: "BAJO" },
};

export default function RiskAssessmentPanel({ riskData, compact = false }: Props) {
  const riskKey = riskData.risk_level.toUpperCase();
  const config = riskLevelConfig[riskKey] || riskLevelConfig["MODERADO"];

  const { drought_months, flood_months, normal_months } = riskData.anomaly_breakdown;
  const totalMonths = drought_months + flood_months + normal_months || 1;

  const droughtPct = Math.round((drought_months / totalMonths) * 100);
  const floodPct = Math.round((flood_months / totalMonths) * 100);
  const normalPct = Math.round((normal_months / totalMonths) * 100);

  return (
    <div className="bg-card border border-white/[0.03] rounded p-6 shadow-xl flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.03] pb-4">
        <div className="space-y-1">
          <h4 className="text-white text-xs font-mono uppercase tracking-wider">EVALUACIÓN DE RIESGO</h4>
          <span className="text-[10px] text-slate-500 block font-mono">
            {riskData.region.name.toUpperCase()}
          </span>
        </div>

        {/* Risk level badge */}
        <div className="text-right">
          <span className={`text-xs font-mono font-bold tracking-widest ${config.color}`}>
            [{config.label} · SCORE {riskData.risk_score.toFixed(1)}]
          </span>
        </div>
      </div>

      {/* Anomaly breakdown bar */}
      <div className="space-y-2">
        <span className="text-slate-500 text-[9px] font-mono tracking-wider block uppercase">
          Distribución de Anomalías (Línea Temporal)
        </span>
        
        {/* Barra ultra delgada sin bordes redondeados toscos */}
        <div className="w-full h-1.5 overflow-hidden flex bg-[#020305] rounded-sm">
          {droughtPct > 0 && (
            <div
              className="h-full bg-drought transition-all duration-500"
              style={{ width: `${droughtPct}%` }}
              title={`Sequía: ${drought_months} meses`}
            />
          )}
          {floodPct > 0 && (
            <div
              className="h-full bg-flood transition-all duration-500"
              style={{ width: `${floodPct}%` }}
              title={`Inundación: ${flood_months} meses`}
            />
          )}
          {normalPct > 0 && (
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${normalPct}%` }}
              title={`Normal: ${normal_months} meses`}
            />
          )}
        </div>

        {/* Legend minimal */}
        <div className="flex items-center gap-4 pt-1 font-mono text-[9px]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-drought" />
            <span className="text-slate-500">
              SEQUÍA: <strong className="text-slate-300 font-medium">{drought_months}M</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-flood" />
            <span className="text-slate-500">
              INUNDACIÓN: <strong className="text-slate-300 font-medium">{flood_months}M</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-slate-500">
              ESTABLE: <strong className="text-slate-300 font-medium">{normal_months}M</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {riskData.recommendations && riskData.recommendations.length > 0 && !compact && (
        <div className="space-y-3 pt-2 border-t border-white/[0.03]">
          <span className="text-slate-500 text-[9px] font-mono tracking-wider block uppercase">
            Medidas Correctivas y Preventivas
          </span>
          <ul className="space-y-2">
            {riskData.recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-300 leading-relaxed font-light pl-4 relative border-l border-white/[0.08]"
              >
                <span className="text-[9px] font-mono text-slate-500 block mb-0.5">
                  MEDIDA {String(idx + 1).padStart(2, "0")}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
