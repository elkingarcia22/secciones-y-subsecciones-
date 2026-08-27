import * as React from "react";
import { Check, GripVertical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetFooter } from "@/components/ui/sheet";
import { DrawerShell } from "@/components/overlays/DrawerShell";
import { DEMOGRAPHIC_TYPES } from "@/components/survey-builder/demographics";
import { createLibraryDemographic } from "@/components/survey-builder/demographicsLibrary";
import type { DemographicType } from "@/components/survey-builder/surveyBuilderTypes";

interface CreateDemographicDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fires after a demographic is stored, with its wording. */
  onCreated: (label: string) => void;
  /** Names already taken across both catalogs, to refuse a duplicate early. */
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
 * Creating a demographic: one form, in one drawer.
 *
 * Not a stepped wizard — a demographic is a name, a way of answering and a
 * short list of values. Three fields do not need three screens, and splitting
 * them would hide the options from the name while you word them, which is
 * exactly when you want both in view.
 */
export function CreateDemographicDrawer({
  open,
  onOpenChange,
  onCreated,
  takenNames,
}: CreateDemographicDrawerProps) {
  const [label, setLabel] = React.useState("");
  const [type, setType] = React.useState<DemographicType>("single");
  const [options, setOptions] = React.useState<readonly string[]>(["", ""]);
  /** Errors stay quiet until a submit is attempted, so an empty form is calm. */
  const [attempted, setAttempted] = React.useState(false);

  // A fresh drawer every time it opens: a half-written demographic surviving a
  // close would reappear as somebody else's draft with no way to tell why.
  React.useEffect(() => {
    if (!open) return;
    setLabel("");
    setType("single");
    setOptions(["", ""]);
    setAttempted(false);
  }, [open]);

  const trimmedLabel = label.trim();
  const duplicate =
    trimmedLabel !== "" && takenNames.some((name) => fold(name) === fold(trimmedLabel));
  const filledOptions = options.map((option) => option.trim()).filter((option) => option !== "");
  const duplicateOption = new Set(filledOptions.map(fold)).size !== filledOptions.length;

  const missingLabel = trimmedLabel === "";
  const notEnoughOptions = filledOptions.length < MIN_OPTIONS;
  const canCreate = !missingLabel && !duplicate && !notEnoughOptions && !duplicateOption;

  const handleCreate = () => {
    setAttempted(true);
    if (!canCreate) return;

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
    onCreated(created.label);
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
      title="Crear dato demográfico"
      description="Quedará disponible para segmentar los resultados de cualquier encuesta"
      size="xl"
      // `size` only sets a max-width, and the sheet's own
      // `data-[side=right]:sm:max-w-sm` outranks it by specificity — so the
      // width has to be forced here. Capped at 92vw for a small screen.
      className="!w-[min(620px,92vw)] !max-w-[min(620px,92vw)]"
      disablePadding
      footer={
        <SheetFooter className="border-t bg-background px-6 py-4">
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="gap-2" onClick={handleCreate}>
              <Check className="h-4 w-4" />
              Crear demográfico
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
              Ponle un nombre para poder crearlo.
            </span>
          ) : (
            <span className="text-[12px] text-muted-foreground">
              Es lo que verán los participantes y lo que aparecerá en los filtros de resultados.
            </span>
          )}
        </div>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-1 text-[13px] font-bold text-text-primary">
            Forma de responder
          </legend>
          {DEMOGRAPHIC_TYPES.map((entry) => {
            const Icon = entry.icon;
            const selected = type === entry.value;
            return (
              <button
                key={entry.value}
                type="button"
                onClick={() => setType(entry.value)}
                aria-pressed={selected}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all",
                  selected
                    ? "border-primary bg-primary/[0.04] shadow-[0_0_0_1px_theme(colors.brand.DEFAULT)]"
                    : "border-border bg-surface hover:border-border hover:bg-muted/40"
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                    selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] font-bold text-text-primary">{entry.label}</span>
                  <span className="mt-0.5 text-[12px] text-muted-foreground">
                    {TYPE_HINTS[entry.value]}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    selected ? "border-primary" : "border-border"
                  )}
                >
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                </span>
              </button>
            );
          })}
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
