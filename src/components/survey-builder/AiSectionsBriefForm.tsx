import * as React from "react";
import {
  AlignLeft,
  CornerDownRight,
  Layers,
  Minus,
  Plus,
  Shuffle,
  SlidersHorizontal,
  Target,
  CircleDot,
  ListChecks,
  ChevronDownCircle,
  Flag,
  MessageSquare,
  Award,
  TrendingUp,
  Scale,
  Heart,
  Smile,
  Laptop,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";
import { toneChip, toneForIndex, toneText, type Tone } from "@/lib/tone";
import { GuidedStep } from "./GuidedStep";
import { AI_FOCUSES } from "./aiSectionThemes";
import {
  AI_BRIEF_LIMITS,
  MAX_AI_NOTES_LENGTH,
  type AiQuestionStyle,
  type AiScope,
  type AiSectionsBrief,
} from "./aiSectionGenerator";

/**
 * The brief: what the author tells the generator before it builds anything.
 *
 * It opens already answered. Every field has a defensible default derived from
 * the survey itself — the type picks the focos, the counts start at a shape
 * that reads well — so the fast path is "Generar" and the form is there for the
 * author who wants to steer. Nothing here is required.
 */
interface AiSectionsBriefFormProps {
  brief: AiSectionsBrief;
  onChange: (patch: Partial<AiSectionsBrief>) => void;
  /** False on the survey's very first section, where "toda la encuesta" and
   * "esta sección" would do nearly the same thing. */
  canScopeToSection: boolean;
  /**
   * Cuántos pasos deben entrar encadenados en vez de aparecer ya puestos.
   *
   * Lo pide quien nos monta al volver del preview, donde el brief entero se
   * rehace de golpe: sin esto los cinco pasos parpadearían a la vez. En el
   * camino normal —una pregunta abriendo la siguiente— vale 0 y cada paso
   * entra sin esperar.
   */
  staggerCount?: number;
}

const SCOPE_OPTIONS: readonly {
  value: AiScope;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: Tone;
}[] = [
  {
    value: "section",
    label: "Esta sección",
    hint: "Crea las subsecciones y sus preguntas dentro de la sección abierta.",
    icon: CornerDownRight,
    tone: "brand",
  },
  {
    value: "survey",
    label: "Toda la encuesta",
    hint: "Crea varias secciones nuevas, cada una con sus subsecciones y preguntas.",
    icon: Layers,
    tone: "brand",
  },
];

const STYLE_OPTIONS: readonly {
  value: AiQuestionStyle;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: Tone;
}[] = [
  {
    value: "scale",
    label: "Escala",
    hint: "Todas en escala de acuerdo, comparables entre sí.",
    icon: SlidersHorizontal,
    tone: "brand",
  },
  {
    value: "single",
    label: "Opción única",
    hint: "Solo una respuesta posible por pregunta.",
    icon: CircleDot,
    tone: "positive",
  },
  {
    value: "multiple",
    label: "Múltiples",
    hint: "El participante puede marcar varias opciones.",
    icon: ListChecks,
    tone: "warning",
  },
  {
    value: "dropdown",
    label: "Desplegable",
    hint: "Lista compacta para elegir una opción.",
    icon: ChevronDownCircle,
    tone: "ai",
  },
  {
    value: "open",
    label: "Abiertas",
    hint: "Solo preguntas de respuesta libre.",
    icon: AlignLeft,
    tone: "neutral",
  },
  {
    value: "mixed",
    label: "Mixtas",
    hint: "Escala para medir y una abierta al cierre.",
    icon: Shuffle,
    tone: "brand",
  },
];

const FOCUS_ICONS: Record<string, LucideIcon> = {
  liderazgo: Flag,
  comunicacion: MessageSquare,
  reconocimiento: Award,
  desarrollo: TrendingUp,
  carga: Scale,
  cultura: Heart,
  bienestar: Smile,
  herramientas: Laptop,
  ia: Sparkles,
};

export function AiSectionsBriefForm({
  brief,
  onChange,
  canScopeToSection,
  staggerCount = 0,
}: AiSectionsBriefFormProps) {
  const [customInput, setCustomInput] = React.useState("");

  const toggleFocus = (id: string) => {
    const next = brief.focuses.includes(id)
      ? brief.focuses.filter((focus) => focus !== id)
      : [...brief.focuses, id];
    onChange({ focuses: next });
  };

  // Cada tarjeta ya trae su propia explicación (ver `ScopeCards`), así que la
  // ayuda del paso no repite la de la opción elegida: solo orienta antes de
  // elegir.
  const scopeHint = "Puedes crear dentro de la sección abierta o repartir varias secciones nuevas.";
  const styleHint =
    STYLE_OPTIONS.find((option) => option.value === brief.questionStyle)?.hint ??
    "Esto decide con qué responde el participante, no qué se le pregunta.";

  /**
   * Las preguntas se abren de a una, en el orden en que dejan de ser
   * adivinanzas: los temas no se pueden elegir sin saber dónde van a caer, y
   * el tamaño no se puede juzgar sin saber qué se está creando.
   *
   * El contexto (el último paso) tampoco es una decisión, pero sí depende de
   * que el tamaño ya diga algo: los contadores nacen en 0 —ninguno es una
   * respuesta real todavía— así que tocar cualquiera de ellos es lo que abre
   * la última pregunta, en vez de mostrarla junto al tamaño sin que nadie la
   * haya pedido.
   */
  const asksScope = canScopeToSection;
  const showFocuses = !asksScope || brief.scope !== null;
  const showStyle = showFocuses && brief.focuses.length > 0;
  const showSize = showStyle && brief.questionStyle !== null;
  const hasSize =
    brief.sectionCount > 0 ||
    brief.subsectionCount > 0 ||
    brief.subsubsectionCount > 0 ||
    brief.questionCount > 0;
  const showNotes = showSize && hasSize;

  const visibleSteps =
    (asksScope ? 1 : 0) +
    (showFocuses ? 1 : 0) +
    (showStyle ? 1 : 0) +
    (showSize ? 1 : 0) +
    (showNotes ? 1 : 0);

  // La primera pregunta solo existe cuando hay dos alcances posibles: sin
  // ella la lista tiene que empezar en 1 igualmente, no en 2.
  const offset = asksScope ? 1 : 0;

  /**
   * Cuánto espera cada paso antes de entrar. Cuando se revela uno solo entra
   * sin esperar; cuando se montan varios de golpe caen encadenados, que es la
   * diferencia entre una cascada y un parpadeo de la tarjeta entera.
   */
  const stepDelay = (ordinal: number) => (ordinal < staggerCount ? ordinal * 0.09 : 0);

  // Lleva la vista al paso recién abierto: la tarjeta crece hacia abajo y la
  // pregunta nueva puede nacer fuera de pantalla.
  const rootRef = React.useRef<HTMLDivElement>(null);
  const seenSteps = React.useRef(visibleSteps);
  React.useEffect(() => {
    if (visibleSteps <= seenSteps.current) {
      seenSteps.current = visibleSteps;
      return;
    }
    seenSteps.current = visibleSteps;
    const steps = rootRef.current?.querySelectorAll("[data-guided-step]");
    steps?.[steps.length - 1]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [visibleSteps]);

  return (
    <div ref={rootRef} className="flex flex-col gap-7">
      {asksScope && (
        <GuidedStep
          number={1}
          delay={stepDelay(0)}
          question="¿Dónde quieres que se cree?"
          help={scopeHint}
        >
          <ScopeCards
            options={SCOPE_OPTIONS}
            value={brief.scope}
            onChange={(value) => onChange({ scope: value })}
          />
        </GuidedStep>
      )}

      {showFocuses && (
      <GuidedStep
        number={offset + 1}
        delay={stepDelay(offset)}
        question="¿Qué temas debe cubrir?"
        help="Elige los frentes que de verdad importan ahora. Si el tuyo no está, escríbelo y lo añadimos."
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {/* Predefined focuses */}
            {AI_FOCUSES.map((focus, index) => {
              const isOn = brief.focuses.includes(focus.id);
              const Icon = FOCUS_ICONS[focus.id] || Target;
              // Un tema no tiene color propio, así que lo toma de su posición
              // — igual que las secciones raíz del builder. Una nube de veinte
              // pastillas grises no se lee; una con acentos, sí.
              const tone = toneForIndex(index);

              return (
                <button
                  key={focus.id}
                  type="button"
                  onClick={() => toggleFocus(focus.id)}
                  aria-pressed={isOn}
                  title={focus.hint}
                  style={isOn ? { ...toneChip(tone), borderColor: "currentColor" } : undefined}
                  className={cn(
                    "group relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold tracking-tight transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    isOn
                      ? "shadow-sm"
                      : "border-border/70 bg-surface text-text-secondary hover:-translate-y-0.5 hover:shadow-card"
                  )}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    strokeWidth={isOn ? 2.5 : 2}
                    style={isOn ? undefined : toneText(tone)}
                  />
                  {focus.label}
                </button>
              );
            })}
            
            {/* Custom focuses from brief */}
            {brief.focuses
              .filter((id) => !AI_FOCUSES.some((f) => f.id === id))
              .map((customId, index) => {
                const tone = toneForIndex(AI_FOCUSES.length + index);
                return (
                  <button
                    key={customId}
                    type="button"
                    onClick={() => toggleFocus(customId)}
                    aria-pressed={true}
                    style={{ ...toneChip(tone), borderColor: "currentColor" }}
                    className={cn(
                      "group relative flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold tracking-tight transition-all shadow-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    )}
                  >
                    <Target className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    {customId}
                  </button>
                );
              })}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="¿Otro frente? Escríbelo, por ejemplo: sostenibilidad"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customInput.trim()) {
                  e.preventDefault();
                  if (!brief.focuses.includes(customInput.trim())) {
                    toggleFocus(customInput.trim());
                  }
                  setCustomInput("");
                }
              }}
              className="flex h-10 w-full rounded-full border border-border/70 bg-surface px-4 py-2 text-[13px] placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => {
                if (customInput.trim() && !brief.focuses.includes(customInput.trim())) {
                  toggleFocus(customInput.trim());
                  setCustomInput("");
                }
              }}
              className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-border/70 bg-surface px-4 text-[13px] font-medium text-text-secondary transition-colors hover:bg-muted hover:text-text-primary disabled:opacity-50"
              disabled={!customInput.trim()}
            >
              <Plus className="h-4 w-4" /> Añadir
            </button>
          </div>
        </div>
      </GuidedStep>
      )}

      {showStyle && (
        <GuidedStep
          number={offset + 2}
          delay={stepDelay(offset + 1)}
          question="¿Cómo se responden?"
          help={styleHint}
        >
          <ScopeCards
            options={STYLE_OPTIONS}
            value={brief.questionStyle}
            onChange={(questionStyle) => onChange({ questionStyle })}
            layout="row"
          />
        </GuidedStep>
      )}

      {showSize && (
        <GuidedStep
          number={offset + 3}
          delay={stepDelay(offset + 2)}
          question="¿De qué tamaño?"
          help="Puedes ajustar todo después: nada de esto queda fijo."
        >
          <div className="flex flex-col gap-2">
            {brief.scope === "survey" && (
              <Counter
                icon={Layers}
                tone="brand"
                label="Secciones"
                value={brief.sectionCount}
                min={AI_BRIEF_LIMITS.sectionCount.min}
                max={AI_BRIEF_LIMITS.sectionCount.max}
                onChange={(sectionCount) => onChange({ sectionCount })}
              />
            )}
            <Counter
              icon={CornerDownRight}
              tone="brand"
              label={brief.scope === "survey" ? "Subsecciones por sección" : "Subsecciones"}
              value={brief.subsectionCount}
              min={AI_BRIEF_LIMITS.subsectionCount.min}
              max={AI_BRIEF_LIMITS.subsectionCount.max}
              onChange={(subsectionCount) => onChange({ subsectionCount })}
            />
            <Counter
              icon={Layers}
              tone="brand"
              label="Sub-subsecciones"
              value={brief.subsubsectionCount}
              min={AI_BRIEF_LIMITS.subsubsectionCount.min}
              max={AI_BRIEF_LIMITS.subsubsectionCount.max}
              onChange={(subsubsectionCount) => onChange({ subsubsectionCount })}
            />
            <Counter
              icon={Target}
              tone="brand"
              label="Preguntas por nivel final"
              value={brief.questionCount}
              min={AI_BRIEF_LIMITS.questionCount.min}
              max={AI_BRIEF_LIMITS.questionCount.max}
              onChange={(questionCount) => onChange({ questionCount })}
            />
          </div>
        </GuidedStep>
      )}

      {showNotes && (
        <GuidedStep
          number={offset + 4}
          delay={stepDelay(offset + 3)}
          question="¿Algo más que debamos tener en cuenta?"
          help="Opcional. Contexto extra: turnos rotativos, cambios de líder o temas a evitar."
        >
          <div className="flex flex-col gap-1">
            <textarea
              rows={3}
              value={brief.notes}
              maxLength={MAX_AI_NOTES_LENGTH}
              onChange={(event) => onChange({ notes: event.target.value })}
              placeholder="Ej: somos una operación con turnos rotativos, este año queremos entender la carga de trabajo del área comercial."
              className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-text-primary outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/25 placeholder:text-muted-foreground/70"
            />
            <p className="text-right text-[11px] font-medium tabular-nums text-text-muted">
              {brief.notes.length}/{MAX_AI_NOTES_LENGTH}
            </p>
          </div>
        </GuidedStep>
      )}
    </div>
  );
}

