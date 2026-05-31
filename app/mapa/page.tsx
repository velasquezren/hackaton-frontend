"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "@/lib/api";
import { Sprout, ArrowLeft, MapPin, ShieldAlert, Satellite } from "lucide-react";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-background flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">Cargando mapa de Santa Cruz...</p>
    </div>
  ),
});

export default function MapaPage() {
  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
  });

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* ─── BARRA SUPERIOR COMPACTA ─── */}
      <header className="h-20 bg-background border-b border-white/[0.02] flex items-center justify-between px-8 z-50 flex-shrink-0">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            prefetch={true}
            className="group flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-mono tracking-wider uppercase"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Volver</span>
          </Link>
          <span className="text-white text-sm font-light uppercase tracking-[0.25em] hidden sm:inline">
            AgroClima
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>En vivo</span>
        </div>
      </header>

      {/* ─── MAPA FULLSCREEN ─── */}
      <main className="flex-1 relative">
        <MapComponent />
      </main>
    </div>
  );
}
