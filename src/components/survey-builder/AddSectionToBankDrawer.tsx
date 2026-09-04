import * as React from "react";
import { BookPlus, ListChecks, type LucideIcon } from "lucide-react";
import { DrawerShell } from "@/components/overlays/DrawerShell";
import { DrawerSection } from "@/components/overlays/DrawerSection";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toneBar, toneBorder, toneChip, toneSelected, toneWash } from "@/lib/tone";
import { BankTypeSelect } from "./BankTypeSelect";
import { questionBankData } from "./questionBankData";
import type { SurveySection } from "./surveyBuilderTypes";

const pluralize = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

export interface SaveSectionToBankInput {
  typeId: string;
  sectionName: string;
  /** Solo las preguntas directas de la sección que el autor dejó marcadas. */
  questions: readonly string[];
}

export interface AddSectionToBankDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: SurveySection | null;
  onSave: (input: SaveSectionToBankInput) => void;
}

type SaveScope = "section-only" | "with-questions";

const SCOPE_OPTIONS: ReadonlyArray<{
  value: SaveScope;
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    value: "section-only",
    icon: BookPlus,
    title: "Solo la sección",
    description: "Se guarda vacía, sin preguntas.",
  },
  {
    value: "with-questions",
    icon: ListChecks,
    title: "La sección y sus preguntas",
    description: "Elige cuáles de sus preguntas quieres guardar también.",
  },
];

/** Texto plano de una pregunta, igual que en el resto del builder. */
const plainStatement = (statement: string) => statement.replace(/<[^>]*>?/gm, "").trim();

/**
 * "Guardar sección en el banco": siempre crea una sección nueva bajo el tipo
 * elegido — nunca se fusiona con una existente — y, si la sección tiene
 * preguntas propias, deja elegir cuáles de esas (solo las directas, el banco
 * no tiene subsecciones) se guardan junto con ella.
 */
export function AddSectionToBankDrawer({ open, onOpenChange, section, onSave }: AddSectionToBankDrawerProps) {
  const [session, setSession] = React.useState({ open, count: 0 });
  if (session.open !== open) {
    setSession({ open, count: open ? session.count + 1 : session.count });
  }

  if (!section) return null;

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Guardar sección en el banco"
      description="Se crea como una sección nueva dentro del tipo de encuesta que elijas."
      size="lg"
      disablePadding
    >
      <AddSectionToBankBody
        key={session.count}
        section={section}
        onSave={onSave}
        onClose={() => onOpenChange(false)}
      />
    </DrawerShell>
  );
}

function AddSectionToBankBody({
  section,
  onSave,
  onClose,
}: {
  section: SurveySection;
  onSave: (input: SaveSectionToBankInput) => void;
  onClose: () => void;
}) {
  const directQuestions = section.questions;
  const hasQuestions = directQuestions.length > 0;

  const [typeId, setTypeId] = React.useState(questionBankData[0].id);
  const [sectionName, setSectionName] = React.useState(section.title.trim());
  const [scope, setScope] = React.useState<SaveScope>(hasQuestions ? "with-questions" : "section-only");
  const [checkedIds, setCheckedIds] = React.useState<ReadonlySet<string>>(
    () => new Set(directQuestions.map((question) => question.id))
  );

  const toggleQuestion = (id: string) => {
    const next = new Set(checkedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedIds(next);
  };

  const canSave = sectionName.trim() !== "";

  const handleSave = () => {
    if (!canSave) return;
    const questions =
      scope === "with-questions"
        ? directQuestions
            .filter((question) => checkedIds.has(question.id))
            .map((question) => plainStatement(question.statement))
            .filter((text) => text !== "")
        : [];

    onSave({ typeId, sectionName: sectionName.trim(), questions });
    onClose();
  };

  return (
    <div className="flex flex-1 flex-col gap-3 bg-background p-4">
      <DrawerSection
        icon={BookPlus}
        tone="brand"
        title="Datos de la sección"
        hint="Se guarda como una sección nueva, con el nombre y el tipo que elijas."
      >
        <div className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-text-secondary">Nombre en el banco</span>
            <Input
              value={sectionName}
              onChange={(event) => setSectionName(event.target.value)}
              placeholder="Nombre de la sección"
              className="border-border/60 bg-surface text-[13px]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-text-secondary">Tipo de encuesta</span>
            <BankTypeSelect value={typeId} onChange={setTypeId} />
          </label>
        </div>
      </DrawerSection>

      {hasQuestions && (
        <DrawerSection
          icon={ListChecks}
          tone="brand"
          title="Qué quieres guardar"
          hint="Guarda solo la sección, o también las preguntas que elijas de ella."
        >
          <div className="flex flex-col gap-3">
            <fieldset className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background p-2">
              <legend className="sr-only">Qué quieres guardar</legend>
              {SCOPE_OPTIONS.map((option) => (
                <ScopeOptionRow key={option.value} {...option} selected={scope === option.value} onSelect={() => setScope(option.value)} />
              ))}
            </fieldset>

            {scope === "with-questions" && (
              <div className="flex flex-col gap-2">
                <span className="px-0.5 text-[12px] font-semibold text-text-secondary">
                  {pluralize(directQuestions.length, "pregunta de la sección", "preguntas de la sección")}
                </span>

                <div className="rounded-xl border border-border/60 bg-background p-2">
                  <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
                    {directQuestions.map((question) => {
                      const isChecked = checkedIds.has(question.id);
                      return (
                        <li key={question.id}>
                          <label
                            style={isChecked ? { ...toneBorder("brand", 45), ...toneWash("brand", 7) } : undefined}
                            className={cn(
                              "group relative flex cursor-pointer items-start gap-2.5 overflow-hidden rounded-xl border bg-surface py-2.5 pl-3.5 pr-3 transition-colors",
                              "focus-within:ring-2 focus-within:ring-primary/25",
                              isChecked ? "shadow-card" : "border-border/60 hover:bg-surface-muted"
                            )}
                          >
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[3px] transition-colors"
                              style={toneBar("brand", isChecked ? 100 : 40)}
                            />
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggleQuestion(question.id)}
                              className="relative z-[1] mt-0.5 shrink-0"
                            />
                            <span className="relative z-[1] min-w-0 text-[13px] font-medium leading-snug text-text-primary">
                              {plainStatement(question.statement) || "Sin enunciado"}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </DrawerSection>
      )}

      {/* Barra de acciones a sangre, igual que la del banco de preguntas. */}
      <div className="-mx-4 -mb-4 mt-auto flex shrink-0 items-center justify-end gap-2 border-t border-border/60 bg-surface px-4 py-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          Guardar en el banco
        </Button>
      </div>
    </div>
  );
}

/**
 * Una fila de opción como las del centro de descargas: chip de icono, título,
 * descripción y un radio propio a la derecha — la tarjeta entera es el botón.
 */
function ScopeOptionRow({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={selected ? toneSelected("brand") : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/30",
        selected ? "shadow-sm" : "border-border/60 bg-surface hover:bg-muted/40"
      )}
    >
      <span
        style={selected ? toneChip("brand") : undefined}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          !selected && "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-tight text-text-primary">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-text-secondary">{description}</span>
      </span>
      <span
        aria-hidden
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-primary" : "border-border"
        )}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
    </button>
  );
}
