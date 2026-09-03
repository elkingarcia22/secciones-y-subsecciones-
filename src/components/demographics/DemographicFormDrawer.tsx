import * as React from "react";
import { Check, ListChecks, ListOrdered, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toneAccent, toneChip } from "@/lib/tone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetFooter } from "@/components/ui/sheet";
import { DrawerShell } from "@/components/overlays/DrawerShell";
import { DEMOGRAPHIC_TYPES, demographicTypeTone } from "@/components/survey-builder/demographics";
import {
  createLibraryDemographic,
  updateLibraryDemographic,
} from "@/components/survey-builder/demographicsLibrary";
import type { DemographicType } from "@/components/survey-builder/surveyBuilderTypes";
import { FormSection } from "./FormSection";
import { TYPE_HINTS } from "./demographicTypeHints";

/** The entry being edited — enough to prefill the form and save back over it. */
export interface EditingDemographic {
  key: string;
  label: string;
  type: DemographicType;
  optionLabels: readonly string[];
}

interface DemographicFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  /** Required when `mode` is "edit". */
  editing?: EditingDemographic | null;
  /** Fires after the demographic is stored, with its final wording. */
  onSaved: (label: string) => void;
  /** Names already taken across both catalogs — excluding the entry being edited. */
  takenNames: readonly string[];
}

/** Two is the floor: a single option is not a choice. */
const MIN_OPTIONS = 2;

const fold = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/**
 * Creating or editing a demographic: one form, in one drawer.
 *
 * Not a stepped wizard — a demographic is a name, a way of answering and a
 * short list of values. Three fields do not need three screens, and splitting
 * them would hide the options from the name while you word them, which is
 * exactly when you want both in view. Editing reuses the same shape: nothing
 * about wording a demographic changes once it already has answers attached.
 */
