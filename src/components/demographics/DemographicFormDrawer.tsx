import * as React from "react";
import { Check, GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetFooter } from "@/components/ui/sheet";
import { DrawerShell } from "@/components/overlays/DrawerShell";
import { MagicCard } from "@/components/ui/magic-card";
import { DEMOGRAPHIC_TYPES } from "@/components/survey-builder/demographics";
import {
  createLibraryDemographic,
  updateLibraryDemographic,
} from "@/components/survey-builder/demographicsLibrary";
import type { DemographicType } from "@/components/survey-builder/surveyBuilderTypes";

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

/** How the answer type reads in one line, next to its name. */
const TYPE_HINTS: Readonly<Record<DemographicType, string>> = {
  single: "Una sola respuesta, con todas las opciones a la vista",
  dropdown: "Una sola respuesta, en una lista plegada",
  multiple: "Permite elegir varias opciones a la vez",
};

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
        <SheetFooter className="border-t bg-background px-6 py-4">
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
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
      <div className="flex flex-col gap-7 px-6 py-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="demographic-label" className="text-[13px] font-bold text-text-primary">
            Nombre del dato demográfico
          </label>
          <Input
            id="demographic-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="Ej. Tipo de jornada"
            aria-invalid={duplicate || (attempted && missingLabel)}
            className={cn(
              "h-10",
              (duplicate || (attempted && missingLabel)) && "border-status-negative"
            )}
          />
          {duplicate ? (
            <span className="text-[12px] font-medium text-status-negative">
              Ya existe un demográfico con este nombre. Dos con el mismo nombre serían
              indistinguibles en los filtros.
            </span>
          ) : attempted && missingLabel ? (
            <span className="text-[12px] font-medium text-status-negative">
              Ponle un nombre para poder {isEdit ? "guardarlo" : "crearlo"}.
            </span>
          ) : (
            <span className="text-[12px] text-muted-foreground">
              Es lo que verán los participantes y lo que aparecerá en los filtros de resultados.
            </span>
          )}
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[13px] font-bold text-text-primary">
            Tipo de respuesta
          </legend>
          <div className="flex flex-wrap gap-2">
            {DEMOGRAPHIC_TYPES.map((entry) => {
              const Icon = entry.icon;
              const selected = type === entry.value;
              return (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => setType(entry.value)}
                  className={cn(
                    "flex flex-1 min-w-[100px] flex-col items-center justify-center gap-1.5 rounded-lg border p-2 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    selected
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={selected ? 2.5 : 2} />
                  <span className="text-[10px] font-semibold leading-tight">{entry.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-text-primary">Opciones de respuesta</span>
          <span className="mb-1 text-[12px] text-muted-foreground">
            Cada opción es un grupo por el que podrás cortar los resultados, así que conviene que
            sean pocas y claras.
          </span>

          <div className="flex flex-col gap-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                <Input
                  value={option}
                  onChange={(event) => update(index, event.target.value)}
                  placeholder={`Opción ${index + 1}`}
                  aria-label={`Opción ${index + 1}`}
                  className="h-10"
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={options.length <= MIN_OPTIONS}
                  aria-label={`Eliminar opción ${index + 1}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-status-negative disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className="mt-1 gap-2 self-start"
            onClick={() => setOptions([...options, ""])}
          >
            <Plus className="h-4 w-4" />
            Agregar opción
          </Button>

          {attempted && notEnoughOptions && (
            <span className="mt-2 text-[12px] font-medium text-status-negative">
              Necesitas al menos {MIN_OPTIONS} opciones con texto: una sola no es una elección.
            </span>
          )}
          {duplicateOption && (
            <span className="mt-2 text-[12px] font-medium text-status-negative">
              Hay opciones repetidas. Dos grupos con el mismo nombre no se pueden distinguir en los
              resultados.
            </span>
          )}
        </div>
      </div>
    </DrawerShell>
  );
}
