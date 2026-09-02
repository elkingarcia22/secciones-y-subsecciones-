import type { SurveyKind } from "./surveyBuilderTypes";

/**
 * Content bank the AI structure generator draws from.
 *
 * The product has no model behind it yet, so the "generation" is a composition:
 * the author picks what the survey is about (focos) and how big the result
 * should be, and the generator assembles subsections and questions from this
 * bank. Keeping the wording here — rather than inline in the generator — means
 * the shape of the output and the words it uses stay separately editable, and
 * swapping this file for a real model response later changes nothing else.
 *
 * Every statement is written to be answered on an agreement scale, in first
 * person, so a whole section reads consistently no matter which themes land in it.
 */

/** One subsection's worth of content. */
export interface AiTheme {
  title: string;
  description: string;
  /** Agreement-scale statements. */
  statements: readonly string[];
  /** Same theme, worded as prompts for an open answer. */
  openPrompts: readonly string[];
}

/** A subject the survey can be built around. One focus becomes one section. */
export interface AiFocus {
  id: string;
  label: string;
  /** Shown under the chip so the author knows what the focus will produce. */
  hint: string;
  /** Description given to a level-1 section built from this focus. */
  sectionDescription: string;
  themes: readonly AiTheme[];
}

export const AI_FOCUSES: readonly AiFocus[] = [
  {
    id: "liderazgo",
    label: "Liderazgo",
    hint: "Acompañamiento, claridad y confianza en el jefe directo",
    sectionDescription:
      "Cómo perciben las personas el acompañamiento, la claridad y la cercanía de quien las lidera.",
    themes: [
      {
        title: "Acompañamiento del líder",
        description: "Disponibilidad, escucha y apoyo del jefe directo en el día a día.",
        statements: [
          "Mi líder está disponible cuando necesito su apoyo.",
          "Mi líder escucha mis ideas antes de tomar decisiones que me afectan.",
          "Recibo acompañamiento cuando enfrento una dificultad en mi trabajo.",
          "Mi líder se interesa genuinamente por cómo me siento en el trabajo.",
          "Puedo plantearle un desacuerdo a mi líder sin temor a consecuencias.",
        ],
        openPrompts: [
          "¿Qué haría tu líder distinto para acompañarte mejor en tu día a día?",
          "Describe una situación reciente en la que el apoyo de tu líder marcó la diferencia.",
        ],
      },
      {
        title: "Claridad de expectativas",
        description: "Qué tan claro es lo que se espera de cada persona y cómo se mide.",
        statements: [
          "Sé con claridad qué se espera de mí en mi cargo.",
          "Entiendo cómo se evalúa mi desempeño.",
          "Las prioridades de mi equipo se comunican de forma clara.",
          "Cuando cambian las prioridades, me entero a tiempo.",
          "Recibo retroalimentación oportuna sobre mi trabajo.",
        ],
        openPrompts: [
          "¿Qué parte de tus responsabilidades te resulta menos clara hoy?",
          "¿Cómo te gustaría recibir retroalimentación sobre tu desempeño?",
        ],
      },
      {
        title: "Confianza y autonomía",
        description: "Margen de decisión y confianza que recibe el equipo.",
        statements: [
          "Tengo autonomía para decidir cómo hago mi trabajo.",
          "Mi líder confía en mi criterio profesional.",
          "Puedo asumir riesgos razonables sin miedo a ser sancionado.",
          "Los errores se tratan como aprendizaje y no como culpa.",
          "Se me involucra en las decisiones que afectan a mi equipo.",
        ],
        openPrompts: [
          "¿En qué decisiones te gustaría tener más autonomía?",
          "¿Qué pasa en tu equipo cuando algo sale mal?",
        ],
      },
    ],
  },
  {
    id: "comunicacion",
    label: "Comunicación",
    hint: "Flujo de información, transparencia y espacios de diálogo",
    sectionDescription:
      "Qué tan bien circula la información en la organización y qué tan seguro es hablar en ella.",
    themes: [
      {
        title: "Información y transparencia",
        description: "Acceso oportuno a lo que las personas necesitan saber.",
        statements: [
          "Recibo a tiempo la información que necesito para hacer mi trabajo.",
          "La organización comunica con transparencia las decisiones importantes.",
          "Entiendo hacia dónde va la compañía en los próximos meses.",
          "Los cambios organizacionales se explican con claridad.",
          "Sé a quién acudir cuando necesito información de otra área.",
        ],
        openPrompts: [
          "¿Qué información te gustaría recibir y hoy no llega?",
          "¿Por qué canal preferirías enterarte de los cambios importantes?",
        ],
      },
      {
        title: "Seguridad para hablar",
        description: "Qué tan posible es decir lo que se piensa sin costo.",
        statements: [
          "Puedo expresar mi opinión aunque sea distinta a la mayoría.",
          "Siento que mis comentarios son tomados en cuenta.",
          "Existen espacios reales para plantear preocupaciones.",
          "Se puede señalar un problema sin que se tome como algo personal.",
          "Confío en que lo que respondo en encuestas como esta se usa para mejorar.",
        ],
        openPrompts: [
          "¿Qué tema te cuesta plantear abiertamente en tu equipo?",
          "¿Qué haría falta para que te sintieras completamente en confianza al opinar?",
        ],
      },
      {
        title: "Colaboración entre áreas",
        description: "Cómo trabajan juntos equipos que dependen unos de otros.",
        statements: [
          "Mi área colabora bien con las áreas de las que depende.",
          "Los objetivos entre áreas están alineados.",
          "Cuando hay un problema entre áreas, se resuelve rápido.",
          "Conozco el trabajo de las áreas con las que me relaciono.",
          "Las reuniones entre equipos son productivas.",
        ],
        openPrompts: [
          "¿Con qué área te cuesta más coordinar y por qué?",
          "¿Qué cambiarías de la forma en que trabajan juntas las áreas?",
        ],
      },
    ],
  },
  {
    id: "reconocimiento",
    label: "Reconocimiento",
    hint: "Valoración del aporte, compensación y equidad",
    sectionDescription:
      "Qué tan valorado se siente el aporte de cada persona y qué tan justo se percibe lo que recibe a cambio.",
    themes: [
      {
        title: "Valoración del aporte",
        description: "Reconocimiento cotidiano del trabajo bien hecho.",
        statements: [
          "Mi trabajo es reconocido cuando hago un buen aporte.",
          "El reconocimiento en mi equipo es oportuno.",
          "Se reconoce el esfuerzo, no solo el resultado.",
          "Mis compañeros reconocen el trabajo de los demás.",
          "Siento que mi trabajo aporta a algo importante.",
        ],
        openPrompts: [
          "¿Cómo te gustaría que se reconociera tu trabajo?",
          "Cuenta una ocasión en la que te sentiste realmente valorado.",
        ],
      },
      {
        title: "Equidad y compensación",
        description: "Percepción de justicia en pago, beneficios y oportunidades.",
        statements: [
          "Considero que mi compensación es justa frente a mis responsabilidades.",
          "Los beneficios que ofrece la organización responden a mis necesidades.",
          "Las oportunidades de crecimiento se asignan con criterios claros.",
          "Personas con el mismo rol reciben un trato equitativo.",
          "Entiendo cómo se define mi compensación.",
        ],
        openPrompts: [
          "¿Qué beneficio marcaría una diferencia real para ti?",
          "¿Qué te parece menos claro sobre cómo se definen los aumentos o ascensos?",
        ],
      },
      {
        title: "Permanencia y recomendación",
        description: "Intención de quedarse y de recomendar la organización.",
        statements: [
          "Me veo trabajando aquí dentro de un año.",
          "Recomendaría esta organización como un buen lugar para trabajar.",
          "Me siento orgulloso de contar dónde trabajo.",
          "Si recibiera una oferta similar, elegiría quedarme.",
          "Lo que la organización ofrece corresponde con lo que prometió.",
        ],
        openPrompts: [
          "¿Qué es lo que más te haría quedarte a largo plazo?",
          "¿Qué le dirías a alguien que está considerando entrar a la organización?",
        ],
      },
    ],
  },
  {
    id: "desarrollo",
    label: "Desarrollo y carrera",
    hint: "Aprendizaje, crecimiento y plan de carrera",
    sectionDescription:
      "Qué tanto puede crecer una persona aquí y qué tan claro es el camino para hacerlo.",
    themes: [
      {
        title: "Aprendizaje continuo",
        description: "Acceso real a formación y tiempo para usarla.",
        statements: [
          "Tengo acceso a la formación que necesito para mi rol.",
          "Dispongo de tiempo para aprender durante mi jornada.",
          "La formación que recibo es aplicable a mi trabajo.",
          "Mi líder me anima a desarrollar nuevas habilidades.",
          "He aprendido algo nuevo en los últimos tres meses.",
        ],
        openPrompts: [
          "¿Qué habilidad te gustaría desarrollar este año?",
          "¿Qué te impide dedicar tiempo a formarte?",
        ],
      },
      {
        title: "Plan de carrera",
        description: "Claridad sobre los siguientes pasos posibles.",
        statements: [
          "Conozco las oportunidades de crecimiento disponibles para mí.",
          "He conversado con mi líder sobre mi plan de carrera.",
          "Existen caminos de crecimiento distintos al de ser jefe.",
          "Las vacantes internas se comunican de forma abierta.",
          "Siento que puedo construir una carrera en esta organización.",
        ],
        openPrompts: [
          "¿Dónde te gustaría estar profesionalmente en dos años?",
          "¿Qué necesitarías de la organización para llegar allí?",
        ],
      },
      {
        title: "Uso de fortalezas",
        description: "Ajuste entre lo que la persona sabe hacer y lo que hace.",
        statements: [
          "En mi trabajo uso lo mejor que sé hacer.",
          "Mi rol aprovecha mi experiencia previa.",
          "Recibo retos que me hacen crecer.",
          "Mi trabajo me resulta estimulante.",
          "Puedo proponer proyectos que me interesan.",
        ],
        openPrompts: [
          "¿Qué fortaleza tuya está siendo poco aprovechada hoy?",
          "¿Qué proyecto te gustaría liderar si tuvieras la oportunidad?",
        ],
      },
    ],
  },
  {
    id: "carga",
    label: "Carga de trabajo",
    hint: "Volumen, ritmo y equilibrio con la vida personal",
    sectionDescription:
      "Qué tan sostenible es el ritmo de trabajo y qué tanto respeta la vida fuera de la jornada.",
    themes: [
      {
        title: "Volumen y ritmo",
        description: "Relación entre lo que se pide y el tiempo disponible.",
        statements: [
          "Mi carga de trabajo es manejable en una jornada normal.",
          "Los plazos que se me asignan son realistas.",
          "Puedo concentrarme sin interrupciones constantes.",
          "Las urgencias son la excepción y no la norma.",
          "Cuento con apoyo cuando la carga aumenta.",
        ],
        openPrompts: [
          "¿Qué tarea te consume más tiempo del que debería?",
          "¿Qué haría más manejable tu carga de trabajo?",
        ],
      },
      {
        title: "Equilibrio con la vida personal",
        description: "Respeto por el tiempo fuera de la jornada.",
        statements: [
          "Puedo desconectarme del trabajo fuera de mi jornada.",
          "Rara vez trabajo en fines de semana o festivos.",
          "Puedo atender asuntos personales sin sentir culpa.",
          "Mis vacaciones se respetan.",
          "La organización respeta mis horarios de descanso.",
        ],
        openPrompts: [
          "¿Qué te dificulta desconectarte del trabajo?",
          "¿Qué práctica del equipo ayudaría a proteger tu tiempo personal?",
        ],
      },
      {
        title: "Organización del trabajo",
        description: "Procesos, reuniones y claridad de responsabilidades.",
        statements: [
          "Los procesos de mi área me permiten avanzar sin trabas.",
          "Las reuniones a las que asisto tienen un propósito claro.",
          "Sé quién es responsable de qué en mi equipo.",
          "Se evita la duplicidad de trabajo entre personas.",
          "Puedo priorizar cuando recibo varias solicitudes a la vez.",
        ],
        openPrompts: [
          "¿Qué proceso eliminarías o simplificarías mañana mismo?",
          "¿Qué reunión recurrente podría ser más corta o innecesaria?",
        ],
      },
    ],
  },
  {
    id: "cultura",
    label: "Cultura y valores",
    hint: "Valores vividos, propósito y sentido de pertenencia",
    sectionDescription:
      "Qué tanto se viven en el día a día los valores que la organización declara.",
    themes: [
      {
        title: "Valores en la práctica",
        description: "Coherencia entre lo declarado y lo que ocurre.",
        statements: [
          "Los valores de la organización se viven en el día a día.",
          "Los líderes actúan de forma coherente con lo que predican.",
          "Se toman decisiones difíciles respetando los valores.",
          "Conozco los valores de la organización.",
          "Los comportamientos contrarios a los valores tienen consecuencias.",
        ],
        openPrompts: [
          "¿Qué valor de la organización se vive mejor y cuál menos?",
          "Describe una decisión reciente que reflejó bien la cultura de la empresa.",
        ],
      },
      {
        title: "Pertenencia",
        description: "Vínculo con el equipo y con la organización.",
        statements: [
          "Me siento parte de mi equipo.",
          "Las relaciones en mi equipo son de respeto.",
          "Puedo ser yo mismo en el trabajo.",
          "Encuentro sentido en lo que hago.",
          "Celebramos los logros como equipo.",
        ],
        openPrompts: [
          "¿Qué fortalece tu sentido de pertenencia aquí?",
          "¿Qué te haría sentir más parte del equipo?",
        ],
      },
      {
        title: "Cambio y adaptación",
        description: "Cómo responde la organización a lo que cambia.",
        statements: [
          "La organización se adapta bien a los cambios del entorno.",
          "Se prueban nuevas formas de trabajar.",
          "Las buenas ideas se escuchan sin importar de quién vengan.",
          "Los cambios se acompañan con la formación necesaria.",
          "Entiendo por qué se toman los cambios que nos afectan.",
        ],
        openPrompts: [
          "¿Qué cambio reciente te costó más asimilar y por qué?",
          "¿Qué propondrías cambiar en la forma de trabajar de tu área?",
        ],
      },
    ],
  },
  {
    id: "bienestar",
    label: "Bienestar",
    hint: "Salud física y mental, seguridad y clima emocional",
    sectionDescription:
      "Cómo está el estado físico y emocional de las personas y qué tanto la organización lo cuida.",
    themes: [
      {
        title: "Salud emocional",
        description: "Nivel de estrés y apoyo disponible.",
        statements: [
          "Termino la jornada con energía suficiente.",
          "El nivel de estrés en mi trabajo es manejable.",
          "Sé a quién acudir si necesito apoyo emocional.",
          "La organización se preocupa por mi bienestar.",
          "Puedo hablar de salud mental sin sentirme juzgado.",
        ],
        openPrompts: [
          "¿Qué es lo que más te genera estrés en tu trabajo hoy?",
          "¿Qué apoyo te gustaría recibir de la organización?",
        ],
      },
      {
        title: "Entorno y seguridad",
        description: "Condiciones físicas y seguridad del puesto de trabajo.",
        statements: [
          "Mi espacio de trabajo es adecuado para lo que hago.",
          "Cuento con condiciones seguras para trabajar.",
          "Los riesgos de mi puesto están identificados.",
          "Sé cómo reportar una condición insegura.",
          "Las condiciones de trabajo mejoraron en el último año.",
        ],
        openPrompts: [
          "¿Qué mejorarías de tu espacio de trabajo?",
          "¿Hay alguna condición que consideres insegura hoy?",
        ],
      },
      {
        title: "Trato y respeto",
        description: "Ausencia de conductas que dañan la convivencia.",
        statements: [
          "Recibo un trato respetuoso en mi trabajo.",
          "No he presenciado conductas de acoso o discriminación.",
          "Los conflictos se manejan de forma sana.",
          "Sé cómo reportar una situación de maltrato.",
          "Confío en que un reporte sería tratado con seriedad.",
        ],
        openPrompts: [
          "¿Qué haría falta para que el trato en tu equipo sea mejor?",
          "¿Conoces los canales para reportar una situación de maltrato?",
        ],
      },
    ],
  },
  {
    id: "herramientas",
    label: "Herramientas y recursos",
    hint: "Tecnología, procesos y recursos para hacer el trabajo",
    sectionDescription:
      "Si las personas tienen lo que necesitan — herramientas, datos y procesos — para hacer bien su trabajo.",
    themes: [
      {
        title: "Herramientas de trabajo",
        description: "Calidad y suficiencia de lo que se usa a diario.",
        statements: [
          "Cuento con las herramientas necesarias para hacer mi trabajo.",
          "Las herramientas que uso funcionan de forma confiable.",
          "Recibo soporte oportuno cuando algo falla.",
          "Las herramientas nuevas llegan con la capacitación necesaria.",
          "Puedo proponer mejoras a las herramientas que uso.",
        ],
        openPrompts: [
          "¿Qué herramienta te está frenando hoy?",
          "¿Qué herramienta te gustaría tener y no tienes?",
        ],
      },
      {
        title: "Acceso a la información",
        description: "Datos y documentación necesarios para decidir.",
        statements: [
          "Encuentro fácilmente la documentación que necesito.",
          "Tengo acceso a los datos necesarios para tomar decisiones.",
          "La información que consulto está actualizada.",
          "Sé dónde se guarda el conocimiento de mi área.",
          "Cuando alguien se va, su conocimiento queda documentado.",
        ],
        openPrompts: [
          "¿Qué información te cuesta encontrar cuando la necesitas?",
          "¿Qué documentarías si tuvieras tiempo para hacerlo?",
        ],
      },
      {
        title: "Soporte de las áreas internas",
        description: "Respuesta de las áreas que habilitan el trabajo de las demás.",
        statements: [
          "Las áreas de soporte responden en tiempos razonables.",
          "Los trámites internos son sencillos.",
          "Sé a quién escribir para cada tipo de solicitud.",
          "Mis solicitudes internas se resuelven en el primer contacto.",
          "Los procesos internos han mejorado en el último año.",
        ],
        openPrompts: [
          "¿Qué trámite interno te resulta más engorroso?",
          "¿Qué área de soporte necesita más atención y por qué?",
        ],
      },
    ],
  },
  {
    id: "ia",
    label: "Adopción de IA",
    hint: "Uso, confianza y formación en inteligencia artificial",
    sectionDescription:
      "Qué tanto se está usando la inteligencia artificial en el trabajo y con qué nivel de confianza.",
    themes: [
      {
        title: "Uso en el día a día",
        description: "Frecuencia y utilidad real de las herramientas de IA.",
        statements: [
          "Uso herramientas de inteligencia artificial en mi trabajo.",
          "Las herramientas de IA me ahorran tiempo.",
          "Sé en qué tareas conviene apoyarme en la IA.",
          "Los resultados que obtengo con IA son de buena calidad.",
          "Mi equipo comparte buenas prácticas de uso de IA.",
        ],
        openPrompts: [
          "¿En qué tarea te ha ayudado más la IA?",
          "¿Qué te gustaría poder resolver con IA y hoy no puedes?",
        ],
      },
      {
        title: "Formación y habilitación",
        description: "Preparación recibida para usar estas herramientas.",
        statements: [
          "He recibido formación para usar herramientas de IA.",
          "Tengo acceso a las herramientas de IA que necesito.",
          "Sé a quién preguntar cuando tengo dudas sobre IA.",
          "La organización promueve el uso responsable de la IA.",
          "Me siento preparado para incorporar IA a mi trabajo.",
        ],
        openPrompts: [
          "¿Qué formación en IA te resultaría más útil?",
          "¿Qué te frena hoy para usar más estas herramientas?",
        ],
      },
      {
        title: "Confianza y uso responsable",
        description: "Percepción de riesgo, ética y reglas claras.",
        statements: [
          "Conozco las políticas de uso de IA de la organización.",
          "Confío en que la IA se usa de forma ética aquí.",
          "Sé qué información no debo compartir con una herramienta de IA.",
          "Reviso los resultados que entrega la IA antes de usarlos.",
          "La IA se usa para apoyar a las personas, no para reemplazarlas.",
        ],
        openPrompts: [
          "¿Qué te preocupa del uso de IA en la organización?",
          "¿Qué regla clara sobre IA te gustaría que existiera?",
        ],
      },
    ],
  },
];

export const findFocus = (id: string): AiFocus | undefined =>
  AI_FOCUSES.find((focus) => focus.id === id);

/**
 * Focos preseleccionados según el tipo de encuesta. El tipo ya dice de qué
 * trata la medición, así que el formulario llega resuelto en vez de en blanco
 * — el autor ajusta desde ahí en vez de empezar de cero.
 */
const FOCUSES_BY_KIND: Readonly<Record<SurveyKind, readonly string[]>> = {
  cultura: ["cultura", "liderazgo", "comunicacion"],
  clima: ["carga", "liderazgo", "bienestar"],
  enps: ["reconocimiento", "desarrollo", "liderazgo"],
  ia: ["ia", "herramientas", "desarrollo"],
  otros: ["cultura", "comunicacion", "desarrollo"],
};

export const defaultFocusesFor = (kind: SurveyKind | null): readonly string[] =>
  kind ? FOCUSES_BY_KIND[kind] : FOCUSES_BY_KIND.otros;