/**
 * The answer-style choice, as the same card the question editor uses for "Tipo
 * de pregunta" — this is the same decision, so it takes the same control, and
 * the same primary selected state, rather than a second vocabulary for it. The
 * gradient stays on what marks the panel as the AI one: its ring, its badge and
 * its title. Choosing something is not an AI-specific act.
 */
function StyleCards({
  options,
  value,
  onChange,
}: {
  options: readonly { value: AiQuestionStyle; label: string; icon: LucideIcon }[];
  /** `null` mientras la pregunta está sin contestar: ninguna tarjeta marcada. */
  value: AiQuestionStyle | null;
  onChange: (value: AiQuestionStyle) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ value: entryValue, label, icon: Icon }) => {
        const isSelected = value === entryValue;

        return (
          <button
            key={entryValue}
            type="button"
            onClick={() => onChange(entryValue)}
            aria-pressed={isSelected}
            className={cn(
              "flex min-w-[100px] flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border p-2 text-center transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              isSelected
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={isSelected ? 2.5 : 2} />
            <span className="text-[10px] font-semibold leading-tight">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Pill segmented control with the selection carried by a shared layout id. */
/**
 * Dónde se crea la estructura: dos tarjetas mutuamente excluyentes, con el
 * mismo lenguaje que "¿Qué tan exigentes deben ser las metas?" en el
 * generador de objetivos — icono, título, y la marca de radio a la vista en
 * vez de un toggle de texto. Es una elección, no un ajuste, así que se lee
 * como una tarjeta que se elige y no como una pastilla que se activa.
 */
function ScopeCards<T extends string>({
  options,
  value,
  onChange,
  layout = "grid",
}: {
  /** Every option carries a `tone` — `MagicCard` needs one to paint the
   *  selected state. `SCOPE_OPTIONS` hands it the same brand blue for both
   *  cards; `STYLE_OPTIONS` gives each response type the same accent the
   *  question editor's own "Tipo de pregunta" cards use, so a type reads as
   *  the same color everywhere it appears. */
  options: readonly { value: T; label: string; hint: string; icon: LucideIcon; tone: Tone }[];
  /** `null` mientras la pregunta está sin contestar: ninguna tarjeta marcada. */
  value: T | null;
  onChange: (value: T) => void;
  layout?: "grid" | "row";
}) {
  return (
    <div
      className={cn(
        "gap-3",
        layout === "grid"
          ? "grid sm:grid-cols-2"
          : // `overflow-x-auto` alone still clips the y-axis (CSS turns its
            // implicit `overflow-y: visible` into `auto`), so the hover lift's
            // upward translate and shadow need the same padding/negative-margin
            // buffer on top as the bottom one already has, or they get cut off.
            "flex w-full overflow-x-auto pt-2 -mt-2 pb-4 -mb-4 snap-x snap-mandatory"
      )}
    >
      {options.map(({ value: optionValue, label, hint, icon: Icon, tone }) => {
        const isSelected = optionValue === value;

        return (
          <MagicCard
            key={optionValue}
            isSelected={isSelected}
            tone={tone}
            onClick={() => onChange(optionValue)}
            className={cn(
              "min-h-[108px]",
              layout === "row" && "flex-1 min-w-[150px] snap-start"
            )}
            contentClassName="h-full flex-col items-start justify-between gap-3"
          >
            <div className="flex w-full items-start justify-between gap-2">
              <span
                className="flex size-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
                style={toneChip(tone)}
              >
                <Icon className="size-[18px]" strokeWidth={2.2} />
              </span>

              {/* La marca de radio: un círculo, no un cuadrado — esta
                  elección es excluyente, nunca se combinan las dos. */}
              <span
                aria-hidden
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  !isSelected && "border-border-strong/40"
                )}
                style={isSelected ? { borderColor: "currentColor" } : undefined}
              >
                {isSelected && <span className="size-2.5 rounded-full bg-current" />}
              </span>
            </div>

            <span className="flex flex-col gap-1">
              <span
                className="text-[13px] font-semibold leading-tight"
                style={isSelected ? toneText(tone) : { color: "var(--color-text-primary)" }}
              >
                {label}
              </span>
              <span className="text-[11.5px] leading-snug text-text-secondary">{hint}</span>
            </span>
          </MagicCard>
        );
      })}
    </div>
  );
}

/**
 * A count, adjusted a step at a time with the buttons — which still respect
 * `min`/`max` for a sane nudge — or typed directly, which doesn't: someone
 * who knows they want 20 questions shouldn't be capped at whatever the
 * button's ceiling is.
 */
function Counter({
  icon: Icon,
  tone,
  label,
  value,
  min,
  max,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** El acento del nivel que cuenta esta fila. */
  tone: Tone;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  // Typing "12" passes through "1" first — a local draft absorbs that
  // half-typed state instead of forcing it through `onChange` and back.
  const [draft, setDraft] = React.useState(String(value));
  const isEditing = React.useRef(false);

  React.useEffect(() => {
    if (!isEditing.current) setDraft(String(value));
  }, [value]);

  const commit = () => {
    isEditing.current = false;
    // Floored at 0, not `min`: 0 is the deliberate "untouched" value every
    // counter starts at, and typing it back in must stick — bumping it up
    // to `min` on blur would make 0 impossible to type.
    const parsed = Number.parseInt(draft, 10);
    const next = Number.isFinite(parsed) ? Math.max(0, parsed) : value;
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface px-3 py-2">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={toneChip(tone)}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
      </span>
      <p className="min-w-0 flex-1 truncate text-[12.5px] font-semibold tracking-tight text-text-primary">
        {label}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <StepButton
          ariaLabel={`Disminuir ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </StepButton>
        <input
          type="text"
          inputMode="numeric"
          aria-label={label}
          value={draft}
          onFocus={() => {
            isEditing.current = true;
          }}
          onChange={(event) => setDraft(event.target.value.replace(/[^0-9]/g, ""))}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className="w-9 rounded-md border border-transparent bg-transparent py-0.5 text-center text-[13px] font-bold tabular-nums text-text-primary outline-none transition-colors focus:border-primary/40 focus:bg-primary/5"
        />
        <StepButton
          ariaLabel={`Aumentar ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  ariaLabel,
  disabled,
  onClick,
  children,
}: {
  ariaLabel: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 text-text-secondary transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-border/60 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
    >
      {children}
    </button>
  );
}
