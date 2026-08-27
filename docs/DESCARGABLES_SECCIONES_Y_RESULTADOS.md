# Anatomía de una encuesta

**Referencia técnica: constructor de secciones · vista previa · resultados · descargables**

> **Audiencia:** desarrolladores que van a mantener, extender o depurar estas tres áreas.
> **Objetivo:** que cualquier persona pueda (a) entender la regla exacta que gobierna cada
> comportamiento, (b) reproducir un caso de uso paso a paso, y (c) reproducir un error
> conocido sin adivinar.
>
> **Estado del código analizado:** rama `main`, commit `ffb7611`.
> Todas las referencias son `archivo:línea` sobre ese estado.
>
> **Documento hermano:** para la versión de experiencia — qué ve la persona, casos de uso paso a
> paso y mensajes literales, sin código — consulta
> [Recorrido de una encuesta](GUIA_DE_USO_ENCUESTAS.md).

---

## Índice

1. [Cómo leer este documento](#1-cómo-leer-este-documento)
2. [Modelo de dominio compartido](#2-modelo-de-dominio-compartido)
3. [Paso "Secciones y preguntas" (constructor)](#3-paso-secciones-y-preguntas-constructor)
4. [Vista previa](#4-vista-previa)
5. [Resultados: cómo se representan secciones y subsecciones en cada tab](#5-resultados-cómo-se-representan-secciones-y-subsecciones-en-cada-tab)
6. [Descargables (centro de descargas)](#6-descargables-centro-de-descargas)
7. [Anonimato: la regla completa, extremo a extremo](#7-anonimato-la-regla-completa-extremo-a-extremo)
8. [Matriz de mensajes al usuario](#8-matriz-de-mensajes-al-usuario)
9. [Catálogo de errores confirmados y cómo reproducirlos](#9-catálogo-de-errores-confirmados-y-cómo-reproducirlos)
10. [Guía rápida de reproducción de escenarios](#10-guía-rápida-de-reproducción-de-escenarios)

---

## 1. Cómo leer este documento

### 1.1 Convenciones

| Marca | Significado |
|---|---|
| **[REGLA]** | Invariante del dominio. Si se rompe, hay bug. |
| **[CASO]** | Caso de uso reproducible paso a paso. |
| **[ERROR]** | Defecto confirmado en el código actual, con archivo:línea. |
| **[NOTA]** | Decisión de diseño deliberada; no es un bug aunque lo parezca. |
| **[RIESGO]** | Comportamiento correcto hoy pero frágil ante cambios. |

### 1.2 Mapa de archivos por área

```
CONSTRUCTOR (paso de secciones)
  src/screens/SurveyBuilder.tsx ................ orquestador: estado, validación, toasts
  src/components/survey-builder/
    surveyBuilderTypes.ts ...................... tipos de dominio + constantes (MAX_SECTION_DEPTH…)
    sectionTree.ts ............................. operaciones puras sobre el árbol (mover, borrar…)
    stepper.ts ................................. orden de pasos, bloqueo y completitud
    SectionsPanel.tsx .......................... panel izquierdo: stepper + árbol navegable
    SectionTreeItem.tsx ........................ una fila del árbol navegable
    SectionEditor.tsx .......................... tarjeta de sección raíz (nivel 1)
    SubsectionAccordion.tsx .................... fila-acordeón de subsección (nivel 2/3)
    SectionQuestions.tsx ....................... lista de preguntas de una sección
    QuestionCard.tsx / QuestionEditor.tsx ...... fila colapsada / formulario abierto
    MoveToPopover.tsx .......................... selector "Mover a…"
    InlineDeleteConfirm.tsx .................... banner inline de confirmación de borrado
    questionCatalog.ts ......................... catálogo de tipos + isQuestionComplete
    sectionFileImport.ts ....................... importación .md/.txt/.csv/.xlsx
    BuilderSideRail.tsx ........................ barra inferior de acciones

VISTA PREVIA
  src/components/survey-preview/
    previewModel.ts ............................ árbol → secuencia de páginas (puro)
    SurveyPreviewDrawer.tsx .................... drawer 80vw, navegación, progreso
    PreviewWelcomePage / PreviewQuestionsPage / PreviewClosingPage / PreviewContents
    PreviewScaleMatrix.tsx ..................... matriz de Likert consecutivas
    PreviewAnswerField.tsx ..................... render por tipo de pregunta

RESULTADOS
  src/screens/SurveyResults.tsx ................ 5 tabs + rail + centro de descargas
  src/components/survey-results/
    FavorabilityTab.tsx ........................ KPIs + sub-switch Secciones/Heatmap
    QuestionsTab.tsx ........................... "Detalle por secciones" (árbol)
    HeatmapTab.tsx ............................. grilla sección × grupo
    QuestionDetailTab.tsx ...................... tab Preguntas + 3 vistas
    QuestionBreakdownView / IndividualResponsesView / CommentsSentimentView
    NpsTab.tsx ................................. eNPS + 3 vistas
    NpsDepthView.tsx ........................... preguntas de profundidad
    useResultsFilters.ts ....................... estado compartido de filtros/niveles/resaltado
    resultLevels.ts / favorabilityScale.ts / sentimentScale.ts / summaryModel.ts

DESCARGABLES
  src/components/survey-results/downloads/
    DownloadReportsDrawer.tsx .................. panel de configuración (2 tabs)
    downloadTypes.ts ........................... catálogo de reportes, secciones PDF, hojas XLSX
    anonymityGuard.ts .......................... ★ la regla de anonimato del centro de descargas
    useDownloadCenter.ts ....................... cola, progreso simulado, entrega, compartir
    DownloadsWidget.tsx ........................ tarjeta flotante minimizada
    reportFiles.ts ............................. constructores SpreadsheetML (4 libros)
    pdfReport.ts ............................... documento HTML + impresión desde iframe
    pdf/{tokens,styles,primitives,blocks,breakdownBlocks}.ts

DATOS (mock determinista)
  src/mocks/surveyResults.ts ................... agregado de resultados, umbral, segmentos
  src/mocks/questionResponses.ts ............... respondientes, tallies, comentarios
  src/mocks/npsDepth.ts ........................ bandas y respuestas de profundidad
  src/mocks/surveyInsights.ts .................. análisis IA
  src/mocks/collaborators.ts ................... directorio de 6.760 personas
```

### 1.3 Propiedad crítica: todo es determinista

`src/mocks/surveyResults.ts:169` define `unitFromSeed(seed)` (FNV-1a + xorshift). **No hay
`Math.random()` ni `Date.now()` en la generación de datos.** Consecuencia para depuración:

> **[REGLA]** El mismo `draft` + el mismo `item` producen exactamente los mismos números en
> pantalla y en el archivo descargado, en cualquier navegador y en cualquier momento.
> Si un bug "solo pasa a veces", **no está en los datos**: está en el estado de React,
> en el orden de renders o en el navegador.

Las dos únicas fuentes de no-determinismo del sistema son:
- `crypto.randomUUID()` para ids nuevos (`buildEmptySection`, `buildQuestion`, `buildOption`).
- El progreso simulado de una descarga (`useDownloadCenter.ts:114`), que usa `Math.random()`
  a propósito para que la barra no parezca falsa. **No afecta al contenido del archivo.**

---

## 2. Modelo de dominio compartido

### 2.1 El borrador (`SurveyDraft`)

`src/components/survey-builder/surveyBuilderTypes.ts:291`

```ts
interface SurveyDraft {
  name: string;
  status: SurveyStatus;              // draft | scheduled | live | closed
  description: string;               // máx. MAX_DESCRIPTION_LENGTH = 450
  startDate: string;                 // ISO yyyy-mm-dd
  endDate: string;
  kind: SurveyKind | null;           // cultura | clima | enps | ia | otros
  visibility: SurveyVisibility;      // "public" | "anonymous"   ← gobierna TODO el anonimato
  anonymityThreshold: number;        // solo significativo si visibility === "anonymous"
  sections: readonly SurveySection[];
  participants: ParticipantsSelection;
  demographics: DemographicsConfig;
  welcomeEnabled / closingEnabled: boolean;
  welcomeDescription / closingDescription: string;  // HTML del editor enriquecido
}
```

**[REGLA]** `visibility` solo tiene dos valores y son opuestos (`surveyBuilderTypes.ts:95-102`):
o toda respuesta es atribuible, o ninguna lo es. No existe un nivel intermedio porque sería
una promesa que el producto no puede cumplir: o guarda el vínculo persona↔respuesta o no.

**[REGLA]** `ANONYMITY_THRESHOLD_MIN = 3` (`surveyBuilderTypes.ts:128`). Por debajo de 3 el
umbral deja de proteger: con dos respuestas cada participante deduce la del otro.
`DEFAULT_ANONYMITY_THRESHOLD = 5`.
La UI que lo edita está en `GeneralDataEditor.tsx:253-299` (stepper −/+ con `disabled` en el mínimo).

### 2.2 El árbol de secciones

```ts
interface SurveySection {
  id: string;                                 // "section-<uuid>"
  title: string;
  description: string;
  questions: readonly SurveyQuestion[];
  children: readonly SurveySection[];         // varios hermanos por nivel
}
```

Constantes que lo gobiernan (`surveyBuilderTypes.ts:326-346`):

| Constante | Valor | Efecto |
|---|---|---|
| `MAX_SECTION_DEPTH` | `3` | nivel 1 Sección → 2 Subsección → 3 Sub-subsección |
| `DEPTH_LABELS` | `{1:"Sección",2:"Subsección",3:"Sub-subsección"}` | etiquetas de UI |
| `MIN_QUESTION_DEPTH` | `1` | **profundidad mínima que admite preguntas** |
| `canHaveQuestions(d)` | `d >= 1` | siempre `true` — ver [ERROR-01](#error-01) |
| `MINUTES_PER_QUESTION` | `0.5` | estimación de duración |

> **[ERROR-01]** El encabezado del archivo y toda la documentación interna afirman que
> "nivel 1 es contenedor puro, niveles 2 y 3 llevan preguntas", pero `MIN_QUESTION_DEPTH = 1`
> hace que `canHaveQuestions(1) === true`. Detalle completo en [§9](#error-01).

### 2.3 La pregunta

```ts
interface SurveyQuestion {
  id: string;                       // "q-<uuid>"
  statement: string;                // enunciado (texto plano; ver ERROR-02)
  type: QuestionType;               // scale | open | single | multiple | dropdown
  required: boolean;
  scale: ScaleConfig;               // se conserva aunque el tipo cambie
  options: readonly QuestionOption[];
  isBankQuestion?: boolean;
}
```

`ScaleConfig` (`surveyBuilderTypes.ts:37`) guarda: `kind` (likert | nps | stars | emoji |
linear | likert-nom035), `ratingType` (solo Likert), `minLabel`/`maxLabel`, `allowDontKnow`
(solo Likert y NOM-035), `followUpEnabled` + `followUps` (solo nps/stars/emoji/linear).

Reglas de catálogo (`questionCatalog.ts:113-130`):

| Función | Verdadero para |
|---|---|
| `hasOptions(type)` | `single`, `multiple`, `dropdown` |
| `hasEndLabels(kind)` | `stars`, `emoji`, `linear` |
| `needsRatingType(kind)` | `likert` |
| `supportsFollowUps(kind)` | `nps`, `stars`, `emoji`, `linear` ← habilita **Profundidad** |
| `supportsDontKnow(kind)` | `likert`, `likert-nom035` |

**[REGLA]** `changeQuestionType` y `changeScaleType` (`questionCatalog.ts:162-190`) **nunca
borran** lo configurado: apagan lo que no aplica y siembran lo que falta (mínimo
`MIN_OPTIONS = 2` opciones). Ida y vuelta entre tipos no pierde datos.

### 2.4 El agregado de resultados (`SurveyResults`)

`src/mocks/surveyResults.ts:151`. Se construye con `buildSurveyResults({draft, item, history})`
(`:860`) **desde el mismo `draft`** que edita el constructor. Por eso vista previa, resultados y
archivos no pueden divergir.

Campos que importan para este documento:

| Campo | Origen | Nota |
|---|---|---|
| `threshold` | `surveyResults.ts:893` | `anonymous ? draft.anonymityThreshold : 1` |
| `sections` | `buildSectionResults(draft, completed)` | espeja el árbol del borrador con numeración |
| `segments` | `buildSegments(draft)` `:352` | **solo** campos demográficos con `options.length > 0` |
| `participation` | `:862` | `completed = round(invited * 0.869)` (`COMPLETION_RATE`) |
| `nps` | `buildNps` `:772` | `null` si ninguna pregunta es `scale`+`nps` |

**[REGLA]** En una encuesta pública `threshold === 1`, así que "por debajo del umbral" solo
ocurre cuando el grupo tiene **cero** respuestas. La palabra que se muestra cambia:
`Reservado` (anónima) vs `Sin datos`/`Sin respuestas` (pública) — ver
`pdf/breakdownBlocks.ts:109` y `HeatmapTab.tsx:623-690`.

### 2.5 Segmentos y filtros

```ts
interface SegmentDefinition { key; label; preloaded; perPerson; options[] }
interface SegmentFilter     { key; optionId }
```

**[REGLA] Semántica de un conjunto de filtros** (`surveyResults.ts:383-434`,
`summaryModel.ts:807`, `reportFiles.ts:1434`):

- Varias opciones **del mismo** demográfico → **unión** (`Área: Producto o Tecnología`).
- Demográficos **distintos** → **intersección** (`País: Colombia` **y** `Género: Mujer`).
- Seleccionar **todas** las opciones de un demográfico equivale a **no filtrar** por él
  (`combinedCoverage` interpola hasta 1 exacto, `:421-434`).
- Un valor que la medición no guarda (todos, en una encuesta anónima) **no filtra nada**:
  se conserva la fila en vez de inventarle grupo.

**[REGLA]** `perPerson: true` (el demográfico "Colaborador") se excluye de toda grilla:
`HeatmapTab.tsx:41-48`, `FavorabilityTab.tsx:44`, `NpsTab.tsx:577`,
`DownloadReportsDrawer.tsx:99`. Solo la tabla de Participación lo acepta, porque es la vista
que existe para responder "¿quién falta?".

---

## 3. Paso "Secciones y preguntas" (constructor)

### 3.1 El stepper: orden, bloqueo y completitud

`src/components/survey-builder/stepper.ts`

```
REQUIRED_STEPS = ["general", "participants", "demographics", "sections"]   // numerados, en orden
OPTIONAL_STEPS = ["pages"]                                                // siempre alcanzable
STEPPER_ORDER  = [...REQUIRED_STEPS, ...OPTIONAL_STEPS]
```

**[NOTA]** `participants` va **antes** que el contenido a propósito (`stepper.ts:28-33`):
decidir a quién se le pregunta cambia qué vale la pena preguntar.

#### Regla de completitud por paso (`isStepComplete`, `stepper.ts:83`)

| Paso | Condición exacta |
|---|---|
| `general` | `name.trim() !== ""` **y** `startDate !== ""` **y** `endDate !== ""` **y** `kind !== null` |
| `participants` | `participantCount(draft.participants) > 0` |
| `demographics` | fue visitado **y** (`!enabled` **o** `fields.length > 0`) |
| `sections` | `hasSectionWithQuestion` **y** `allSectionsHaveQuestions` **y** `allQuestionsComplete` |
| `pages` | siempre `true` |

Las tres banderas del paso `sections` se calculan en `SurveyBuilder.tsx`:

```ts
// :232  al menos una pregunta en todo el árbol
hasSectionWithQuestion = draft.sections.length > 0 && countQuestions(draft.sections) > 0

// :241  ninguna sección vacía; una sección "contenedora" es válida si TODA
//       su descendencia está llena
allSectionsHaveQuestions = draft.sections.every(isSectionFilled)
  isSectionFilled(s) = (s.questions.length > 0 || s.children.length > 0)
                       && s.children.every(isSectionFilled)

// :254  toda pregunta del árbol pasa isQuestionComplete
allQuestionsComplete = flattenSections(...).every(e => e.section.questions.every(isQuestionComplete))
```

`isQuestionComplete` (`questionCatalog.ts:244`):

```ts
statement.trim() !== ""                                  // enunciado obligatorio
&& (type !== "scale" || scale.kind !== null)             // escala elegida
&& (!needsRatingType(scale.kind) || ratingType !== null) // Likert: qué mide
&& (!hasOptions(type) || options.length >= 2)            // mínimo 2 opciones…
&& (!hasOptions(type) || options.every(o => o.label.trim() !== ""))  // …y ninguna vacía
```

#### Alcanzabilidad (`isStepReachable`, `stepper.ts:127`)

- Paso requerido índice *N*: exige que **0…N−1** estén completos.
- Paso opcional (`pages`): exige que **todos** los requeridos estén completos.

#### Estado visual (`getStepState`, `stepper.ts:142`)

`active` > `locked` (no alcanzable) > `complete` > `locked` (opcional no visitado) > `available`.
Se pinta en `SectionsPanel.tsx:63-143`; un paso dentro de `errorSteps` se pinta rojo y **gana
sobre cualquier otro estado** (`:72`).

> **[NOTA]** `errorSteps` es reactivo: se llena tras un "Finalizar" fallido
> (`SurveyBuilder.tsx:1008`) y una vez el paso se completa deja de pintarse rojo en el
> siguiente render aunque el `Set` todavía lo contenga.

---

### 3.2 Anatomía del árbol y numeración

`sectionTree.ts` es **puro e inmutable**: toda función devuelve arrays nuevos.

| Función | Qué devuelve | Usado por |
|---|---|---|
| `flattenSections(sections)` | todas las entradas en orden visual | validación, preview, resultados |
| `expandedEntries(sections, expandedIds)` | solo las filas visibles del árbol | `SectionsPanel` |
| `findSection` / `findQuestionOwner` | entrada o `null` | casi todo |
| `pathIds(sections, id)` | cadena raíz→id, **es** el set de filas abiertas | expansión |
| `childEntries(entry)` | hijos con numeración absoluta | `SectionEditor`, `SubsectionAccordion` |
| `countQuestions` / `countDescendants` | totales del subárbol | badges, borrado |

**Numeración** (`walkTree`, `sectionTree.ts:41`): `numbering = prefix ? "${prefix}.${i+1}" : "${i+1}"`.
Es **posicional y derivada**, nunca se persiste: al reordenar o mover, todos los números se
recalculan solos.

### 3.3 Crear

| Acción | Handler | Efecto |
|---|---|---|
| Sección raíz | `handleAddRootSection` `SurveyBuilder.tsx:409` | añade al final, título `Sección N`, abre solo su rama, entra en modo renombrar |
| Subsección hija | `handleAddSubsection` `:451` | `appendChild`, título `${depthLabel(d+1)} ${numbering}.${n+1}` |
| Subsección **hermana** | `handleAddSiblingSubsection` `:488` | `insertAfterSibling`, se inserta justo debajo |
| Subsección + pregunta | `handleAddSubsectionWithQuestion` `:524` | crea subsección **con** una pregunta y abre su formulario |
| Pregunta | `handleAddQuestionTo` `:637` | añade al final de la lista y abre el editor |
| Pregunta desde el rail | `handleAddQuestion` `:679` | si la sección activa es nivel 1 → delega en `handleAddSubsectionWithQuestion` |
| Banco de preguntas | `handleAddBankQuestions` `:694` | añade N preguntas con `statement: "<p>texto</p>"` ← ver [ERROR-02](#error-02) |
| Importar archivo | `handleImportSections` `:433` | **anexa** al árbol existente, selecciona la primera raíz importada |

**[REGLA]** Toda ruta de creación pasa antes por `isStepReachable("sections", stepInput)`
(`:412`, `:455`, `:495`, `:528`). El rail no puede saltarse el bloqueo del stepper.

**[REGLA]** Crear una subsección respeta `subsectionBlockedReason(entry)`
(`sectionTree.ts:365`): si `entry.depth >= 3` se muestra `toast.info("Alcanzaste el máximo
de 3 niveles")` y no se crea nada.

**[NOTA]** El rail ofrece, estando en nivel 2 o 3, un menú con dos opciones
(`BuilderSideRail.tsx:363-500`): crear una **hermana** del mismo nivel o —estando en nivel 3—
una subsección de **nivel 2**. Por eso el botón "Añadir subsección" nunca se oculta
(`SurveyBuilder.tsx:953 showAddSubsection = true`) aunque el nivel esté topado.

#### Importación de archivo (`sectionFileImport.ts`)

Formatos realmente parseados (`SECTION_IMPORT_ACCEPT = ".md,.markdown,.txt,.csv,.xlsx"`):

- **Markdown/texto** (`parseMarkdown` `:119`): `#`→nivel 1, `##`→2, `###`→3 (más profundo se
  clava en 3); párrafo pegado al encabezado = descripción; viñeta = pregunta; viñeta
  indentada bajo una pregunta = opción; sufijo `[escala]`, `[abierta]`, `[opción única]`,
  `[múltiple]`, `[desplegable]` marca el tipo (sin etiqueta → `scale`).
- **CSV/XLSX** (`parseTabular` `:193`): columnas `seccion`, `subseccion`, `subsubseccion`,
  `pregunta`, `tipo`, `opciones` (separadas por `|`).
- PDF y Word se rechazan por extensión antes de llegar al parser.

**[REGLA]** `importedToSections` (`:288`) reagrupa las preguntas que caen directamente bajo un
`#` en una subsección automática llamada **"Preguntas"** (`:293-306`), replicando lo que hace
la pantalla.

> **[ERROR-06]** `buildImportedSection` corta en `depth < MAX_SECTION_DEPTH` (`:308`): los hijos
> de un nodo de nivel 3 —y **todas sus preguntas**— se descartan en silencio. Ver [§9](#error-06).

### 3.4 Mover

Hay **dos mecanismos distintos** y no hacen lo mismo:

#### (a) Reordenar entre hermanos — arrastre

`useDragReorder` + `reorderSiblings` (`sectionTree.ts:191`).

**[REGLA]** Un `drop` entre secciones con **distinto padre** se **rechaza**, no reparenta:
```ts
if (!from || !to || from.parentId !== to.parentId) return [...sections];
```
Mueve el subárbol completo. Funciona igual en raíz que en cualquier nivel.

Las preguntas se reordenan igual pero **solo dentro de su propia sección**
(`SurveyBuilder.tsx:777-787`: si `owner.section.id !== target.section.id` retorna sin hacer nada).
Cada `SectionQuestions` monta su propio contexto de arrastre (`SectionQuestions.tsx:62`) para
que no se cruce entre subsecciones.

#### (b) "Mover a…" — popover con destinos válidos

`MoveToPopover.tsx`. Los destinos llegan **ya validados** desde:

**Para una subsección** — `moveDestinationsForSection` (`sectionTree.ts:279`):

```
Se excluye:
  · ella misma
  · su padre actual (moverla ahí no la mueve)
  · cualquier descendiente suyo (ciclo)
  · destinos de nivel 1 SI el subárbol lleva preguntas
Se exige:
  candidate.depth + maxSubtreeDepth(entry.section) <= MAX_SECTION_DEPTH
```

**[REGLA] La subsección movida ADOPTA la profundidad del destino.** `moveSectionTo`
(`:318`) hace `removeSection` + `insertAfterSection`, que la coloca como **hermana siguiente**
del destino. Una subsección de nivel 2 movida junto a un destino de nivel 3 **se vuelve nivel 3**,
y al revés. La numeración se recalcula sola.

**Para una pregunta** — `moveDestinationsForQuestion` (`sectionTree.ts:301`): cualquier sección
que `canHaveQuestions(depth)` excepto su dueña actual. `moveQuestionTo` la **anexa al final**
de la lista destino.

Efectos secundarios de mover (`SurveyBuilder.tsx:605` y `:796`):
- Se selecciona el **destino** para que el movimiento sea visible.
- Se cierra cualquier formulario de pregunta abierto.
- Toast: `"Subsección movida"` / `"Pregunta movida"`.

**[NOTA]** Si no hay destinos, el disparador del popover se renderiza `disabled` con tooltip
`"No hay otra sección o subsección donde moverla"` (`MoveToPopover.tsx:66`).

### 3.5 Eliminar

`handleDeleteRequest` (`SurveyBuilder.tsx:571`) bifurca:

1. **Sección vacía** (`questions.length === 0 && !isBranch`): se borra **sin confirmar**.
2. **Con preguntas o subsecciones**: se marca `pendingDeleteId` y aparece el banner inline.

El banner (`InlineDeleteConfirm`) sustituye el encabezado de la fila y su mensaje lo arma
`buildDeleteDescription` (`SurveyBuilder.tsx:1155`):

```
"Se eliminará junto con 3 subsecciones y 12 preguntas. Esta acción no se puede deshacer."
"Esta acción no se puede deshacer."   ← cuando no arrastra nada
```

**[REGLA]** Solo hay **un** borrado en vuelo a la vez (`pendingDeleteId` es global), igual que
solo hay un editor de pregunta abierto.

**[REGLA]** Mientras el banner está arriba, hacer clic en la cabecera **no** cambia la selección:
`onClick={() => !isPendingDelete && onSelect(...)}` (`SectionEditor.tsx:85`,
`SubsectionAccordion.tsx:93`).

**Selección posterior** — `nextSelectionAfterRemoval` (`sectionTree.ts:384`): la fila que ocupa
el lugar de la borrada, o la última que quede. Si no queda ninguna, cae a `selectFixed("welcome")`
→ ver [ERROR-03](#error-03).

**[REGLA]** La última sección raíz no se puede borrar: `canDelete={draft.sections.length > 1}`
(`SurveyBuilder.tsx:930`), con tooltip `"La encuesta debe tener al menos una sección"`.
Las subsecciones **no** tienen esa protección.

**[NOTA]** El borrado vive **solo en el panel principal**: la tarjeta de sección raíz
(`SectionEditor.tsx:147`) y la fila de subsección (`SubsectionAccordion.tsx:178`). El árbol
navegable de la izquierda recibe `onDelete` y `canDelete` pero **no los renderiza** —
ver [ERROR-11](#error-11).

### 3.6 Editar preguntas

- **Un solo editor abierto en toda la encuesta**: `editingQuestionId` es un `string | null`
  global (`SurveyBuilder.tsx:169`).
- La pregunta abierta **sale de la lista** y se dibuja como tarjeta propia con contorno azul
  (`SectionQuestions.tsx:108-123`); las filas anteriores y posteriores se renderizan como dos
  listas separadas conservando la numeración absoluta (`:95-96`).
- **No hay guardar/descartar**: cada cambio escribe directo en el borrador
  (`handleQuestionChange` `:664`). Abrir otra pregunta solo mueve el formulario.
- `showValidation` (`sectionsValidationTouched`) enciende el resaltado de campos faltantes;
  arranca apagado para no recibir al autor con errores en un formulario que nadie intentó enviar.
- `Escape` cierra el editor; si el banner de borrado está arriba, `Escape` cancela **ese**
  primero (`QuestionEditor.tsx:105-112`).
- Duplicar (`handleDuplicateQuestion` `:761`) inserta la copia inmediatamente después con ids
  nuevos y **mueve la edición a la copia**.

### 3.7 Validación: cuándo se dispara y qué dice

Tres banderas "touched" evitan errores prematuros (`SurveyBuilder.tsx:130-140`):
`generalValidationTouched`, `participantsValidationTouched`, `sectionsValidationTouched`.

#### Ruta A — "Continuar" (`handleContinue`, `:974`)

```
si el paso activo NO es "pages":
    si !isStepComplete(activeStep)  → announceStepBlocked() y NO avanza
    si no                           → handleSelectStep(nextStep)
si el paso activo ES "pages":       → handleFinalize()
```

**[NOTA]** La comprobación es `isStepComplete(activeStep)` y no "el siguiente es alcanzable",
porque `pages` es siempre alcanzable: sin esto, el paso de secciones podría entregar el autor a
la página de bienvenida con cero preguntas (`:976-979`).

#### Ruta B — clic directo en un paso del menú (`handleSelectStep`, `:376`)

Si `!isStepReachable(step)` → `announceStepBlocked()`.

#### `announceStepBlocked` (`:342`) — busca **el primer** requerido incompleto

| Paso bloqueante | Efecto adicional | Toast (texto exacto) |
|---|---|---|
| `general` | enciende resaltado inline | `Completa el nombre, el tipo y las fechas de la encuesta para continuar.` |
| `participants` | — | `Selecciona al menos un participante para continuar.` |
| `demographics` | — | `Si usas datos demográficos, activa o crea al menos un dato demográfico para continuar.` |
| `sections` (hay preguntas pero hay secciones vacías) | enciende resaltado | `Todas las secciones deben tener al menos una pregunta para continuar.` |
| `sections` (no hay ninguna pregunta) | enciende resaltado | `Añade al menos una sección con preguntas para continuar.` |
| ninguno (fallback) | — | `Completa los pasos anteriores para desbloquear este paso.` |

#### Ruta C — "Finalizar" (`handleFinalize`, `:997`)

```ts
const failing = STEPPER_ORDER.filter(step => !isStepComplete(step, stepInput));
```

- **Sin fallos**: limpia `errorSteps`, `toast.success("Encuesta guardada")`, `onExit(draft)`.
- **Con fallos**:
  1. marca **todos** los pasos fallidos en rojo en el rail (`setFinalizeErrorSteps`);
  2. enciende el resaltado inline de cada paso fallido;
  3. si el primer fallo es `sections` y existe al menos una pregunta, llama a
     `focusFirstIncompleteQuestion()` (`:322`) → **selecciona la sección, abre la pregunta
     incompleta y hace scroll hasta ella** (`scrollToAnchorTick` + `ANCHOR_ATTRIBUTE`);
  4. si no, navega al primer paso fallido;
  5. emite **un solo toast** compuesto:

```
1 fallo :  "<mensaje del primer fallo>."
N fallos:  "<mensaje del primer fallo> y N-1 pasos más por completar."
           (singular: "y 1 paso más por completar.")
```

Mensajes base (`:1025-1033`):

| Paso | Mensaje |
|---|---|
| `general` | `Completa el nombre, el tipo y las fechas de la encuesta` |
| `participants` | `Selecciona al menos un participante para finalizar` |
| `demographics` | `Activa al menos un dato demográfico o desactívala` |
| `sections` (pregunta incompleta) | `Completa los campos obligatorios de la pregunta señalada` |
| `sections` (sin preguntas) | `Añade al menos una sección con preguntas` |
| `pages` | `Escribe el contenido de las páginas de encuesta activas` ← **inalcanzable**, ver [ERROR-04](#error-04) |

### 3.8 La experiencia inmersiva

Siete decisiones que definen cómo se siente el paso. Cambiarlas rompe la experiencia aunque
no rompa ningún test.

1. **Una sola rama abierta.** `expandedCardIds` es un `Set` compartido por el panel
   navegable y el panel principal (`SurveyBuilder.tsx:158`). `handleToggleCardExpanded` (`:621`)
   lo reemplaza por `pathIds(id)` completo, o por `chain.slice(0,-1)` al cerrar. Consecuencia:
   **nunca hay dos filas del mismo nivel abiertas** y el panel no crece en una columna infinita.

2. **Abrir = seleccionar.** Tocar cualquier parte del encabezado de una fila la vuelve la
   activa (`:629`), no solo el título. Sin esto el panel derecho se movía y el árbol y el rail
   se quedaban atrás.

3. **Un solo editor de pregunta**, en toda la encuesta, y sale de la lista para volverse
   tarjeta con contorno azul (`SectionQuestions.tsx:108`).

4. **El ancla del scroll.** `ANCHOR_ATTRIBUTE` lo lleva la fila seleccionada **solo cuando no
   hay editor abierto** (`SectionEditor.tsx:81`, `SubsectionAccordion.tsx:88`); si lo hay, lo
   lleva el editor. `scrollToAnchorTick` (`SurveyBuilder.tsx:218-223`) hace
   `scrollIntoView({behavior:"smooth", block:"center"})` cuando la validación abre una pregunta
   que el autor no pidió.

5. **El panel izquierdo se colapsa solo a los 8 s** (`:116-121`), dejando un rail de marcadores.
   Se puede volver a abrir a mano.

6. **Autosave sobre el borrador completo** (`useAutosave(draft)` `:210`): cualquier edición
   —un título, un toggle— mueve el indicador que vive en la cabecera del shell.

7. **Profundidad legible sin leer etiquetas**: badge sólido en nivel 1
   (`SectionEditor.tsx:114`), chip con nivel + numeración en 2/3
   (`SubsectionAccordion.tsx:126`), riel vertical indentado (`depthTheme.ts`), divisor
   `SIBLING_DIVIDER` entre hermanos. El badge de preguntas de una fila **colapsada** cuenta
   todo el subárbol; **abierta**, solo las propias (`SubsectionAccordion.tsx:77`).

### 3.9 Casos de uso reproducibles

#### [CASO-B1] Crear una sección con dos subsecciones y mover una pregunta entre ellas

1. Completa Datos generales, Participantes y Demográficos (si no, el paso 4 está bloqueado).
2. Entra en **Secciones y preguntas**. Si la encuesta está vacía, el propio `handleSelectStep`
   crea la primera sección raíz (`:387-392`).
3. En la tarjeta vacía pulsa **"Crear subsección"** → nace `Subsección 1.1`, en modo renombrar.
4. Con la subsección activa, en el rail **"Añadir subsección"** → menú → *hermana nivel 2* →
   nace `Subsección 1.2` justo debajo.
5. En 1.1, **"Añadir la primera pregunta"** → se abre el editor. Escribe el enunciado.
6. Colapsa el editor. En la fila de la pregunta pulsa el icono **Mover** → aparecen 1.2 y
   cualquier otra sección con `canHaveQuestions`. Elige 1.2.
7. **Resultado esperado:** toast `"Pregunta movida"`, la selección salta a 1.2, la pregunta
   aparece **al final** de su lista, y 1.1 queda vacía → el paso deja de estar completo.

#### [CASO-B2] Convertir una subsección de nivel 2 en nivel 3

1. Ten `1.1` y `1.2` como subsecciones de nivel 2, y `1.2.1` como nivel 3.
2. En la fila de `1.1` pulsa **Mover** → en la lista aparece `1.2.1` (nivel 3) **solo si**
   `1.1` no tiene descendencia propia (`depth(3) + maxSubtreeDepth(1.1) <= 3`).
3. Elige `1.2.1`.
4. **Resultado esperado:** `1.1` pasa a ser hermana de `1.2.1`, es decir **nivel 3**, y se
   renumera como `1.2.2`. El árbol se reordena completo.

#### [CASO-B3] Bloqueo por sección vacía

1. Crea `Sección 1` → `1.1` con una pregunta completa.
2. Crea `Sección 2` y **no** le pongas nada.
3. Pulsa **Continuar**.
4. **Resultado esperado:** no avanza; toast
   `"Todas las secciones deben tener al menos una pregunta para continuar."`;
   `sectionsValidationTouched` queda encendido y las preguntas incompletas se marcan.
   (Esta rama es la que se corrigió en el commit `4b86232`.)

#### [CASO-B4] Finalizar con varios pasos incompletos

1. Deja `general` sin `kind`, `sections` con una pregunta sin enunciado.
2. Navega hasta `pages` (necesitarás completar lo suficiente para llegar) y pulsa **Finalizar**.
3. **Resultado esperado:** ambos pasos en rojo en el rail; el autor aterriza en `general`;
   un toast:
   `"Completa el nombre, el tipo y las fechas de la encuesta y 1 paso más por completar."`

#### [CASO-B5] Importar un Markdown

Archivo de prueba:

```markdown
# Liderazgo
Cómo se percibe a los líderes.

## Cercanía
- Mi líder me da retroalimentación útil [escala]
- ¿Qué cambiarías de tu líder? [abierta]

## Reconocimiento
- ¿Con qué frecuencia recibes reconocimiento? [opción única]
  - Nunca
  - A veces
  - Siempre
```

**Resultado esperado:** una sección `Liderazgo` con descripción, dos subsecciones de nivel 2,
tres preguntas (dos con tipo explícito, una con opciones), y el toast
`"Se importaron 1 sección y 3 preguntas."`

---

## 4. Vista previa

### 4.1 Puerta de entrada

`canPreview(draft) = countQuestions(draft.sections) > 0` (`previewModel.ts:98`).
Si no hay preguntas: `toast.info("Añade al menos una pregunta para ver la vista previa.")`
(`SurveyBuilder.tsx:736`) y el botón del rail muestra el tooltip
`"Añade al menos una pregunta para ver la vista previa"`.

### 4.2 De árbol a secuencia: qué se vuelve página

`buildPreviewPages(draft)` (`previewModel.ts:123`) produce, **en este orden**:

```
1. { kind:"welcome" }        si draft.welcomeEnabled
2. { kind:"demographics" }   si askedDemographics(draft).length > 0
3. una página por cada entrada de flattenSections(draft.sections)
     ── condición: entry.section.questions.length > 0 ──
4. { kind:"closing" }        si draft.closingEnabled
```

**[REGLA]** *Una sección se vuelve página si y solo si lleva preguntas propias.*
Las secciones de nivel 1 normalmente son contenedores → **no generan página**, sus subsecciones
sí. `flattenSections` camina en orden visual, así que una página de nivel 2 siempre precede a
las de nivel 3 que cuelgan de ella.

**[REGLA]** `askedDemographics` (`:91`) = campos con `visible === true` y solo si
`demographics.enabled`. Un demográfico oculto **no se pregunta**: solo sirve para filtrar
resultados.

**[NOTA]** El texto de la página de demográficos cambia con la privacidad (`:134-137`):
anónima → *"…Ninguna respuesta se muestra de forma individual."*

### 4.3 Cómo se representan secciones y subsecciones

Cada página de sección lleva:

```ts
{ kind:"section", id, title, description, numbering, depth,
  trail: PreviewCrumb[],       // ancestros raíz→padre
  questions }
```

- `sectionLabel(entry)` (`:86`): si el título está vacío usa `"${depthLabel(depth)} ${numbering}"`
  — nunca "Sección sin título" repetido veinte veces.
- `trailFor` (`:101`) construye la miga de pan. Se pinta en la barra de ubicación del header
  (`SurveyPreviewDrawer.tsx:347-381`): `2. Liderazgo › Subsección 2.1 · Cercanía`.
- `buildPreviewOutline` (`:167`) devuelve **todas** las secciones, contenedoras incluidas
  (`pageId: null` cuando no tienen página propia): el nivel 1 tiene que aparecer para decir a
  qué bloque pertenece la subsección que se está respondiendo.
- `groupOutline` (`:214`) agrupa el índice de la página de bienvenida por raíz: la tabla de
  contenidos responde "de qué está hecha la encuesta" a nivel de bloques.
- `ancestorSectionIds` (`:183`) marca la rama abierta en el panel de contenido.

### 4.4 Matrices de escala

`groupQuestionBlocks` (`previewModel.ts:267`) agrupa **preguntas consecutivas** que comparten
exactamente los mismos pasos de escala:

- `matrixSignature` (`:254`) solo devuelve pasos para `likert` y `likert-nom035`; añade
  `"No sabe / no responde"` si `allowDontKnow`.
- Se agrupan solo si `sameSteps(previous.steps, steps)`.
- **Una matriz de una sola pregunta se degrada a tarjeta suelta** (`:290-294`).

**[REGLA]** Cambiar el `ratingType` de una pregunta en medio de una tanda **parte la matriz en
dos**. Es el comportamiento correcto y una fuente frecuente de "¿por qué se ve distinto?".

### 4.5 Navegación, progreso y reinicio

`SurveyPreviewDrawer.tsx`:

- Drawer lateral de `80vw` (`:135`), sin panel lateral permanente: el índice vive en un popover
  del header (`:294-325`).
- **Cada apertura es una corrida nueva** (`:68-74`): `activeIndex`, `answers`, `followUps` y el
  popover se reinician. Las respuestas escritas **se tiran** al cerrar; es un ensayo.
- `safeIndex = min(activeIndex, pages.length-1)` (`:77`): editar el borrador puede eliminar la
  página que se estaba viendo.
- Progreso: `answeredCount` (`:49`) cuenta 1 por pregunta con valor no vacío;
  `progressByPage` por página y `totals`/`percent` global.
- `PageDots` (`:385`) dibuja puntos si hay ≤14 páginas; con más, cae a `"Página N de M"`.
- El botón principal dice `"Siguiente"`, `"Enviar y finalizar"` (cuando la siguiente es la de
  cierre) o `"Cerrar vista previa"` (última).
- `pageQuestionIds` (`:341`) es lo que hace que los demográficos cuenten en el progreso igual
  que las preguntas.

**[NOTA]** `toPreviewQuestion(field)` (`:321`) convierte un demográfico en `SurveyQuestion`: la
vista previa tiene **un solo** renderizador de preguntas, no dos que se separen con el tiempo.

### 4.6 Casos de uso

#### [CASO-P1] Una sección de nivel 1 con preguntas genera página propia

1. En el constructor, mueve una pregunta a una sección de nivel 1 (posible hoy, ver [ERROR-01](#error-01)).
2. Abre la vista previa.
3. **Resultado observado:** aparece una página cuya ubicación dice `Sección 1 · <título>`, sin
   miga de pan (su `trail` está vacío). Esto contradice la documentación del modelo pero es lo
   que hace el código.

#### [CASO-P2] La matriz se parte

1. Crea tres preguntas Likert seguidas con `ratingType = "agreement"`.
2. Cambia la segunda a `"frequency"`.
3. **Resultado esperado:** tres bloques — tarjeta, tarjeta, tarjeta — porque cada tanda queda
   de una sola pregunta y se degrada. Vuelve a poner `"agreement"` y reaparece una única matriz.

#### [CASO-P3] Editar mientras la vista previa está abierta

La vista previa lee `draft` en vivo. Cierra, borra la última sección con preguntas, reabre:
`safeIndex` recorta y la vista aterriza en la última página existente en vez de romperse.

---

## 5. Resultados: cómo se representan secciones y subsecciones en cada tab

### 5.1 Arquitectura de la pantalla

`src/screens/SurveyResults.tsx`

```
Tabs: Participación · Favorabilidad · Preguntas · eNPS · Análisis con IA
```

- El **demográfico elegido es estado de pantalla**, no de tab (`:56-61`): pasar de
  "participación por área" a "heatmap por área" es un solo pensamiento.
- `results = buildSurveyResults({draft, item, history})` se calcula una vez y se comparte.
- El centro de descargas (`useDownloadCenter`) vive **aquí**, no en el drawer: cerrar el panel
  no puede matar un reporte a medio preparar (`:85`).
- La selección de filas de Participación se limpia al cambiar de tab (`:107`).

### 5.2 Estado compartido de filtros — `useResultsFilters`

Cuatro ejes, todos compartidos entre las vistas que comparten pantalla:

| Eje | Qué hace | Estado |
|---|---|---|
| **Ver por** | qué demográfico son las columnas/filas | `activeSegment` (de la pantalla) |
| **Filtros** ("Filtrar a fondo") | **re-calcula** la población de cada número | `filters: SegmentFilter[]` |
| **Niveles** | oculta los **números** de un nivel, conservando la fila | `visibleLevels` |
| **Resaltar** | atenúa lo que cae fuera de las bandas marcadas | `highlightBands` / `tierBands` |

**[REGLA]** Cambiar el demográfico de desglose **elimina el filtro sobre ese mismo demográfico**
(`useResultsFilters.ts:95-101`): una vez es las columnas, filtrar por él no dice nada.

**[REGLA]** Dos escalas de resaltado conviven a propósito (`:26-35`):
- `highlightBands` → las **cinco** bandas 1–5 (heatmap, eNPS con sus propias bandas).
- `tierBands` → los **cuatro** buckets Favorables/Neutrales/Desfavorables/NS-NR
  ("Detalle por secciones", Preguntas).

**[REGLA]** `filters` narrow real: `sectionResultsForFilters` (`surveyResults.ts:726`) devuelve
**identidad** si no hay filtros (para que la vista sin filtro no sea un gemelo con ruido de
redondeo) y, con filtros, re-agrega el árbol completo desde `narrowQuestion` (`:702`).

---

### 5.3 Tab **Favorabilidad**

`FavorabilityTab.tsx`. Cinco KPIs arriba (Total de favorabilidad, Favorables, Neutrales,
Desfavorables, NS/NR) y un sub-switch de dos vistas.

#### 5.3.1 Vista **Secciones** (`QuestionsTab.tsx`) — "Detalle por secciones"

**Cómo se representa el árbol** (`QuestionsTab.tsx:96-101` y siguientes): reusa el *chrome* del
propio constructor —`SECTION_HEADER_DIVIDER`, `SIBLING_DIVIDER`, `depthTheme`
(`@/components/survey-builder/depthTheme`)— de modo que el informe se lee con **la misma
jerarquía que el autor escribió**:

- Una **sección raíz** es una tarjeta con encabezado generoso; se abre una a la vez
  (`openSection`, `:110`).
- Cada **subsección** es una fila con chip de nivel y riel colgando del chevron.
- Cada **pregunta** es una hoja.

Por fila se muestra: distribución apilada, % desfavorable / neutral / favorable, puntaje 1–5 y
chip de favorabilidad. Una pregunta **sin escala** (abierta, opción única, NPS) no toma prestada
una barra que no significa nada: dice qué es y cuántas personas respondieron.

Totales del árbol: `sectionTotals.ts`
- `sectionHasContent` — tiene preguntas propias o algún descendiente que las tenga.
- `countSectionQuestions` — preguntas propias + de todo el subárbol.
- `countSectionAnswers` — **`n + nsnr` de todo formato**, porque `SectionResult.n` solo cuenta
  respuestas de escala y una rama con solo un NPS reportaría 0 (`:18-25`).
- `pooledDistribution` — junta las cinco cajas de todo el subárbol.

Orden: el del autor por defecto; se puede voltear a *peor primero* (`ResultsSortHeader`).

#### 5.3.2 Vista **Heatmap** (`HeatmapTab.tsx`)

**Cómo se representa el árbol** — `heatmapBySegment` (`surveyResults.ts:585`) construye
`HeatmapRow` con `kind: "section" | "question"` y `children`, así que **la grilla camina el
mismo árbol** que la encuesta: cada sección se despliega en sus preguntas y luego en sus
subsecciones. Una pregunta es una fila hoja que se comporta igual que las de sección.

Arranque: colapsado a las raíces, **excepto la primera**, que se abre completa con sus preguntas
como ejemplo de lo que la grilla puede mostrar.

Estados posibles de una celda (`HeatmapTab.tsx:603-725`):

| Estado | Condición | Se ve |
|---|---|---|
| Valor | normal | número con fondo de su banda 1–5 |
| Atenuado | banda desmarcada en *Resaltar* | número gris |
| `Sin escala` | `cell.unscored` | icono de mensaje + badge "Sin escala" |
| `—` "Sin respuestas" | `cell.masked && cell.n === 0` | guion gris |
| 🔒 `Reservado` | `cell.masked && cell.n > 0` | candado; tooltip *"Por debajo del mínimo para mostrar resultados de este grupo."* |
| Nivel oculto | nivel desmarcado en *Niveles* | caja vacía; tooltip *"Resultados ocultos: marca este nivel en el filtro de Niveles."* |

**[REGLA]** *Niveles* **nunca borra la fila**: la deja como estructura con total y celdas en
blanco, para que la jerarquía siga siendo legible.

**[REGLA]** La primera columna queda fija mientras el resto se desplaza; sin eso, leer el décimo
grupo significa leer números cuya fila ya no se ve.

**[NOTA]** El heatmap **rechaza** demográficos `perPerson` por la bandera del propio dato
(`HeatmapTab.tsx:41-48`), no por una lista de claves: un futuro demográfico personal queda
excluido por la misma regla sin tocar nada.

---

### 5.4 Tab **Preguntas** (`QuestionDetailTab.tsx`)

Cinco KPIs (Preguntas, Respuestas registradas, Personas con respuesta, Comentarios abiertos,
Sentimiento promedio) y **tres vistas** (`QuestionViewSwitch.tsx`):

| Vista | id | Título del panel |
|---|---|---|
| **Secciones** | `breakdown` | recuento por opción, leído sobre el árbol del autor |
| **Por persona** | `people` | una hoja por respondiente |
| **Comentarios** | `comments` | respuestas abiertas con sentimiento y tema |

#### 5.4.1 Secciones (`QuestionBreakdownView`)

Recorre `sectionResultsForFilters` y usa `buildQuestionBreakdowns(draft, {...results, sections})`
(`questionResponses.ts`) para obtener, por pregunta:

```ts
{ questionId, statement, type, scaleKind, formatLabel, n, nsnr,
  score, favorability, tallies: OptionTally[], multiSelect, commentCount }
```

Las secciones, subsecciones y sub-subsecciones **anidan exactamente como las escribió el autor**,
con el mismo *chrome* de contorno que usa Favorabilidad (`QuestionDetailTab.tsx:71-76`).

**Enlaces entre vistas** (lo que hace que las tres sean una sola pantalla):
- Clic en una fila de recuento → `drillToPeople(questionId, tallyId)` → salta a **Por persona**
  con el roster acotado a esas personas (`:181-184`).
- Clic en una pregunta abierta → `openComments(questionId)` → salta a **Comentarios** filtrado
  a esa pregunta (`:190-193`).

#### 5.4.2 Por persona (`IndividualResponsesView` + `RespondentSheet`)

`buildRespondents(draft, results)` (`questionResponses.ts:311`) produce el roster, acotado por
el directorio: `min(participation.completed, COLLABORATORS.length)` con
`COLLABORATOR_COUNT = 6760`.

**[REGLA] En una encuesta anónima el respondiente no lleva demográficos** (`:327-334`):

```ts
name    = `Participante ${index+1}`     // seudónimo estable
initials= `P${index+1}`
email = area = leader = country = gender = age = null
```

El motivo está escrito en `:261-266`: *"Marketing, Colombia, 18–24, mujer"* reduce un roster de
450 a una persona igual de bien que un nombre. Por eso el demográfico se anula **en el origen**,
no se tacha al final en una vista.

`buildAnswerMatrix(respondents, breakdowns)` reparte a cada tally su porción exacta del roster,
**una sola vez**. Consecuencia: si una pregunta reporta "190 en 4", la lista tiene exactamente
190 personas en el 4 — pantalla y archivo no pueden separarse.

Filtros propios: `useRosterFilters` (botón "Filtrar" junto a "Personalizar").
Nota: en esta vista `filterableSegments` se pasa vacío (`:250`) — el roster no se acota por
"Filtrar a fondo".

#### 5.4.3 Comentarios (`CommentsSentimentView`)

`buildOpenComments(draft, results, respondents)` produce `OpenComment` con
`sectionNumbering`, `sectionTitle`, `questionStatement`, `text`, `aiSentiment`,
`aiConfidence`, `topic`, `area`, `country`, `submittedLabel`.

**[REGLA]** Solo se ofrecen como filtro los demográficos que un comentario realmente lleva:
`COMMENT_FILTER_KEYS = ["area", "country"]` (`summaryModel.ts:791`).

**[REGLA]** `commentMatchesFilters` (`:807`) traduce **id de opción → etiqueta** usando
`results.segments`, porque el filtro nombra por id (`…-dem-area-o6`) y el comentario lleva la
etiqueta (`"Tecnología"`). **Sin pasar `segments` toda comparación falla y la lista sale vacía.**
Un valor desconocido —todos, en anónima— **se conserva**.

**Corrección manual del sentimiento**: `overrides: Map<commentId, Sentiment>`
(`QuestionDetailTab.tsx:89`). Un `Map` mantiene distinguible "sin corrección" de "corregido de
vuelta a lo que dijo la IA". El KPI de promedio **lee** las correcciones (`:156-159`), que es la
única razón por la que corregir una vale el clic.

---

### 5.5 Tab **eNPS** (`NpsTab.tsx`)

Si `results.nps === null` (ninguna pregunta `scale`+`nps`): `EmptyState`
*"Esta encuesta no midio recomendabilidad"*.

Cuatro KPIs (Puntaje eNPS con su fórmula en tooltip, % Promotores, % Neutros, % Detractores) y
**tres vistas**:

#### 5.5.1 Secciones (`DimensionsView`)

`npsBySection(results, filters)` (`surveyResults.ts:1041`) devuelve `NpsSectionDetail[]` con
`children` — es decir, **el árbol completo de secciones y subsecciones**, cada una con su
`score`, `promoters`, `passives`, `detractors`, `n`, y sus `questions` como hojas.

**[NOTA]** El orden del bloque en el PDF y en la pantalla es el mismo y es deliberado
(`pdf/breakdownBlocks.ts:292-299`): el puntaje global no dice dónde actuar, y un corte por
demográfico **sin** el mapa por secciones deja al lector adivinando qué dimensión mueve el número.

#### 5.5.2 Por segmento (`SegmentView`)

`npsBySegmentData(results, segment, filters)` (`:1128`) construye una grilla
`dimensión × grupo`:

```ts
NpsSegmentRow { title, kind, total: NpsSegmentCell, cells: (NpsSegmentCell|null)[],
                questions?: NpsSegmentRow[], children?: NpsSegmentRow[] }
NpsSegmentCell { score, promoters, passives, detractors, n, belowThreshold }
```

**[REGLA]** `buildNpsCell` (`:1100`) marca `belowThreshold` cuando `n < threshold` y devuelve
ceros: la celda se pinta como **Reservado**, nunca como `0`.

**[REGLA]** `aggregateCells` (`:1113`) ignora las celdas bajo umbral al calcular el total.

**[NOTA]** En esta vista se ocultan las filas de nivel *pregunta* por defecto
(`hiddenLevelOptions={["question"]}` en `NpsTab.tsx:713`).

#### 5.5.3 Profundidad (`NpsDepthView` + `mocks/npsDepth.ts`)

**Una pregunta de profundidad no es una sección de la encuesta**: es una propiedad de una
pregunta de escala (`scale.followUpEnabled` + los tres textos de `followUps`). Por eso
`npsDepthBySection` (`npsDepth.ts:230`) **no inventa un árbol**: camina las secciones del autor,
**descarta las ramas que no tienen ninguna pregunta con profundidad** (`:288`) y cuelga las tres
bandas de cada pregunta que sí la tiene.

Corte de bandas (`:161-165`), leído de los *tallies* reales:

| Escala | Detractores | Neutros | Promotores |
|---|---|---|---|
| NPS 0–10 | 0–6 | 7–8 | 9–10 |
| Escala 1–5 | 1–2 | 3 | 4–5 |

**[REGLA]** NS/NR **nunca** cuenta como banda (`:181`): quien se salió de la escala nunca fue
enrutado a un seguimiento.

Por banda se calcula `people` (quienes la vieron), `answered`, `coverage = answered/people`
y `answers[]` — **una fila por persona que respondió, no una muestra** (`:191-196`): la fila
promete "78 respondieron" y una lista de seis la convertiría en mentira. La **pantalla** dibuja
las primeras ocho; el **archivo XLSX** lleva todas (ver §6.5).

En la cabecera del panel se muestra la cobertura junto al conteo (`NpsTab.tsx:681-690`):
`"1.204 respuestas de 1.980 personas · 60,8% de cobertura"`.

**[NOTA]** "Personalizar" (niveles + resaltado) se oculta en Profundidad
(`showCustomize={view !== "depth"}`, `:715`) porque esa vista no dibuja puntajes.

### 5.6 Casos de uso de resultados

#### [CASO-R1] Un grupo cae bajo el umbral solo al filtrar

1. Encuesta **anónima** con `anonymityThreshold = 5`.
2. Heatmap por **Área**: todas las columnas muestran números.
3. Abre *Filtrar a fondo* → `País: Chile`.
4. **Resultado esperado:** las áreas pequeñas pasan a 🔒 `Reservado`. La razón está en
   `participationBySegment` (`surveyResults.ts:459`): el filtro estrecha `invited` de cada grupo
   **antes** de aplicar la tasa, así que un grupo que estaba bien sin filtro cruza el umbral.

#### [CASO-R2] Una sección "sin escala"

1. Crea una subsección cuyas preguntas sean todas abiertas.
2. Ve a Favorabilidad → Heatmap.
3. **Resultado esperado:** la fila muestra el badge `Sin escala` y sus celdas el icono de mensaje.
   **No** aparece un número bajo inventado. Es la protección contra "el heatmap apunta al
   problema equivocado" (`surveyResults.ts:576-584`).

#### [CASO-R3] Comentarios filtrados en encuesta anónima

1. Encuesta anónima. Tab Preguntas → Comentarios.
2. Aplica `Área: Tecnología`.
3. **Resultado esperado:** la lista **no** se vacía y **no** se acota: los comentarios no llevan
   área en una encuesta anónima, y `commentMatchesFilters` conserva lo desconocido en vez de
   inventarle grupo. El contador sigue diciendo lo que contó.

---

## 6. Descargables (centro de descargas)

### 6.1 Arquitectura

```
SurveyResults.tsx
  └─ useDownloadCenter({draft, results})     ← estado, vive en la PANTALLA
       ├─ entries: DownloadEntry[]
       ├─ start(request) / deliver(id) / share(id)
       └─ isBusy
  ├─ <DownloadReportsDrawer …/>              ← configuración (tab "Reportes") + estado (tab "Descargas")
  └─ <DownloadsWidget …/>                    ← cara minimizada; visible si !drawerOpen && !dismissed
```

**[NOTA]** El estado vive fuera del drawer a propósito (`useDownloadCenter.ts:38-48`): cerrar el
panel no puede matar un reporte a medio preparar, y el widget flotante necesita la misma lista
que la pestaña "Descargas".

**[NOTA]** Dos pestañas a propósito (`DownloadReportsDrawer.tsx:76-85`): *Reportes* es
configuración (dar forma al siguiente archivo), *Descargas* es estado. Mezclarlas mete una barra
de progreso dentro de un formulario.

Ancho del drawer: `!w-[30vw] !max-w-[30vw] !min-w-[28rem]` (`:346`) — 30% de la ventana pero
nunca menos que el ancho `md`, porque bajo ~1500 px el 30vw es más estrecho y las tarjetas de
configuración empiezan a envolverse.

### 6.2 Los cinco reportes (`REPORT_TYPES`, `downloadTypes.ts:307`)

| `kind` | Título | Formato | `fileSlug` | `prepareMs` | Constructor |
|---|---|---|---|---|---|
| `pdf` | Reporte general (PDF) | PDF | `reporte-general` | 7000 | `openPdfReport` |
| `xlsx` | Resultados generales (XLSX) | XLSX | `resultados-generales` | 5500 | `buildResultsWorkbook` |
| `comments` | Comentarios (XLSX) | XLSX | `comentarios` | 3000 | `buildCommentsWorkbook` |
| `questions-csv` | Preguntas (XLSX) | XLSX | `preguntas` | 2500 | `buildQuestionsWorkbook` |
| `answers-csv` | Respuestas (XLSX) | XLSX | `respuestas` | 4000 | `buildAnswersWorkbook` |

**[NOTA]** Los `kind` `questions-csv` y `answers-csv` conservan el sufijo `-csv` por historia:
hoy ambos producen **XLSX** (SpreadsheetML). No renombrarlos sin migrar el `switch` de
`useDownloadCenter.ts:70-88`.

**[REGLA] La descripción del reporte se lee de la encuesta, no del catálogo**
(`reportDescriptionFor` `:365`, `reportDetailFor` `:375`): el anonimato es una propiedad de la
medición, así que la misma exportación "Respuestas" promete identidad en una encuesta pública y
un participante numerado en una anónima.

Solo la fila **seleccionada** muestra su descripción (`ReportTypeRow`, `:679-733`): cinco
descripciones permanentes eran ~200 px de texto que nadie leía.

### 6.3 `ReportRequest`: todo lo que viaja en un clic

`downloadTypes.ts:253`

```ts
interface ReportRequest {
  kind: ReportKind;
  // XLSX — tandas por demográfico
  participationSegments: string[];
  heatmapSegments:      string[];
  npsSegments:          string[];
  xlsxSheets:           XlsxSheetId[];      // en orden de XLSX_SHEETS
  // PDF
  pdfSections:          PdfSectionId[];     // en orden de PDF_SECTIONS
  pdfSegments:          Record<PdfSegmentSlot, string[]>;   // uno por bloque
  pdfQuestionSections:  string[];           // vacío = ninguna
  // Comentarios
  commentSentiments:    Sentiment[];
  commentTopics:        string[];           // vacío = TODOS
  // Población
  filters:              SegmentFilter[];    // todos comparten la misma `key`
}
```

**[REGLA]** `commentTopics` vacío significa **todos los temas**, no ninguno
(`:281-286`, `reportFiles.ts:1335-1338`): una medición puede recoger un tema nuevo que la
configuración nunca vio, y descartarlo en silencio sería peor que exportar una fila de más.
La conversión ocurre en `DownloadReportsDrawer.tsx:305-306`:
`topicFilterEnabled && selectedTopics.size < topicRows.length ? [...selectedTopics] : []`.

**[REGLA]** `pdfQuestionSections` vacío significa **ninguna** (`breakdownBlocks.ts:222-227`): el
panel avisa que sin secciones elegidas el bloque no se imprime, y un bloque que en ese caso
imprimiera las 46 preguntas desmentiría el aviso.

### 6.4 PDF — "Reporte general"

#### Secciones disponibles (`PDF_SECTIONS`, `downloadTypes.ts:58`)

| # | id | Selector | Si el selector queda vacío |
|---|---|---|---|
| 1 | `verification` | — | — |
| 2 | `participation` | demográficos (`Desglosar por`) | solo se imprime la cobertura general |
| 3 | `sections` | — | — |
| 4 | `heatmap` | demográficos (`Una grilla por cada`) | **el bloque no se imprime** |
| 5 | `questions` | **secciones de la encuesta** (`Secciones a incluir`) | **el bloque no se imprime** |
| 6 | `nps` | demográficos (`Desglosar además por`) | solo puntaje + desglose por secciones |
| 7 | `gaps` | demográficos (`Buscar brechas por`) | **el bloque no se imprime** |
| 8 | `ai` | — | — |

Requisitos: `heatmap` y `gaps` exigen `needsSegments`; `nps` exige `needsNps`. Si la medición no
los cumple, la fila sale deshabilitada con la razón impresa
(`"Esta medición no incluyó pregunta eNPS"` / `"Esta encuesta no recogió demográficos"`,
`DownloadReportsDrawer.tsx:458-464`).

**[REGLA] Numeración dinámica**: el número que se muestra en el panel **y** el que se imprime es
la posición **tras apagar secciones** (`DownloadReportsDrawer.tsx:428-432`, `pdfReport.ts:166-176`).
Un documento de siete secciones nunca salta del 3 al 5.

**[REGLA] Cada bloque configurable elige sus propios demográficos** (`ReportRequest.pdfSegments`,
`downloadTypes.ts:265-272`): participación se lee por la unidad que convoca (sede, contrato) y el
heatmap por la unidad donde se actúa. Forzarlos al mismo corte convierte uno de los dos en relleno.

**[REGLA] Precarga = solo Área.** `areaFirst` (`DownloadReportsDrawer.tsx:57`) elige el
demográfico cuya clave de catálogo es `area`, o el primero que haya. Precargar todos parece
generoso y no lo es: 4 bloques × 5 demográficos = 20 grillas que nadie pidió (`:139-147`).

#### Demográficos que el PDF **no** puede desplegar

`reportableSegments(segments)` (`downloadTypes.ts:141`) descarta:
- `segment.perPerson === true`
- `PERSON_NAMED_SEGMENT_KEYS` = `["leader"]` (`:127`)

Comparando por **el último tramo** de la clave: `catalogKeyOf("cultura-2026-dem-leader") === "leader"`
(`:138`), porque un demográfico del catálogo viaja con su clave tal cual (`"area"`) y uno que la
plataforma construye contra el directorio se identifica por el id del campo.

> **[REGLA]** El motivo (`:119-127`): *un PDF viaja por correo y no tiene control de acceso*.
> Desplegar resultados por líder en un archivo expone personas identificables en grupos
> pequeños. El corte existe —vive en la herramienta y en el XLSX, con su umbral— pero **no viaja
> en el ejecutivo**.

#### Contenido de cada bloque

- **1 Verificación** (`pdf/blocks.ts:35`): cuatro KPI — Favorabilidad, Participación, eNPS,
  Respuestas registradas. **Sin párrafo de conclusión** a propósito (`:27-34`): una frase
  generada compite con la tabla que dice lo mismo con la cifra al lado.
- **2 Participación** (`:92`): escala de lectura de la tasa (≥80 alta / 60–79 media / <60 baja),
  barra de mezcla Completaron/En curso/Sin abrir, y una tabla por demográfico elegido.
  **Sin fila de total** en los desgloses (`:118-122`): los invitados de los grupos reconstituyen
  el censo pero sus respuestas no suman exactamente la cifra global; dos números de respuestas
  a tres centímetros uno del otro no se pueden arbitrar.
- **3 Favorabilidad por secciones** (`:200`): **no es configurable**. Recorre el árbol completo
  —todas las subsecciones abiertas— con distribución apilada, %Desfav/Neutral/Favor, puntaje y
  chip. Es la lectura general contra la que se leen los cortes posteriores.
- **4 Heatmap** (`breakdownBlocks.ts:100`): una grilla por demográfico elegido, **solo filas de
  sección** (`:118-119` descarta `kind !== "section"`). Ver [ERROR-05](#error-05).
- **5 Detalle de preguntas** (`:220`): por cada sección elegida, sus preguntas **con escala y
  n > 0** (`:234`).
- **6 eNPS** (`:300`): medidor −100/+100, tres bandas, tabla por secciones y subsecciones, y una
  tabla por demográfico elegido. Las celdas bajo umbral imprimen
  `Reservado · menos de N respuestas` (`:394`).
- **7 Brechas** (`:452`): `analyseSegmentGaps` por demográfico → mayor polarización + tabla de
  grupos rezagados con su diferencia contra el promedio.
- **8 Análisis de IA** (`:529`): **cierra el documento a propósito** (`:521-527`) — leerla antes
  de las tablas la convierte en conclusión en vez de hipótesis; cada afirmación viaja con su
  evidencia para poder contradecirla con la página anterior.

#### Partición de grillas anchas

`pdf/tokens.ts:21`: `MAX_GRID_COLUMNS = 6`, `GRID_GROUP_LABELS = ["A".."F"]`.
Con más grupos de los que caben legibles, la grilla se **parte en tandas** ("Grupo A", "Grupo B")
en vez de encoger la tipografía. Los anchos son fijos (`breakdownBlocks.ts:76-90`) y la tanda
corta rellena con una columna vacía, para que dos mitades del mismo heatmap no se lean como dos
escalas distintas.

#### Cómo se produce el archivo

`openPdfReport` (`pdfReport.ts:207`):

1. Construye el HTML completo con `<style>` inline (`STYLES` de `pdf/styles.ts`).
2. Crea un **iframe oculto** (0×0, `aria-hidden`) y escribe el documento en él.
3. A los **350 ms** hace `win.focus(); win.print()`.
4. Limpia el iframe en `afterprint` (+500 ms) o, como respaldo, a los **120 s**.
5. Devuelve `false` solo si no hay `contentDocument`/`contentWindow`.

> **[NOTA]** Iframe en vez de `window.open` a propósito (`:200-206`): un bloqueador de popups se
> come una pestaña nueva en silencio, y un reporte que a veces no aparece se lee como un botón roto.
> "Guardar como PDF" en ese diálogo **es** la descarga.

Pie del documento (`:188-195`), condicionado por privacidad:
- anónima → `Los grupos con menos de N respuestas se reportan como "Reservado".`
- pública → `Encuesta nominal: los resultados pueden atribuirse.`

### 6.5 XLSX — "Resultados generales"

#### Hojas disponibles (`XLSX_SHEETS`, `downloadTypes.ts:191`)

| Orden | id | Contenido | Requiere |
|---|---|---|---|
| 1 | `summary` | La pestaña Resumen completa (6 bloques) | — |
| 2 | `demographics` | Demográficos con sus grupos y participación | segmentos |
| 3 | `sections` | Puntaje y favorabilidad por sección | — |
| 4 | `questions` | Una fila por pregunta con su distribución 1–5 | — |
| 5 | `question-detail` | Conteo y % de **cada opción**, todos los formatos | — |
| 6 | `nps` | Puntaje, mezcla y detalle por dimensión y pregunta | eNPS |
| 7 | `participation-by` | **Una hoja por demográfico elegido** | segmentos |
| 8 | `heatmap-by` | **Una hoja por demográfico elegido** | segmentos |
| 9 | `nps-by` | **Una hoja por demográfico elegido** | segmentos + eNPS |
| 10 | `depth` | Respuestas abiertas de cada banda | `hasNpsDepthQuestions(draft)` |
| 11 | `ai` | Resumen, hallazgos, riesgos y acciones | — |

**[REGLA]** Las tres hojas `*-by` no son una hoja sino una **tanda**: producen una hoja por cada
demográfico elegido. Por eso el panel muestra un **rango** ("7–9") y no un número
(`DownloadReportsDrawer.tsx:500-526`): `tabsBefore` suma, por cada hoja encendida anterior,
`1` o `segmentSlot.size`.

**[REGLA]** `xlsxHasContent` (`:319-323`): encender una tanda y dejar su selector vacío **no
cuenta** como contenido; un libro que solo tuviera eso saldría en blanco.

#### Formato del archivo

`reportFiles.ts:53-67`: **SpreadsheetML (Excel 2003 XML)**, ensamblado como string, sin
dependencias. Lo abren Excel, Numbers y Sheets.

Paleta de estilos (`STYLE_XML`, `:99`): `title`, `hint`, `head` (azul de marca `#0C5BEF`),
`label`, `cell`, `alt` (cebra), `wrap`, `b1`..`b5` (las cinco bandas de favorabilidad),
`bx` (gris = reservado/sin dato), `pos`/`neu`/`neg` (sentimiento y eNPS).
`bandStyle(score)` (`:234`) usa los mismos cortes que `FAVORABILITY_BANDS`:
`≤1.9 b1 · ≤2.9 b2 · ≤3.9 b3 · ≤4.9 b4 · resto b5`.

**Cabecera de toda hoja** — `sheetIntro` (`:258`):

```
<Título de la hoja>
<Nombre de la encuesta>  ·  Generado el dd/mm/aaaa  ·  Población: <label>  [· extra]
(fila en blanco)
```

`filterLabelFor` (`:245`) produce `"Toda la empresa"` o `"Área: Comercial, Finanzas"`.

#### Detalles por hoja que importan

- **Resumen** (`summarySheet` `:628`): imprime **los seis bloques de la pestaña** en el mismo
  orden y desde **las mismas funciones del modelo** (`resolveScope`, `scopedMetrics`,
  `findingsAtLevel`, `buildPriorities`, `buildStrengths`, `analyseSegmentGaps`,
  `sentimentRollup`) — no hay una segunda implementación que pueda discrepar con la pantalla.
  Con filtro puesto **re-totaliza la participación** desde los grupos supervivientes (`:656-677`),
  exactamente lo que hace el titular de la pestaña.
  La fila `Mínimo por grupo (anonimato)` **solo aparece en encuestas anónimas** (`:708-712`):
  imprimir un mínimo de 1 en una pública se lee como una regla que no existe.
- **Demográficos** (`:938`): por cada demográfico, una fila de encabezado (origen
  `Precargado`/`Preguntado en la encuesta`, tipo `Grupo`/`Una fila por persona`, nº de grupos) y
  una fila por grupo con `Reservado`/`Se reporta`. Existe porque quien recibe solo los desgloses
  no puede saber si "Área" tenía ocho grupos u ochenta.
- **Heatmap por …** (`:1239`): fila `Total por grupo` al pie; celdas bajo umbral escriben el
  **texto** `"Reservado"` con estilo `bx`.
- **eNPS por …** (`:1290`): usa `npsSegmentRows` (`:409`); una celda `null` o `belowThreshold`
  escribe `"Reservado"`.
- **Profundidad** (`npsDepthSheet` `:1019`): **una fila por respuesta escrita**, repitiendo la
  cobertura de la banda en cada fila (forma *tidy*, pivotable). La pantalla dibuja las primeras
  ocho de una banda; **esta hoja lleva todas** — es a lo que apunta el "y N más" de la pantalla.
- **Análisis IA** (`:541`): una fila por afirmación con tipo, lectura, detalle, evidencia y
  confiabilidad. Va **al final** porque la narrativa se lee después del dato en el que se apoya
  (`:1315`).

### 6.6 XLSX — "Comentarios"

`buildCommentsWorkbook` (`reportFiles.ts:1329`). Una hoja, filtrada por tres ejes:

```ts
wanted.has(comment.aiSentiment)
&& (topics.size === 0 || topics.has(comment.topic))
&& commentMatchesFilters(comment, request.filters, results.segments)
```

Columnas: Sección · Pregunta · Comentario · Sentimiento · Confianza IA · Tema · Área · País ·
Enviado. En encuesta anónima, Área y País escriben `"Anónimo"` (`:1383-1384`).

La cabecera resume la configuración (`scopeHint`, `:1357`):
`"Todos los sentimientos  ·  Temas: Liderazgo, Carga de trabajo"`.

Sin resultados: una sola fila `"Sin comentarios con esta configuración"`.

**Configuración en el panel** (`DownloadReportsDrawer.tsx:565-592`):
- *Sentimiento* — arranca **encendido con los tres marcados**, con el conteo real de esta
  medición en cada etiqueta: `"Positivo (312)"`.
- *Temas* — arranca encendido con todos marcados; los temas se ordenan **por volumen**, no
  alfabéticamente (`topicTotals`, `:1174`): la configuración es donde se decide qué vale la pena
  exportar, y el tema del que escribieron 200 personas no puede quedar bajo uno de 3 por su inicial.
- Dejar un eje encendido y **vacío** deshabilita la descarga con el aviso
  `"Selecciona al menos un sentimiento para poder descargar."` / `"…un tema…"`.

### 6.7 XLSX — "Preguntas"

`buildQuestionsWorkbook` (`reportFiles.ts:1687`): **hoja resumen + una hoja por pregunta**.

Cada hoja de pregunta (`questionResponsesSheet` `:1565`) lleva:
1. Intro con `P{n}. <enunciado>`, sección, formato, nº de respuestas, puntaje, favorabilidad y
   `identityHint`.
2. Tabla de distribución **contada sobre las filas de esa misma hoja** (`:1584-1591`) — nunca
   copiada del agregado: una pestaña cuyo total y lista discrepan es peor que una que solo
   afirma lo que imprime.
3. Una fila por respuesta: `Respuesta #`, `Participante`, columnas de demográficos, `Respuesta`.

**Nombres de pestaña** — `sheetNamer` (`:1542`): Excel corta en **31 caracteres**, rechaza
`[ ] : * ? / \` y no admite duplicados; el desempate añade ` (2)`, ` (3)`… recortando la base.

> **[RIESGO]** Una encuesta de 46 preguntas produce **47 pestañas**. El libro se ensambla como
> un único string en memoria; con rosters grandes puede pesar decenas de MB y tardar segundos en
> `saveBlob`. El progreso simulado (2.500 ms) **no mide** ese trabajo real.

### 6.8 XLSX — "Respuestas"

`buildAnswersWorkbook` (`reportFiles.ts:1740`): **una fila por participante, una columna por
pregunta**.

```
Respuesta # | Participante | [Correo]* | [demográficos]* | Estado | Enviado | <una col. por pregunta>
                             * solo en encuesta pública
```

`answerCell` (`:1528`): vacío si la saltó, `NS/NR` gris, o el valor pintado con la banda 1–5.

**[REGLA]** Lo que identifica la fila es **la configuración de privacidad de la encuesta**, no una
regla de la exportación (`:1729-1739`). Y en anónima **tampoco viajan los demográficos**, porque
"Marketing, Colombia, 18–24" identifica igual de bien que un nombre.

`identityHint` (`:1518`) escribe en la cabecera exactamente qué son las filas:

| Caso | Texto |
|---|---|
| Pública | `Encuesta pública: cada fila lleva la identidad y los demográficos de quien respondió` |
| Anónima, sin filtro | `Encuesta anónima: cada fila es un participante numerado, sin identidad ni demográficos` |
| Anónima, **con** filtro | `Encuesta anónima: participantes numerados, sin demográficos — por eso las filas no se acotan por población` |

### 6.9 Ciclo de vida de una descarga

`useDownloadCenter.ts`

```
start(request)
  ├─ id       = `dl-${Date.now()}-${random36}`
  ├─ fileName = `${fileSlug}-${slugify(draft.name)}-${YYYY-MM-DD}.${pdf|xls}`
  ├─ entry { status:"preparing", progress:0, delivered:false, deliver }
  ├─ se inserta AL PRINCIPIO de la lista (más reciente primero)
  └─ setInterval(220 ms):
        progress += meanStep * (0.4 + random*1.2)        // ticks desiguales a propósito
        si progress >= 100:
            clearInterval
            delivered = deliver()                        // ← el archivo se genera AQUÍ
            toast.success(`${format} descargado`)  ó  toast.error(…)
            entry → { progress:100, status:"ready", delivered }
```

**[REGLA] No hay segundo clic.** Pedir un reporte **es** pedir la descarga; la fila que queda es
un recibo, no una acción pendiente (`:38-48`).

**[REGLA]** El sorteo aleatorio y la entrega viven **en el cuerpo del intervalo, nunca dentro del
updater de `setState`** (`:105-109`): React ejecuta los updaters dos veces en StrictMode y un
segundo sorteo re-entregaría el archivo y desharía la finalización.

**Reintentar** — solo lo ofrece la ruta del PDF, porque solo `openPdfReport` puede devolver
`false`. `deliver(id)` (`:151`) re-entrega y, si falla otra vez, muestra
`"No se pudo abrir la vista de impresión — Revisa si el navegador está bloqueando las ventanas emergentes."`

**Compartir** — `share(id)` (`:168`) copia
`${location.href sin hash}#reporte=${encodeURIComponent(fileName)}`.
Sin backend que aloje el archivo, es el enlace a esta vista más el nombre del reporte.
`copyToClipboard` (`:200`) cae al truco de `<textarea>` + `execCommand("copy")` si la Clipboard
API está denegada.

**Limpieza**: al desmontar, todos los intervalos se limpian (`:53-59`). **Las entradas no se
persisten**: recargar la página vacía la lista.

#### Cómo se ve el estado

| Superficie | Preparando | Listo y entregado | Listo y **no** entregado |
|---|---|---|---|
| Fila del drawer | barra + % + spinner | `Descargado` (PDF: `Descargado — se abrió para imprimir o guardar`) + **Compartir** | `La descarga quedó bloqueada por el navegador` + **Reintentar** |
| Widget flotante | `Preparando N reportes…` / `Puedes seguir navegando` | `PDF descargado` / `Descarga completada` | `Descarga bloqueada` + **Reintentar** |

**[NOTA]** El widget reporta el **peor** estado del lote (`DownloadsWidget.tsx:16-23`): un archivo
todavía preparándose hace que la cabecera diga "Preparando", porque la pregunta del lector es
"¿ya me puedo ir?".

**[NOTA]** El check verde marca **esta** descarga, no el historial: las entradas llegan
más-reciente-primero, así que solo la primera terminada lo lleva
(`DownloadReportsDrawer.tsx:1195-1200`).

El widget muestra como máximo 4 filas y luego `"Ver las N descargas"` (`:149-157`).

### 6.10 La puerta de descarga: `canDownload`

`DownloadReportsDrawer.tsx:328-334`

```ts
canDownload =
  blocked === null                                   // ← anonimato / selección vacía
  && (kind !== "pdf"  || pdfHasContent)              // al menos una sección encendida
  && (kind !== "xlsx" || xlsxHasContent)             // al menos una hoja con contenido real
  && (kind !== "comments" ||
       ((!sentimentFilterEnabled || selectedSentiments.size > 0) &&
        (!topicFilterEnabled     || selectedTopics.size     > 0)));
```

Cuando es `false`, el botón del pie (`Descargar PDF` / `Descargar XLSX`) queda `disabled` y,
según el motivo, aparece uno de estos avisos inline:

- `Enciende al menos una sección para poder descargar.` (PDF, `:478`)
- `Enciende al menos una hoja para poder descargar.` (XLSX, `:558`)
- `Selecciona al menos un sentimiento para poder descargar.` / `…un tema…` (`:576`, `:588`)
- La tarjeta roja con candado del filtro de población (§7).

---

## 7. Anonimato: la regla completa, extremo a extremo

Esta es la parte que el negocio pregunta más y la que más fácil se rompe al refactorizar.

### 7.1 De dónde sale el umbral

```
draft.visibility === "anonymous"
   ↓
results.threshold = draft.anonymityThreshold        (mínimo 3, por defecto 5)

draft.visibility === "public"
   ↓
results.threshold = 1        →  solo se oculta lo que tiene CERO respuestas
```

`surveyResults.ts:890-893`.

### 7.2 Dónde se aplica dentro del producto

| Superficie | Función | Resultado bajo umbral |
|---|---|---|
| Participación (tabla) | `participationBySegment` `:497,552,570` | `belowThreshold: true` → conteos sí, resultados no |
| Heatmap | `heatmapBySegment` `:593` | celda `masked` → 🔒 `Reservado` |
| eNPS por segmento | `buildNpsCell` `:1102` | `belowThreshold` → `Reservado` |
| Brechas (Resumen/IA) | `analyseSegmentGaps` | grupo va a `masked[]` |
| XLSX heatmap / eNPS | `reportFiles.ts:1255,1414` | texto `"Reservado"` |
| PDF heatmap / eNPS | `breakdownBlocks.ts:63,394` | `Reservado` / `Sin datos` |
| **Centro de descargas** | `anonymityGuard.ts` | **bloquea la descarga entera** |

> **[REGLA]** El umbral ya gobernaba **cada** desglose que el producto muestra. El centro de
> descargas era la única puerta que lo ignoraba: alguien podía filtrar un reporte completo a un
> área de una persona y obtener **todos** los números que esa persona dio
> (`anonymityGuard.ts:9-24`). Por eso la regla se aplica **una vez, aquí**, y todos los reportes
> hacen la misma pregunta.

### 7.3 `populationScope` — qué selecciona el filtro y si se puede reportar

`anonymityGuard.ts:42`

```ts
interface PopulationScope {
  completed: number;   // respuestas que la población seleccionada realmente tiene
  threshold: number;   // mínimo por grupo
  anonymous: boolean;  // la encuesta prometió anonimato
  reserved: boolean;   // anonymous && completed < threshold  → nada se puede reportar
  empty: boolean;      // completed === 0                     → no hay archivo que construir
  label: string;       // "Área: Comercial, Finanzas" | "Toda la empresa"
}
```

Tres ramas:

```
A) filters.length === 0
     completed = results.participation.completed
     reserved  = false
     empty     = completed === 0
     label     = "Toda la empresa"

B) el segmento del filtro NO existe en results.segments
     → se cae a "Toda la empresa", reserved=false, empty=false      ← ver RIESGO abajo

C) caso normal
     rows      = participationBySegment(results, segment, [])       ← ¡SIN filtros!
                   .filter(row => chosenIds.has(row.id))
     completed = suma de rows[].completed                           ← UNIÓN, no intersección
     reserved  = anonymous && completed < threshold
     empty     = completed === 0
     label     = `${segment.label}: ${rows.map(r => r.label).join(", ")}`
```

> **[REGLA] El conteo sale de `participationBySegment`, no del agregado filtrado**
> (`anonymityGuard.ts:19-23`). El agregado estrecha por una participación **modelada**, y el
> número que tiene que proteger a alguien debe ser **el que muestra la tabla de participación**.
> Nótese que la llamada pasa `[]` como filtros (`:76`): se mide el tamaño real del grupo, no el
> tamaño que quedaría tras aplicarse a sí mismo.

> **[REGLA]** Varias opciones del mismo demográfico son **unión**: "Marketing o Comercial" son
> las personas de ambos grupos, no su intersección (`:61-62`). El drawer solo filtra por **un**
> demográfico a la vez (un `Select` de clave + un multi-select de grupos), así que todos los
> `SegmentFilter` comparten `key`.

> **[RIESGO]** La rama B (segmento inexistente) **no bloquea**: cae a "toda la empresa" y permite
> descargar. Hoy es inalcanzable desde la UI porque el `Select` se llena de `results.segments`,
> pero un `filterKey` obsoleto (por ejemplo, si el borrador cambia de demográficos mientras el
> drawer está abierto) abriría esa rama.

### 7.4 `blockedReason` — el mensaje exacto

`anonymityGuard.ts:90`

```ts
if (scope.reserved)
  return scope.completed === 1
    ? `Esta selección tiene 1 respuesta y el mínimo por grupo es ${scope.threshold}. Sus resultados quedan reservados para proteger el anonimato de la encuesta.`
    : `Esta selección tiene ${scope.completed} respuestas y el mínimo por grupo es ${scope.threshold}. Sus resultados quedan reservados para proteger el anonimato de la encuesta.`;

if (scope.empty)
  return "Esta selección no tiene respuestas: no hay nada que reportar.";

return null;
```

Se pinta como tarjeta roja con candado dentro del bloque *Filtrar población*
(`DownloadReportsDrawer.tsx:1142-1147`), y `canDownload` pasa a `false`.

**[REGLA]** Cuando **no** hay bloqueo pero sí hay selección, se muestra igualmente el conteo
(`:1149-1153`):

```
"842 respuestas en la selección · mínimo por grupo: 5"     (anónima)
"842 respuestas en la selección"                            (pública)
```

El motivo (`:1137-1139`): *el conteo viaja con la selección, no solo con el rechazo* — quien ve
"842 respuestas" antes de descargar entiende la regla la única vez que sí lo detiene.

**[REGLA]** El conteo y el bloqueo **solo se muestran si hay al menos un grupo marcado**
(`selectedOptionIds.size > 0`, `:1140`).

### 7.5 `populationFilterApplies` — dónde el filtro ni siquiera se ofrece

`anonymityGuard.ts:108`

```ts
if (!anonymous) return true;                       // encuesta pública: aplica a los 5 reportes
return kind === "pdf" || kind === "xlsx";          // anónima: solo a los dos agregados
```

> **[REGLA]** Una encuesta anónima **no guarda un demográfico junto a un comentario ni junto a
> una respuesta individual** — esa es la promesa, no una omisión. Los tres reportes a nivel de
> registro (`comments`, `questions-csv`, `answers-csv`) no pueden acotarse por demográfico, así
> que **ocultan la tarjeta de filtro** en vez de prometer un corte que el archivo nunca hace
> (`:100-107`).

Y el filtro **no viaja en la petición** cuando no aplica (`DownloadReportsDrawer.tsx:264-271`):
`activeFilters` exige `filterApplies`. Así, un reporte que oculta la tarjeta nunca arrastra la
selección que el lector dejó puesta en el reporte anterior.

La tarjeta además solo se renderiza si la encuesta tiene demográficos:
`{hasSegments && filterApplies && <PopulationFilterCard …/>}` (`:603`).

### 7.6 Matriz completa de comportamiento

| Encuesta | Reporte | ¿Tarjeta "Filtrar población"? | ¿Puede bloquear? | Qué hace el filtro en el archivo |
|---|---|---|---|---|
| Pública | PDF | Sí | Solo si la selección tiene 0 respuestas | acota el árbol, la participación y todas las grillas |
| Pública | XLSX | Sí | Solo si 0 respuestas | ídem, en todas las hojas |
| Pública | Comentarios | Sí | Solo si 0 respuestas | `commentMatchesFilters` acota de verdad |
| Pública | Preguntas | Sí | Solo si 0 respuestas | `respondentMatchesFilters` acota el roster |
| Pública | Respuestas | Sí | Solo si 0 respuestas | ídem |
| **Anónima** | PDF | Sí | **Sí**, si `completed < threshold` | acota el agregado |
| **Anónima** | XLSX | Sí | **Sí** | acota el agregado |
| **Anónima** | Comentarios | **No** | No | — |
| **Anónima** | Preguntas | **No** | No | — |
| **Anónima** | Respuestas | **No** | No | — |
| Cualquiera, sin demográficos | todos | **No** | No | — |

### 7.7 Casos de uso del bloqueo

#### [CASO-D1] Bloqueo por grupo demasiado pequeño ★

**Preparación:** encuesta **anónima**, `anonymityThreshold = 5`, con un demográfico *Área* que
tenga muchos grupos (el generador reparte con cola larga a propósito, `surveyResults.ts:333-341`,
para que existan grupos de 4 personas).

1. Resultados → rail → **Descargar** → drawer.
2. Tipo de reporte: **Reporte general (PDF)**.
3. Baja a **Filtrar población** → enciende el interruptor.
4. Demográfico: `Área`. Grupos: marca **solo el más pequeño**.
5. **Resultado esperado:**
   - Tarjeta roja con candado:
     `Esta selección tiene 4 respuestas y el mínimo por grupo es 5. Sus resultados quedan reservados para proteger el anonimato de la encuesta.`
   - El botón `Descargar PDF` queda **deshabilitado**.
6. Marca **un segundo grupo**. La unión supera el umbral → el bloqueo desaparece y en su lugar
   aparece `"N respuestas en la selección · mínimo por grupo: 5"`. El botón se habilita.

#### [CASO-D2] Grupo de una sola persona (singular)

Mismo procedimiento con un grupo de **1** respuesta:
`Esta selección tiene 1 respuesta y el mínimo por grupo es 5. …`
(fíjate en el singular: `blockedReason` lo trata aparte, `anonymityGuard.ts:92`).

#### [CASO-D3] La misma selección en una encuesta pública **no** bloquea

Cambia `visibility` a `public` (Datos generales) y repite [CASO-D1].
**Resultado esperado:** `threshold = 1`, `reserved = false`. No hay tarjeta roja; aparece
`"4 respuestas en la selección"` **sin** el sufijo del mínimo (`:1152`), y la descarga procede.

#### [CASO-D4] Selección sin ninguna respuesta

Filtra a un grupo con `completed === 0`.
**Resultado esperado:** `Esta selección no tiene respuestas: no hay nada que reportar.`
Ocurre en encuesta anónima **y** pública.

#### [CASO-D5] El filtro desaparece al cambiar de reporte (anónima)

1. Encuesta anónima. Reporte **PDF**. Enciende el filtro y elige un grupo válido.
2. Cambia el tipo de reporte a **Respuestas (XLSX)**.
3. **Resultado esperado:** la tarjeta *Filtrar población* **desaparece** por completo y el aviso
   informativo dice
   `"…Sin identidad ni demográficos: la encuesta es anónima."`
   La petición sale con `filters: []` aunque `filterEnabled` siga en `true` internamente.
4. Vuelve a **PDF**: la tarjeta reaparece **con la selección intacta**.

#### [CASO-D6] Interruptor encendido, cero grupos marcados

1. Enciende *Filtrar población* pero **no marques ningún grupo**.
2. **Resultado observado:** `activeFilters = []` → `scope` = toda la empresa → **no hay bloqueo
   ni conteo visible**, y la descarga sale **sin filtrar**.
3. Es coherente con "vacío = todos", pero **no hay ningún texto que lo diga**. Ver
   [ERROR-07](#error-07).

#### [CASO-D7] "Líder" nunca aparece en el PDF

1. Encuesta con un demográfico cuyo `catalogKey` termine en `leader`.
2. Reporte **PDF** → los selectores de Participación / Heatmap / eNPS / Brechas **no lo listan**
   (`reportableSegments`).
3. Cambia a **XLSX** → **sí** aparece, porque el libro sí puede desplegarlo (con su umbral).
4. La tarjeta *Filtrar población* **sí** lo lista en ambos, porque ahí no despliega nada: acota.

### 7.8 Advertencia de implementación

> **[RIESGO — importante para el backend]** `anonymityGuard` se evalúa **únicamente en la UI del
> drawer**. `useDownloadCenter.start(request)` **no vuelve a comprobarlo**
> (`useDownloadCenter.ts:61-89`), y los constructores de archivo tampoco. Cualquier consumidor
> que llame a `start()` directamente —o una futura API— produciría el archivo sin la protección.
> Cuando esto deje de ser un prototipo, **la misma regla tiene que vivir en el servidor**, y esta
> capa debe quedarse solo como el aviso temprano que ya es.

---

## 8. Matriz de mensajes al usuario

### 8.1 Constructor — toasts

| Trigger | Tipo | Texto |
|---|---|---|
| Paso bloqueado: general | error | `Completa el nombre, el tipo y las fechas de la encuesta para continuar.` |
| Paso bloqueado: participantes | error | `Selecciona al menos un participante para continuar.` |
| Paso bloqueado: demográficos | error | `Si usas datos demográficos, activa o crea al menos un dato demográfico para continuar.` |
| Paso bloqueado: secciones vacías | error | `Todas las secciones deben tener al menos una pregunta para continuar.` |
| Paso bloqueado: sin preguntas | error | `Añade al menos una sección con preguntas para continuar.` |
| Fallback | error | `Completa los pasos anteriores para desbloquear este paso.` |
| Profundidad máxima | info | `Alcanzaste el máximo de 3 niveles` |
| Sin sección seleccionada | info | `Selecciona una sección para añadir preguntas.` |
| Vista previa sin preguntas | info | `Añade al menos una pregunta para ver la vista previa.` |
| Banco de respuestas | info | `El banco de respuestas llega en el siguiente paso.` |
| Sección eliminada | success | `${depthLabel} eliminada` → `Sección eliminada` / `Subsección eliminada` |
| Subsección movida | success | `Subsección movida` |
| Pregunta movida | success | `Pregunta movida` |
| Preguntas del banco | success | `Se añadieron N preguntas.` |
| Importación OK | success | `Se importaron N secciones y M preguntas.` |
| Importación sin contenido | error | `No se detectaron secciones` |
| Importación ilegible | error | `Archivo no válido` |
| Guardar (rail) | success | `Encuesta guardada` |
| Finalizar OK | success | `Encuesta guardada` |
| Finalizar con fallos | error | ver §3.7 ruta C |

### 8.2 Descargas — toasts

| Trigger | Tipo | Texto |
|---|---|---|
| Archivo entregado | success | `PDF descargado` / `XLSX descargado` + `description: <nombre del archivo>` |
| PDF bloqueado al entregar | error | `No se pudo abrir la vista de impresión` + `Reintenta la descarga desde la lista de descargas.` |
| Reintento fallido | error | `No se pudo abrir la vista de impresión` + `Revisa si el navegador está bloqueando las ventanas emergentes.` |
| Enlace copiado | success | `Enlace copiado` + `Compártelo con quien deba ver este reporte.` |
| Copia fallida | error | `No se pudo copiar el enlace` + `Copia la URL desde la barra del navegador.` |

### 8.3 Descargas — avisos inline

| Ubicación | Texto |
|---|---|
| PDF sin secciones | `Enciende al menos una sección para poder descargar.` |
| XLSX sin hojas | `Enciende al menos una hoja para poder descargar.` |
| Comentarios sin sentimiento | `Selecciona al menos un sentimiento para poder descargar.` |
| Comentarios sin tema | `Selecciona al menos un tema para poder descargar.` |
| Selector de bloque vacío (heatmap/brechas) | `Elige al menos un demográfico o este bloque no se imprime.` |
| Selector de bloque vacío (secciones) | `Elige al menos una sección o este bloque no se imprime.` |
| Selector vacío (participación) | `Sin demográficos solo se imprime la cobertura general.` |
| Selector vacío (eNPS) | `Sin demográficos solo se imprime el puntaje y el desglose por secciones.` |
| Selector vacío (tandas XLSX) | `Elige al menos un demográfico o estas hojas no se generan.` |
| Bloque no disponible: eNPS | `Esta medición no incluyó pregunta eNPS` |
| Bloque no disponible: demográficos | `Esta encuesta no recogió demográficos` |
| Bloque no disponible: profundidad | `Ninguna pregunta activó preguntas de profundidad` |
| Población bloqueada | ver §7.4 |

---

## 9. Catálogo de errores confirmados y cómo reproducirlos

Verificados con `npx tsc -b --pretty false` sobre el commit `ffb7611`
(137 diagnósticos en total; aquí solo los que afectan a comportamiento).

<a id="error-01"></a>
### [ERROR-01] `MIN_QUESTION_DEPTH = 1` contradice "nivel 1 es contenedor" — **alto**

**Dónde:** `src/components/survey-builder/surveyBuilderTypes.ts:343-346`

```ts
export const MIN_QUESTION_DEPTH = 1;
export const canHaveQuestions = (depth: number): boolean => depth >= MIN_QUESTION_DEPTH;
```

Pero el encabezado del mismo archivo (`:1-10`) afirma: *"level 1 sections are pure containers,
while levels 2 and 3 may hold questions"*, y `questionBlockedReason` (`sectionTree.ts:373`)
tiene un mensaje que **nunca se puede mostrar**:

```ts
if (!canHaveQuestions(entry.depth)) return "Las secciones de primer nivel no llevan preguntas…";
```

**Consecuencias en cadena:**

1. `moveDestinationsForQuestion` (`sectionTree.ts:301`) **ofrece secciones de nivel 1** como
   destino de una pregunta.
2. Una vez la sección de nivel 1 tiene ≥1 pregunta, `SectionEditor.tsx:199` la renderiza y su
   botón "Añadir pregunta" permite añadir más (`handleAddQuestionTo` no bloquea).
3. `buildPreviewPages` la convierte en página con `trail` vacío.
4. `allSectionsHaveQuestions` la da por llena aunque no tenga subsecciones.
5. `moveDestinationsForSection` **sí** aplica la regla contraria (`:292`: un subárbol con
   preguntas no puede moverse junto a un nivel 1), quedando el sistema incoherente consigo mismo.

**Reproducir:**
1. Crea `Sección 1` → `1.1` con una pregunta.
2. En la fila de la pregunta pulsa **Mover** → verás `1. Sección 1` en la lista de destinos.
3. Muévela. La pregunta queda colgando de la sección raíz.
4. Abre la vista previa → hay una página para `Sección 1`.

**Decisión pendiente:** o `MIN_QUESTION_DEPTH = 2` (y adaptar `handleAddQuestion`,
`SectionEditor` y el importador, que ya reagrupa en "Preguntas"), o actualizar la documentación
y borrar `questionBlockedReason`. Hoy conviven las dos versiones.

<a id="error-02"></a>
### [ERROR-02] Las preguntas del banco llevan HTML crudo que se imprime literal — **alto**

**Dónde:** `src/screens/SurveyBuilder.tsx:703-706`

```ts
const q = buildQuestion();
return { ...q, statement: `<p>${text}</p>`, isBankQuestion: true };
```

`QuestionEditor` edita el enunciado con un `<input>` de texto plano (`:180-189`), no con
`RichTextEditor`. Solo `QuestionCard` limpia las etiquetas al pintar
(`QuestionCard.tsx:108`: `.replace(/<[^>]*>?/gm,'')`). **Nadie más lo hace.**

**Dónde se ve el HTML literal:**

| Superficie | Archivo |
|---|---|
| Formulario de la pregunta | `QuestionEditor.tsx:182` |
| Vista previa (tarjeta) | `PreviewQuestionCard.tsx:93` |
| Vista previa (matriz) | `PreviewScaleMatrix.tsx:84` |
| Resultados — Detalle por secciones | `QuestionsTab.tsx:646` |
| XLSX Preguntas / Detalle / Respuestas | `reportFiles.ts:311, 469, 1794` |
| PDF Detalle de preguntas | `pdf/breakdownBlocks.ts:243` (`escapeHtml` lo convierte en texto visible) |

**Reproducir:**
1. Constructor → rail → **Banco de preguntas** → añade cualquier pregunta.
2. Abre la vista previa → el enunciado se lee `<p>Mi líder me da retroalimentación útil</p>`.
3. Ve a Resultados → Descargar → **Preguntas (XLSX)** → la celda contiene las etiquetas.

**Arreglo mínimo:** guardar texto plano en `handleAddBankQuestions`, o normalizar en un solo
sitio (`stripHtml(statement)`) para todo consumidor que no sea el editor enriquecido.

<a id="error-03"></a>
### [ERROR-03] `selectFixed("welcome")` — bloque inexistente — **medio**

**Dónde:** `src/screens/SurveyBuilder.tsx:565` y `:582`
**Diagnóstico:** `TS2345: Argument of type '"welcome"' is not assignable to parameter of type 'FixedBlockId'`

`FixedBlockId` = `"general" | "demographics" | "participants" | "pages"`
(`surveyBuilderTypes.ts:78-82`). `"welcome"` fue absorbido por `pages` y no se actualizó aquí.

**Efecto en runtime:** `renderMainPanel()` (`:854-914`) evalúa los cuatro `if` de `blockId`,
ninguno coincide, cae al `return` final y **renderiza el árbol de secciones** — que en ese
momento está vacío. El resultado sería un panel principal en blanco, sin explicación.

**Alcanzabilidad hoy: ninguna.** La rama se ejecuta solo cuando `nextSelectionAfterRemoval`
devuelve `null`, es decir cuando el árbol queda **sin ninguna sección**, y hoy no hay forma de
llegar ahí desde la interfaz:

- El botón de borrar de la tarjeta raíz está `disabled` con una sola sección
  (`SurveyBuilder.tsx:930` → `canDelete={draft.sections.length > 1}`).
- La fila del árbol navegable **no renderiza ningún botón de borrar** — ver [ERROR-11](#error-11).

Es por tanto una **bomba de relojería**: en cuanto se habilite cualquier vía para vaciar el
árbol (o se conecte el borrado del árbol navegable), el bug se activa.

**Reproducir el error de tipo (siempre):**

```bash
npx tsc -b --pretty false 2>&1 | grep SurveyBuilder
# src/screens/SurveyBuilder.tsx(565,19): error TS2345: Argument of type '"welcome"' …
# src/screens/SurveyBuilder.tsx(582,21): error TS2345: Argument of type '"welcome"' …
```

**Reproducir el efecto en runtime (forzado):** cambia temporalmente
`canDelete={draft.sections.length > 1}` por `canDelete` y borra la última sección.

**Arreglo:** `selectFixed("pages")` o `selectFixed("general")`.

<a id="error-04"></a>
### [ERROR-04] El paso `pages` nunca puede fallar, pero hay código que lo asume — **bajo**

**Dónde:** `stepper.ts:114-116` (`case "pages": return true;`) contra
`SurveyBuilder.tsx:1013` y `:1032`.

`fixedValidationTouched` se declara (`:134`), se **escribe** (`:1013`) y **nunca se lee**
(`TS6133: 'fixedValidationTouched' is declared but its value is never read`). El mensaje
`"Escribe el contenido de las páginas de encuesta activas"` es **código muerto**.

El comentario del propio `stepper.ts:112-114` describe la regla que *pretendía* existir
("una página encendida y vacía no es una página que nadie terminó") pero el `return true` la
anula. Además, `handleFixedBlockContentChange` (`SurveyBuilder.tsx:808-814`) deriva
`welcomeEnabled` de `content.trim() !== ""`, así que **no puede existir** una página encendida
y vacía. La regla es innecesaria; lo que sobra es el estado y el mensaje.

<a id="error-05"></a>
### [ERROR-05] El heatmap del PDF descarta las filas de pregunta — **medio (documentación)**

**Dónde:** `pdf/breakdownBlocks.ts:118-119`

```ts
if (node.kind !== "section") continue;
```

La descripción del bloque promete *"La misma grilla de la herramienta"*
(`downloadTypes.ts:80`), pero la grilla de la herramienta **sí** despliega preguntas como filas
hoja (`HeatmapTab.tsx:79-84`). El PDF solo imprime secciones y subsecciones.

**Reproducir:** expande una sección en el heatmap de pantalla hasta ver sus preguntas; descarga
el PDF con el bloque *Heatmap por demográficos* encendido; compara. Las filas de pregunta no están.

**Decisión:** es probablemente deliberado (una grilla con 46 filas de pregunta × 10 columnas es
ilegible en papel) pero **no está documentado ni en el código ni en la copia del panel**. O se
documenta, o se ofrece como opción.

<a id="error-06"></a>
### [ERROR-06] La importación descarta en silencio todo lo que pase de nivel 3 — **medio**

**Dónde:** `sectionFileImport.ts:308-311`

```ts
const nested: SurveySection[] =
  depth < MAX_SECTION_DEPTH
    ? node.children.map(child => buildImportedSection(child, depth + 1))
    : [];        // ← los hijos de un nivel 3, y TODAS sus preguntas, desaparecen
```

`parseMarkdown` ya clava los encabezados más profundos que `###` en el nivel 3, así que por la
ruta Markdown el problema es menor. Por la ruta **tabular** una fila puede describir una
jerarquía más profunda y perderse.

Peor: `summarizeImported` (`:269`) cuenta sobre el **árbol parseado**, no sobre el convertido, así
que el toast informa preguntas que **no se importaron**.

**Reproducir:** un CSV con `seccion`, `subseccion`, `subsubseccion` y una cuarta columna de
jerarquía (o un Markdown con `####` bajo un `###` si el parser lo respetara). El toast dirá
`Se importaron 1 sección y 5 preguntas` y en el árbol habrá menos.

**Arreglo:** o reagrupar lo excedente en el nivel 3 (como se hace con las preguntas de nivel 1),
o avisar explícitamente de lo descartado en el toast.

<a id="error-07"></a>
### [ERROR-07] Filtro encendido sin grupos = descarga sin filtrar, sin avisar — **bajo (UX)**

**Dónde:** `DownloadReportsDrawer.tsx:265-271` + `:1140`

Con `filterEnabled === true` y `filterOptionIds.size === 0`, `activeFilters` es `[]`. El `scope`
pasa a ser "toda la empresa", no hay bloqueo, no hay conteo visible y el archivo sale **completo**.
El interruptor está encendido y no filtra nada, sin ningún texto que lo explique — a diferencia
de los selectores de bloque, que sí tienen `pickerEmptyHint`.

**Reproducir:** enciende *Filtrar población*, no marques ningún grupo, descarga el XLSX.
La cabecera de las hojas dirá `Población: Toda la empresa`.

**Arreglo sugerido:** un hint bajo el multi-select, del mismo estilo que los demás
(`"Sin grupos seleccionados el reporte incluye a toda la empresa."`).

<a id="error-08"></a>
### [ERROR-08] `FavorabilityTab` lee una propiedad que no existe — **bajo**

**Dónde:** `FavorabilityTab.tsx:42`

```ts
const filterableSegments = results.segments.filter(s => s.type === "demographic");
```

`SegmentDefinition` no tiene `type` (`TS2339`), y la variable **no se usa**
(`TS6133: 'filterableSegments' is declared but its value is never read`). En runtime
`s.type` es `undefined` → array vacío. No hay efecto porque nadie lo consume, pero es una
trampa: quien lo cablee heredará un array siempre vacío.

**Arreglo:** borrar la línea; el filtrado correcto ya está una línea más abajo (`:44`,
`!candidate.perPerson`).

<a id="error-09"></a>
### [ERROR-09] La lista de descargas dice "Últimos 7 días" pero es memoria de sesión — **bajo**

**Dónde:** `DownloadReportsDrawer.tsx:1206-1208` contra `useDownloadCenter.ts:50`

`entries` es `React.useState([])` dentro del hook, que vive en `SurveyResults`. No hay
persistencia: recargar la página, o salir y volver a la pantalla de resultados, vacía la lista.
La copia promete un historial de 7 días que no existe.

**Reproducir:** descarga un reporte, recarga (F5), abre el drawer → pestaña *Descargas* →
`"Sin descargas recientes"`.

<a id="error-11"></a>
### [ERROR-11] El árbol navegable recibe `onDelete`/`canDelete` y nunca los usa — **bajo**

**Dónde:** `SectionsPanel.tsx:312,319` pasa las props; `SectionTreeItem.tsx:42,49` las
desestructura y **no las renderiza**.

```
TS6133: 'canDelete' is declared but its value is never read.   (SectionTreeItem.tsx:42)
TS6133: 'onDelete' is declared but its value is never read.    (SectionTreeItem.tsx:49)
TS6133: 'onAddSubsection' is declared but its value is never read.  (:48)
```

Consecuencia: **borrar y crear subsección solo existen en el panel principal**, no en el árbol
de la izquierda, aunque el cableado sugiere lo contrario. Quien lea `SectionsPanel` asumirá que
la fila tiene esas acciones. También quedan sin usar los imports `canAddSubsection` y
`depthLabel` (`:8,9`) y el componente `MenuItemIcon` (`:156`) — restos de un menú contextual
que se quitó.

**Arreglo:** o se vuelve a conectar el menú de fila, o se borran las props y el cableado.
Mientras tanto, cualquier cambio en el borrado del árbol **no** tiene efecto visible.

<a id="error-10"></a>
### [ERROR-10] Extensión `.xls` con contenido SpreadsheetML y MIME de Excel 97 — **bajo**

**Dónde:** `useDownloadCenter.ts:65,69`

```ts
const extension = type.format === "PDF" ? "pdf" : "xls";
const xlsMime = "application/vnd.ms-excel";
```

El contenido es **Excel 2003 XML** (`reportFiles.ts:191-198`). Excel para Windows muestra el
aviso *"El formato del archivo y la extensión no coinciden"* antes de abrirlo. Se abre bien, pero
el aviso alarma a quien recibe el archivo. Alternativa: extensión `.xml` con
`application/xml`, o cambiar a `.xlsx` real vía la dependencia `xlsx` que el proyecto **ya tiene**
(se usa en `sectionFileImport.ts`).

### 9.1 Otros diagnósticos (no afectan comportamiento)

`npx tsc -b` reporta además 4 errores en `src/App.tsx` (`SurveyDraft` sin `id` ni `general`, y
`statusVariant: string` vs. la unión), `Cannot find name 'Button'` en `CollaboratorTable.tsx:512,525`
e `ImportedUsersTable.tsx:647,658`, `Cannot find namespace 'NodeJS'` en `BuilderSideRail.tsx:269,277`
y `ResultsActionRail.tsx`, `Cannot find name 'ImportRow'` en `ImportedUsersTable.tsx:213`, más ~100
avisos `TS6133` de importaciones sin usar. **El proyecto no compila limpio hoy**; `vite build` sí
funciona porque no ejecuta `tsc`.

---

## 10. Guía rápida de reproducción de escenarios

### 10.1 Arranque

```bash
npm install
npm run dev
```

Verificación de tipos (falla hoy, ver §9.1):

```bash
npx tsc -b --pretty false
```

### 10.2 Cómo forzar cada condición

| Quiero… | Cómo |
|---|---|
| **Umbral de anonimato activo** | Datos generales → Visibilidad **Anónimo** → sube el mínimo (mín. 3) |
| **Sin umbral** | Visibilidad **Público** → `threshold = 1` |
| **Sin demográficos** | Paso Demográficos → apaga el interruptor maestro → desaparecen tabs con desglose, bloques `needsSegments` y la tarjeta de filtro |
| **Sin eNPS** | Que ninguna pregunta sea `scale` + `kind: "nps"` → `results.nps === null` → tab eNPS en vacío, hojas y bloques `needsNps` deshabilitados |
| **Con Profundidad** | Una pregunta `nps`/`stars`/`emoji`/`linear` con `followUpEnabled: true` y los tres textos → habilita la hoja `depth` y la vista Profundidad |
| **Un demográfico "por persona"** | Campo con `perPerson: true` (Colaborador) → sale de heatmap, eNPS por segmento y selectores del PDF; sigue en Participación |
| **Un grupo bajo umbral** | Filtra por País/Género en el heatmap; los grupos pequeños de Área cruzan el umbral (`coverageFor` los estrecha) |
| **Un grupo con 0 respuestas** | Los "grupos estancados" que genera `participationBySegment:508-535` (máx. 2 por segmento, solo los más pequeños y solo dentro del presupuesto de "faltan") |
| **PDF bloqueado por el navegador** | Difícil de forzar: `openPdfReport` solo devuelve `false` si el iframe no tiene `contentDocument`. Para probar la UI de reintento, parchea temporalmente `openPdfReport` para devolver `false` |
| **Cero secciones en el PDF** | Apaga los 8 interruptores → aviso rojo + botón deshabilitado |
| **Libro XLSX vacío** | Deja solo una tanda `*-by` encendida y vacía su selector → `xlsxHasContent === false` |

### 10.3 Checklist de regresión al tocar estas áreas

**Si tocas `sectionTree.ts`:**
- [ ] Reordenar hermanos en raíz y en nivel 3
- [ ] Rechazo de drop entre padres distintos
- [ ] "Mover a…" cambia de nivel en ambas direcciones (2→3 y 3→2)
- [ ] Un subárbol con preguntas **no** puede ir junto a un nivel 1
- [ ] Borrar una rama renumera todo y selecciona la fila correcta
- [ ] `pathIds` sigue abriendo exactamente una rama

**Si tocas `stepper.ts` o la validación:**
- [ ] Los 5 toasts de `announceStepBlocked`
- [ ] Composición singular/plural de `handleFinalize`
- [ ] `focusFirstIncompleteQuestion` abre **y** hace scroll
- [ ] Los pasos que se recuperan dejan de estar rojos sin recargar

**Si tocas los descargables:**
- [ ] Los 5 reportes se descargan y abren en Excel/Numbers
- [ ] Numeración dinámica del PDF (apaga la sección 2 y verifica que la 3 pasa a ser 2)
- [ ] Rango de pestañas del XLSX ("7–9") al cambiar el número de demográficos
- [ ] [CASO-D1] a [CASO-D7] de §7.7
- [ ] Widget flotante: estado "peor del lote", máximo 4 filas, "Ver las N descargas"
- [ ] StrictMode: **una sola** entrega por reporte (no dos descargas del mismo archivo)

**Si tocas los mocks (`surveyResults.ts`, `questionResponses.ts`):**
- [ ] Los números de pantalla y de archivo siguen coincidiendo celda a celda
- [ ] No se introdujo `Math.random()` ni `Date.now()` en la generación
- [ ] `buildAnswerMatrix` sigue repartiendo el roster una sola vez

---

*Documento generado a partir del análisis del código en el commit `ffb7611`.
Cuando cambie el comportamiento descrito aquí, actualiza la sección correspondiente en el mismo PR.*
