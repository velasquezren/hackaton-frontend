"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchRegions,
  fetchRegionPredictions,
  ClimatePrediction,
  Region,
} from "@/lib/api";
import { Sun, CloudRain, ShieldAlert, Calendar } from "lucide-react";

interface AlertItem {
  regionName: string;
  anomaly_type: ClimatePrediction["anomaly_type"];
  severity_level: number;
  target_date: string;
  regionId: number;
}

/**
 * Banner horizontal de alertas activas de alta severidad (>= 4).
 * Color-coded: sequía en naranja, inundación en azul.
 */
export default function AlertsBanner() {
  // Fetch all regions
  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
  });

  // Fetch predictions for all regions in parallel
  const { data: allPredictions } = useQuery({
    queryKey: ["all-predictions-for-alerts", regions?.map((r) => r.id)],
    queryFn: async () => {
      if (!regions || regions.length === 0) return [];
      const results = await Promise.all(
        regions.map(async (region: Region) => {
          try {
            const res = await fetchRegionPredictions(region.id);
            return res.predictions.map((p) => ({
              regionName: region.name,
              anomaly_type: p.anomaly_type,
              severity_level: p.severity_level,
              target_date: p.target_date,
              regionId: region.id,
            }));
          } catch {
            return [];
          }
        })
      );
      return results.flat();
    },
    enabled: !!regions && regions.length > 0,
  });

  // Filter high-severity alerts
  const alerts: AlertItem[] = (allPredictions || []).filter(
    (a) => a.severity_level >= 4 && a.anomaly_type !== "NORMAL"
  );

  if (alerts.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-red-400">
            Alertas Activas de Alta Severidad
          </span>
          <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-500/30">
            {alerts.length}
          </span>
        </div>

        {/* Scrollable alerts row */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {alerts.map((alert, idx) => {
            const isDrought = alert.anomaly_type === "SEQUIA";
            const colorScheme = isDrought
              ? {
                  bg: "bg-drought/5",
                  border: "border-drought/20",
                  iconBg: "bg-drought/10",
                  iconBorder: "border-drought/30",
                  text: "text-drought",
                  badge: "bg-orange-500/20 text-orange-300 border-orange-500/30",
                }
              : {
                  bg: "bg-flood/5",
                  border: "border-flood/20",
                  iconBg: "bg-flood/10",
                  iconBorder: "border-flood/30",
                  text: "text-flood",
                  badge: "bg-blue-500/20 text-blue-300 border-blue-500/30",
                };

            return (
              <motion.div
                key={`${alert.regionId}-${alert.target_date}-${idx}`}
                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className={`flex-shrink-0 ${colorScheme.bg} border ${colorScheme.border} rounded-xl px-4 py-3 flex items-center gap-3 min-w-[280px] hover:scale-[1.02] transition-transform cursor-default`}
              >
                {/* Icon */}
                <div
                  className={`w-9 h-9 rounded-lg ${colorScheme.iconBg} border ${colorScheme.iconBorder} flex items-center justify-center flex-shrink-0`}
                >
                  {isDrought ? (
                    <Sun className={`w-4 h-4 ${colorScheme.text}`} />
                  ) : (
                    <CloudRain className={`w-4 h-4 ${colorScheme.text}`} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-bold truncate">
                    {alert.regionName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${colorScheme.badge}`}
                    >
                      {isDrought ? "Sequía" : "Inundación"}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(alert.target_date).toLocaleDateString("es-BO", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Severity badge */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <span className="text-red-400 text-sm font-black">
                    {alert.severity_level}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Hook exportado para que otros componentes puedan obtener el conteo de alertas activas.
 */
export function useAlertCount() {
  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
  });

  const { data: allPredictions } = useQuery({
    queryKey: ["all-predictions-for-alerts", regions?.map((r) => r.id)],
    queryFn: async () => {
      if (!regions || regions.length === 0) return [];
      const results = await Promise.all(
        regions.map(async (region: Region) => {
          try {
            const res = await fetchRegionPredictions(region.id);
            return res.predictions
              .filter((p) => p.severity_level >= 4 && p.anomaly_type !== "NORMAL")
              .map((p) => ({
                regionName: region.name,
                anomaly_type: p.anomaly_type,
                severity_level: p.severity_level,
                target_date: p.target_date,
                regionId: region.id,
              }));
          } catch {
            return [];
          }
        })
      );
      return results.flat();
    },
    enabled: !!regions && regions.length > 0,
  });

  return allPredictions?.length || 0;
}
