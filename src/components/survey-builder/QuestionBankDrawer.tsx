import * as React from "react"
import { Check, Eye, EyeOff, Inbox, Layers, ListChecks, Search, X } from "lucide-react"
import { DrawerShell } from "@/components/overlays/DrawerShell"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/feedback/EmptyState"
import { cn } from "@/lib/utils"
import { toneAccent, toneBar, toneBorder, toneChip, toneForIndex, toneWash, type Tone } from "@/lib/tone"
import { questionBankData } from "./questionBankData"

export interface QuestionBankDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddQuestions: (questions: string[]) => void
}

/** Una pregunta del banco con el contexto que la ubica: de qué tipo y de qué
 *  sección viene, y el tono que le toca a esa sección. */
interface BankEntry {
  id: string
  text: string
  typeId: string
  typeName: string
  sectionId: string
  sectionName: string
  tone: Tone
}

/**
 * Todo el banco aplanado, con un tono por sección repartido por posición —
 * igual que las secciones de una encuesta — para que el chip de una pregunta
 * tenga color propio y una sección se reconozca antes por el tinte que por el
 * nombre. Se calcula una vez: el catálogo es estático.
 */
const BANK_ENTRIES: readonly BankEntry[] = (() => {
  const entries: BankEntry[] = []
  let sectionIndex = 0
  questionBankData.forEach((type) => {
    type.sections.forEach((section) => {
      const tone = toneForIndex(sectionIndex++)
      section.questions.forEach((question) => {
        entries.push({
          id: question.id,
          text: question.text,
          typeId: type.id,
          typeName: type.name,
          sectionId: section.id,
          sectionName: section.name,
          tone,
        })
      })
    })
  })
  return entries
})()

const SECTION_TONE: ReadonlyMap<string, Tone> = new Map(
  BANK_ENTRIES.map((entry) => [entry.sectionId, entry.tone])
)

const matchesQuery = (entry: BankEntry, query: string) =>
  entry.text.toLowerCase().includes(query) ||
  entry.sectionName.toLowerCase().includes(query) ||
  entry.typeName.toLowerCase().includes(query)

