import type { SurveyDraft, SurveyQuestion, QuestionOption } from "@/components/survey-builder/surveyBuilderTypes";

const likertQuestion = (id: string, statement: string): SurveyQuestion => ({
  id,
  statement,
  type: "scale",
  required: true,
  scale: {
    kind: "likert",
    ratingType: "agreement",
    minLabel: "Totalmente en desacuerdo",
    maxLabel: "Totalmente de acuerdo",
    allowDontKnow: false,
    followUpEnabled: false,
    followUps: { detractors: "", neutrals: "", promoters: "" },
  },
  options: [],
});

const enpsQuestion = (id: string, statement: string): SurveyQuestion => ({
  id,
  statement,
  type: "scale",
  required: true,
  scale: {
    kind: "enps",
    ratingType: "nps",
    minLabel: "Nada probable",
    maxLabel: "Muy probable",
    allowDontKnow: false,
    followUpEnabled: false,
    followUps: { detractors: "", neutrals: "", promoters: "" },
  },
  options: [],
});

const binaryQuestion = (id: string, statement: string): SurveyQuestion => ({
  id,
  statement,
  type: "single",
  required: true,
  scale: {
    kind: null,
    ratingType: "agreement",
    minLabel: "",
    maxLabel: "",
    allowDontKnow: false,
    followUpEnabled: false,
    followUps: { detractors: "", neutrals: "", promoters: "" },
  },
  options: [
    { id: id + "-opt-1", label: "Sí", weight: 1 },
    { id: id + "-opt-2", label: "No", weight: 0 },
  ],
});

export const cultura: SurveyDraft = {
  name: "Cultura",
  status: "draft",
  description: "Cuestionario para evaluar la cultura organizacional, los valores y las creencias compartidas.",
  startDate: "",
  endDate: "",
  kind: "cultura",
  visibility: "anonymous",
  anonymityThreshold: 5,
  participants: { mode: "company", selectedIds: [], importedFileName: null, importedUsers: [], importedCount: 0, importedNewCount: 0, importedDemographics: [], importedFailed: false },
  demographics: { enabled: true, fields: [] },
  welcomeEnabled: true,
  closingEnabled: true,
  welcomeDescription: "Bienvenido a la encuesta de Cultura.",
  closingDescription: "Gracias por participar.",
  sections: [
    { id: "cultura-1", title: "Participación", description: "Involucramiento de los colaboradores", questions: [likertQuestion("q-cultura-1-1", "Siento que mis opiniones son escuchadas y valoradas."), likertQuestion("q-cultura-1-2", "Se fomenta el trabajo en equipo en mi área.")], children: [] },
    { id: "cultura-2", title: "Consistencia", description: "Alineación y coherencia de valores", questions: [likertQuestion("q-cultura-2-1", "Los líderes de la empresa actúan de acuerdo con los valores declarados."), likertQuestion("q-cultura-2-2", "Existe coherencia entre lo que la empresa dice y lo que hace.")], children: [] },
    { id: "cultura-3", title: "Misión", description: "Propósito central y objetivos", questions: [likertQuestion("q-cultura-3-1", "Comprendo claramente la misión y visión de la empresa."), likertQuestion("q-cultura-3-2", "Mi trabajo contribuye directamente a los objetivos de la organización.")], children: [] },
    { id: "cultura-4", title: "Adaptabilidad", description: "Intercambio de ideas y coordinación", questions: [likertQuestion("q-cultura-4-1", "La empresa se adapta rápidamente a los cambios del mercado."), likertQuestion("q-cultura-4-2", "Se fomenta la innovación y la mejora continua.")], children: [] }
  ]
};

