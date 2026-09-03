import { COLLABORATORS } from "./collaborators";
import type { DemographicSeed, SectionSeed } from "./surveySeeds";

/**
 * Clima Organizacional — Q1 2026.
 *
 * The one closed survey in the list that carries its own content instead of the
 * generic seed: seven dimensions, three levels deep, and every question type the
 * builder can produce. It exists so "ver la encuesta" on a finished measurement
 * shows what a real, full-length climate survey looks like — the case the
 * preview has to hold up under, rather than a three-section sample.
 *
 * The wording follows the usual shape of a climate instrument: statements rated
 * on a shared Likert scale inside each subsection (so the preview groups them
 * into a matrix), with the choice, NPS and open questions kept apart.
 */

export const CLIMA_Q1_2026_SURVEY_ID = "c2026-1";

/** Blocks at level 1, questions at levels 2 and 3. */
export const CLIMA_Q1_2026_SECTIONS: readonly SectionSeed[] = [
  {
    title: "Propósito y estrategia",
    description:
      "Qué tan claro es hacia dónde va la organización y cómo el trabajo de cada persona contribuye a ello.",
    children: [
      {
        title: "Claridad estratégica",
        description: "Conocimiento del rumbo y de las prioridades de la organización.",
        questions: [
          { statement: "Entiendo claramente la misión de la organización y hacia dónde va." },
          { statement: "Conozco los objetivos estratégicos definidos para este año." },
          { statement: "Las prioridades de la organización se mantienen estables el tiempo suficiente para poder avanzar en ellas." },
        ],
      },
      {
        title: "Mi rol en la estrategia",
        description: "La conexión entre el día a día y los objetivos del negocio.",
        questions: [
          { statement: "Es claro cómo mi trabajo contribuye a los objetivos de la organización." },
          { statement: "Sé exactamente qué se espera de mí en mi rol." },
          { statement: "Las metas de mi área son alcanzables con los recursos que tenemos." },
        ],
      },
    ],
  },
  {
    title: "Liderazgo",
    description: "La calidad del acompañamiento de quien lidera el equipo y de la alta dirección.",
    children: [
      {
        title: "Mi líder directo",
        description: "Cercanía, claridad y consistencia en el día a día.",
        questions: [
          { statement: "Mi líder está disponible cuando necesito apoyo.", rating: "frequency" },
          { statement: "Mi líder me explica el porqué de las decisiones que afectan a mi equipo.", rating: "frequency" },
          { statement: "Mi líder reconoce el trabajo bien hecho.", rating: "frequency" },
        ],
        children: [
          {
            title: "Retroalimentación y desarrollo",
            description: "Cómo se conversa sobre el desempeño y el crecimiento.",
            questions: [
              { statement: "Recibo retroalimentación concreta y útil sobre mi trabajo.", rating: "frequency" },
              { statement: "Mi líder y yo conversamos sobre mi desarrollo profesional.", rating: "frequency" },
              { statement: "Cuando algo no sale bien, la conversación se centra en cómo mejorar.", rating: "frequency" },
            ],
          },
          {
            title: "Confianza y seguridad psicológica",
            description: "Qué tan seguro es equivocarse, preguntar o disentir.",
            questions: [
              {
                statement: "Puedo expresar un desacuerdo con mi líder sin temor a consecuencias.",
                allowDontKnow: true,
              },
              {
                statement: "En mi equipo se pueden reconocer los errores sin que alguien pague por ellos.",
                allowDontKnow: true,
              },
              {
                statement: "Me siento seguro/a al proponer ideas nuevas, incluso si no funcionan.",
                allowDontKnow: true,
              },
            ],
          },
        ],
      },
      {
        title: "Alta dirección",
        description: "La percepción sobre quienes dirigen la organización.",
        questions: [
          { statement: "Confío en las decisiones que toma la alta dirección." },
          { statement: "La alta dirección actúa de forma coherente con los valores que comunica." },
          { statement: "Los cambios importantes se comunican a tiempo y con claridad." },
        ],
      },
    ],
  },
  {
    title: "Colaboración y comunicación",
    description: "Cómo se trabaja con otras personas, dentro y fuera del propio equipo.",
    children: [
      {
        title: "Mi equipo inmediato",
        questions: [
          { statement: "En mi equipo nos apoyamos cuando alguien va sobrecargado." },
          { statement: "Los desacuerdos en mi equipo se resuelven de forma respetuosa." },
          { statement: "En mi equipo hay claridad sobre quién hace qué." },
        ],
      },
      {
        title: "Colaboración entre áreas",
        description: "El trabajo que cruza las fronteras del propio equipo.",
        questions: [
          { statement: "Obtengo respuesta de otras áreas cuando necesito algo para avanzar.", rating: "frequency" },
          { statement: "La información que necesito para trabajar circula sin que tenga que perseguirla.", rating: "frequency" },
          { statement: "Los procesos entre áreas están definidos con claridad.", rating: "frequency" },
          {
            statement: "¿Con qué área te resulta más difícil coordinar y por qué?",
            type: "open",
          },
        ],
      },
    ],
  },
  {
    title: "Desarrollo y crecimiento",
    description: "Las oportunidades de aprender y de avanzar dentro de la organización.",
    children: [
      {
        title: "Aprendizaje",
        questions: [
          { statement: "Las oportunidades de formación que recibo", rating: "satisfaction" },
          { statement: "El tiempo del que dispongo para aprender cosas nuevas", rating: "satisfaction" },
          { statement: "La pertinencia de la formación frente a lo que mi rol necesita", rating: "satisfaction" },
        ],
      },
      {
        title: "Plan de carrera",
        description: "Cómo se ve el siguiente paso desde donde cada persona está hoy.",
        questions: [
          { statement: "Sé qué necesito para dar el siguiente paso en mi carrera aquí." },
          { statement: "Las promociones y los ascensos se deciden con criterios claros." },
          {
            statement: "¿Qué te gustaría que fuera tu siguiente paso en la organización?",
            type: "single",
            options: [
              "Crecer dentro de mi rol actual",
              "Asumir un rol de liderazgo",
              "Especializarme técnicamente",
              "Cambiar a otra área",
              "Todavía no lo sé",
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Reconocimiento y compensación",
    description: "Qué tan justo se percibe lo que se recibe a cambio del trabajo.",
    children: [
      {
        title: "Reconocimiento",
        questions: [
          { statement: "Mi aporte es reconocido cuando hago un buen trabajo.", rating: "frequency" },
          { statement: "El reconocimiento en mi área se reparte de forma justa.", rating: "frequency" },
          { statement: "El esfuerzo extra se nota y se agradece.", rating: "frequency" },
          {
            statement: "¿Qué formas de reconocimiento valoras más? Elige hasta tres.",
            type: "multiple",
            options: [
              "Reconocimiento público en el equipo",
              "Conversación uno a uno con mi líder",
              "Oportunidades de crecimiento o proyectos nuevos",
              "Compensación económica o bonos",
              "Días libres o flexibilidad",
              "Formación pagada por la organización",
            ],
          },
        ],
      },
      {
        title: "Compensación y beneficios",
        questions: [
          { statement: "Mi salario frente a la responsabilidad de mi rol", rating: "satisfaction" },
          { statement: "Los beneficios que ofrece la organización", rating: "satisfaction" },
          {
            statement: "¿Cuál de los beneficios actuales usas con más frecuencia?",
            type: "dropdown",
            options: [
              "Plan de salud complementario",
              "Apoyo educativo",
              "Días de bienestar",
              "Trabajo remoto o flexible",
              "Apoyo psicológico",
              "Ninguno",
            ],
          },
          {
            statement: "¿Qué tan importante sería para ti que la organización sumara apoyo económico para vivienda?",
            rating: "importance",
          },
        ],
      },
    ],
  },
  {
    title: "Bienestar y carga de trabajo",
    description: "Cómo se sostiene el trabajo en el tiempo, y a qué costo.",
    children: [
      {
        title: "Carga y balance",
        questions: [
          { statement: "Puedo terminar mi jornada sin dejar trabajo crítico pendiente.", rating: "frequency" },
          { statement: "Logro desconectarme del trabajo en mi tiempo libre.", rating: "frequency" },
          { statement: "Las urgencias de última hora son la excepción y no la norma.", rating: "frequency" },
          {
            statement: "¿Cómo describirías tu carga de trabajo del último trimestre?",
            scale: "linear",
            minLabel: "Muy por debajo de lo que puedo",
            maxLabel: "Muy por encima de lo que puedo",
          },
        ],
      },
      {
        title: "Entorno organizacional (NOM 035)",
        description:
          "Preguntas del cuestionario de referencia para factores de riesgo psicosocial. La escala es fija.",
        questions: [
          { statement: "Mi trabajo me exige atender varias tareas al mismo tiempo.", scale: "likert-nom035" },
          { statement: "Trabajo horas extras más de tres veces a la semana.", scale: "likert-nom035" },
          { statement: "Puedo decidir cuánto trabajo realizo durante la jornada laboral.", scale: "likert-nom035" },
        ],
      },
      {
        title: "Entorno y recursos",
        description: "Las condiciones concretas en las que ocurre el trabajo.",
        questions: [
          {
            statement: "¿Cómo calificarías tu bienestar general en el trabajo durante los últimos tres meses?",
            scale: "stars",
            minLabel: "Muy bajo",
            maxLabel: "Muy alto",
          },
          {
            statement: "¿Con qué ánimo terminas normalmente tu jornada?",
            scale: "emoji",
            minLabel: "Agotado/a",
            maxLabel: "Con energía",
          },
        ],
      },
    ],
  },
  {
    title: "Compromiso y recomendabilidad",
    description: "El cierre: qué tan dispuesto está cada quien a quedarse y a recomendar.",
    children: [
      {
        title: "Recomendabilidad",
        questions: [
          {
            statement:
              "¿Qué tan probable es que recomiendes a esta organización como un buen lugar para trabajar?",
            scale: "nps",
            minLabel: "Nada probable",
            maxLabel: "Muy probable",
            followUps: {
              detractors: "¿Qué tendría que cambiar para que la recomendaras?",
              neutrals: "¿Qué falta para que la recomiendes sin dudarlo?",
              promoters: "¿Qué es lo que más valoras de trabajar aquí?",
            },
          },
        ],
      },
      {
        title: "Permanencia",
        questions: [
          { statement: "Me veo trabajando aquí dentro de dos años." },
          { statement: "Recomendaría a alguien de confianza aplicar a una vacante en mi área." },
          {
            statement: "¿Qué es lo que más pesaría en una decisión de quedarte?",
            type: "single",
            options: [
              "Mi equipo y las personas con las que trabajo",
              "El aprendizaje y el reto del trabajo",
              "La compensación y los beneficios",
              "La flexibilidad y el balance",
              "Las oportunidades de crecimiento",
            ],
          },
          { statement: "¿Qué es lo primero que cambiarías de tu experiencia de trabajo?", type: "open" },
          {
            statement: "¿Hay algo que la organización esté haciendo bien y que valga la pena mantener?",
            type: "open",
          },
        ],
      },
    ],
  },
];

/**
 * The demographics this measurement broke its results down by.
 *
 * These are the "Ver por" options the results screens offer. All of them are
 * hidden — the platform already holds them, so asking again would ask a
 * participant to retype what is on their own profile — and they still work as
 * the segment the participation, heatmap and compliance views break themselves
 * down by. Each option set is read from the directory, so the names match the
 * data the survey was sent to. The per-collaborator breakdown is part of the
 * same list so the participation view can answer "¿quién falta?", but a column
 * per person would hold a single response and read as noise in a grid — the
 * heatmap view refuses the segment and never offers it.
 */

/** The areas as they exist in the directory, so the names match the builder. */
const AREA_OPTIONS = [...new Set(COLLABORATORS.map((person) => person.area))];

/** Each area's leader, plus the people at the top of an area who lead nobody. */
const LEADER_OPTIONS = [
  ...new Set(
    COLLABORATORS.map((person) => person.leader).filter((leader): leader is string => leader !== null)
  ),
  "Sin líder",
];

const COUNTRY_OPTIONS = [...new Set(COLLABORATORS.map((person) => person.country))];
const AGE_OPTIONS = [...new Set(COLLABORATORS.map((person) => person.age))];
const GENDER_OPTIONS = [...new Set(COLLABORATORS.map((person) => person.gender))];
const CUSTOM_GROUP_OPTIONS = [...new Set(COLLABORATORS.map((person) => person.customGroup))];

/** The people the measurement was sent to, as the one per-person breakdown. */
export const CLIMA_Q1_2026_INVITED = 520;
const COLLABORATOR_OPTIONS = COLLABORATORS.slice(0, CLIMA_Q1_2026_INVITED).map((person) => person.name);

/**
 * The dimensions every measurement is cut by.
 *
 * Not specific to this measurement despite living here: each one is read
 * straight off the collaborator directory, so they are the company's own
 * demographics and any published survey segments by the same set.
 */
export const STANDARD_DEMOGRAPHICS: readonly DemographicSeed[] = [
  { key: "area", label: "Área", visible: false, options: AREA_OPTIONS },
  { key: "leader", label: "Líder", visible: false, options: LEADER_OPTIONS },
  { key: "country", label: "País", visible: false, options: COUNTRY_OPTIONS },
  { key: "age", label: "Edad", visible: false, options: AGE_OPTIONS },
  { key: "gender", label: "Género", visible: false, options: GENDER_OPTIONS },
  { key: "customGroup", label: "Grupos personalizados", visible: false, options: CUSTOM_GROUP_OPTIONS },
  { key: "collaborator", label: "Colaborador", visible: false, perPerson: true, options: COLLABORATOR_OPTIONS },
];

export const CLIMA_Q1_2026_DESCRIPTION =
  "Primera medición de clima del año. Cubre siete dimensiones y alimenta los planes de acción de cada área para el resto de 2026.";

export const CLIMA_Q1_2026_WELCOME =
  "<p><strong>Tu opinión cuenta, y esta vez cuenta el doble.</strong></p>" +
  "<p>Esta es la medición de clima del primer trimestre de 2026. Recorre siete dimensiones: propósito, liderazgo, colaboración, desarrollo, reconocimiento, bienestar y compromiso.</p>" +
  "<p>Son 54 preguntas y toma alrededor de media hora. No hace falta responder todo de una vez: tu avance se guarda automáticamente y puedes retomar donde lo dejaste.</p>" +
  "<p><strong>Esta medición no es anónima.</strong> Tus respuestas quedan asociadas a tu nombre y las verá el equipo responsable de la encuesta, junto con los resultados agrupados de cada área.</p>";

export const CLIMA_Q1_2026_CLOSING =
  "<p><strong>¡Gracias por completar la medición!</strong></p>" +
  "<p>Con 520 respuestas, esta fue la medición con mayor participación desde que empezamos a medir clima.</p>" +
  "<p>Los resultados generales y los de cada área se comparten durante febrero, junto con los planes de acción que cada equipo definirá a partir de ellos.</p>";
