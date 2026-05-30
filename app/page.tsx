"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  fetchRegions,
  fetchRegionPredictions,
  fetchDashboardSummary,
  fetchRiskAssessment,
  ClimatePrediction,
} from "@/lib/api";
import PredictionChart from "@/components/PredictionChart";
import VertexDetails from "@/components/VertexDetails";
import AlertsBanner from "@/components/AlertsBanner";
import RiskAssessmentPanel from "@/components/RiskAssessmentPanel";
import CountUp from "react-countup";
import {
  CloudRain,
  Sun,
  ShieldAlert,
  CheckCircle,
  Calendar,
  Percent,
  Layers,
  Sprout,
  Globe,
  BarChart3,
  Gauge,
  ExternalLink,
} from "lucide-react";

// --- Skeleton Components ---

function StatCardSkeleton() {
  return (
    <div className="bg-card border border-card-border p-5 rounded-2xl animate-pulse">
      <div className="h-3 bg-slate-800 rounded w-24 mb-3" />
      <div className="h-8 bg-slate-800/60 rounded w-16 mb-2" />
      <div className="h-3 bg-slate-800/40 rounded w-32" />
    </div>
  );
}

function PredictionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-card-border p-6 rounded-2xl">
            <div className="h-3 bg-slate-800 rounded w-24 mb-3" />
            <div className="h-4 bg-slate-800/60 rounded w-32 mb-4" />
            <div className="h-12 bg-slate-800/30 rounded-xl mb-4" />
            <div className="h-3 bg-slate-800/40 rounded w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-card-border rounded-2xl h-[400px]">
          <div className="p-6 space-y-3">
            <div className="h-4 bg-slate-800 rounded w-48" />
            <div className="h-3 bg-slate-800/60 rounded w-64" />
            <div className="h-64 bg-slate-800/20 rounded-xl mt-4" />
          </div>
        </div>
        <div className="bg-card border border-card-border rounded-2xl h-[400px]">
          <div className="p-6 space-y-3">
            <div className="h-4 bg-slate-800 rounded w-40" />
            <div className="h-3 bg-slate-800/60 rounded w-56" />
            <div className="h-48 bg-slate-800/20 rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cabina Central de Control AgriTech - Dashboard de Visualización Dinámica
 */
