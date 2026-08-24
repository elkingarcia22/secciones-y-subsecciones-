import {
  Home,
  UserSearch,
  GraduationCap,
  Gauge,
  Activity,
  ClipboardList,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Third-level leaf (inside a drilled panel). */
export interface NavLeaf {
  id: string;
  label: string;
}

/** Second-level item: with children it drills into its own panel. */
export interface NavChild {
  id: string;
  label: string;
  children?: readonly NavLeaf[];
}

/** Root item: with children it behaves as an in-place accordion. */
export interface NavRoot {
  kind: "item";
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  children?: readonly NavChild[];
}

export interface NavGroup {
  kind: "group";
  label: string;
}

export type NavEntry = NavRoot | NavGroup;

export const NAV_TREE: readonly NavEntry[] = [
  { kind: "item", id: "inicio", label: "Inicio", icon: Home },

  { kind: "group", label: "Productos" },
  {
    kind: "item",
    id: "seleccion",
    label: "Selección",
    icon: UserSearch,
    badge: "Nuevo",
    children: [
      { id: "seldash", label: "Dashboard" },
      { id: "vacantes", label: "Vacantes" },
      { id: "plantillas", label: "Plantillas" },
      { id: "creditos", label: "Créditos" },
    ],
  },
  {
    kind: "item",
    id: "aprendizaje",
    label: "Aprendizaje",
    icon: GraduationCap,
    children: [
      {
        id: "lms",
        label: "LMS Creator",
        children: [
          { id: "contenidos", label: "Contenidos" },
          { id: "categorias", label: "Categorías" },
          { id: "universidad", label: "Universidad corporativa" },
          { id: "lmsai", label: "LMS AI" },
        ],
      },
      {
        id: "planes",
        label: "Planes de Formación",
        children: [
          { id: "planesactivos", label: "Planes" },
          { id: "grupos", label: "Grupos" },
        ],
      },
      {
        id: "certificados",
        label: "Certificados",
        children: [
          { id: "certdescarga", label: "Descarga" },
          { id: "certconfig", label: "Configuración" },
        ],
      },
      { id: "reportes", label: "Reportes" },
    ],
  },
  {
    kind: "item",
    id: "desempeno",
    label: "Desempeño",
    icon: Gauge,
    children: [
      { id: "eval360", label: "Evaluaciones 360" },
      { id: "objetivos", label: "Objetivos" },
      { id: "matriztalento", label: "Matriz de talento" },
      { id: "encuestas", label: "Encuestas" },
    ],
  },
  { kind: "item", id: "diagnostico", label: "Diagnóstico", icon: Activity },

  { kind: "group", label: "Herramientas" },
  { kind: "item", id: "tareas", label: "Tareas", icon: ClipboardList },
  { kind: "item", id: "avisos", label: "Avisos", icon: Megaphone },
];

export interface Company {
  id: string;
  name: string;
  /** Single-letter mark when there is no logo. */
  initial: string;
  /** Mark background color. */
  bg: string;
  /** Whether the mark renders the Google logo instead of the initial. */
  isGoogle?: boolean;
  licenses: readonly [number, number];
  credits: readonly [number, number];
}

export const COMPANIES: readonly Company[] = [
  { id: "google", name: "Google", initial: "G", bg: "#FFFFFF", isGoogle: true, licenses: [940, 1000], credits: [25000, 45000] },
  { id: "alpha", name: "Alpha", initial: "A", bg: "#2E6BFF", licenses: [128, 150], credits: [4200, 10000] },
  { id: "beta", name: "Beta", initial: "B", bg: "#7A5AF8", licenses: [312, 400], credits: [18500, 20000] },
  { id: "omega", name: "Omega", initial: "O", bg: "#E0457B", licenses: [76, 100], credits: [1900, 5000] },
];

export const COMPANY_MENU_LINKS: readonly string[] = [
  "Gestión de usuarios",
  "Personalización",
  "Organigrama",
  "Datos de empresa",
  "Roles y permisos",
];

export interface NotificationItem {
  title: string;
  description: string;
  date: string;
}

export const NOTIFICATIONS: readonly NotificationItem[] = [
  { title: "Evaluaciones vencidas", description: "27 colaboradores no han completado su evaluación de desempeño.", date: "Hoy, 9:12 a.m." },
  { title: "Nuevo reporte disponible", description: "El reporte mensual de formación de junio ya está listo para descargar.", date: "Ayer, 4:30 p.m." },
  { title: "Onboarding completado", description: "12 nuevos colaboradores finalizaron su ruta de onboarding.", date: "14 jul, 11:05 a.m." },
  { title: "Licencias por renovar", description: "Tu plan renueva en 15 días. Revisa las licencias activas.", date: "12 jul, 8:00 a.m." },
  { title: "Encuesta de clima cerrada", description: "La encuesta de clima laboral Q2 cerró con 87% de participación.", date: "11 jul, 5:20 p.m." },
  { title: "Nuevo contenido asignado", description: "Se asignó la ruta \"Liderazgo ágil\" a 45 colaboradores de Ventas.", date: "10 jul, 10:15 a.m." },
  { title: "Recordatorio de 1:1", description: "Tienes 3 sesiones de feedback pendientes por agendar esta semana.", date: "9 jul, 9:00 a.m." },
  { title: "Actualización de la plataforma", description: "Nuevas funciones de reportes con IA disponibles en tu plan.", date: "8 jul, 7:45 a.m." },
];

export interface NewsItem {
  title: string;
  description: string;
  isNew?: boolean;
}

export const NEWS_ITEMS: readonly NewsItem[] = [
  { title: "Nuevo Home operativo", description: "Tu Home ahora es un centro de mando: métricas clave, quick actions y lo que necesita tu atención, todo en un solo lugar.", isNew: true },
  { title: "Agente IA de UBITS", description: "Pregúntale al agente sobre pendientes, participación o evaluaciones sin salir del Home. Actívalo desde el tab \"Agente IA\" en el sidebar.", isNew: true },
  { title: "Alertas de vencimiento", description: "Recibe avisos automáticos cuando una evaluación, encuesta o assessment esté por vencer, antes de que se convierta en un pendiente oculto." },
  { title: "Modo oscuro", description: "Actívalo desde tu perfil, en la esquina superior derecha. Tu preferencia se mantiene en toda la plataforma." },
  { title: "Exportar reportes a Excel", description: "Los paneles de participación y evaluaciones ahora se pueden exportar directamente en formato .xlsx para compartir con liderazgo." },
];

export interface ChatHistoryGroup {
  label: string;
  items: readonly string[];
}

export const CHAT_HISTORY: readonly ChatHistoryGroup[] = [
  { label: "Hoy", items: ["Evaluaciones pendientes por equipo", "Participación de Ventas Bogotá"] },
  { label: "Ayer", items: ["Resumen encuesta de clima laboral", "Plan de onboarding para operarios"] },
  { label: "Últimos 7 días", items: ["Riesgo de rotación Q3", "Cursos con baja satisfacción", "Matriz de talento de liderazgo"] },
];

export const AGENT_SUGGESTIONS: readonly string[] = [
  "Analiza la participación en aprendizaje por equipo.",
  "Identifica colaboradores con evaluaciones vencidas.",
  "Resume los resultados de la última encuesta de clima.",
  "Detecta señales de riesgo de rotación en mi empresa.",
];

export const CURRENT_USER = {
  name: "Carolina Vargas",
  email: "carolina.vargas@google.com",
  role: "Admin",
  avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150",
} as const;

/** Shared AI gradient used by the shell (segmented thumb, agent send button, ad icon). */
export const AI_GRADIENT =
  "linear-gradient(135deg, var(--color-ai-stop-1) 0%, var(--color-ai-stop-2) 38%, var(--color-ai-stop-3) 72%, var(--color-ai-stop-5) 100%)";