export const clima: SurveyDraft = {
  name: "Clima",
  status: "draft",
  description: "Cuestionario para explorar las diversas dimensiones del clima y ambiente de trabajo.",
  startDate: "",
  endDate: "",
  kind: "clima",
  visibility: "anonymous",
  anonymityThreshold: 5,
  participants: { mode: "company", selectedIds: [], importedFileName: null, importedUsers: [], importedCount: 0, importedNewCount: 0, importedDemographics: [], importedFailed: false },
  demographics: { enabled: true, fields: [] },
  welcomeEnabled: true,
  closingEnabled: true,
  welcomeDescription: "Bienvenido a la encuesta de Clima.",
  closingDescription: "Gracias por participar.",
  sections: [
    { id: "clima-1", title: "Orientación organizacional", description: "", questions: [likertQuestion("q-clima-1", "Conozco la dirección estratégica de la empresa.")], children: [] },
    { id: "clima-2", title: "Gestión del talento humano", description: "", questions: [likertQuestion("q-clima-2", "Siento que tengo oportunidades de desarrollo profesional.")], children: [] },
    { id: "clima-3", title: "Estilo de liderazgo", description: "", questions: [likertQuestion("q-clima-3", "Mi jefe inmediato me motiva a dar lo mejor de mí.")], children: [] },
    { id: "clima-4", title: "Comunicación organizacional", description: "", questions: [likertQuestion("q-clima-4", "La comunicación interna es clara y oportuna.")], children: [] },
    { id: "clima-5", title: "Colaboración", description: "", questions: [likertQuestion("q-clima-5", "Existe una buena colaboración entre las diferentes áreas.")], children: [] },
    { id: "clima-6", title: "Capacidad profesional", description: "", questions: [likertQuestion("q-clima-6", "Recibo la capacitación necesaria para hacer mi trabajo.")], children: [] },
    { id: "clima-7", title: "Ambiente físico de trabajo", description: "", questions: [likertQuestion("q-clima-7", "Mi espacio de trabajo es cómodo y adecuado.")], children: [] },
    { id: "clima-8", title: "Salud y seguridad en el trabajo", description: "", questions: [likertQuestion("q-clima-8", "La empresa se preocupa por mi seguridad física.")], children: [] },
    { id: "clima-9", title: "Manejo del cambio", description: "", questions: [likertQuestion("q-clima-9", "Los cambios en la empresa se manejan de forma adecuada.")], children: [] },
    { id: "clima-10", title: "Equilibrio trabajo-vida", description: "", questions: [likertQuestion("q-clima-10", "Puedo mantener un buen equilibrio entre mi vida personal y laboral.")], children: [] }
  ]
};

export const eNPS: SurveyDraft = {
  name: "eNPS (Employee Net Promoter Score)",
  status: "draft",
  description: "Mide el nivel de satisfacción y lealtad de los colaboradores hacia la empresa.",
  startDate: "",
  endDate: "",
  kind: "enps",
  visibility: "anonymous",
  anonymityThreshold: 5,
  participants: { mode: "company", selectedIds: [], importedFileName: null, importedUsers: [], importedCount: 0, importedNewCount: 0, importedDemographics: [], importedFailed: false },
  demographics: { enabled: true, fields: [] },
  welcomeEnabled: true,
  closingEnabled: true,
  welcomeDescription: "Bienvenido a la encuesta eNPS.",
  closingDescription: "Gracias por participar.",
  sections: [
    { id: "enps-1", title: "Satisfacción laboral", description: "", questions: [enpsQuestion("q-enps-1", "¿Qué tan probable es que recomiendes a la empresa como un buen lugar para trabajar?")], children: [] },
    { id: "enps-2", title: "Confianza en la organización", description: "", questions: [likertQuestion("q-enps-2", "Confío en las decisiones que toma la dirección de la empresa.")], children: [] },
    { id: "enps-3", title: "Compromiso organizacional", description: "", questions: [likertQuestion("q-enps-3", "Me veo trabajando en esta empresa en los próximos dos años.")], children: [] },
    { id: "enps-4", title: "Lealtad del colaborador", description: "", questions: [likertQuestion("q-enps-4", "Siento que la empresa valora mi lealtad y dedicación.")], children: [] },
    { id: "enps-5", title: "Valor percibido del empleo", description: "", questions: [likertQuestion("q-enps-5", "Considero que mi compensación y beneficios son justos.")], children: [] }
  ]
};