export default function Dashboard() {
  const [selectedRegionId, setSelectedRegionId] = useState<number>(1);

  // 1. Dashboard summary
  const {
    data: summary,
    isLoading: loadingSummary,
  } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
  });

  // 2. Obtiene la lista de regiones
  const {
    data: regions,
    isLoading: loadingRegions,
    error: errorRegions,
  } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
  });

  // 3. Obtiene las predicciones climáticas de la región seleccionada
  const {
    data: predictionData,
    isLoading: loadingPredictions,
    error: errorPredictions,
  } = useQuery({
    queryKey: ["predictions", selectedRegionId],
    queryFn: () => fetchRegionPredictions(selectedRegionId),
    enabled: !!selectedRegionId,
  });

  // 4. Risk assessment for selected region
  const {
    data: riskData,
    isLoading: loadingRisk,
  } = useQuery({
    queryKey: ["risk-assessment", selectedRegionId],
    queryFn: () => fetchRiskAssessment(selectedRegionId),
    enabled: !!selectedRegionId,
  });

  // Carga inicial
  if (loadingRegions) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <PredictionSkeleton />
      </div>
    );
  }

  // Error al conectar al backend
  if (errorRegions || !regions || regions.length === 0) {
    return (
      <div className="bg-card border border-card-border p-8 rounded-3xl max-w-2xl mx-auto text-center mt-12 shadow-2xl">
        <ShieldAlert className="text-amber-500 w-12 h-12 mx-auto mb-4 animate-bounce" />
        <h3 className="text-white text-lg font-bold">Sin Conexión con la Base de Datos</h3>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
          No pudimos leer las regiones agrícolas. Esto puede deberse a que tu base de datos de Cloud SQL está vacía
          o a que aún no has cargado los datos iniciales de prueba en el backend.
        </p>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 mt-6 text-left text-xs font-mono text-slate-300">
          <p className="text-primary font-bold mb-2"># ¿Cómo solucionar esto rápidamente?</p>
          <p>1. Ingresa a tu panel de administración:</p>
          <p className="text-amber-400 font-semibold mb-2">👉 https://backend-agritech-698520637534.us-central1.run.app/admin/</p>
          <p>2. Crea al menos una Región y asóciale predicciones, o ejecuta el script de carga de prueba detallado en el README.md de tu backend.</p>
        </div>
      </div>
    );
  }

  // Región actualmente seleccionada
  const activeRegion = regions.find((r) => r.id === selectedRegionId) || regions[0];

  // Predicción climática más severa
  const latestPrediction: ClimatePrediction | undefined =
    predictionData?.predictions && predictionData.predictions.length > 0
      ? predictionData.predictions[0]
      : undefined;

  return (
    <div className="space-y-6">
      {/* --- ALERTAS BANNER --- */}
      <AlertsBanner />

      {/* --- STAT CARDS ROW --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Regiones */}
        <div className="bg-card border border-card-border p-5 rounded-2xl group hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              Total Regiones
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Globe className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {loadingSummary ? (
              <div className="h-8 w-12 bg-slate-800 rounded animate-pulse" />
            ) : (
              <CountUp end={summary?.total_regions || regions.length} duration={1.5} />
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Zonas agrícolas monitoreadas
          </span>
        </div>

        {/* Total Predicciones */}
        <div className="bg-card border border-card-border p-5 rounded-2xl group hover:border-accent/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              Total Predicciones
            </span>
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-accent" />
            </div>
          </div>
          <div className="text-3xl font-black text-white tracking-tight">
            {loadingSummary ? (
              <div className="h-8 w-12 bg-slate-800 rounded animate-pulse" />
            ) : (
              <CountUp end={summary?.total_predictions || 0} duration={1.5} />
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Inferencias generadas por IA
          </span>
        </div>

        {/* Confianza Promedio */}
        <div className="bg-card border border-card-border p-5 rounded-2xl group hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              Confianza Promedio
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Gauge className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white tracking-tight">
              {loadingSummary ? (
                <div className="h-8 w-16 bg-slate-800 rounded animate-pulse" />
              ) : (
                <CountUp
                  end={Math.round((summary?.average_confidence || 0) * 100)}
                  duration={1.5}
                  suffix="%"
                />
              )}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            Precisión promedio del modelo
          </span>
        </div>

        {/* Alerta Máxima */}
        <div className={`bg-card border p-5 rounded-2xl group transition-all ${
          summary?.highest_severity?.severity_level && summary.highest_severity.severity_level >= 4
            ? "border-red-500/30 hover:border-red-500/50"
            : "border-card-border hover:border-amber-500/30"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
              Alerta Máxima
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              summary?.highest_severity?.severity_level && summary.highest_severity.severity_level >= 4
                ? "bg-red-500/10 border border-red-500/30"
                : "bg-amber-500/10 border border-amber-500/20"
            }`}>
              <ShieldAlert className={`w-4 h-4 ${
                summary?.highest_severity?.severity_level && summary.highest_severity.severity_level >= 4
                  ? "text-red-400 animate-pulse"
                  : "text-amber-400"
              }`} />
            </div>
          </div>
          {loadingSummary ? (
            <div className="h-8 w-20 bg-slate-800 rounded animate-pulse" />
          ) : summary?.highest_severity ? (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-white tracking-tight">
                  <CountUp end={summary.highest_severity.severity_level} duration={1} />
                </span>
                <span className="text-slate-500 text-sm font-bold">/ 5</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block truncate">
                {summary.highest_severity.region_name} •{" "}
                <span className={
                  summary.highest_severity.anomaly_type === "SEQUIA"
                    ? "text-drought"
                    : summary.highest_severity.anomaly_type === "INUNDACION"
                    ? "text-flood"
                    : "text-primary"
                }>
                  {summary.highest_severity.anomaly_type === "SEQUIA"
                    ? "Sequía"
                    : summary.highest_severity.anomaly_type === "INUNDACION"
                    ? "Inundación"
                    : "Normal"}
                </span>
              </span>
            </>
          ) : (
            <span className="text-slate-500 text-sm">Sin datos</span>
          )}
        </div>
      </div>

      {/* --- REGION SELECTOR + INFO --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selector de Región */}
        <div className="bg-card border border-card-border p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">
              Filtro Geográfico
            </span>
            <h3 className="text-white text-lg font-bold">Seleccionar Región Agrícola</h3>
            <p className="text-slate-500 text-xs mt-1">
              Cambia entre regiones de Santa Cruz para ver las proyecciones climáticas.
            </p>
          </div>
          <div className="mt-6">
            <select
              value={selectedRegionId}
              onChange={(e) => setSelectedRegionId(Number(e.target.value))}
              className="w-full bg-slate-950 text-white border border-card-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-all font-semibold"
            >
              {regions.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  📍 {reg.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Información General de la Región */}
        <div className="lg:col-span-2 bg-card border border-card-border p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <span className="text-primary text-[10px] uppercase font-bold tracking-wider block mb-1 flex items-center gap-1">
              <Sprout className="w-3.5 h-3.5" />
              Región Seleccionada
            </span>
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-bold">{activeRegion.name}</h3>
              <Link
                href={`/region/${activeRegion.id}`}
                className="flex items-center gap-1.5 text-[10px] text-primary hover:text-emerald-300 font-bold uppercase tracking-wider transition-colors"
              >
                Ver Detalle Completo
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-slate-400 text-sm mt-3 leading-relaxed">
              {activeRegion.description || "Sin descripción disponible para esta área productiva."}
            </p>
          </div>
          <div className="text-xs text-slate-500 mt-4 border-t border-card-border/60 pt-4 flex items-center gap-2">
            <span>ID Único de Monitoreo:</span>
            <span className="text-slate-400 font-mono font-bold">#SCZ-00{activeRegion.id}</span>
          </div>
        </div>
      </div>

      {/* --- ESTADOS DE CARGA DE PREDICCIONES --- */}
      {loadingPredictions ? (
        <PredictionSkeleton />
      ) : !latestPrediction ? (
        <div className="bg-card border border-card-border p-12 rounded-2xl text-center shadow-xl">
          <ShieldAlert className="text-amber-500 w-10 h-10 mx-auto mb-3 animate-pulse" />
          <h4 className="text-white text-md font-bold">Sin Predicciones Cargadas</h4>
          <p className="text-slate-400 text-sm mt-2 max-w-lg mx-auto">
            La región <strong>{activeRegion.name}</strong> está registrada, pero aún no se han calculado predicciones climáticas a 12 meses en la base de datos.
          </p>
        </div>
      ) : (
        <>
          {/* --- TARJETAS MÉTRICAS DE PREDICCIÓN CLIMÁTICA --- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Alerta de Anomalía */}
            <div className="bg-card border border-card-border p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">
                  Pronóstico a 12 Meses
                </span>
                <h4 className="text-white text-md font-bold mt-1">Fenómeno Predicho</h4>
              </div>
              <div className="my-6 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  latestPrediction.anomaly_type === "SEQUIA"
                    ? "bg-drought/10 border border-drought/20 text-drought"
                    : latestPrediction.anomaly_type === "INUNDACION"
                    ? "bg-flood/10 border border-flood/20 text-flood"
                    : "bg-primary/10 border border-primary/20 text-primary"
                }`}>
                  {latestPrediction.anomaly_type === "SEQUIA" ? (
                    <Sun className="w-6 h-6 animate-pulse" />
                  ) : latestPrediction.anomaly_type === "INUNDACION" ? (
                    <CloudRain className="w-6 h-6 animate-bounce" />
                  ) : (
                    <CheckCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <span className={`text-xl font-black block tracking-wide uppercase ${
                    latestPrediction.anomaly_type === "SEQUIA"
                      ? "text-drought"
                      : latestPrediction.anomaly_type === "INUNDACION"
                      ? "text-flood"
                      : "text-primary"
                  }`}>
                    {latestPrediction.anomaly_type === "SEQUIA"
                      ? "Sequía"
                      : latestPrediction.anomaly_type === "INUNDACION"
                      ? "Inundación"
                      : "Normal"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Tipo de alerta meteorológica</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-950/40 p-2 rounded-lg border border-card-border">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Fecha Objetivo: </span>
                <strong className="text-white font-mono ml-auto">
                  {new Date(latestPrediction.target_date).toLocaleDateString("es-BO", {
                    month: "long",
                    year: "numeric",
                  })}
                </strong>
              </div>
            </div>

            {/* Severidad */}
            <div className="bg-card border border-card-border p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">
                  Magnitud del Impacto
                </span>
                <h4 className="text-white text-md font-bold mt-1">Nivel de Severidad</h4>
              </div>
              <div className="my-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white tracking-tighter">
                    <CountUp end={latestPrediction.severity_level} duration={1.5} />
                  </span>
                  <span className="text-slate-500 text-lg font-bold">/ 5</span>
                </div>
                {/* Barra Visual */}
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden mt-4 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      latestPrediction.severity_level >= 4
                        ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        : latestPrediction.severity_level >= 3
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${latestPrediction.severity_level * 20}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {latestPrediction.severity_level >= 4 ? (
                  <span className="text-red-400 font-bold">⚠️ Impacto Severo: Medidas preventivas sugeridas</span>
                ) : (
                  <span>Riesgo tolerable para agricultura general</span>
                )}
              </div>
            </div>

            {/* Confianza */}
            <div className="bg-card border border-card-border p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider block mb-1">
                  Probabilidad del Algoritmo
                </span>
                <h4 className="text-white text-md font-bold mt-1">Certeza de Predicción</h4>
              </div>
              <div className="my-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full border-4 border-slate-900 border-t-primary flex items-center justify-center relative">
                  <Percent className="w-4 h-4 text-primary absolute right-1.5 top-1.5" />
                  <span className="text-2xl font-black text-white leading-none">
                    <CountUp end={Math.round(latestPrediction.confidence_score * 100)} duration={1.5} />
                  </span>
                </div>
                <div>
                  <span className="text-slate-200 font-bold block">
                    {latestPrediction.confidence_score >= 0.85 ? "Confianza Extrema" : "Confianza Moderada"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">Margen de error mitigado por IA</span>
                </div>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1 bg-slate-950/40 p-2 rounded-lg border border-card-border">
                <Layers className="w-3.5 h-3.5 text-accent" />
                <span>Fecha de Corrida: </span>
                <span className="text-slate-300 font-mono ml-auto">{latestPrediction.prediction_date}</span>
              </div>
            </div>
          </div>

          {/* --- GRÁFICOS Y DETALLES DE IA --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PredictionChart predictions={predictionData?.predictions || []} />
            <VertexDetails prediction={latestPrediction} />
          </div>
        </>
      )}

      {/* --- RISK ASSESSMENT SECTION --- */}
      {selectedRegionId && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
              Evaluación de Riesgo — {activeRegion.name}
            </span>
          </div>
          {loadingRisk ? (
            <div className="bg-card border border-card-border rounded-2xl h-64 animate-pulse">
              <div className="p-6 space-y-3">
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-800/60 rounded w-2/3" />
                <div className="h-32 bg-slate-800/30 rounded-xl mt-4" />
              </div>
            </div>
          ) : riskData ? (
            <RiskAssessmentPanel riskData={riskData} compact />
          ) : (
            <div className="bg-card border border-card-border p-6 rounded-2xl text-center">
              <p className="text-slate-500 text-sm">
                No hay datos de evaluación de riesgo disponibles para esta región.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