const pluralize = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`

/**
 * "Banco de preguntas": el catálogo de UBITS con el mismo lenguaje visual que
 * el drawer de plantillas — las tarjetas se apoyan sobre el fondo del drawer,
 * cada una con su tinte, su hover y su acento por sección.
 *
 * Una sola lista, sin tabs: los filtros dicen qué se está mirando y, en cuanto
 * hay algo seleccionado, aparece "Ver seleccionadas" junto a "Añadir todo",
 * igual que en las tablas del producto.
 */
export function QuestionBankDrawer({ open, onOpenChange, onAddQuestions }: QuestionBankDrawerProps) {
  const [session, setSession] = React.useState({ open, count: 0 })
  if (session.open !== open) {
    setSession({ open, count: open ? session.count + 1 : session.count })
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Banco de preguntas"
      description="Explora las preguntas de UBITS por tipo de encuesta y sección, y elige las que quieras añadir."
      size="4xl"
      disablePadding
      disableScrollbarGutter
      className="!w-[58vw] !max-w-[900px] gap-0 p-0"
    >
      <QuestionBankBody key={session.count} onAddQuestions={onAddQuestions} onClose={() => onOpenChange(false)} />
    </DrawerShell>
  )
}

function QuestionBankBody({
  onAddQuestions,
  onClose,
}: {
  onAddQuestions: (questions: string[]) => void
  onClose: () => void
}) {
  const [typeId, setTypeId] = React.useState(questionBankData[0].id)
  const [sectionId, setSectionId] = React.useState(questionBankData[0].sections[0].id)
  const [query, setQuery] = React.useState("")
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(() => new Set())
  // El equivalente del "Ver seleccionados" de las tablas: la misma lista,
  // recortada a lo que ya está marcado, en lugar de una pestaña aparte.
  const [onlySelected, setOnlySelected] = React.useState(false)

  const currentType = questionBankData.find((type) => type.id === typeId) ?? questionBankData[0]
  const currentSection =
    currentType.sections.find((section) => section.id === sectionId) ?? currentType.sections[0]
  const sectionTone = SECTION_TONE.get(currentSection.id) ?? "brand"

  const normalizedQuery = query.trim().toLowerCase()

  // Buscar dentro de una sola sección deja fuera casi todo el banco, así que
  // una búsqueda en el catálogo abre el alcance a todo el tipo de encuesta —
  // el filtro que el usuario sí eligió — y cada resultado dice de qué sección
  // viene. Sin búsqueda, se mira la sección y ya.
  const visibleEntries = React.useMemo(() => {
    if (onlySelected) {
      const picked = BANK_ENTRIES.filter((entry) => selected.has(entry.id))
      return normalizedQuery ? picked.filter((entry) => matchesQuery(entry, normalizedQuery)) : picked
    }
    if (normalizedQuery) {
      return BANK_ENTRIES.filter(
        (entry) => entry.typeId === currentType.id && matchesQuery(entry, normalizedQuery)
      )
    }
    return BANK_ENTRIES.filter((entry) => entry.sectionId === currentSection.id)
  }, [onlySelected, selected, currentType.id, currentSection.id, normalizedQuery])

  const allVisibleSelected =
    visibleEntries.length > 0 && visibleEntries.every((entry) => selected.has(entry.id))

  const toggleQuestion = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleAllVisible = () => {
    if (visibleEntries.length === 0) return
    const next = new Set(selected)
    visibleEntries.forEach((entry) => {
      if (allVisibleSelected) next.delete(entry.id)
      else next.add(entry.id)
    })
    setSelected(next)
  }

  const handleAdd = () => {
    const texts = BANK_ENTRIES.filter((entry) => selected.has(entry.id)).map((entry) => entry.text)
    onAddQuestions(texts)
    onClose()
  }

  // La primera lista aparece mientras el Sheet todavía entra, así que espera a
  // que ese movimiento libere el paso; un cambio de filtro posterior ya no
  // compite con nada y entra de inmediato.
  const [hasNavigated, setHasNavigated] = React.useState(false)
  const cascadeClassName = hasNavigated ? "cascade-enter" : "cascade-enter-drawer"
  const navigate = (apply: () => void) => {
    apply()
    setHasNavigated(true)
  }

  const listKey = onlySelected ? "selected" : normalizedQuery ? "search" : currentSection.id

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 bg-background p-4">
      {/* Panel de control: qué se está mirando y cómo se acota. Todo lo que
          decide el contenido vive dentro de esta tarjeta; la lista, en la
          suya. Antes ambos grupos flotaban sueltos sobre el fondo y no había
          nada que dijera dónde termina uno y empieza el otro. */}
      <section className="shrink-0 rounded-2xl border border-border/60 bg-surface p-3.5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold tracking-tight text-text-primary">
              {onlySelected ? "Tus preguntas seleccionadas" : "Elige preguntas del catálogo"}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-text-secondary">
              {onlySelected
                ? "Estas son las que se añadirán a la encuesta. Desmarca cualquiera para quitarla."
                : `${pluralize(BANK_ENTRIES.length, "pregunta lista", "preguntas listas")} para usar, escritas y validadas por UBITS.`}
            </p>
          </div>

          <div className="relative w-full sm:w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <Input
              aria-label="Buscar pregunta"
              placeholder="Buscar por texto o sección…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="border-border/60 bg-surface pl-9 pr-8 text-[13px]"
            />
            {query.trim().length > 0 && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* Los filtros solo ordenan el catálogo: la vista de seleccionadas
            cruza todos los tipos y secciones, así que se repliegan — con
            ellos se va también la línea que los separa del encabezado. */}
        <div
          className={cn(
            "grid gap-3 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:grid-cols-2",
            onlySelected ? "max-h-0 opacity-0" : "mt-3.5 max-h-24 border-t border-border/50 pt-3.5 opacity-100"
          )}
          aria-hidden={onlySelected}
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text-secondary">Tipo de encuesta</span>
            <Select
              value={typeId}
              onValueChange={(value) =>
                navigate(() => {
                  const type = questionBankData.find((item) => item.id === value)
                  setTypeId(value)
                  setSectionId(type?.sections[0]?.id ?? "")
                })
              }
            >
              <SelectTrigger className="h-9 w-full border-border/60 bg-surface text-[13px]">
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {questionBankData.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-text-secondary">Sección</span>
            <Select value={sectionId} onValueChange={(value) => navigate(() => setSectionId(value))}>
              <SelectTrigger className="h-9 w-full border-border/60 bg-surface text-[13px]">
                <SelectValue placeholder="Selecciona la sección" />
              </SelectTrigger>
              <SelectContent>
                {currentType.sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>
      </section>

      {/* La lista y su encabezado como un solo bloque: el encabezado dice qué
          hay dentro y las acciones actúan sobre eso mismo, así que van
          pegados, y las tarjetas blancas se recortan contra el fondo gris del
          cuerpo. */}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/60 bg-surface shadow-card">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border/60 px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-border/40"
              style={onlySelected ? toneChip("brand") : toneChip(sectionTone)}
            >
              {onlySelected ? (
                <ListChecks className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Layers className="h-4 w-4" strokeWidth={2} />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-semibold leading-tight text-text-primary">
                {onlySelected
                  ? "Seleccionadas de todo el banco"
                  : normalizedQuery
                    ? `Resultados en ${currentType.name}`
                    : currentSection.name}
              </p>
              <p className="mt-0.5 text-[11.5px] font-medium text-text-muted">
                {pluralize(visibleEntries.length, "pregunta", "preguntas")}
                {!onlySelected && selected.size > 0 && ` · ${selected.size} seleccionadas`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Aparece en cuanto hay algo marcado y se repliega al vaciarse,
                con la misma transición de ancho que en las tablas. */}
            <div
              className={cn(
                "flex shrink-0 items-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                selected.size > 0 || onlySelected
                  ? "max-w-[220px] opacity-100"
                  : "pointer-events-none max-w-0 opacity-0"
              )}
            >
              <button
                type="button"
                onClick={() => navigate(() => setOnlySelected((value) => !value))}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-[13px] font-semibold transition-colors",
                  onlySelected
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-border text-text-secondary hover:border-primary/30 hover:text-primary"
                )}
              >
                {onlySelected ? (
                  <EyeOff className="h-3.5 w-3.5" strokeWidth={2} />
                ) : (
                  <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                )}
                {onlySelected ? "Ver catálogo" : `Ver seleccionadas (${selected.size})`}
              </button>
            </div>

            <Button
              variant="outline"
              onClick={toggleAllVisible}
              disabled={visibleEntries.length === 0}
              className="h-8"
            >
              {allVisibleSelected ? (
                <>
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                  Quitar todo
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" strokeWidth={2} />
                  Añadir todo
                </>
              )}
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-background p-3 pr-2">
          {visibleEntries.length > 0 ? (
            <div key={listKey} className={cn("flex flex-col gap-2", cascadeClassName)}>
              {visibleEntries.map((entry) => (
                <QuestionRow
                  key={entry.id}
                  entry={entry}
                  showOrigin={onlySelected || normalizedQuery.length > 0}
                  isSelected={selected.has(entry.id)}
                  onToggle={() => toggleQuestion(entry.id)}
                />
              ))}
            </div>
          ) : onlySelected ? (
            <EmptyState
              title="Aún no hay preguntas seleccionadas"
              description="Vuelve al catálogo y marca las preguntas que quieras añadir a tu encuesta."
              icon={Inbox}
              className="mt-6"
              action={
                <Button variant="outline" onClick={() => navigate(() => setOnlySelected(false))}>
                  Ver catálogo
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="No encontramos preguntas para esta búsqueda"
              description="Prueba con otra palabra o cambia el tipo de encuesta y la sección."
              icon={Search}
              className="mt-6"
            />
          )}
        </div>
      </section>

      <div className="-mx-4 -mb-4 flex shrink-0 items-center justify-between gap-3 border-t border-border/60 bg-surface px-4 py-3">
        <span className="text-[12.5px] font-medium text-text-muted">
          {selected.size > 0
            ? `${pluralize(selected.size, "pregunta seleccionada", "preguntas seleccionadas")}`
            : "Marca al menos una pregunta para continuar"}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleAdd} disabled={selected.size === 0}>
            Agregar {selected.size > 0 && `(${selected.size})`}
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * Una pregunta como tarjeta: el mismo cuerpo que las tiles de plantilla — el
 * lavado y el levantamiento al pasar el cursor, en el tono de su sección — con
 * una barra de acento al costado. El origen (tipo · sección) solo aparece
 * cuando la lista mezcla secciones; dentro de una sola, el encabezado ya lo
 * dice y repetirlo en cada tarjeta era puro ruido.
 */
function QuestionRow({
  entry,
  isSelected,
  showOrigin,
  onToggle,
}: {
  entry: BankEntry
  isSelected: boolean
  showOrigin: boolean
  onToggle: () => void
}) {
  const accent = toneAccent(entry.tone)

  return (
    <label
      style={{
        ["--tone" as string]: accent,
        ...(isSelected ? { ...toneBorder(entry.tone, 45), ...toneWash(entry.tone, 7) } : undefined),
      }}
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-xl border py-3 pl-4 pr-3.5",
        "magic-card-toned magic-card-sweep magic-card-lift",
        "focus-within:ring-2 focus-within:ring-primary/25",
        isSelected ? "magic-card-selected shadow-card" : "border-border/60 bg-surface"
      )}
    >
      {/* La barra de acento: el color de la sección, tenue mientras la
          pregunta está libre y a fondo cuando ya está elegida. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[3px] transition-colors"
        style={toneBar(entry.tone, isSelected ? 100 : 40)}
      />
      {isSelected && (
        // La luz que mantiene el tinte como un lavado y no como un bloque de
        // color, igual que en las tiles de plantilla.
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,hsl(var(--card)/0.2)_0%,hsl(var(--card)/0.9)_48%)]"
        />
      )}
      <Checkbox checked={isSelected} onCheckedChange={onToggle} className="relative z-[1] mt-0.5 shrink-0" />
      <span className="relative z-[1] flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-start justify-between gap-3">
          <span className="min-w-0 text-[13px] font-medium leading-snug text-text-primary">{entry.text}</span>
          <span className="mt-px inline-flex shrink-0 items-center rounded-full bg-surface-muted px-2 py-0.5 text-[10.5px] font-medium text-text-muted ring-1 ring-inset ring-border/40">
            Creada por UBITS
          </span>
        </span>
        {showOrigin && (
          <span
            className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
            style={toneChip(entry.tone)}
          >
            {entry.typeName} · {entry.sectionName}
          </span>
        )}
      </span>
    </label>
  )
}