export function DemographicFormDrawer({
  open,
  onOpenChange,
  mode,
  editing = null,
  onSaved,
  takenNames,
}: DemographicFormDrawerProps) {
  const [label, setLabel] = React.useState("");
  const [type, setType] = React.useState<DemographicType>("single");
  const [options, setOptions] = React.useState<readonly string[]>(["", ""]);
  /** Errors stay quiet until a submit is attempted, so an empty form is calm. */
  const [attempted, setAttempted] = React.useState(false);

  const isEdit = mode === "edit";

  // A fresh drawer every time it opens: a half-written demographic surviving a
  // close would reappear as somebody else's draft with no way to tell why.
  // Editing starts from the entry's own wording instead of a blank form.
  React.useEffect(() => {
    if (!open) return;
    if (isEdit && editing) {
      setLabel(editing.label);
      setType(editing.type);
      setOptions(editing.optionLabels.length > 0 ? editing.optionLabels : ["", ""]);
    } else {
      setLabel("");
      setType("single");
      setOptions(["", ""]);
    }
    setAttempted(false);
  }, [open, isEdit, editing]);

  const trimmedLabel = label.trim();
  const duplicate =
    trimmedLabel !== "" && takenNames.some((name) => fold(name) === fold(trimmedLabel));
  const filledOptions = options.map((option) => option.trim()).filter((option) => option !== "");
  const duplicateOption = new Set(filledOptions.map(fold)).size !== filledOptions.length;

  const missingLabel = trimmedLabel === "";
  const notEnoughOptions = filledOptions.length < MIN_OPTIONS;
  const canSave = !missingLabel && !duplicate && !notEnoughOptions && !duplicateOption;

  const handleSave = () => {
    setAttempted(true);
    if (!canSave) return;

    if (isEdit && editing) {
      const updated = updateLibraryDemographic(editing.key, {
        label: trimmedLabel,
        type,
        optionLabels: filledOptions,
      });
      if (!updated) {
        toast.error("No se pudo guardar el demográfico", {
          description: "Revisa que el nombre no esté repetido.",
        });
        return;
      }
      toast.success("Demográfico actualizado", {
        description: `“${updated.label}” se actualizó correctamente.`,
      });
      onSaved(updated.label);
      onOpenChange(false);
      return;
    }

    const created = createLibraryDemographic({
      label: trimmedLabel,
      type,
      optionLabels: filledOptions,
    });
    if (!created) {
      toast.error("No se pudo crear el demográfico", {
        description: "Revisa que el nombre no esté repetido.",
      });
      return;
    }
    toast.success("Demográfico creado", {
      description: `“${created.label}” ya está disponible para segmentar.`,
    });
    onSaved(created.label);
    onOpenChange(false);
  };

  const update = (index: number, value: string) =>
    setOptions(options.map((option, position) => (position === index ? value : option)));
  const remove = (index: number) =>
    setOptions(options.filter((_, position) => position !== index));

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Editar dato demográfico" : "Crear dato demográfico"}
      description={
        isEdit
          ? "Los cambios se reflejarán en los filtros de resultados que ya lo usan."
          : "Quedará disponible para segmentar los resultados de cualquier encuesta"
      }
      size="xl"
      // `size` solo fija un max-width; este drawer necesita además un ancho
      // exacto, así que se fuerza aquí. Tope de 92vw para pantallas pequeñas.
      className="!w-[min(620px,92vw)] !max-w-[min(620px,92vw)]"
      disablePadding
      footer={
        <SheetFooter className="border-t border-border/60 bg-surface px-4 py-3">
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="gap-2" onClick={handleSave}>
              <Check className="h-4 w-4" />
              {isEdit ? "Guardar cambios" : "Crear demográfico"}
            </Button>
          </div>
        </SheetFooter>
      }
    >
      {/* Cada parte del demográfico —cómo se llama, cómo se responde, qué se
          puede responder— en su propia tarjeta sobre el fondo del drawer, en
          vez de tres bloques de campos flotando en una misma superficie. El
          tono del tipo elegido tiñe los dos grupos que dependen de él. */}
      <div className="flex min-h-full flex-col gap-3 bg-background p-4">
        <FormSection
          icon={Tag}
          tone="brand"
          title="Nombre del dato demográfico"
          hint="Es lo que verán los participantes y lo que aparecerá en los filtros de resultados."
        >
          <Input
            id="demographic-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Ej. Tipo de jornada"
            aria-label="Nombre del dato demográfico"
            aria-invalid={duplicate || (attempted && missingLabel)}
            className={cn(
              "h-10 border-border/60 bg-surface",
              (duplicate || (attempted && missingLabel)) && "border-status-negative"
            )}
          />
          {duplicate ? (
            <span className="mt-2 block text-[12px] font-medium text-status-negative">
              Ya existe un demográfico con este nombre. Dos con el mismo nombre serían
              indistinguibles en los filtros.
            </span>
          ) : attempted && missingLabel ? (
            <span className="mt-2 block text-[12px] font-medium text-status-negative">
              Ponle un nombre para poder {isEdit ? "guardarlo" : "crearlo"}.
            </span>
          ) : null}
        </FormSection>

        <FormSection
          icon={ListChecks}
          tone="brand"
          title="Tipo de respuesta"
          hint={TYPE_HINTS[type]}
        >
          {/* Las mismas tarjetas de tipo que el editor de demográficos dentro
              de la encuesta: grises en reposo y teñidas solo al elegirlas. */}
          <div className="flex flex-wrap gap-2">
            {DEMOGRAPHIC_TYPES.map((entry) => {
              const Icon = entry.icon;
              const selected = type === entry.value;
              const entryTone = demographicTypeTone(entry.value);
              const accent = toneAccent(entryTone);
              return (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => setType(entry.value)}
                  style={
                    {
                      "--tone": accent,
                      ...(selected
                        ? {
                            borderColor: `color-mix(in srgb, ${accent} 55%, transparent)`,
                            backgroundColor: `color-mix(in srgb, ${accent} 7%, transparent)`,
                            color: accent,
                          }
                        : null),
                    } as React.CSSProperties
                  }
                  className={cn(
                    "flex min-w-[100px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    selected ? "shadow-sm" : "tone-hover border-border/60 bg-surface text-text-secondary"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-lg",
                      !selected && "tone-reveal-chip"
                    )}
                    style={selected ? toneChip(entryTone) : undefined}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="text-[10.5px] font-semibold leading-tight">{entry.label}</span>
                </button>
              );
            })}
          </div>
        </FormSection>

        <FormSection
          icon={ListOrdered}
          tone="brand"
          title="Opciones de respuesta"
          hint="Cada opción es un grupo por el que podrás cortar los resultados, así que conviene que sean pocas y claras."
          badge={`${options.length}`}
        >
          {/* La lista vive sobre el fondo gris, dentro de su marco: las filas
              se leen como un grupo y no como campos sueltos en la tarjeta. */}
          <div className="rounded-xl border border-border/60 bg-background p-2.5">
            <ul className="flex flex-col gap-2">
              {options.map((option, index) => (
                <li key={index} className="flex items-center gap-2.5">
                  <span className="w-4 shrink-0 text-right text-[11px] font-semibold tabular-nums text-text-muted">
                    {index + 1}
                  </span>
                  <Input
                    value={option}
                    onChange={(event) => update(index, event.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    aria-label={`Opción ${index + 1}`}
                    className="h-9 min-w-0 flex-1 border-border/60 bg-surface text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={options.length <= MIN_OPTIONS}
                    aria-label={`Eliminar opción ${index + 1}`}
                    className={cn(
                      "shrink-0 rounded-lg border border-status-negative/30 bg-status-negative/5 p-2 text-status-negative transition-all",
                      "hover:border-status-negative/40 hover:bg-status-negative/10",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-negative/30",
                      "disabled:cursor-not-allowed disabled:border-border/60 disabled:bg-transparent disabled:text-text-muted disabled:opacity-40"
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              className="mt-2.5 h-8 w-full gap-2 border-dashed"
              onClick={() => setOptions([...options, ""])}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar opción
            </Button>
          </div>

          {attempted && notEnoughOptions && (
            <span className="mt-2 block text-[12px] font-medium text-status-negative">
              Necesitas al menos {MIN_OPTIONS} opciones con texto: una sola no es una elección.
            </span>
          )}
          {duplicateOption && (
            <span className="mt-2 block text-[12px] font-medium text-status-negative">
              Hay opciones repetidas. Dos grupos con el mismo nombre no se pueden distinguir en los
              resultados.
            </span>
          )}
        </FormSection>
      </div>
    </DrawerShell>
  );
}
