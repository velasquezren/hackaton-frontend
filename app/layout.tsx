import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Sidebar from "@/components/Sidebar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriTech — Predicción Climática para Santa Cruz",
  description: "Sistema de predicción de eventos climáticos severos a 12 meses para productores agrícolas de Santa Cruz, Bolivia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full bg-background text-foreground flex overflow-hidden font-sans">
        <Providers>
          <Sidebar />

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header simple */}
            <header className="h-12 border-b border-card-border bg-card/40 backdrop-blur-sm flex items-center justify-between px-6 z-10">
              <span className="text-slate-400 text-xs font-medium md:hidden ml-10">AgriTech</span>
              <span className="text-slate-400 text-xs font-medium hidden md:block">Inteligencia Climática · Santa Cruz</span>
              <span className="text-[10px] text-slate-500 font-mono bg-slate-900/50 border border-slate-800/50 px-2.5 py-1 rounded-lg hidden sm:block">
                {new Date().toLocaleDateString("es-BO", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </header>

            <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
