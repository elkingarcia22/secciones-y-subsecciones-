import * as React from "react";
import { BookPlus, MessageSquareQuote, Plus } from "lucide-react";
import { DrawerShell } from "@/components/overlays/DrawerShell";
import { DrawerSection } from "@/components/overlays/DrawerSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toneBar, toneChip, toneText } from "@/lib/tone";
import { BankTypeSelect } from "./BankTypeSelect";
import { questionBankData } from "./questionBankData";
import { useQuestionBankLibrary } from "./questionBankLibrary";

const NEW_SECTION_VALUE = "__new-section__";

export interface SaveQuestionToBankInput {
  typeId: string;
  sectionId?: string;
  newSectionName?: string;
}

export interface AddQuestionToBankDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** El enunciado en texto plano, tal como se guardará en el banco. */
  statement: string;
  onSave: (input: SaveQuestionToBankInput) => void;
}

/**
 * "Guardar en el banco de preguntas" para una sola pregunta: mismo mundo
 * visual que el `QuestionBankDrawer` de explorar, pero mucho más chico — es
 * un formulario de dos decisiones, no un catálogo para recorrer.
 */
export function AddQuestionToBankDrawer({ open, onOpenChange, statement, onSave }: AddQuestionToBankDrawerProps) {
  const [session, setSession] = React.useState({ open, count: 0 });
  if (session.open !== open) {
    setSession({ open, count: open ? session.count + 1 : session.count });
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title="Guardar pregunta en el banco"
      description="Elige a qué tipo de encuesta y sección del banco pertenece esta pregunta."
      size="lg"
      disablePadding
    >
      <AddQuestionToBankBody
        key={session.count}
        statement={statement}
        onSave={onSave}
        onClose={() => onOpenChange(false)}
      />
    </DrawerShell>
  );
}

function AddQuestionToBankBody({
  statement,
  onSave,
  onClose,
}: {
  statement: string;
  onSave: (input: SaveQuestionToBankInput) => void;
  onClose: () => void;
}) {
  const types = useQuestionBankLibrary();
  const [typeId, setTypeId] = React.useState(questionBankData[0].id);
  const currentType = types.find((type) => type.id === typeId) ?? types[0];

  const [sectionValue, setSectionValue] = React.useState<string>(
    currentType.sections[0]?.id ?? NEW_SECTION_VALUE
  );
  const [newSectionName, setNewSectionName] = React.useState("");

  const isNewSection = sectionValue === NEW_SECTION_VALUE;
  const canSave = isNewSection ? newSectionName.trim() !== "" : sectionValue !== "";

  const handleTypeChange = (value: string) => {
    setTypeId(value);
    const nextType = types.find((type) => type.id === value);
    setSectionValue(nextType?.sections[0]?.id ?? NEW_SECTION_VALUE);
    setNewSectionName("");
  };

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      typeId,
      sectionId: isNewSection ? undefined : sectionValue,
      newSectionName: isNewSection ? newSectionName.trim() : undefined,
    });
    onClose();
  };

  return (
    <div className="flex flex-1 flex-col gap-3 bg-background p-4">
      <DrawerSection
        icon={BookPlus}
        tone="brand"
        title="Datos de la pregunta"
        hint="Elige a qué tipo de encuesta y sección del banco pertenece."
      >
        <div className="flex flex-col gap-3.5">
          <div className="relative flex gap-3 overflow-hidden rounded-xl border border-border/60 bg-surface-muted/50 py-3 pl-4 pr-3.5">
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[3px]" style={toneBar("brand")} />
            <span
              aria-hidden
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-border/40"
              style={toneChip("brand")}
            >
              <MessageSquareQuote className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Pregunta</p>
              <p className="mt-1 text-[13.5px] font-medium leading-snug text-text-primary">
                {statement || "Sin enunciado"}
              </p>
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-text-secondary">Tipo de encuesta</span>
            <BankTypeSelect value={typeId} onChange={handleTypeChange} />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-semibold text-text-secondary">Sección</span>
            <Select value={sectionValue} onValueChange={setSectionValue}>
              <SelectTrigger className="h-9 w-full border-border/60 bg-surface text-[13px]">
                <SelectValue placeholder="Selecciona la sección" />
              </SelectTrigger>
              <SelectContent>
                {currentType.sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.name}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={NEW_SECTION_VALUE}>
                  <span className="flex items-center gap-1.5 font-semibold" style={toneText("brand")}>
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    Crear sección nueva
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </label>

          {isNewSection && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-semibold text-text-secondary">Nombre de la sección nueva</span>
              <Input
                value={newSectionName}
                onChange={(event) => setNewSectionName(event.target.value)}
                placeholder="Escribe el nombre de la sección"
                className="border-border/60 bg-surface text-[13px]"
                autoFocus
              />
            </label>
          )}
        </div>
      </DrawerSection>

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
