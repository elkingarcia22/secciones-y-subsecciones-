export interface QuestionBankItem {
  id: string;
  text: string;
  /** UBITS content when absent. Set to "custom" for what an author saved
   * into the bank from their own survey. */
  origin?: "ubits" | "custom";
}

export interface QuestionBankSection {
  id: string;
  name: string;
  questions: QuestionBankItem[];
  /** UBITS content when absent. Set to "custom" for a section an author
   * created by saving one of their own into the bank. */
  origin?: "ubits" | "custom";
}

export interface QuestionBankType {
  id: string;
  name: string;
  sections: QuestionBankSection[];
}

export const questionBankData: QuestionBankType[] = [
  {
    id: "cultura",
    name: "Cultura",
    sections: [
      {
        id: "cultura-adaptabilidad",
        name: "Adaptabilidad",
        questions: [
          { id: "c-a-1", text: "Existe una apertura general para implementar nuevas ideas y enfoques innovadores." },
          { id: "c-a-2", text: "La gestión del cambio se realiza de manera estructurada, minimizando el impacto negativo." },
          { id: "c-a-3", text: "La organización actúa de manera ágil para responder a las demandas del entorno." },
          { id: "c-a-4", text: "La organización es flexible y se adapta rápidamente a los cambios del entorno." },
          { id: "c-a-5", text: "La organización está dispuesta a cambiar sus prácticas para adaptarse a nuevas circunstancias." },
          { id: "c-a-6", text: "La organización fomenta un entorno donde el cambio se considera una oportunidad de crecimiento." },
          { id: "c-a-7", text: "La organización gestiona bien las transiciones y se adapta rápidamente a nuevas realidades." },
          { id: "c-a-8", text: "Las iniciativas de cambio se implementan de manera coherente con la visión de la organización." },
          { id: "c-a-9", text: "Las innovaciones en la organización se realizan teniendo en cuenta la sostenibilidad a largo plazo." },
          { id: "c-a-10", text: "Los cambios en la organización se comunican de manera efectiva a todos los empleados." },
          { id: "c-a-11", text: "Los cambios en la organización son bien gestionados y se consideran las opiniones de los empleados." },
          { id: "c-a-12", text: "Los cambios organizacionales se implementan de manera que maximicen la colaboración y el aprendizaje." },
          { id: "c-a-13", text: "Los empleados estamos preparados para enfrentar los cambios de manera proactiva." },
          { id: "c-a-14", text: "Los empleados son informados oportunamente sobre las razones de los cambios." },
          { id: "c-a-15", text: "Los líderes de la organización promueven el cambio como una forma de mejorar continuamente." },
          { id: "c-a-16", text: "Los líderes de la organización promueven una cultura que apoya el cambio continuo y la evolución." },
          { id: "c-a-17", text: "Se fomenta la innovación para enfrentar nuevos desafíos y oportunidades." },
          { id: "c-a-18", text: "Se me anima a participar activamente en los procesos de cambio e innovación." },
          { id: "c-a-19", text: "Siento que la organización me apoya en momentos de cambio e incertidumbre." },
          { id: "c-a-20", text: "Siento que la organización valora mi capacidad para adaptarme a los cambios." }
        ]
      },
      {
        id: "cultura-consistencia",
        name: "Consistencia",
        questions: [
          { id: "c-c-1", text: "Comprendo y respeto los valores fundamentales de la organización." },
          { id: "c-c-2", text: "El comportamiento de los líderes está alineado con los valores de la organización." },
          { id: "c-c-3", text: "El éxito de la organización se mide no solo por resultados, sino también por adherencia a sus valores." },
          { id: "c-c-4", text: "Existe un compromiso general con los valores fundamentales de la organización." },
          { id: "c-c-5", text: "La organización promueve los valores fundamentales en mí." },
          { id: "c-c-6", text: "La organización se asegura de que los nuevos empleados comprendan sus valores desde el inicio." },
          { id: "c-c-7", text: "Las decisiones importantes se toman basándose en los valores de la organización." },
          { id: "c-c-8", text: "Las políticas de la organización están diseñadas en consonancia con sus valores." },
          { id: "c-c-9", text: "Los comportamientos de los empleados reflejan los valores de la organización." },
          { id: "c-c-10", text: "Los líderes de la organización son un ejemplo a seguir en cuanto a los valores compartidos." },
          { id: "c-c-11", text: "Los valores compartidos facilitan la resolución de conflictos dentro de la organización." },
          { id: "c-c-12", text: "Los valores de la organización guían las decisiones que tomo en mi trabajo diario." },
          { id: "c-c-13", text: "Los valores de la organización guían nuestra forma de interactuar entre colegas." },
          { id: "c-c-14", text: "Los valores de la organización se reflejan en la forma en que trato a mis clientes." },
          { id: "c-c-15", text: "Los valores de la organización son claros y están bien definidos." },
          { id: "c-c-16", text: "Los valores de la organización son coherentes con mis valores personales." },
          { id: "c-c-17", text: "Los valores de la organización son una parte integral de su identidad." },
          { id: "c-c-18", text: "Me siento orgulloso/a de pertenecer a una organización con valores claramente definidos." },
          { id: "c-c-19", text: "Se espera que actuemos de acuerdo con los valores fundamentales de la organización." },
          { id: "c-c-20", text: "Se fomenta el respeto a los valores compartidos en las decisiones y acciones de la organización." }
        ]
      },
      {
        id: "cultura-mision",
        name: "Misión",
        questions: [
          { id: "c-m-1", text: "Conozco la dirección estratégica de la organización y cómo se espera que contribuyamos a ella." },
          { id: "c-m-2", text: "El enfoque estratégico de la organización es inspirador y motiva a los empleados a dar lo mejor de sí." },
          { id: "c-m-3", text: "El plan estratégico de la organización es revisado y actualizado según las necesidades del entorno." },
          { id: "c-m-4", text: "Existe un entendimiento común sobre las prioridades estratégicas de la organización." },
          { id: "c-m-5", text: "La dirección de la organización comunica de manera efectiva su estrategia a todos los empleados." },
          { id: "c-m-6", text: "La dirección estratégica de la organización está claramente definida." },
          { id: "c-m-7", text: "La estrategia de la organización es comprensible para todos los niveles." },
          { id: "c-m-8", text: "La estrategia de la organización guía nuestras actividades diarias." },
          { id: "c-m-9", text: "La organización comunica claramente cómo se mide el éxito en relación con la estrategia." },
          { id: "c-m-10", text: "La organización tiene un enfoque estratégico que le permite adaptarse a los cambios del entorno." },
          { id: "c-m-11", text: "La organización tiene una estrategia clara para alcanzar sus objetivos a largo plazo." },
          { id: "c-m-12", text: "La organización tiene una visión a largo plazo que se refleja en sus decisiones estratégicas." },
          { id: "c-m-13", text: "Las decisiones que se toman están alineadas con la dirección estratégica de la organización." },
          { id: "c-m-14", text: "Los empleados entienden cómo sus roles contribuyen a la estrategia general de la organización." },
          { id: "c-m-15", text: "Los líderes de la organización explican cómo cada área contribuye a la estrategia general." },
          { id: "c-m-16", text: "Los líderes de la organización proporcionan claridad sobre hacia dónde se dirige la empresa." },
          { id: "c-m-17", text: "Los objetivos a largo plazo de la organización están alineados con su misión y visión." },
          { id: "c-m-18", text: "Los objetivos estratégicos de la organización son alcanzables y están bien definidos." },
          { id: "c-m-19", text: "Siento que la dirección estratégica de la organización es adecuada para lograr el éxito." },
          { id: "c-m-20", text: "Siento que la organización tiene una estrategia coherente que guía su crecimiento." }
        ]
      },
      {
        id: "cultura-participacion",
        name: "Participación",
        questions: [
          { id: "c-p-1", text: "Confío en que puedo tomar decisiones sin tener que consultar cada detalle con mi superior." },
          { id: "c-p-2", text: "Cuento con la confianza para sugerir cambios en las tareas asignadas." },
          { id: "c-p-3", text: "Me siento capaz de influir en las decisiones que afectan mi desempeño." },
          { id: "c-p-4", text: "Me siento con la autoridad necesaria para tomar decisiones importantes en mi trabajo." },
          { id: "c-p-5", text: "Me siento en capacidad de resolver problemas sin tener que pedir aprobación constantemente." },
          { id: "c-p-6", text: "Me siento habilitado/a para coordinar tareas entre distintos equipos sin requerir permiso previo." },
          { id: "c-p-7", text: "Mi líder me apoya para que tome decisiones que me permitan cumplir mis objetivos." },
          { id: "c-p-8", text: "Mis aportes se valoran en la toma de decisiones dentro de mi área." },
          { id: "c-p-9", text: "Mis decisiones contribuyen de manera directa al logro de los objetivos de mi equipo." },
          { id: "c-p-10", text: "Mis opiniones son consideradas al momento de definir los procesos de mi área." },
          { id: "c-p-11", text: "Puedo actuar con independencia para asegurar el cumplimiento de mis responsabilidades." },
          { id: "c-p-12", text: "Puedo tomar decisiones que impactan en el éxito de mi área." },
          { id: "c-p-13", text: "Se me brinda la libertad de buscar soluciones creativas a los problemas que enfrento." },
          { id: "c-p-14", text: "Se me motiva a tomar decisiones que apoyen el crecimiento de mi área." },
          { id: "c-p-15", text: "Se me permite tomar decisiones que impactan en la calidad del servicio que brindo." },
          { id: "c-p-16", text: "Tengo el poder para implementar mejoras en mi área de trabajo." },
          { id: "c-p-17", text: "Tengo la autonomía para decidir cómo organizar mi carga de trabajo." },
          { id: "c-p-18", text: "Tengo la facultad de priorizar mis tareas según las necesidades del equipo." },
          { id: "c-p-19", text: "Tengo la libertad de proponer nuevas formas de hacer las cosas en mi puesto." },
          { id: "c-p-20", text: "Tengo la libertad para proponer nuevas ideas en mi equipo." }
        ]
      }
    ]
  },
  {
    id: "clima",
    name: "Clima",
    sections: [
      {
        id: "clima-ambiente-fisico",
        name: "Ambiente físico de trabajo",
        questions: [
          { id: "cl-a-1", text: "El baño en mi lugar de trabajo está en buen estado." },
          { id: "cl-a-2", text: "El lugar de trabajo está libre de riesgos físicos que puedan poner en peligro mi seguridad." },
          { id: "cl-a-3", text: "El nivel de confort en mi espacio de trabajo me permite desempeñarme de manera efectiva." },
          { id: "cl-a-4", text: "El nivel de ruido en mi entorno de trabajo me permite concentrarme." },
          { id: "cl-a-5", text: "Estoy satisfecho/a con la ergonomía de mi lugar de trabajo." },
          { id: "cl-a-6", text: "Estoy satisfecho/a con la iluminación en mi espacio de trabajo." },
          { id: "cl-a-7", text: "La organización se asegura de que mis herramientas de trabajo estén en buen estado de funcionamiento." },
          { id: "cl-a-8", text: "La ventilación en mi lugar de trabajo es adecuada." },
          { id: "cl-a-9", text: "Las herramientas de trabajo que utilizo son adecuadas para realizar mis tareas eficientemente." },
          { id: "cl-a-10", text: "Las instalaciones de mi lugar de trabajo están en buenas condiciones." },
          { id: "cl-a-11", text: "Los equipos tecnológicos que utilizo en mi trabajo están actualizados y en buen estado." },
          { id: "cl-a-12", text: "Los espacios de trabajo están diseñados para minimizar el riesgo de accidentes." },
          { id: "cl-a-13", text: "Los protocolos de salud y seguridad en mi lugar de trabajo están bien implementados." },
          { id: "cl-a-14", text: "Me siento cómodo/a con la temperatura en mi área de trabajo." },
          { id: "cl-a-15", text: "Me siento seguro/a físicamente en mi espacio de trabajo." },
          { id: "cl-a-16", text: "Mi espacio de trabajo es cómodo y adecuado para mis tareas." },
          { id: "cl-a-17", text: "Mi espacio de trabajo está limpio y bien mantenido." },
          { id: "cl-a-18", text: "Siempre tengo acceso a los materiales y recursos necesarios para completar mi trabajo." },
          { id: "cl-a-19", text: "Siento que los procedimientos de emergencia en mi lugar de trabajo están bien establecidos." },
          { id: "cl-a-20", text: "Tengo acceso a todas las herramientas mínimas necesarias para realizar mi trabajo de la mejor manera efectiva." }
        ]
      },
      {
        id: "clima-capacidad-profesional",
        name: "Capacidad profesional",
        questions: [
          { id: "cl-cp-1", text: "Confío en que puedo cumplir con los criterios de desempeño y calidad establecidos en mi trabajo." },
          { id: "cl-cp-2", text: "Estoy satisfecho/a con las opciones de formación que ofrece la organización." },
          { id: "cl-cp-3", text: "La organización aprovecha mi experiencia para proyectos clave." },
          { id: "cl-cp-4", text: "La organización me brinda oportunidades para mejorar mis habilidades." },
          { id: "cl-cp-5", text: "La organización reconoce mis contribuciones y logros." },
          { id: "cl-cp-6", text: "Las habilidades técnicas que tengo son valoradas por mis compañeros y líderes." },
          { id: "cl-cp-7", text: "Me considero capacitado/a para enfrentar las responsabilidades asignadas a mí." },
          { id: "cl-cp-8", text: "Me considero competente en el uso de las herramientas y tecnologías requeridas para mi trabajo." },
          { id: "cl-cp-9", text: "Mi líder directo reconoce mi experiencia en la toma de decisiones." },
          { id: "cl-cp-10", text: "Mi nivel de habilidad me permite enfrentar tareas complejas con confianza." },
          { id: "cl-cp-11", text: "Mis competencias actuales me facilitan alcanzar las metas laborales de manera eficiente." },
          { id: "cl-cp-12", text: "Mis habilidades profesionales me ayudan a cumplir con plazos y objetivos establecidos." },
          { id: "cl-cp-13", text: "Mis habilidades se alinean con las expectativas y requerimientos de mi trabajo." },
          { id: "cl-cp-14", text: "Siento que la organización promueve activamente mi aprendizaje continuo, ofreciéndome oportunidades y recursos para adquirir nuevos conocimientos." },
          { id: "cl-cp-15", text: "Siento que mi experiencia es valorada dentro de la organización." },
          { id: "cl-cp-16", text: "Siento que mi experiencia se refleja en las oportunidades de crecimiento que se me ofrecen." },
          { id: "cl-cp-17", text: "Siento que mi nivel de competencia aporta al éxito de mi equipo." },
          { id: "cl-cp-18", text: "Siento que tengo opciones de crecimiento profesional dentro de la organización." },
          { id: "cl-cp-19", text: "Tengo acceso a programas de formación que fortalecen mis competencias." },
          { id: "cl-cp-20", text: "Tengo confianza en mis habilidades técnicas para desempeñar mi trabajo." }
        ]
      },
      {
        id: "clima-colaboracion",
        name: "Colaboración",
        questions: [
          { id: "cl-c-1", text: "El apoyo mutuo dentro de mi equipo fortalece nuestra capacidad para cumplir con los objetivos organizacionales." },
          { id: "cl-c-2", text: "El equipo trabaja de manera efectiva para alcanzar nuestros objetivos comunes." },
          { id: "cl-c-3", text: "La colaboración en mi equipo contribuye a obtener mejores resultados." },
          { id: "cl-c-4", text: "Las diferencias de opinión en el equipo se resuelven de forma constructiva." },
          { id: "cl-c-5", text: "Los miembros de mi equipo se apoyan mutuamente para completar las tareas de manera eficiente." },
          { id: "cl-c-6", text: "Los miembros de mi equipo se comunican de forma abierta y clara." },
          { id: "cl-c-7", text: "Los miembros de mi equipo tienen claro el rol que desempeñan dentro del grupo." },
          { id: "cl-c-8", text: "Mi equipo colabora de manera efectiva con otros equipos dentro de la organización." },
          { id: "cl-c-9", text: "Mi equipo colabora frecuentemente con otros departamentos para resolver problemas." },
          { id: "cl-c-10", text: "Mi equipo comparte un sentido claro de identidad y propósito común." },
          { id: "cl-c-11", text: "Mi equipo coopera bien con otros departamentos para lograr los objetivos organizacionales." },
          { id: "cl-c-12", text: "Mi equipo mantiene relaciones laborales respetuosas." },
          { id: "cl-c-13", text: "Mi equipo se adapta de manera flexible cuando necesita colaborar con otros equipos." },
          { id: "cl-c-14", text: "Mis compañeros de equipo me brindan apoyo cuando enfrento desafíos laborales." },
          { id: "cl-c-15", text: "Mis compañeros están dispuestos a cubrirme cuando no puedo cumplir con alguna de mis responsabilidades." },
          { id: "cl-c-16", text: "Siento que la colaboración entre áreas mejora la eficiencia de la organización." },
          { id: "cl-c-17", text: "Siento que mi equipo está unido y colabora de forma eficiente." },
          { id: "cl-c-18", text: "Siento que puedo contar con el apoyo de mis compañeros de equipo cuando lo necesito." },
          { id: "cl-c-19", text: "Siento que todos en mi equipo están comprometidos a cumplir metas comunes." }
        ]
      },
      {
        id: "clima-comunicacion",
        name: "Comunicación organizacional",
        questions: [
          { id: "cl-co-1", text: "La alta dirección comparte información relevante y estratégica con todos los empleados." },
          { id: "cl-co-2", text: "La comunicación digital (correo, plataformas) en mi organización es eficiente y clara." },
          { id: "cl-co-3", text: "La comunicación entre departamentos en la organización es fluida." },
          { id: "cl-co-4", text: "La comunicación entre equipos mejora la calidad de nuestro trabajo en general." },
          { id: "cl-co-5", text: "La comunicación vertical en la organización (de jefes a subordinados y viceversa) es clara y directa." },
          { id: "cl-co-6", text: "La información crítica se transmite de manera rápida y efectiva en la organización." },
          { id: "cl-co-7", text: "La organización se asegura de que la información importante llegue a todos los empleados." },
          { id: "cl-co-8", text: "La organización utiliza canales de comunicación adecuados para mantenernos actualizados." },
          { id: "cl-co-9", text: "Las herramientas de comunicación que utiliza la organización son fáciles de usar y accesibles." },
          { id: "cl-co-10", text: "Los canales de comunicación en la organización son claros y efectivos." },
          { id: "cl-co-11", text: "Los diferentes departamentos en la organización colaboran bien entre sí." },
          { id: "cl-co-12", text: "Los diferentes equipos dentro de la organización comparten recursos y conocimientos cuando es necesario." },
          { id: "cl-co-13", text: "Los líderes en mi organización promueven una comunicación abierta con todos los empleados." },
          { id: "cl-co-14", text: "Los proyectos que involucran a varios equipos se gestionan de manera efectiva." },
          { id: "cl-co-15", text: "Mi equipo se comunica eficazmente con otros equipos en la organización." },
          { id: "cl-co-16", text: "Puedo acceder fácilmente a la información necesaria a través de los canales de comunicación." },
          { id: "cl-co-17", text: "Recibo la información relevante de manera oportuna." },
          { id: "cl-co-18", text: "Siento que la comunicación entre los distintos niveles de la organización es adecuada." },
          { id: "cl-co-19", text: "Siento que mi equipo recibe suficiente información de parte de la alta dirección." },
          { id: "cl-co-20", text: "Siento que puedo comunicarme fácilmente con mis superiores cuando es necesario." }
        ]
      },
      {
        id: "clima-equilibrio",
        name: "Equilibrio trabajo-vida",
        questions: [
          { id: "cl-e-1", text: "Estoy satisfecho/a con el equilibrio entre mi vida personal y laboral." },
          { id: "cl-e-2", text: "Estoy satisfecho/a con las políticas de flexibilidad laboral de la organización, como horarios, funciones y beneficios." },
          { id: "cl-e-3", text: "La cantidad de trabajo que se me asigna me permite mantener un buen equilibrio entre el trabajo y mi vida personal." },
          { id: "cl-e-4", text: "La organización promueve un buen equilibrio entre la vida laboral y personal." },
          { id: "cl-e-5", text: "La organización respeta mi tiempo personal y no me exige trabajar fuera de horario." },
          { id: "cl-e-6", text: "La organización respeta mis límites de horario cuando trabajo remotamente." },
          { id: "cl-e-7", text: "Los sistemas y herramientas de la organización me permiten ser productivo/a cuando trabajo de forma remota." },
          { id: "cl-e-8", text: "Mi carga de trabajo es adecuada para mi nivel de experiencia y habilidades." },
          { id: "cl-e-9", text: "Mi carga de trabajo es razonable porque es coherente con mis funciones." },
          { id: "cl-e-10", text: "Mi carga de trabajo no afecta negativamente mi bienestar." },
          { id: "cl-e-11", text: "Mi trabajo no interfiere con mi tiempo personal fuera del horario laboral." },
          { id: "cl-e-12", text: "Mi vida personal no se ve afectada por las demandas laborales." },
          { id: "cl-e-13", text: "Mis responsabilidades laborales no me exigen más horas de las que debería trabajar." },
          { id: "cl-e-14", text: "Puedo completar mis tareas laborales dentro de mi horario de trabajo habitual." },
          { id: "cl-e-15", text: "Puedo dedicar tiempo suficiente a mis actividades personales y familiares." },
          { id: "cl-e-16", text: "Siento que puedo desconectar del trabajo cuando termina mi jornada laboral." },
          { id: "cl-e-17", text: "Siento que puedo disfrutar de mi tiempo libre sin pensar en mis responsabilidades laborales." },
          { id: "cl-e-18", text: "Siento que puedo mantener un equilibrio adecuado entre el trabajo remoto y la vida personal." },
          { id: "cl-e-19", text: "Siento que tengo flexibilidad para organizar mi horario de trabajo remoto de manera efectiva." },
          { id: "cl-e-20", text: "Siento que tengo un equilibrio adecuado entre la cantidad de trabajo y el tiempo disponible." }
        ]
      },
      {
        id: "clima-liderazgo",
        name: "Estilo de liderazgo",
        questions: [
          { id: "cl-l-1", text: "Confío en que las decisiones de los líderes son justas y equitativas." },
          { id: "cl-l-2", text: "El proceso de toma de decisiones en la organización es claro y transparente." },
          { id: "cl-l-3", text: "Los líderes comunican de manera efectiva la visión y los objetivos de la empresa." },
          { id: "cl-l-4", text: "Los líderes inspiran confianza a través de su comportamiento ético y profesional." },
          { id: "cl-l-5", text: "Los líderes solicitan aportes de empleados en diferentes roles y áreas antes de tomar decisiones importantes." },
          { id: "cl-l-6", text: "Los líderes son proactivos al anticipar y resolver problemas." },
          { id: "cl-l-7", text: "Me siento respaldado/a por mi líder directo cuando enfrento desafíos laborales." },
          { id: "cl-l-8", text: "Mi líder directo demuestra interés genuino en mi bienestar personal y profesional." },
          { id: "cl-l-9", text: "Mi líder directo está disponible cuando necesito orientación para mi trabajo." },
          { id: "cl-l-10", text: "Mi líder directo fomenta relaciones basadas en la confianza dentro del equipo." },
          { id: "cl-l-11", text: "Mi líder directo me proporciona los recursos necesarios para cumplir con mis responsabilidades." },
          { id: "cl-l-12", text: "Mi líder me apoya activamente en mi desarrollo profesional al ofrecer orientación, brindar retroalimentación constructiva y facilitar recursos u oportunidades." },
          { id: "cl-l-13", text: "Mi líder me involucra activamente en decisiones relacionadas con mi equipo." },
          { id: "cl-l-14", text: "Percibo que las decisiones organizacionales consideran las necesidades de los colaboradores." },
          { id: "cl-l-15", text: "Percibo que los líderes crean un ambiente de trabajo basado en la confianza." },
          { id: "cl-l-16", text: "Puedo confiar en mi líder directo para resolver problemas de manera efectiva y oportuna." },
          { id: "cl-l-17", text: "Recibo retroalimentación constructiva de mi líder cuando la solicito." },
          { id: "cl-l-18", text: "Siento que me consultan para tomar las decisiones que impactan mi desempeño laboral." },
          { id: "cl-l-19", text: "Siento que mis ideas son consideradas al tomar decisiones organizacionales importantes." },
          { id: "cl-l-20", text: "Tengo oportunidades para influir en decisiones que impactan mi equipo." }
        ]
      },
      {
        id: "clima-gestion-talento",
        name: "Gestión del talento humano",
        questions: [
          { id: "cl-gt-1", text: "El entorno laboral facilita un estilo de vida saludable, promoviendo el bienestar físico y emocional en mí." },
          { id: "cl-gt-2", text: "El entorno laboral favorece mi salud mental y emocional, permitiéndome afrontar de manera efectiva los retos diarios." },
          { id: "cl-gt-3", text: "En situaciones de estrés o carga laboral elevada, recibo apoyo por parte de la organización para gestionar la situación." },
          { id: "cl-gt-4", text: "Estoy satisfecho/a con el apoyo que recibo de la organización para mantener mi bienestar integral, que incluye mi salud física, mental y emocional." },
          { id: "cl-gt-5", text: "Estoy satisfecho/a con la compensación que recibo por mi trabajo en relación con mis responsabilidades y el mercado laboral." },
          { id: "cl-gt-6", text: "Estoy satisfecho/a con las oportunidades de promoción interna y el reconocimiento dentro de la organización." },
          { id: "cl-gt-7", text: "La formación proporcionada por la organización está alineada con las competencias necesarias para mi crecimiento profesional." },
          { id: "cl-gt-8", text: "La organización crea un entorno de trabajo en el que me siento apoyado/a para alcanzar mis metas tanto personales como profesionales." },
          { id: "cl-gt-9", text: "La organización demuestra un interés genuino en mi salud y bienestar mediante recursos y acciones tangibles." },
          { id: "cl-gt-10", text: "La organización establece condiciones laborales claras, como horarios definidos, políticas de seguridad, protocolos de comunicación y recursos adecuados, que contribuyen a un entorno de trabajo seguro y estructurado." },
          { id: "cl-gt-11", text: "La organización me ofrece oportunidades claras de avance profesional, tales como promociones internas, cambios de rol y proyectos desafiantes." },
          { id: "cl-gt-12", text: "La organización promueve un ambiente de trabajo positivo y saludable que favorece mi bienestar emocional y físico." },
          { id: "cl-gt-13", text: "La organización proporciona oportunidades de aprendizaje constantes para el desarrollo de mis habilidades y conocimientos." },
          { id: "cl-gt-14", text: "Los beneficios extrasalariales que la organización ofrece contribuyen positivamente a mi bienestar general." },
          { id: "cl-gt-15", text: "Los planes de desarrollo profesional de la organización están alineados con mis objetivos personales y profesionales." },
          { id: "cl-gt-16", text: "Los programas de bienestar ofrecidos por la organización tienen un impacto positivo en mi calidad de vida." },
          { id: "cl-gt-17", text: "Me siento valorado/a por la organización en cuanto a mi desarrollo integral y bienestar." },
          { id: "cl-gt-18", text: "Mi lugar de trabajo está diseñado para fomentar un ambiente de trabajo cómodo y funcional, que contribuye a mi bienestar." },
          { id: "cl-gt-19", text: "Mi salario es competitivo en comparación con las organizaciones del mismo sector y refleja mis habilidades y experiencia." },
          { id: "cl-gt-20", text: "Siento que hay equidad en los procesos de gestión del talento humano dentro de la organización." }
        ]
      },
      {
        id: "clima-manejo-cambio",
        name: "Manejo del cambio",
        questions: [
          { id: "cl-mc-1", text: "Acepto los cambios como una oportunidad para aprender y mejorar." },
          { id: "cl-mc-2", text: "Asumo los cambios en mi rol y responsabilidades con flexibilidad en el entorno laboral." },
          { id: "cl-mc-3", text: "Durante los periodos de cambio, siento que la organización se preocupa por mi bienestar." },
          { id: "cl-mc-4", text: "La organización proporciona actualizaciones regulares sobre el progreso de los cambios." },
          { id: "cl-mc-5", text: "La organización proporciona los recursos necesarios para adaptarse a los cambios." },
          { id: "cl-mc-6", text: "La organización realiza capacitaciones para asegurar que podamos adaptarnos a los cambios." },
          { id: "cl-mc-7", text: "La organización utiliza múltiples canales de comunicación para mantenernos al tanto de los cambios." },
          { id: "cl-mc-8", text: "Las razones detrás de los cambios organizacionales son explicadas de manera transparente." },
          { id: "cl-mc-9", text: "Las transiciones se comunican con suficiente antelación para que podamos prepararnos." },
          { id: "cl-mc-10", text: "Los cambios dentro de la organización se comunican de manera clara y oportuna." },
          { id: "cl-mc-11", text: "Los cambios en la organización me desafían de manera positiva." },
          { id: "cl-mc-12", text: "Me muestro abierto/a a adaptarme a los cambios estructurales dentro de la organización." },
          { id: "cl-mc-13", text: "Me siento capacitado/a para hacer frente a los desafíos que surgen con los cambios organizacionales." },
          { id: "cl-mc-14", text: "Me siento cómodo/a con los cambios tecnológicos implementados en la organización." },
          { id: "cl-mc-15", text: "Me siento motivado/a por las nuevas oportunidades que traen los cambios organizacionales." },
          { id: "cl-mc-16", text: "Me siento respaldado/a durante las transiciones en los procesos o políticas de la empresa." },
          { id: "cl-mc-17", text: "Mis compañeros de trabajo me apoyan durante los períodos de transición." },
          { id: "cl-mc-18", text: "Mis líderes me brindan orientación cuando hay cambios en mi trabajo." },
          { id: "cl-mc-19", text: "Siento que la organización me apoya cuando ocurren cambios significativos." },
          { id: "cl-mc-20", text: "Soy flexible a la hora de ajustar mi trabajo a los nuevos cambios." }
        ]
      },
      {
        id: "clima-orientacion",
        name: "Orientación organizacional",
        questions: [
          { id: "cl-o-1", text: "Conozco los objetivos estratégicos de la organización y es claro cómo contribuyo a ellos." },
          { id: "cl-o-2", text: "Entiendo claramente la misión de la organización y cómo impacta mi bienestar personal." },
          { id: "cl-o-3", text: "Entiendo cómo mis responsabilidades específicas impactan en los resultados y el éxito del equipo." },
          { id: "cl-o-4", text: "La claridad en la definición de las metas de la organización me brinda confianza en mi trabajo." },
          { id: "cl-o-5", text: "La misión de la organización está alineada con mis actividades diarias, lo que refuerza mi sentido de propósito en el trabajo." },
          { id: "cl-o-6", text: "La organización comunica los cambios en los objetivos estratégicos, lo cual me genera tranquilidad." },
          { id: "cl-o-7", text: "La organización promueve una cultura cuyos valores son compatibles con los míos, lo que refuerza mi compromiso laboral." },
          { id: "cl-o-8", text: "Las responsabilidades asociadas a mi rol laboral están claramente definidas y comunicadas." },
          { id: "cl-o-9", text: "Los líderes de la organización, desde la alta dirección hasta los mandos intermedios, actúan conforme a los valores institucionales." },
          { id: "cl-o-10", text: "Los objetivos de la organización son alcanzables con los recursos físicos y tecnológicos disponibles, lo que me genera confianza." },
          { id: "cl-o-11", text: "Los valores de la organización están claramente definidos y son fácilmente comprensibles para mí." },
          { id: "cl-o-12", text: "Los valores de la organización son un referente para la toma de decisiones." },
          { id: "cl-o-13", text: "Mi rol está claramente alineado con los procesos y objetivos organizacionales, contribuyendo de manera efectiva al funcionamiento de la empresa." },
          { id: "cl-o-14", text: "Mi trabajo diario contribuye de manera clara a los objetivos organizacionales." },
          { id: "cl-o-15", text: "Recibo comunicación clara y oportuna sobre cualquier cambio en mis responsabilidades laborales." },
          { id: "cl-o-16", text: "Recibo información periódica y detallada sobre los objetivos de la organización, lo que facilita la comprensión de ellos." },
          { id: "cl-o-17", text: "Reconozco y comparto los valores promovidos por la organización en mi trabajo diario." },
          { id: "cl-o-18", text: "Se me proporciona información clara sobre las prioridades de la organización." },
          { id: "cl-o-19", text: "Tengo claro cuál es mi rol dentro de la organización y cómo contribuye." },
          { id: "cl-o-20", text: "Tengo una comprensión clara de los cambios en las estrategias de la organización y cómo estos afectan mi rol." }
        ]
      },
      {
        id: "clima-salud",
        name: "Salud y seguridad en el trabajo",
        questions: [
          { id: "cl-s-1", text: "Conozco las medidas de seguridad que debo seguir en caso de emergencia." },
          { id: "cl-s-2", text: "Considero que mi lugar de trabajo es un entorno libre de riesgos físicos." },
          { id: "cl-s-3", text: "El ambiente de trabajo me proporciona una sensación de bienestar físico." },
          { id: "cl-s-4", text: "El ambiente de trabajo me proporciona una sensación de bienestar mental." },
          { id: "cl-s-5", text: "Estoy al tanto de los protocolos de salud y seguridad en mi lugar de trabajo." },
          { id: "cl-s-6", text: "La organización me proporciona acceso a servicios de salud mental." },
          { id: "cl-s-7", text: "La organización promueve un entorno de trabajo seguro tanto física como mentalmente." },
          { id: "cl-s-8", text: "La organización promueve un equilibrio saludable entre el trabajo y la salud mental." },
          { id: "cl-s-9", text: "La organización se asegura de que todos los empleados comprendan las normativas de seguridad." },
          { id: "cl-s-10", text: "Los empleados tienen acceso a asesoramiento psicológico cuando es necesario." },
          { id: "cl-s-11", text: "Los equipos de protección personal que debo usar están bien especificados." },
          { id: "cl-s-12", text: "Los procedimientos de seguridad en mi lugar de trabajo están bien definidos." },
          { id: "cl-s-13", text: "Los programas de bienestar físico que ofrece la organización son adecuados." },
          { id: "cl-s-14", text: "Me siento capacitado/a para actuar en situaciones de emergencia en el lugar de trabajo." },
          { id: "cl-s-15", text: "Mi salud mental está protegida en el entorno laboral porque tienen programas o recursos a los que puedo acceder." },
          { id: "cl-s-16", text: "Recibo formación periódica sobre los protocolos de salud y seguridad." },
          { id: "cl-s-17", text: "Se llevan a cabo inspecciones regulares para asegurar el cumplimiento de las normas de seguridad." },
          { id: "cl-s-18", text: "Siento que la organización se preocupa por mi seguridad física en todo momento." },
          { id: "cl-s-19", text: "Tengo acceso a recursos para cuidar mi salud física en el trabajo." },
          { id: "cl-s-20", text: "Tengo acceso a servicios médicos preventivos en mi lugar de trabajo (kit de emergencia, servicios de salud o enfermería en el lugar de trabajo)." }
        ]
      }
    ]
  },
  {
    id: "enps",
    name: "eNPS",
    sections: [
      {
        id: "enps-compromiso",
        name: "Compromiso organizacional",
        questions: [
          { id: "en-c-1", text: "El ambiente laboral me hace sentir parte de un equipo unido." },
          { id: "en-c-2", text: "Esta empresa fomenta el sentido de pertenencia entre sus colaboradores." },
          { id: "en-c-3", text: "Estoy dispuesto/a a contribuir al éxito de la organización." },
          { id: "en-c-4", text: "Estoy orgulloso/a del valor que aporto con mi trabajo." },
          { id: "en-c-5", text: "La misión y visión de esta empresa están alineadas con mis valores." },
          { id: "en-c-6", text: "Me siento comprometido/a con los objetivos de esta empresa." },
          { id: "en-c-7", text: "Me siento parte de una comunidad dentro de esta empresa." },
          { id: "en-c-8", text: "Mi trabajo contribuye a un propósito importante en esta empresa." },
          { id: "en-c-9", text: "Siento que mi labor tiene un impacto positivo en la organización o la sociedad." }
        ]
      },
      {
        id: "enps-confianza",
        name: "Confianza en la organización",
        questions: [
          { id: "en-co-1", text: "Confío en la estrategia a largo plazo de esta empresa." },
          { id: "en-co-2", text: "El entorno laboral es inclusivo y respeta las diferencias." },
          { id: "en-co-3", text: "Esta empresa comparte suficiente información sobre sus estrategias y decisiones." },
          { id: "en-co-4", text: "Esta empresa es innovadora y se adapta bien a los cambios del entorno." },
          { id: "en-co-5", text: "Esta empresa me ofrece seguridad en mi empleo a largo plazo." },
          { id: "en-co-6", text: "Esta empresa promueve activamente la diversidad en el lugar de trabajo." },
          { id: "en-co-7", text: "Este es un lugar de trabajo diverso y respetuoso." },
          { id: "en-co-8", text: "Estoy seguro/a de que esta empresa alcanzará sus objetivos futuros." },
          { id: "en-co-9", text: "La dirección estratégica de esta empresa es clara y eficaz." },
          { id: "en-co-10", text: "Las decisiones importantes de esta empresa se comunican de manera transparente." },
          { id: "en-co-11", text: "Las iniciativas de innovación son frecuentes y bien implementadas." },
          { id: "en-co-12", text: "Las políticas de inclusión de esta empresa son efectivas." },
          { id: "en-co-13", text: "Los procesos de toma de decisiones son claros y comprensibles." },
          { id: "en-co-14", text: "Me siento tranquilo/a respecto a la continuidad de mi trabajo en esta empresa." },
          { id: "en-co-15", text: "Mi puesto de trabajo es estable y seguro." }
        ]
      },
      {
        id: "enps-lealtad",
        name: "Lealtad del colaborador",
        questions: [
          { id: "en-l-1", text: "Confío en la capacidad de la empresa para gestionar los desafíos y mantener la estabilidad." },
          { id: "en-l-2", text: "Considero que esta empresa es el lugar adecuado para desarrollar mi carrera profesional a largo plazo." },
          { id: "en-l-3", text: "Estoy satisfecho/a con cómo esta empresa maneja los cambios y las situaciones difíciles." },
          { id: "en-l-4", text: "La empresa comunica y gestiona eficazmente los cambios, lo que me da confianza durante los periodos difíciles." },
          { id: "en-l-5", text: "Me veo trabajando en esta empresa durante muchos años más." },
          { id: "en-l-6", text: "Promovería esta empresa como un excelente lugar de trabajo dentro de mi red profesional." },
          { id: "en-l-7", text: "Recomendaría a esta empresa como un lugar ideal para trabajar." },
          { id: "en-l-8", text: "Sugeriría a amistades y familiares que consideren trabajar en esta empresa." },
          { id: "en-l-9", text: "Tengo la intención de seguir formando parte de esta empresa en el futuro a largo plazo." }
        ]
      },
      {
        id: "enps-satisfaccion",
        name: "Satisfacción laboral",
        questions: [
          { id: "en-s-1", text: "El ambiente de trabajo en esta empresa es agradable y positivo." },
          { id: "en-s-2", text: "El ambiente en mi equipo favorece el éxito colectivo." },
          { id: "en-s-3", text: "El clima laboral fomenta el bienestar de los colaboradores." },
          { id: "en-s-4", text: "Esta empresa cumple con mis expectativas laborales." },
          { id: "en-s-5", text: "Esta empresa es un buen lugar para trabajar." },
          { id: "en-s-6", text: "Esta empresa me proporciona las herramientas necesarias para realizar mi trabajo." },
          { id: "en-s-7", text: "Estoy bien informado/a sobre los cambios y decisiones de esta empresa." },
          { id: "en-s-8", text: "La alta dirección se comunica de manera clara y efectiva." },
          { id: "en-s-9", text: "La comunicación dentro de esta empresa es clara y oportuna." },
          { id: "en-s-10", text: "La distribución del trabajo es justa y equilibrada." },
          { id: "en-s-11", text: "La información importante se transmite de manera adecuada." },
          { id: "en-s-12", text: "La tecnología y los medios proporcionados por esta empresa son suficientes para mi buen desempeño." },
          { id: "en-s-13", text: "Los líderes de esta empresa inspiran confianza." },
          { id: "en-s-14", text: "Los líderes de esta empresa toman decisiones acertadas." },
          { id: "en-s-15", text: "Los recursos a mi disposición son adecuados para desempeñar mis tareas con éxito." },
          { id: "en-s-16", text: "Me siento cómodo/a trabajando en el entorno que esta empresa me proporciona." },
          { id: "en-s-17", text: "Me siento orgulloso/a de formar parte de esta empresa." },
          { id: "en-s-18", text: "Mi carga de trabajo es manejable y adecuada para mi puesto." },
          { id: "en-s-19", text: "Mi equipo de trabajo colabora de manera eficaz." },
          { id: "en-s-20", text: "Siento que puedo confiar en mis compañeros de trabajo." },
          { id: "en-s-21", text: "Tengo suficiente tiempo para cumplir con mis responsabilidades laborales." }
        ]
      },
      {
        id: "enps-valor",
        name: "Valor percibido del empleo",
        questions: [
          { id: "en-v-1", text: "Esta empresa facilita un buen balance entre trabajo y vida personal." },
          { id: "en-v-2", text: "Esta empresa fomenta mi desarrollo profesional." },
          { id: "en-v-3", text: "Estoy satisfecho/a con mi nivel de remuneración." },
          { id: "en-v-4", text: "La compensación que recibo es justa en comparación con mis responsabilidades." },
          { id: "en-v-5", text: "Los beneficios laborales están alineados con mis expectativas." },
          { id: "en-v-6", text: "Los beneficios que ofrece esta empresa son adecuados para mis necesidades." },
          { id: "en-v-7", text: "Los incentivos y prestaciones complementan bien mi salario." },
          { id: "en-v-8", text: "Me siento valorado/a por mi contribución en el trabajo." },
          { id: "en-v-9", text: "Mi salario refleja adecuadamente el trabajo que realizo." },
          { id: "en-v-10", text: "Mi trabajo es reconocido de manera justa en esta empresa." },
          { id: "en-v-11", text: "Mi trabajo me permite equilibrar adecuadamente mi vida personal y laboral." },
          { id: "en-v-12", text: "Puedo gestionar mis responsabilidades laborales sin afectar mi vida personal." },
          { id: "en-v-13", text: "Recibo el reconocimiento adecuado por mis logros." },
          { id: "en-v-14", text: "Siento que mi carrera puede avanzar en esta organización." },
          { id: "en-v-15", text: "Tengo oportunidades de crecimiento en esta empresa." }
        ]
      }
    ]
  },
  {
    id: "otros",
    name: "Otros",
    sections: [
      {
        id: "otros-sin-seccion",
        name: "Sin sección",
        questions: [
          { id: "ot-1", text: "El ambiente laboral me hace sentir parte de un equipo unido." },
          { id: "ot-2", text: "Esta empresa fomenta el sentido de pertenencia entre sus colaboradores." },
          { id: "ot-3", text: "Estoy dispuesto/a a contribuir al éxito de la organización." },
          { id: "ot-4", text: "Estoy orgulloso/a del valor que aporto con mi trabajo." },
          { id: "ot-5", text: "La misión y visión de esta empresa están alineadas con mis valores." },
          { id: "ot-6", text: "Me siento comprometido/a con los objetivos de esta empresa." },
          { id: "ot-7", text: "Me siento parte de una comunidad dentro de esta empresa." },
          { id: "ot-8", text: "Mi trabajo contribuye a un propósito importante en esta empresa." },
          { id: "ot-9", text: "Siento que mi labor tiene un impacto positivo en la organización o la sociedad." }
        ]
      }
    ]
  },
  {
    id: "ia",
    name: "Evaluación y adopción de IA",
    sections: [
      {
        id: "ia-sin-seccion",
        name: "Sin sección",
        questions: [
          { id: "ia-1", text: "El ambiente laboral me hace sentir parte de un equipo unido." },
          { id: "ia-2", text: "Esta empresa fomenta el sentido de pertenencia entre sus colaboradores." },
          { id: "ia-3", text: "Estoy dispuesto/a a contribuir al éxito de la organización." },
          { id: "ia-4", text: "Estoy orgulloso/a del valor que aporto con mi trabajo." },
          { id: "ia-5", text: "La misión y visión de esta empresa están alineadas con mis valores." },
          { id: "ia-6", text: "Me siento comprometido/a con los objetivos de esta empresa." },
          { id: "ia-7", text: "Me siento parte de una comunidad dentro de esta empresa." },
          { id: "ia-8", text: "Mi trabajo contribuye a un propósito importante en esta empresa." },
          { id: "ia-9", text: "Siento que mi labor tiene un impacto positivo en la organización o la sociedad." }
        ]
      }
    ]
  },
  {
    id: "traumaticos",
    name: "Acontecimientos traumáticos",
    sections: [
      {
        id: "tr-sin-seccion",
        name: "Sin sección",
        questions: [
          { id: "tr-1", text: "El ambiente laboral me hace sentir parte de un equipo unido." },
          { id: "tr-2", text: "Esta empresa fomenta el sentido de pertenencia entre sus colaboradores." },
          { id: "tr-3", text: "Estoy dispuesto/a a contribuir al éxito de la organización." },
          { id: "tr-4", text: "Estoy orgulloso/a del valor que aporto con mi trabajo." },
          { id: "tr-5", text: "La misión y visión de esta empresa están alineadas con mis valores." },
          { id: "tr-6", text: "Me siento comprometido/a con los objetivos de esta empresa." },
          { id: "tr-7", text: "Me siento parte de una comunidad dentro de esta empresa." },
          { id: "tr-8", text: "Mi trabajo contribuye a un propósito importante en esta empresa." },
          { id: "tr-9", text: "Siento que mi labor tiene un impacto positivo en la organización o la sociedad." }
        ]
      }
    ]
  },
  {
    id: "riesgo-menos-50",
    name: "Riesgo psicosocial (- 50 trabajadores)",
    sections: [
      {
        id: "rm50-sin-seccion",
        name: "Sin sección",
        questions: [
          { id: "rm50-1", text: "El ambiente laboral me hace sentir parte de un equipo unido." },
          { id: "rm50-2", text: "Esta empresa fomenta el sentido de pertenencia entre sus colaboradores." },
          { id: "rm50-3", text: "Estoy dispuesto/a a contribuir al éxito de la organización." },
          { id: "rm50-4", text: "Estoy orgulloso/a del valor que aporto con mi trabajo." },
          { id: "rm50-5", text: "La misión y visión de esta empresa están alineadas con mis valores." },
          { id: "rm50-6", text: "Me siento comprometido/a con los objetivos de esta empresa." },
          { id: "rm50-7", text: "Me siento parte de una comunidad dentro de esta empresa." },
          { id: "rm50-8", text: "Mi trabajo contribuye a un propósito importante en esta empresa." },
          { id: "rm50-9", text: "Siento que mi labor tiene un impacto positivo en la organización o la sociedad." }
        ]
      }
    ]
  },
  {
    id: "riesgo-mas-50",
    name: "Riesgo psicosocial (+ 50 trabajadores)",
    sections: [
      {
        id: "rp50-sin-seccion",
        name: "Sin sección",
        questions: [
          { id: "rp50-1", text: "El ambiente laboral me hace sentir parte de un equipo unido." },
          { id: "rp50-2", text: "Esta empresa fomenta el sentido de pertenencia entre sus colaboradores." },
          { id: "rp50-3", text: "Estoy dispuesto/a a contribuir al éxito de la organización." },
          { id: "rp50-4", text: "Estoy orgulloso/a del valor que aporto con mi trabajo." },
          { id: "rp50-5", text: "La misión y visión de esta empresa están alineadas con mis valores." },
          { id: "rp50-6", text: "Me siento comprometido/a con los objetivos de esta empresa." },
          { id: "rp50-7", text: "Me siento parte de una comunidad dentro de esta empresa." },
          { id: "rp50-8", text: "Mi trabajo contribuye a un propósito importante en esta empresa." },
          { id: "rp50-9", text: "Siento que mi labor tiene un impacto positivo en la organización o la sociedad." }
        ]
      }
    ]
  }
];