export const evaluacionIA: SurveyDraft = {
  name: "Evaluación y adopción de la IA",
  status: "draft",
  description: "Cuestionario para conocer el nivel de adopción, uso y percepción de las herramientas de inteligencia artificial.",
  startDate: "",
  endDate: "",
  kind: "ia",
  visibility: "anonymous",
  anonymityThreshold: 5,
  participants: { mode: "company", selectedIds: [], importedFileName: null, importedUsers: [], importedCount: 0, importedNewCount: 0, importedDemographics: [], importedFailed: false },
  demographics: { enabled: true, fields: [] },
  welcomeEnabled: true,
  closingEnabled: true,
  welcomeDescription: "Bienvenido a la encuesta de Evaluación de IA.",
  closingDescription: "Gracias por participar.",
  sections: [
    { id: "ia-1", title: "Percepción general sobre IA", description: "", questions: [likertQuestion("q-ia-1-1", "Considero que la IA es una herramienta útil para mi trabajo."), likertQuestion("q-ia-1-2", "Me preocupa que la IA pueda reemplazar mi puesto de trabajo.")], children: [] },
    { id: "ia-2", title: "Conocimiento técnico básico", description: "", questions: [likertQuestion("q-ia-2-1", "Comprendo los conceptos básicos de cómo funciona la IA."), likertQuestion("q-ia-2-2", "Sé distinguir qué tareas pueden ser automatizadas por IA.")], children: [] },
    { id: "ia-3", title: "Aplicación práctica en el trabajo", description: "", questions: [likertQuestion("q-ia-3-1", "Utilizo herramientas de IA (como ChatGPT) frecuentemente en mis tareas diarias."), likertQuestion("q-ia-3-2", "La IA me ha ayudado a reducir el tiempo que dedico a tareas repetitivas.")], children: [] },
    { id: "ia-4", title: "Formación y desarrollo", description: "", questions: [likertQuestion("q-ia-4-1", "La empresa me ha brindado capacitación suficiente sobre el uso de IA."), likertQuestion("q-ia-4-2", "Me gustaría recibir más formación especializada en herramientas de IA.")], children: [] },
    { id: "ia-5", title: "Ética y seguridad", description: "", questions: [likertQuestion("q-ia-5-1", "Conozco las políticas de la empresa sobre el uso seguro de datos con IA."), likertQuestion("q-ia-5-2", "Confío en que la IA se utiliza de manera ética en nuestra organización.")], children: [] }
  ]
};

export const nom035Acontecimientos: SurveyDraft = {
  isReadOnly: true,
  name: "NOM 035 - Acontecimientos traumáticos severos",
  status: "draft",
  description: "Guía de Referencia I. Cuestionario para identificar a los trabajadores que fueron sujetos a acontecimientos traumáticos severos.",
  startDate: "",
  endDate: "",
  kind: "otros",
  visibility: "anonymous",
  anonymityThreshold: 5,
  participants: { mode: "company", selectedIds: [], importedFileName: null, importedUsers: [], importedCount: 0, importedNewCount: 0, importedDemographics: [], importedFailed: false },
  demographics: { enabled: true, fields: [] },
  welcomeEnabled: true,
  closingEnabled: true,
  welcomeDescription: "Aviso de privacidad...",
  closingDescription: "Gracias por participar.",
  sections: [
    {
      id: "ats-sec-1", title: "I. Acontecimiento traumático severo", description: "¿Ha presenciado o sufrido alguna vez, durante o con motivo del trabajo un acontecimiento como los siguientes:", questions: [
        binaryQuestion("ats-q-1", "Accidente que tenga como consecuencia la muerte, la pérdida de un miembro o una lesión grave?"),
        binaryQuestion("ats-q-2", "Asaltos?"),
        binaryQuestion("ats-q-3", "Actos violentos que derivaron en lesiones graves?"),
        binaryQuestion("ats-q-4", "Secuestro?"),
        binaryQuestion("ats-q-5", "Amenazas?"),
        binaryQuestion("ats-q-6", "Cualquier otro que ponga en riesgo su vida o salud, y/o la de otras personas?"),
      ], children: []
    },
    {
      id: "ats-sec-2", title: "II. Recuerdos persistentes sobre el acontecimiento", description: "Conteste las siguientes preguntas:", questions: [
        binaryQuestion("ats-q-7", "¿Ha tenido recuerdos recurrentes sobre el acontecimiento que le provocan malestares?"),
        binaryQuestion("ats-q-8", "¿Ha tenido sueños de carácter recurrente sobre el acontecimiento, que le producen malestar?"),
      ], children: []
    },
    {
      id: "ats-sec-3", title: "III. Esfuerzo por evitar circunstancias parecidas", description: "Conteste las siguientes preguntas:", questions: [
        binaryQuestion("ats-q-9", "¿Se ha esforzado por evitar todo tipo de sentimientos, conversaciones o situaciones que le puedan recordar el acontecimiento?"),
        binaryQuestion("ats-q-10", "¿Se ha esforzado por evitar todo tipo de actividades, lugares o personas que motivan recuerdos del acontecimiento?"),
        binaryQuestion("ats-q-11", "¿Ha tenido dificultad para recordar alguna parte importante del evento?"),
        binaryQuestion("ats-q-12", "¿Ha disminuido su interés en sus actividades cotidianas?"),
        binaryQuestion("ats-q-13", "¿Se ha sentido usted alejado o distante de los demás?"),
        binaryQuestion("ats-q-14", "¿Ha notado que tiene dificultad para expresar sus sentimientos?"),
        binaryQuestion("ats-q-15", "¿Ha tenido la impresión de que su vida se va a acortar, que va a morir pronto o que no tendrá un futuro?"),
      ], children: []
    },
    {
      id: "ats-sec-4", title: "IV. Afectación", description: "Conteste las siguientes preguntas:", questions: [
        binaryQuestion("ats-q-16", "¿Ha tenido usted dificultades para dormir?"),
        binaryQuestion("ats-q-17", "¿Ha estado particularmente irritable o ha tenido arranques de coraje?"),
        binaryQuestion("ats-q-18", "¿Ha tenido dificultad para concentrarse?"),
        binaryQuestion("ats-q-19", "¿Ha estado nervioso o constantemente en alerta?"),
        binaryQuestion("ats-q-20", "¿Se ha sobresaltado fácilmente por cualquier cosa?"),
      ], children: []
    }
  ]
};

