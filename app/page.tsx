"use client";

import React, { useState, useEffect } from "react";
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
import RiskAssessmentPanel from "@/components/RiskAssessmentPanel";
import CountUp from "react-countup";
import {
  CloudRain,
  Sun,
  ShieldAlert,
  CheckCircle,
  Sprout,
  ArrowRight,
  MapPin,
  Droplets,
  Thermometer,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null);

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
  });

  const { data: regions, isLoading: loadingRegions, error: errorRegions } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
  });

  // Cuando las regiones cargan, seleccionar la primera automáticamente
  useEffect(() => {
    if (regions && regions.length > 0 && selectedRegionId === null) {
      setSelectedRegionId(regions[0].id);
    }
  }, [regions, selectedRegionId]);

  const { data: predictionData, isLoading: loadingPredictions } = useQuery({
    queryKey: ["predictions", selectedRegionId],
    queryFn: () => fetchRegionPredictions(selectedRegionId!),
    enabled: !!selectedRegionId,
  });

  const { data: riskData, isLoading: loadingRisk } = useQuery({
    queryKey: ["risk-assessment", selectedRegionId],
    queryFn: () => fetchRiskAssessment(selectedRegionId!),
    enabled: !!selectedRegionId,
  });

  // Loading
  if (loadingRegions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Error / empty
  if (errorRegions || !regions || regions.length === 0) {
    return (
      <div className="bg-card border border-card-border p-8 rounded-2xl max-w-lg mx-auto text-center mt-12">
        <ShieldAlert className="text-amber-500 w-10 h-10 mx-auto mb-3" />
        <h3 className="text-white text-lg font-bold">Sin datos cargados</h3>
        <p className="text-slate-400 text-sm mt-2">
          Ejecutá <code className="bg-slate-900 px-2 py-0.5 rounded text-xs">python manage.py seed_climate_data</code> para cargar las regiones y predicciones de ejemplo.
        </p>
      </div>
    );
  }

  const activeRegion = regions.find((r) => r.id === selectedRegionId) || regions[0];
  const currentRegionId = activeRegion.id;
  const predictions = predictionData?.predictions || [];
  const latestPrediction: ClimatePrediction | undefined = predictions.length > 0 ? predictions[0] : undefined;

  // Contar alertas severas
  const severeCount = predictions.filter((p) => p.severity_level >= 4 && p.anomaly_type !== "NORMAL").length;

  const anomalyLabel = (type: string) => type === "SEQUIA" ? "Sequía" : type === "INUNDACION" ? "Inundación" : "Normal";
  const anomalyColor = (type: string) => type === "SEQUIA" ? "text-drought" : type === "INUNDACION" ? "text-flood" : "text-primary";
  const anomalyIcon = (type: string) => type === "SEQUIA" ? <Sun className="w-4 h-4" /> : type === "INUNDACION" ? <CloudRain className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />;

  return (
    <div className="space-y-6 max-w-6xl">

      {/* === HEADER: Resumen rápido === */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-white text-xl font-bold flex items-center gap-2">
            <Sprout className="w-5 h-5 text-primary" />
            Pronóstico Climático
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Predicciones a 12 meses para el agro de Santa Cruz, Bolivia
          </p>
        </div>
        <Link
          href="/mapa"
          className="inline-flex items-center gap-2 bg-card border border-card-border text-sm text-slate-300 hover:text-white px-4 py-2.5 rounded-xl transition-all hover:border-primary/30"
        >
          <MapPin className="w-4 h-4 text-primary" />
          Ver mapa completo
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* === STATS: 4 indicadores clave === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-card-border p-4 rounded-xl">
          <p className="text-slate-500 text-xs mb-1">Regiones</p>
          <p className="text-2xl font-bold text-white">
            {loadingSummary ? "—" : <CountUp end={summary?.total_regions || regions.length} duration={1} />}
          </p>
        </div>
        <div className="bg-card border border-card-border p-4 rounded-xl">
          <p className="text-slate-500 text-xs mb-1">Predicciones</p>
          <p className="text-2xl font-bold text-white">
            {loadingSummary ? "—" : <CountUp end={summary?.total_predictions || 0} duration={1} />}
          </p>
        </div>
        <div className="bg-card border border-card-border p-4 rounded-xl">
          <p className="text-slate-500 text-xs mb-1">Precisión promedio</p>
          <p className="text-2xl font-bold text-emerald-400">
            {loadingSummary ? "—" : <CountUp end={Math.round((summary?.average_confidence || 0) * 100)} duration={1} suffix="%" />}
          </p>
        </div>
        <div className={`bg-card border p-4 rounded-xl ${summary?.highest_severity?.severity_level && summary.highest_severity.severity_level >= 4 ? "border-red-500/30" : "border-card-border"}`}>
          <p className="text-slate-500 text-xs mb-1">Alerta máxima</p>
          {summary?.highest_severity ? (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                <CountUp end={summary.highest_severity.severity_level} duration={0.8} />
              </span>
              <span className="text-slate-500 text-sm">/5</span>
            </div>
          ) : (
            <p className="text-2xl font-bold text-white">—</p>
          )}
        </div>
      </div>

      {/* === SELECTOR DE REGIÓN + ALERTA ACTUAL === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Selector */}
        <div className="bg-card border border-card-border p-5 rounded-xl">
          <label className="text-slate-500 text-xs font-medium block mb-2">Seleccionar región</label>
          <select
            value={selectedRegionId || ""}
            onChange={(e) => setSelectedRegionId(Number(e.target.value))}
            className="w-full bg-slate-950 text-white border border-card-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-all"
          >
            {regions.map((reg) => (
              <option key={reg.id} value={reg.id}>{reg.name}</option>
            ))}
          </select>
          {activeRegion.main_crops && (
            <p className="text-slate-500 text-xs mt-3 flex items-center gap-1.5">
              <Sprout className="w-3 h-3 text-primary" />
              {activeRegion.main_crops}
            </p>
          )}
          {activeRegion.area_hectares && (
            <p className="text-slate-500 text-xs mt-1">
              {activeRegion.area_hectares.toLocaleString()} ha monitoreadas
            </p>
          )}
        </div>

        {/* Alerta principal de la región */}
        <div className="lg:col-span-2 bg-card border border-card-border p-5 rounded-xl">
          {loadingPredictions ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : latestPrediction ? (
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                latestPrediction.anomaly_type === "SEQUIA" ? "bg-drought/10 text-drought"
                : latestPrediction.anomaly_type === "INUNDACION" ? "bg-flood/10 text-flood"
                : "bg-primary/10 text-primary"
              }`}>
                {anomalyIcon(latestPrediction.anomaly_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-bold">{activeRegion.name}</h3>
                  <span className={`text-xs font-bold ${anomalyColor(latestPrediction.anomaly_type)}`}>
                    {anomalyLabel(latestPrediction.anomaly_type)}
                  </span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                  {activeRegion.description}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-3 h-3" />
                    Severidad: <strong className={latestPrediction.severity_level >= 4 ? "text-red-400" : "text-white"}>{latestPrediction.severity_level}/5</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Precisión: <strong className="text-emerald-400">{Math.round(latestPrediction.confidence_score * 100)}%</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3" />
                    {new Date(latestPrediction.target_date).toLocaleDateString("es-BO", { month: "long", year: "numeric" })}
                  </span>
                  {severeCount > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <ShieldAlert className="w-3 h-3" />
                      {severeCount} alerta{severeCount > 1 ? "s" : ""} severa{severeCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/region/${activeRegion.id}`}
                className="text-xs text-primary hover:text-emerald-300 font-medium flex items-center gap-1 flex-shrink-0 transition-colors"
              >
                Detalle <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">Sin predicciones cargadas para esta región.</p>
            </div>
          )}
        </div>
      </div>

      {/* === TIMELINE: 12 meses en cards compactas === */}
      {predictions.length > 0 && (
        <div>
          <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
            Pronóstico mensual — {activeRegion.name}
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {[...predictions].reverse().map((pred, idx) => {
              const isDrought = pred.anomaly_type === "SEQUIA";
              const isFlood = pred.anomaly_type === "INUNDACION";
              const borderColor = isDrought ? "border-drought/30" : isFlood ? "border-flood/30" : "border-card-border";
              const isSevere = pred.severity_level >= 4;

              return (
                <div key={idx} className={`bg-card border ${borderColor} rounded-lg p-2 text-center ${isSevere ? "ring-1 ring-red-500/20" : ""}`}>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {new Date(pred.target_date).toLocaleDateString("es-BO", { month: "short" }).replace(".", "")}
                  </p>
                  <div className={`text-xs font-bold mt-0.5 ${anomalyColor(pred.anomaly_type)}`}>
                    {isDrought ? "🌡" : isFlood ? "🌧" : "✓"}
                  </div>
                  <p className={`text-[10px] font-bold mt-0.5 ${isSevere ? "text-red-400" : "text-slate-400"}`}>
                    {pred.severity_level}/5
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* === GRÁFICO + RIESGO === */}
      {predictions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PredictionChart predictions={predictions} />
          {loadingRisk ? (
            <div className="bg-card border border-card-border rounded-2xl h-[400px] flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : riskData ? (
            <RiskAssessmentPanel riskData={riskData} />
          ) : null}
        </div>
      )}
    </div>
  );
}
