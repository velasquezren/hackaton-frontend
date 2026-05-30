/**
 * Cliente de Conexión de API - AgriTech Climate Intelligence Platform
 * 
 * Este archivo contiene los tipos estrictos de TypeScript y los fetchers asíncronos 
 * que se comunican directamente con el backend desplegado en Google Cloud Run.
 */

export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  "https://backend-agritech-698520637534.us-central1.run.app/api";

// --- Tipos e Interfaces de TypeScript ---

export interface Region {
  id: number;
  name: string;
  description: string;
}

export type AnomalyType = "SEQUIA" | "INUNDACION" | "NORMAL";

export interface ClimatePrediction {
  id: number;
  prediction_date: string;
  target_date: string;
  anomaly_type: AnomalyType;
  severity_level: number; // Escala 1-5
  confidence_score: number; // 0.0 - 1.0 (ej. 0.88 para 88%)
  vertex_ai_output?: {
    model_id?: string;
    features_used?: string[];
    predicted_precipitation_anomaly_pct?: number;
    validation_metric?: string;
    [key: string]: any;
  } | null;
}

export interface RegionPredictionResponse {
  region: Region;
  predictions: ClimatePrediction[];
  generated_at: string;
}

// --- Nuevas Interfaces para los endpoints avanzados ---

export interface HighestSeverityInfo {
  region_name: string;
  severity_level: number;
  anomaly_type: AnomalyType;
  target_date: string;
}

export interface DashboardSummary {
  total_regions: number;
  total_predictions: number;
  predictions_by_type: {
    SEQUIA: number;
    INUNDACION: number;
    NORMAL: number;
  };
  highest_severity: HighestSeverityInfo;
  average_confidence: number;
}

export interface TimelineEntry {
  target_date: string;
  anomaly_type: AnomalyType;
  severity_level: number;
  confidence_score: number;
}

export interface PredictionTimelineResponse {
  region: Region;
  timeline: TimelineEntry[];
}

export interface AnomalyBreakdown {
  drought_months: number;
  flood_months: number;
  normal_months: number;
}

export interface RiskAssessmentResponse {
  region: Region;
  risk_level: string;
  risk_score: number;
  anomaly_breakdown: AnomalyBreakdown;
  recommendations: string[];
}

// --- Consultas del Backend (Fetchers) ---

/**
 * Recupera la lista completa de regiones agrícolas registradas en el sistema.
 * Implementa revalidación estática de Next.js de 1 hora para alto rendimiento.
 */
export async function fetchRegions(): Promise<Region[]> {
  const response = await fetch(`${API_BASE_URL}/regions`, {
    next: { revalidate: 3600 } // Cache de 1 hora en servidor
  });
  
  if (!response.ok) {
    throw new Error(`Error al obtener regiones: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Obtiene la lista completa de predicciones climáticas severas a 12 meses 
 * para una región geográfica específica.
 */
export async function fetchRegionPredictions(regionId: number): Promise<RegionPredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/predictions/${regionId}`, {
    cache: "no-store" // Inferencia viva en tiempo real
  });
  
  if (!response.ok) {
    throw new Error(`Error al obtener predicciones para la región ID ${regionId}: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Obtiene un resumen ejecutivo de todo el sistema: total de regiones,
 * predicciones, distribución por tipo de anomalía, y la alerta más severa.
 */
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Error al obtener resumen del dashboard: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Recupera la línea temporal de predicciones para una región específica,
 * incluyendo la evolución mensual de anomalías y severidad.
 */
export async function fetchPredictionTimeline(regionId: number): Promise<PredictionTimelineResponse> {
  const response = await fetch(`${API_BASE_URL}/predictions/${regionId}/timeline`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Error al obtener timeline para la región ID ${regionId}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Obtiene la evaluación de riesgo completa para una región, incluyendo
 * nivel de riesgo, puntuación, desglose de anomalías y recomendaciones.
 */
export async function fetchRiskAssessment(regionId: number): Promise<RiskAssessmentResponse> {
  const response = await fetch(`${API_BASE_URL}/regions/${regionId}/risk-assessment`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Error al obtener evaluación de riesgo para la región ID ${regionId}: ${response.statusText}`);
  }

  return response.json();
}
