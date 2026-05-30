"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchRegions,
  fetchRegionPredictions,
  fetchRiskAssessment,
  fetchPredictionTimeline,
} from "@/lib/api";
import PredictionChart from "@/components/PredictionChart";
import VertexDetails from "@/components/VertexDetails";
import RiskAssessmentPanel from "@/components/RiskAssessmentPanel";

function SectionSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`bg-card border border-card-border rounded ${height} animate-pulse`}>
      <div className="p-6 space-y-3">
        <div className="h-3 bg-slate-800/80 rounded w-1/4" />
        <div className="h-2 bg-slate-800/40 rounded w-1/2" />
        <div className="h-32 bg-slate-800/10 rounded mt-4" />
      </div>
    </div>
  );
}

export default function RegionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const regionId = Number(params.id);

  // Obtener lista de regiones
  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
  });

  // Redirección si la región no existe
  useEffect(() => {
    if (regions && regions.length > 0) {
      const isValid = regions.some((r) => r.id === regionId);
      if (!isValid) {
        router.replace(`/region/${regions[0].id}`);
      }
    }
  }, [regions, regionId, router]);

  // Carga de predicciones
  const {
    data: predictionData,
    isLoading: loadingPredictions,
    error: errorPredictions,
  } = useQuery({
    queryKey: ["predictions", regionId],
    queryFn: () => fetchRegionPredictions(regionId),
    enabled: !!regionId,
  });

  // Carga del historial / línea de tiempo
  const {
    data: timelineData,
    isLoading: loadingTimeline,
  } = useQuery({
    queryKey: ["timeline", regionId],
    queryFn: () => fetchPredictionTimeline(regionId),
    enabled: !!regionId,
  });

  // Carga de la evaluación de riesgo
  const {
    data: riskData,
    isLoading: loadingRisk,
  } = useQuery({
    queryKey: ["risk-assessment", regionId],
    queryFn: () => fetchRiskAssessment(regionId),
    enabled: !!regionId,
  });

  const region = predictionData?.region || riskData?.region || timelineData?.region;

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/region/${e.target.value}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* ─── CABECERA ─── */}
      <header className="h-20 border-b border-white/[0.02] bg-background sticky top-0 z-40 mb-12 flex items-center justify-between px-10">
        <Link
          href="/mapa"
          prefetch={true}
          className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-mono tracking-wider uppercase"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al mapa</span>
        </Link>
        <span className="text-white text-sm font-light uppercase tracking-[0.25em]">
          AgroClima
        </span>
      </header>

      {/* ─── CONTENEDOR PRINCIPAL ─── */}
      <main className="max-w-[90vw] mx-auto px-6 space-y-16">
        {/* Cabecera del Reporte */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.03] pb-8">
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase block">
              DIAGNÓSTICO REGIONAL
            </span>
            {region ? (
              <h1 className="text-white text-3xl font-light tracking-tight">
                {region.name}
              </h1>
            ) : (
              <div className="h-8 w-64 bg-slate-800 rounded animate-pulse" />
            )}
          </div>

          {/* Selector de Zonas */}
          {regions && regions.length > 0 && (
            <div className="flex items-center gap-3 border border-white/[0.04] rounded px-4 py-2.5 bg-card/40">
              <span className="text-slate-500 text-xs font-mono uppercase">ZONA:</span>
              <select
                value={regionId || ""}
                onChange={handleRegionChange}
                className="bg-transparent text-white font-medium text-sm focus:outline-none cursor-pointer pr-1 border-none font-mono"
              >
                {regions.map((reg) => (
                  <option key={reg.id} value={reg.id} className="bg-[#020305] text-white">
                    {reg.name.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Ficha descriptiva */}
        {region?.description && (
          <div className="bg-card border border-white/[0.03] p-8 rounded shadow-xl space-y-8">
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-light">
              {region.description}
            </p>
            <div className="flex flex-wrap gap-x-10 gap-y-3 text-xs font-mono text-slate-500 border-t border-white/[0.03] pt-6">
              <div>
                <span>ID:</span>
                <span className="text-slate-300 ml-1">#SCZ-00{region.id}</span>
              </div>
              {region.main_crops && (
                <div>
                  <span>CULTIVOS:</span>
                  <span className="text-slate-300 ml-1 uppercase">{region.main_crops}</span>
                </div>
              )}
              {region.area_hectares && (
                <div>
                  <span>ÁREA:</span>
                  <span className="text-slate-300 ml-1">
                    {region.area_hectares.toLocaleString()} HA
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estado de error */}
        {errorPredictions && (
          <div className="border border-red-500/10 bg-red-500/[0.02] p-10 rounded text-center">
            <h4 className="text-red-400 text-sm font-mono uppercase tracking-wider">Error de Conexión</h4>
            <p className="text-slate-500 text-xs mt-2 max-w-md mx-auto">
              No se pudieron obtener las proyecciones climáticas para esta región. Verifique la conexión con el servidor.
            </p>
          </div>
        )}

        {/* Gráfico de Proyección */}
        <div className="space-y-4">
          <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase block">
            [ Evolución Temporal del Alerta ]
          </span>
          {loadingPredictions || loadingTimeline ? (
            <SectionSkeleton height="h-[420px]" />
          ) : (
            <PredictionChart predictions={predictionData?.predictions || []} />
          )}
        </div>

        {/* Línea temporal de 12 meses */}
        {timelineData && timelineData.timeline.length > 0 && (
          <div className="space-y-4">
            <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase block">
              [ Proyecciones Mensuales a 12 Meses ]
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {timelineData.timeline.map((entry, idx) => {
                const isDrought = entry.anomaly_type === "SEQUIA";
                const isFlood = entry.anomaly_type === "INUNDACION";
                const dotColor = isDrought
                  ? "bg-drought"
                  : isFlood
                  ? "bg-flood"
                  : "bg-primary";

                const label = isDrought ? "Sequía" : isFlood ? "Inundación" : "Estable";

                return (
                  <div
                    key={idx}
                    className="bg-card border border-white/[0.03] rounded p-5 space-y-4 transition-colors hover:border-white/[0.06]"
                  >
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {new Date(entry.target_date).toLocaleDateString("es-BO", {
                        month: "short",
                        year: "numeric",
                      }).toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      <span className="text-xs text-slate-300 font-medium">
                        {label}
                      </span>
                    </div>
                    <div className="border-t border-white/[0.03] pt-3 space-y-1.5 text-[10px] font-mono text-slate-500">
                      <div className="flex justify-between">
                        <span>RIESGO:</span>
                        <span className="text-slate-300">{entry.severity_level}/5</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CONFIANZA:</span>
                        <span className="text-slate-300">{Math.round(entry.confidence_score * 100)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Paneles de mitigación y calibración */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase block">
              [ Medidas de Mitigación Recomendadas ]
            </span>
            {loadingRisk ? (
              <SectionSkeleton height="h-80" />
            ) : riskData ? (
              <RiskAssessmentPanel riskData={riskData} />
            ) : (
              <div className="bg-card border border-white/[0.03] p-10 rounded text-center">
                <p className="text-slate-500 text-xs font-mono">
                  Evaluación de riesgo no disponible para esta región.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <span className="text-[11px] font-mono tracking-widest text-slate-500 uppercase block">
              [ Calibración del Modelo Predictivo ]
            </span>
            {predictionData && predictionData.predictions.length > 0 ? (
              <VertexDetails prediction={predictionData.predictions[0]} />
            ) : (
              <SectionSkeleton height="h-80" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
