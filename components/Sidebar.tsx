"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAlertCount } from "@/components/AlertsBanner";
import { fetchRegions } from "@/lib/api";
import {
  Sprout,
  LayoutDashboard,
  Map,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const alertCount = useAlertCount();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: regions } = useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
  });

  const firstRegionId = regions && regions.length > 0 ? regions[0].id : 1;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive(href)
        ? "text-white bg-white/[0.07] border border-card-border"
        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
    }`;

  const navContent = (
    <>
      <Link href="/" className={linkClass("/")} onClick={() => setMobileOpen(false)}>
        <LayoutDashboard className={`w-4 h-4 ${isActive("/") ? "text-primary" : "text-slate-500"}`} />
        Pronóstico
      </Link>

      <Link href="/mapa" className={linkClass("/mapa")} onClick={() => setMobileOpen(false)}>
        <Map className={`w-4 h-4 ${isActive("/mapa") ? "text-blue-400" : "text-slate-500"}`} />
        Mapa
      </Link>

      <Link href={`/region/${firstRegionId}`} className={linkClass("/region")} onClick={() => setMobileOpen(false)}>
        <Sprout className={`w-4 h-4 ${isActive("/region") ? "text-emerald-400" : "text-slate-500"}`} />
        Regiones
      </Link>

      {alertCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-red-500/[0.06] border border-red-500/20 mt-1">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span className="text-red-300 text-sm font-medium flex-1">Alertas</span>
          <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-500/30">
            {alertCount}
          </span>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-card border border-card-border rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        w-56 bg-card border-r border-card-border flex flex-col z-40
        fixed md:relative top-0 left-0 h-full
        transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-card-border gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sprout className="text-primary w-4 h-4" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">AgriTech</h1>
            <span className="text-[9px] text-slate-500 font-medium block leading-tight">Santa Cruz, Bolivia</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 space-y-1 flex-1">
          {navContent}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-card-border">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] text-slate-500 font-medium">Sistema activo</span>
          </div>
        </div>
      </aside>
    </>
  );
}