export const nom035Menos50: SurveyDraft = {
  isReadOnly: true,
  name: "NOM 035 - Riesgo psicosocial (- 50 colaboradores)",
  status: "draft",
  description: "Guía de Referencia II. Cuestionario para identificar los factores de riesgo psicosocial en los centros de trabajo (hasta 50 colaboradores).",
  startDate: "",
  endDate: "",
  kind: "otros",
  visibility: "anonymous",
  anonymityThreshold: 5,
  participants: { mode: "company", selectedIds: [], importedFileName: null, importedUsers: [], importedCount: 0, importedNewCount: 0, importedDemographics: [], importedFailed: false },
  demographics: { enabled: true, fields: [] },
  welcomeEnabled: true,
  closingEnabled: true,
  welcomeDescription: "Aviso de privacidad...",
  closingDescription: "Gracias por participar.",
  sections: [
    {
      id: "gr2-cat-1", title: "Categoría: Ambiente de trabajo", description: "", questions: [], children: [
        {
          id: "gr2-dom-1", title: "Dominio: Condiciones en el ambiente de trabajo", description: "", questions: [], children: [
            { id: "gr2-dim-1-1", title: "Dimensión: Condiciones peligrosas e inseguras", description: "", questions: [likertQuestion("gr2-q-1", "El espacio donde trabajo me permite realizar mis actividades de manera segura e higiénica."), likertQuestion("gr2-q-2", "Me preocupa sufrir un accidente en mi trabajo.")], children: [] },
            { id: "gr2-dim-1-2", title: "Dimensión: Condiciones deficientes e insalubres", description: "", questions: [likertQuestion("gr2-q-3", "Considero que en mi trabajo se aplican las normas de seguridad y salud en el trabajo.")], children: [] },
            { id: "gr2-dim-1-3", title: "Dimensión: Trabajos peligrosos", description: "", questions: [likertQuestion("gr2-q-4", "Considero que las actividades que realizo son peligrosas.")], children: [] }
          ]
        }
      ]
    },
    {
      id: "gr2-cat-2", title: "Categoría: Factores propios de la actividad", description: "", questions: [], children: [
        {
          id: "gr2-dom-2", title: "Dominio: Carga de trabajo", description: "", questions: [], children: [
            { id: "gr2-dim-2-1", title: "Dimensión: Cargas cuantitativas", description: "", questions: [likertQuestion("gr2-q-5", "Por la cantidad de trabajo que tengo debo quedarme tiempo adicional a mi turno.")], children: [] },
            { id: "gr2-dim-2-2", title: "Dimensión: Ritmos de trabajo acelerado", description: "", questions: [likertQuestion("gr2-q-6", "Considero que es necesario mantener un ritmo de trabajo acelerado.")], children: [] },
            { id: "gr2-dim-2-3", title: "Dimensión: Carga mental", description: "", questions: [likertQuestion("gr2-q-7", "Mi trabajo exige que esté muy concentrado.")], children: [] }
          ]
        },
        {
          id: "gr2-dom-3", title: "Dominio: Falta de control sobre el trabajo", description: "", questions: [], children: [
            { id: "gr2-dim-3-1", title: "Dimensión: Falta de control y autonomía sobre el trabajo", description: "", questions: [likertQuestion("gr2-q-8", "Mi trabajo permite que desarrolle nuevas habilidades.")], children: [] }
          ]
        }
      ]
    },
    {
      id: "gr2-cat-3", title: "Categoría: Organización del tiempo de trabajo", description: "", questions: [], children: [
        {
          id: "gr2-dom-4", title: "Dominio: Jornada de trabajo", description: "", questions: [], children: [
            { id: "gr2-dim-4-1", title: "Dimensión: Jornadas de trabajo extensas", description: "", questions: [likertQuestion("gr2-q-9", "Trabajo horas extras más de tres veces a la semana.")], children: [] }
          ]
        },
        {
          id: "gr2-dom-5", title: "Dominio: Interferencia en la relación trabajo-familia", description: "", questions: [], children: [
            { id: "gr2-dim-5-1", title: "Dimensión: Influencia del trabajo fuera del centro laboral", description: "", questions: [likertQuestion("gr2-q-10", "Considero que el tiempo en el trabajo es mucho y perjudica mis actividades familiares o personales.")], children: [] }
          ]
        }
      ]
    },
    {
      id: "gr2-cat-4", title: "Categoría: Liderazgo y relaciones en el trabajo", description: "", questions: [], children: [
        {
          id: "gr2-dom-6", title: "Dominio: Liderazgo", description: "", questions: [], children: [
            { id: "gr2-dim-6-1", title: "Dimensión: Liderazgo negativo", description: "", questions: [likertQuestion("gr2-q-11", "Mi jefe tiene en cuenta mis puntos de vista y opiniones.")], children: [] }
          ]
        },
        {
          id: "gr2-dom-7", title: "Dominio: Relaciones en el trabajo", description: "", questions: [], children: [
            { id: "gr2-dim-7-1", title: "Dimensión: Relaciones sociales en el trabajo", description: "", questions: [likertQuestion("gr2-q-12", "Puedo confiar en mis compañeros de trabajo.")], children: [] }
          ]
        },
        {
          id: "gr2-dom-8", title: "Dominio: Violencia", description: "", questions: [], children: [
            { id: "gr2-dim-8-1", title: "Dimensión: Violencia laboral", description: "", questions: [likertQuestion("gr2-q-13", "En mi trabajo puedo expresarme libremente sin interrupciones.")], children: [] }
          ]
        }
      ]
    }
  ]
};

