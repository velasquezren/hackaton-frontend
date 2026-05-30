"use client";

import React from "react";
import { RiskAssessmentResponse } from "@/lib/api";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Sun,
  CloudRain,
  Leaf,
  Lightbulb,
} from "lucide-react";

interface Props {
  riskData: RiskAssessmentResponse;
  compact?: boolean;
}

const riskLevelConfig: Record<
  string,
  { color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  CRITICO: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
  },
  ALTO: {
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
  },
  MODERADO: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: <Shield className="w-5 h-5 text-amber-400" />,
  },
  BAJO: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
  },
};

/**
 * Panel de evaluación de riesgo con badge de nivel, desglose de anomalías 
 * y lista de recomendaciones.
 */
export default function RiskAssessmentPanel({ riskData, compact = false }: Props) {
  const riskKey = riskData.risk_level.toUpperCase();
  const config = riskLevelConfig[riskKey] || riskLevelConfig["MODERADO"];

  const { drought_months, flood_months, normal_months } = riskData.anomaly_breakdown;
  const totalMonths = drought_months + flood_months + normal_months || 1;

  const droughtPct = Math.round((drought_months / totalMonths) * 100);
  const floodPct = Math.round((flood_months / totalMonths) * 100);
  const normalPct = Math.round((normal_months / totalMonths) * 100);

  return (
    <div className="bg-card border border-card-border rounded-2xl p-6 shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center`}>
            {config.icon}
          </div>
          <div>
            <h4 className="text-white text-sm font-bold">Evaluación de Riesgo</h4>
            <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">
              {riskData.region.name}
            </span>
          </div>
        </div>

        {/* Risk level badge */}
        <div className={`${config.bg} border ${config.border} rounded-xl px-3 py-1.5 flex items-center gap-2`}>
          <span className={`text-xs font-black uppercase ${config.color}`}>
            {riskData.risk_level}
          </span>
          <span className={`text-lg font-black ${config.color}`}>
            {riskData.risk_score.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Anomaly breakdown bar */}
      <div className="mb-4">
        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block mb-2">
          Desglose de Anomalías (Meses Proyectados)
        </span>
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
          {droughtPct > 0 && (
            <div
              className="h-full bg-drought transition-all duration-700"
              style={{ width: `${droughtPct}%` }}
              title={`Sequía: ${drought_months} meses`}
            />
          )}
          {floodPct > 0 && (
            <div
              className="h-full bg-flood transition-all duration-700"
              style={{ width: `${floodPct}%` }}
              title={`Inundación: ${flood_months} meses`}
            />
          )}
          {normalPct > 0 && (
            <div
              className="h-full bg-primary transition-all duration-700"
              style={{ width: `${normalPct}%` }}
              title={`Normal: ${normal_months} meses`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <Sun className="w-3 h-3 text-drought" />
            <span className="text-[10px] text-slate-400">
              Sequía: <strong className="text-drought">{drought_months}m</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CloudRain className="w-3 h-3 text-flood" />
            <span className="text-[10px] text-slate-400">
              Inundación: <strong className="text-flood">{flood_months}m</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Leaf className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-slate-400">
              Normal: <strong className="text-primary">{normal_months}m</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {riskData.recommendations && riskData.recommendations.length > 0 && !compact && (
        <div className="border-t border-card-border pt-4">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 mb-3">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            Recomendaciones de Mitigación
          </span>
          <ul className="space-y-2">
            {riskData.recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-3 rounded-lg border border-card-border"
              >
                <span className="text-primary font-bold text-[10px] mt-0.5 flex-shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
