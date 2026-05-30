"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  ArrowLeft,
  MapPin,
  ShieldAlert,
  Sun,
  CloudRain,
  CheckCircle,
  Calendar,
  TrendingUp,
  Sprout,
} from "lucide-react";

/**
 * Skeleton loader for the page sections
 */
function SectionSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className={`bg-card border border-card-border rounded-2xl ${height} animate-pulse`}>
      <div className="p-6 space-y-3">
        <div className="h-4 bg-slate-800 rounded w-1/3" />
        <div className="h-3 bg-slate-800/60 rounded w-2/3" />
        <div className="h-32 bg-slate-800/30 rounded-xl mt-4" />
      </div>
    </div>
  );
}

/**
 * Página de detalle de una región específica con predicciones completas,
 * timeline, evaluación de riesgo y detalles de Vertex AI.
 */
export default function RegionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const regionId = Number(params.id);

  // Fetch all regions to validate current ID and provide a selector
  const { data: regions, isLoading: loadingRegionsList } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
  });

  // Auto-redirect if the region ID is invalid or outdated
  useEffect(() => {
    if (regions && regions.length > 0) {
      const isValid = regions.some((r) => r.id === regionId);
      if (!isValid) {
        router.replace(`/region/${regions[0].id}`);
      }
    }
  }, [regions, regionId, router]);

  // Fetch predictions
  const {
    data: predictionData,
    isLoading: loadingPredictions,
    error: errorPredictions,
  } = useQuery({
    queryKey: ["predictions", regionId],
    queryFn: () => fetchRegionPredictions(regionId),
    enabled: !!regionId,
  });

  // Fetch timeline
  const {
    data: timelineData,
    isLoading: loadingTimeline,
  } = useQuery({
    queryKey: ["timeline", regionId],
    queryFn: () => fetchPredictionTimeline(regionId),
    enabled: !!regionId,
  });

  // Fetch risk assessment
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
    <div className="space-y-6">
      {/* Back button + Region header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="w-10 h-10 rounded-xl bg-card border border-card-border flex items-center justify-center hover:bg-white/5 transition-all hover:border-primary/30"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400" />
          </Link>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Detalle de Región
            </span>
            {region ? (
              <h2 className="text-white text-xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                {region.name}
              </h2>
            ) : (
              <div className="h-6 w-48 bg-slate-800 rounded animate-pulse mt-1" />
            )}
          </div>
        </div>

        {/* Region selector dropdown */}
        {regions && regions.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-medium">Cambiar región:</span>
            <select
              value={regionId || ""}
              onChange={handleRegionChange}
              className="bg-slate-950 text-white border border-card-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary/50 transition-all"
            >
              {regions.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Region description */}
      {region?.description && (
        <div className="bg-card border border-card-border p-5 rounded-2xl">
          <p className="text-slate-400 text-sm leading-relaxed">
            {region.description}
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-3 border-t border-card-border/50 pt-3">
            <div>
              <span>ID de Monitoreo:</span>
              <span className="text-slate-400 font-mono font-bold ml-1">
                #SCZ-00{region.id}
              </span>
            </div>
            {region.main_crops && (
              <div className="flex items-center gap-1">
                <Sprout className="w-3.5 h-3.5 text-primary" />
                <span>Cultivos:</span>
                <span className="text-slate-300 font-medium">{region.main_crops}</span>
              </div>
            )}
            {region.area_hectares && (
              <div>
                <span>Área Monitoreada:</span>
                <span className="text-slate-300 font-medium ml-1">
                  {region.area_hectares.toLocaleString()} ha
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {errorPredictions && (
        <div className="bg-card border border-red-500/20 p-8 rounded-2xl text-center">
          <ShieldAlert className="text-red-400 w-10 h-10 mx-auto mb-3" />
          <h4 className="text-white text-md font-bold">Error al Cargar Datos</h4>
          <p className="text-slate-400 text-sm mt-2">
            No se pudieron obtener las predicciones para esta región. Verifique la conexión con el backend.
          </p>
        </div>
      )}

      {/* Full-width Prediction Chart */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
            Proyección Climática Completa
          </span>
        </div>
        {loadingPredictions || loadingTimeline ? (
          <SectionSkeleton height="h-[420px]" />
        ) : (
          <PredictionChart predictions={predictionData?.predictions || []} />
        )}
      </div>

      {/* Timeline summary cards */}
      {timelineData && timelineData.timeline.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-accent" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Línea Temporal de Anomalías
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {timelineData.timeline.map((entry, idx) => {
              const isDrought = entry.anomaly_type === "SEQUIA";
              const isFlood = entry.anomaly_type === "INUNDACION";
              const borderColor = isDrought
                ? "border-drought/30 hover:border-drought/60"
                : isFlood
                ? "border-flood/30 hover:border-flood/60"
                : "border-primary/20 hover:border-primary/40";

              return (
                <div
                  key={idx}
                  className={`bg-card border ${borderColor} rounded-xl p-3 transition-all`}
                >
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {new Date(entry.target_date).toLocaleDateString("es-BO", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    {isDrought ? (
                      <Sun className="w-3.5 h-3.5 text-drought" />
                    ) : isFlood ? (
                      <CloudRain className="w-3.5 h-3.5 text-flood" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-primary" />
                    )}
                    <span className={`text-xs font-bold ${
                      isDrought ? "text-drought" : isFlood ? "text-flood" : "text-primary"
                    }`}>
                      {isDrought ? "Sequía" : isFlood ? "Inundación" : "Normal"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Sev.</span>
                    <span className={`text-xs font-black ${
                      entry.severity_level >= 4 ? "text-red-400" : entry.severity_level >= 3 ? "text-amber-400" : "text-slate-300"
                    }`}>
                      {entry.severity_level}/5
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">Conf.</span>
                    <span className="text-[10px] text-primary font-bold">
                      {Math.round(entry.confidence_score * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Risk Assessment */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
            Evaluación de Riesgo Integral
          </span>
        </div>
        {loadingRisk ? (
          <SectionSkeleton height="h-72" />
        ) : riskData ? (
          <RiskAssessmentPanel riskData={riskData} />
        ) : (
          <div className="bg-card border border-card-border p-8 rounded-2xl text-center">
            <p className="text-slate-500 text-sm">
              No hay datos de evaluación de riesgo disponibles para esta región.
            </p>
          </div>
        )}
      </div>

      {/* Vertex AI Details Grid */}
      {predictionData && predictionData.predictions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Telemetría de Vertex AI por Predicción
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {predictionData.predictions.map((prediction) => (
              <VertexDetails key={prediction.id} prediction={prediction} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