export const nom035Mas50: SurveyDraft = {
  isReadOnly: true,
  name: "NOM 035 - Riesgo psicosocial (+ 50 colaboradores)",
  status: "draft",
  description: "Guía de Referencia III. Cuestionario para identificar y analizar los factores de riesgo psicosocial y evaluar el entorno organizacional (más de 50 colaboradores).",
  startDate: "",
  endDate: "",
  kind: "otros",
  visibility: "anonymous",
  anonymityThreshold: 5,
  participants: { mode: "company", selectedIds: [], importedFileName: null, importedUsers: [], importedCount: 0, importedNewCount: 0, importedDemographics: [], importedFailed: false },
  demographics: { enabled: true, fields: [] },
  welcomeEnabled: true,
  closingEnabled: true,
  welcomeDescription: "Aviso de privacidad...",
  closingDescription: "Gracias por participar.",
  sections: [
    ...nom035Menos50.sections,
    {
      id: "gr3-cat-5", title: "Categoría: Entorno organizacional", description: "", questions: [], children: [
        {
          id: "gr3-dom-9", title: "Dominio: Reconocimiento del desempeño", description: "", questions: [], children: [
            { id: "gr3-dim-9-1", title: "Dimensión: Escaso o nulo reconocimiento y compensación", description: "", questions: [likertQuestion("gr3-q-14", "Me informan sobre lo que hago bien en mi trabajo."), likertQuestion("gr3-q-15", "El reconocimiento que me entregan es justo.")], children: [] }
          ]
        },
        {
          id: "gr3-dom-10", title: "Dominio: Sentido de pertenencia e inestabilidad", description: "", questions: [], children: [
            { id: "gr3-dim-10-1", title: "Dimensión: Inestabilidad laboral", description: "", questions: [likertQuestion("gr3-q-16", "Siento orgullo de laborar en este centro de trabajo.")], children: [] },
            { id: "gr3-dim-10-2", title: "Dimensión: Insuficiente sentido de pertenencia", description: "", questions: [likertQuestion("gr3-q-17", "Me siento comprometido con mi trabajo.")], children: [] }
          ]
        }
      ]
    }
  ]
};

export const templates = [
  cultura,
  clima,
  eNPS,
  evaluacionIA,
  nom035Acontecimientos,
  nom035Menos50,
  nom035Mas50
];
