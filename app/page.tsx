"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardSummary } from "@/lib/api";
import CountUp from "react-countup";

export default function LandingPage() {
  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
  });

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background text-foreground flex flex-col justify-between font-sans antialiased relative">
      {/* ─── ANIMACIÓN DE FONDO: RADAR SATELITAL (Sentinel-2 Scanner) ─── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 select-none">
        <div className="absolute w-[900px] h-[900px] bg-primary/[0.01] rounded-full blur-[180px]" />
        
        {/* Marca de agua gigante y ultra tenue estilo ingeniería */}
        <div className="absolute text-[8vw] font-mono font-bold tracking-[0.25em] text-white/[0.007] uppercase whitespace-nowrap select-none">
          BUILD WITH AI 2026
        </div>
        
        {/* Ondas concéntricas de escaneo satelital */}
        {[1, 2, 3].map((index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.5, opacity: 0.12 }}
            animate={{
              scale: [0.5, 2.2],
              opacity: [0.12, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: (index - 1) * 2.6,
              ease: "linear",
            }}
            className="absolute rounded-full border border-primary/[0.08]"
            style={{
              width: "650px",
              height: "650px",
            }}
          />
        ))}

        {/* Línea horizontal de barrido satelital */}
        <motion.div
          animate={{
            y: ["-50vh", "50vh"],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-40"
        />
      </div>

      {/* ─── NAVEGACIÓN COMPACTA ─── */}
      <nav className="w-full bg-background/20 backdrop-blur-xl border-b border-white/[0.01] h-20 sm:h-24 flex-shrink-0 z-50">
        <div className="max-w-[90vw] mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white text-sm sm:text-lg font-light uppercase tracking-[0.25em]">
              AgroClima
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-8">
            <a
              href="https://t.me/CampoIA_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-block text-xs uppercase font-mono tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              Alertas Telegram
            </a>
            <Link
              href="/mapa"
              prefetch={true}
              className="bg-white text-black font-semibold text-xs sm:text-base px-4 py-2 sm:px-6 sm:py-3 rounded hover:bg-neutral-200 transition-colors"
            >
              Mapa en Vivo
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HÉROE SIMPLIFICADO Y CENTRADO ─── */}
      <main className="flex-1 flex flex-col items-center justify-center pt-12 pb-20 md:pb-28 max-w-[90vw] mx-auto px-6 w-full text-center z-10 space-y-8 md:space-y-10 lg:space-y-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-wide select-none bg-white/[0.01] border border-white/[0.02] px-8 lg:px-12 py-3 lg:py-5 rounded-full backdrop-blur-md"
        >
          {/* Santa Cruz en degradé verde y blanco (colores de la bandera) */}
          <span className="bg-gradient-to-r from-emerald-500 via-emerald-100 to-white bg-clip-text text-transparent font-extrabold">
            Santa Cruz
          </span>
          <span className="text-slate-600 font-light">:</span>
          {/* Build With AI 2026 en colores corporativos de Google */}
          <span className="text-[#4285F4]">Build</span>
          <span className="text-[#EA4335]">With</span>
          <span className="text-[#FBBC05]">AI</span>
          <span className="text-[#34A853]">2026</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-6xl sm:text-8xl lg:text-[110px] xl:text-[140px] font-light text-white leading-none tracking-tight"
        >
          Prevención Climática.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-xl lg:text-2xl text-slate-400 font-light leading-relaxed max-w-4xl mx-auto"
        >
          Proyecciones a 12 meses de sequías e inundaciones para el sector agropecuario de Santa Cruz basadas en datos de Sentinel-2.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6 lg:pt-10 w-full"
        >
          <motion.div
            whileHover={{ scale: 1.025, translateY: -1 }}
            whileTap={{ scale: 0.985 }}
            className="w-full sm:w-auto"
          >
            <Link
              href="/mapa"
              prefetch={true}
              className="bg-primary hover:bg-emerald-600 text-slate-950 font-bold px-10 lg:px-14 py-5 lg:py-6 rounded text-xs lg:text-base tracking-wider uppercase transition-all w-full block text-center"
            >
              Abrir Visualizador
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.025, translateY: -1 }}
            whileTap={{ scale: 0.985 }}
            className="w-full sm:w-auto"
          >
            <a
              href="https://t.me/CampoIA_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/[0.08] hover:bg-white/[0.02] text-white font-medium px-10 lg:px-14 py-5 lg:py-6 rounded text-xs lg:text-base tracking-wider uppercase transition-all w-full block text-center"
            >
              Canal de Alertas
            </a>
          </motion.div>
        </motion.div>
      </main>

      {/* ─── MÉTRICAS GENERALES ─── */}
      <section className="border-t border-white/[0.01] bg-card/[0.05] py-10 lg:py-16 flex-shrink-0 z-10">
        <div className="max-w-[90vw] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/[0.03]">
            {[
              { label: "Regiones", value: summary?.total_regions || 5, suffix: "" },
              { label: "Predicciones", value: summary?.total_predictions || 0, suffix: "" },
              { label: "Precisión del Modelo", value: Math.round((summary?.average_confidence || 0.78) * 100), suffix: "%" },
              { label: "Cobertura", value: 12.5, suffix: "M ha" },
            ].map((stat, i) => (
              <div key={i} className="text-center pt-3 md:pt-0 first:pt-0 flex flex-col justify-center">
                <span className="text-xs sm:text-sm font-mono tracking-widest text-slate-500 uppercase block mb-2">
                  {stat.label}
                </span>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-white font-mono leading-none">
                  {stat.label === "Cobertura" ? (
                    <span>{stat.value}{stat.suffix}</span>
                  ) : (
                    <CountUp end={stat.value} duration={1.5} separator="," suffix={stat.suffix} />
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PIE DE PÁGINA ─── */}
      <footer className="border-t border-white/[0.01] py-10 px-8 flex-shrink-0 z-10">
        <div className="max-w-[90vw] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm font-mono text-slate-500">
          <span>AGROCLIMA · 2026</span>
          <span className="tracking-widest">MONITOREO CLIMÁTICO DE SANTA CRUZ</span>
        </div>
      </footer>
    </div>
  );
}
