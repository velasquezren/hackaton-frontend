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
  latitude: number | null;
  longitude: number | null;
  main_crops: string | null;
  area_hectares: number | null;
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

  const data = await response.json();
  
  // Mapear conteos de anomalías del array anomaly_counts a predictions_by_type
  const predictions_by_type = { SEQUIA: 0, INUNDACION: 0, NORMAL: 0 };
  if (Array.isArray(data.anomaly_counts)) {
    data.anomaly_counts.forEach((item: any) => {
      const type = item.anomaly_type as keyof typeof predictions_by_type;
      if (type in predictions_by_type) {
        predictions_by_type[type] = item.count;
      }
    });
  }

  const hs = data.highest_severity_prediction || {};

  return {
    total_regions: data.total_regions || 0,
    total_predictions: data.total_predictions || 0,
    predictions_by_type,
    highest_severity: {
      region_name: hs.region_name || "N/A",
      severity_level: hs.severity_level || 0,
      anomaly_type: hs.anomaly_type || "NORMAL",
      target_date: hs.target_date || "",
    },
    average_confidence: data.average_confidence || 0,
  };
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

  const data = await response.json();

  // Mapear desglose de anomalías del array risk_breakdown
  let drought_months = 0;
  let flood_months = 0;
  let normal_months = 0;

  if (Array.isArray(data.risk_breakdown)) {
    data.risk_breakdown.forEach((item: any) => {
      if (item.anomaly_type === "SEQUIA") {
        drought_months = item.count || 0;
      } else if (item.anomaly_type === "INUNDACION") {
        flood_months = item.count || 0;
      } else if (item.anomaly_type === "NORMAL") {
        normal_months = item.count || 0;
      }
    });
  }

  // Generar recomendaciones agronómicas premium adaptadas a cada microclima del bosque en Santa Cruz
  const recommendations: string[] = [];
  const name = data.region?.name || "";

  if (drought_months > 0) {
    if (name.includes("Chiquitania")) {
      recommendations.push(
        "Cortinas Rompevientos Forestales: Conservar y reforestar franjas de bosque nativo chiquitano alrededor de las parcelas ganaderas y agrícolas para mitigar los fuertes vientos secos y retener la humedad del suelo.",
        "Monitoreo Satelital de Biomasa Seca: Utilizar imágenes Sentinel-2/MODIS de acceso libre para seguir el índice NDVI y detectar de forma temprana el estrés hídrico vegetal extremo antes de la temporada de quemas de invierno.",
        "Manejo de Suelos Sin Labranza: Mantener una densa capa de rastrojo (cobertura muerta) sobre la superficie agrícola para contrarrestar la alta tasa de evaporación en la sabana boscosa."
      );
    } else if (name.includes("Valles")) {
      recommendations.push(
        "Cosecha de Agua de Lluvia (Atajados): Construir reservorios e impermeabilizar atajados familiares/comunales para colectar escorrentías y regar cultivos clave en invierno (papa y hortalizas).",
        "Riego por Goteo Tecnificado: Adoptar sistemas de microaspersión localizado con temporizadores nocturnos para maximizar la eficiencia hídrica en laderas y pendientes pronunciadas.",
        "Mulching Orgánico en Huertos: Proteger la base de árboles frutales con paja o aserrín para disminuir pérdidas hídricas del suelo y proteger las raíces de las heladas rápidas de invierno."
      );
    } else if (name.includes("Chaco")) {
      recommendations.push(
        "Sistemas Silvopastoriles Colectivos: Fomentar el crecimiento de árboles leguminosos nativos (como el algarrobo chaco) dentro de las pasturas para proveer sombra vital, reducir el estrés térmico ganadero y mejorar pastos.",
        "Pozos Profundos y Cosecha de Escorrentía: Apoyar la excavación planificada de pozos profundos comunitarios y la distribución equitativa del agua subterránea durante sequías agudas recurrentes.",
        "Forrajes Altamente Tolerantes: Priorizar la siembra estratégica de sorgo granífero y pastos megatérmicos adaptados al déficit pluvial extremo antes de la época de sequía invernal."
      );
    } else {
      recommendations.push(
        "Planificación del Riego por Zonas: Distribuir el riego nocturno de manera inteligente, priorizando lotes de germinación activa para minimizar evaporación térmica.",
        "Uso Eficiente del Suelo: Reducir pasadas de maquinaria pesada para evitar compactación, preservando la porosidad natural y el almacenamiento de agua capilar."
      );
    }
  }

  if (flood_months > 0) {
    if (name.includes("Norte Integrado")) {
      recommendations.push(
        "Canalización y Drenaje Parcelario Activo: Limpiar de sedimentos y readecuar las zanjas de drenaje primario en zonas vulnerables (Yapacaní, Montero) para mitigar crecidas de los ríos Piraí y Grande.",
        "Rotación Chronológica de Siembra: Ajustar el calendario de siembra de la campaña de verano para evitar que el llenado de grano de soya coincida con los picos extremos de encharcamiento entre enero y febrero.",
        "Semillas Certificadas Resistentes: Fomentar la adquisición de ecotipos de soya y arroz con tolerancia demostrada a condiciones de anoxia radicular y encharcamientos temporales prolongados."
      );
    } else if (name.includes("Pantanal")) {
      recommendations.push(
        "Traslado Preventivo de Ganado Bovino: Establecer lomas artificiales (refugios elevados) y coordinar el traslado logístico hacia tierras altas en cuanto se reporten crecidas en las cuencas altas de los ríos.",
        "Monitoreo Satelital del Pulso de Inundación: Integrar imágenes de radar SAR (Sentinel-1) que penetran cobertura nubosa densa para cartografiar frentes de inundación fluvial en tiempo real.",
        "Preservación Agroecológica del Humedal: Fomentar prácticas agrícolas de bajo impacto para proteger el frágil balance hidrológico del ecosistema del Pantanal."
      );
    } else {
      recommendations.push(
        "Zanjas de Contorno para Escorrentía: Cavar zanjas perimetrales alrededor de las áreas agrícolas críticas para desviar el agua de lluvia excesiva hacia cuencas naturales de retención.",
        "Establecimiento de Pastos Hidrófilos: Sembrar pasturas específicas en los bajíos agrícolas para mejorar la retención mecánica y drenaje del agua en la capa arable superior del suelo."
      );
    }
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Monitoreo Agroclimático Sistemático: Consultar mensualmente la plataforma AgriTech a fin de anticipar variaciones o eventos severos inesperados.",
      "Análisis Estructural del Suelo: Realizar calicatas periódicas para medir la estructura de retención de humedad y reponer nutrientes en suelos boscosos susceptibles."
    );
  }

  return {
    region: data.region || { id: regionId, name: "Región" },
    risk_level: data.overall_risk_level || "MODERADO",
    risk_score: data.overall_risk_score || 0.0,
    anomaly_breakdown: {
      drought_months,
      flood_months,
      normal_months,
    },
    recommendations,
  };
}
