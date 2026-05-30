import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriTech | Inteligencia Climática - Santa Cruz",
  description: "Plataforma de predicción climática severa a 12 meses de anticipación con Google Vertex AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-background text-foreground flex overflow-hidden">
        <Providers>
          {/* --- SIDEBAR LATERAL PREMIUM --- */}
          <Sidebar />

          {/* --- CONTENEDOR CENTRAL DE PÁGINAS --- */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Superior */}
            <header className="h-16 border-b border-card-border bg-card/60 backdrop-blur-md flex items-center justify-between px-6 z-10">
              <h2 className="text-white text-md font-semibold tracking-wide">
                Cabina de Inteligencia Climática
              </h2>
              
              <div className="flex items-center gap-4">
                {/* Indicador Temporal */}
                <div className="text-xs text-slate-400 font-mono hidden sm:block bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
                  Santa Cruz (GMT-4): {new Date().toISOString().split("T")[0]}
                </div>
              </div>
            </header>

            {/* Inyección de Páginas dinámicas */}
            <main className="flex-1 overflow-y-auto bg-background p-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
