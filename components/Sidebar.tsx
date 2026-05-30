"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAlertCount } from "@/components/AlertsBanner";
import {
  Sprout,
  LayoutDashboard,
  Map,
  Database,
  CloudSun,
  ShieldAlert,
  MapPin,
} from "lucide-react";

/**
 * Sidebar lateral premium con navegación y badge de alertas activas.
 * Componente cliente para acceder a usePathname y useAlertCount.
 */
export default function Sidebar() {
  const pathname = usePathname();
  const alertCount = useAlertCount();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive(href)
        ? "text-white bg-white/[0.07] border border-card-border"
        : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
    }`;

  return (
    <aside className="w-64 bg-card border-r border-card-border flex flex-col justify-between hidden md:flex z-20">
      <div>
        {/* Header del Logotipo */}
        <div className="h-16 flex items-center px-6 border-b border-card-border gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sprout className="text-primary w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide uppercase">AgriTech</h1>
            <span className="text-[10px] text-slate-500 font-semibold block">Santa Cruz, Bolivia</span>
          </div>
        </div>

        {/* Enlaces de Navegación */}
        <nav className="p-4 space-y-1">
          <Link href="/" className={linkClass("/")}>
            <LayoutDashboard className={`w-4 h-4 ${isActive("/") ? "text-primary" : "text-primary/70"}`} />
            <span>Dashboard Principal</span>
          </Link>

          <Link href="/mapa" className={linkClass("/mapa")}>
            <Map className={`w-4 h-4 ${isActive("/mapa") ? "text-violet-400" : "text-violet-400/70"}`} />
            <span>Mapa Predictivo GIS</span>
          </Link>

          <Link href="/region/1" className={linkClass("/region")}>
            <MapPin className={`w-4 h-4 ${isActive("/region") ? "text-sky-400" : "text-sky-400/70"}`} />
            <span>Detalle de Región</span>
          </Link>

          {/* Alertas Activas Indicator */}
          {alertCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/[0.06] border border-red-500/20 mt-2">
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-red-300 text-sm font-medium flex-1">Alertas Activas</span>
              <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-500/30 min-w-[24px] text-center">
                {alertCount}
              </span>
            </div>
          )}

          <div className="px-4 pt-4 pb-2 text-[10px] uppercase font-bold tracking-widest text-slate-600">
            Infraestructura
          </div>

          <a
            href="https://backend-agritech-698520637534.us-central1.run.app/admin/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium border border-transparent"
          >
            <Database className="w-4 h-4 text-amber-500" />
            <span>Django Admin Panel</span>
          </a>

          <a
            href="https://backend-agritech-698520637534.us-central1.run.app/api/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all text-sm font-medium border border-transparent"
          >
            <CloudSun className="w-4 h-4 text-sky-400" />
            <span>Swagger API Docs</span>
          </a>
        </nav>
      </div>

      {/* Footer del Sidebar */}
      <div className="p-4 border-t border-card-border">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
            Vertex AI Link: Active
          </span>
        </div>
      </div>
    </aside>
  );
}
