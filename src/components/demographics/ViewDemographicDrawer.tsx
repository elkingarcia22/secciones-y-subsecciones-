import * as React from "react";
import { Calendar, Copy, ListOrdered, Pencil, Tag, Trash2, User as UserIcon } from "lucide-react";
import { toneChip } from "@/lib/tone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { DrawerShell } from "@/components/overlays/DrawerShell";
import { DEMOGRAPHIC_TYPES, demographicTypeTone } from "@/components/survey-builder/demographics";
import { FormSection } from "./FormSection";
import { TYPE_HINTS } from "./demographicTypeHints";
import { formatIsoDay, type DemographicRow } from "./demographicRows";

interface ViewDemographicDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The row being inspected. Null while closed, or right after its source disappears. */
  demographic: DemographicRow | null;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * A read-only look at one demographic — what clicking its name, or "Ver" in
 * the rail, opens. Same card anatomy as `DemographicFormDrawer` (icon chip,
 * title, hint, divider, content) so the two drawers read as one product;
 * editing itself stays in that other drawer, so a system demographic (which
 * can't be edited) is just as much at home here as an author's own.
 */
export function ViewDemographicDrawer({
  open,
  onOpenChange,
  demographic,
  onEdit,
  onDuplicate,
  onDelete,
}: ViewDemographicDrawerProps) {
  // The parent nulls `demographic` in the same tick it closes the drawer, so
  // reacting to that directly with an early `return null` would unmount the
  // Sheet mid-close and skip its exit animation entirely. Keeping the last
  // non-null row around lets the drawer keep rendering real content while it
  // animates out.
  const [lastDemographic, setLastDemographic] = React.useState(demographic);
  React.useEffect(() => {
    if (demographic) setLastDemographic(demographic);
  }, [demographic]);

  const shown = demographic ?? lastDemographic;
  if (!shown) return null;

  const typeEntry = DEMOGRAPHIC_TYPES.find((entry) => entry.value === shown.type);
  const TypeIcon = typeEntry?.icon ?? ListOrdered;
  const isSystem = shown.origin === "system";
  // Independent from the cards' own icon chips (always blue, see below): this
  // is what makes the type pill itself read as "single" vs. "dropdown" vs.
  // "multiple" at a glance.
  const typeTone = demographicTypeTone(shown.type);

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={shown.name}
      description="Detalle del dato demográfico"
      size="xl"
      className="!w-[min(620px,92vw)] !max-w-[min(620px,92vw)]"
      disablePadding
      footer={
        <SheetFooter className="border-t border-border/60 bg-surface px-4 py-3">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {!isSystem && (
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    onDelete(shown.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  onOpenChange(false);
                  onDuplicate(shown.id);
                }}
              >
                <Copy className="h-4 w-4" />
                Duplicar
              </Button>
            </div>
            {!isSystem && (
              <Button
                className="gap-2"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(shown.id);
                }}
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </SheetFooter>
      }
    >
      <div className="flex min-h-full flex-col gap-3 bg-background p-4">
        <FormSection
          icon={Tag}
          tone="brand"
          title="Origen del dato demográfico"
          hint={
            isSystem
              ? "Variable propia de la plataforma: sus opciones son fijas porque alimentan datos que ya tiene de cada participante."
              : "Creado por una persona de tu equipo para segmentar los resultados."
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isSystem ? "info" : "neutral"}>{shown.originLabel}</Badge>
          </div>

          {(shown.createdAt !== null || shown.createdBy !== null) && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-border/60 bg-background p-3">
              {shown.createdAt !== null && (
                <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                  <Calendar className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                  Creado el {formatIsoDay(shown.createdAt)}
                </div>
              )}
              {shown.createdBy !== null && (
                <div className="flex items-center gap-2 text-[13px] text-text-secondary">
                  <UserIcon className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
                  {shown.createdBy}
                </div>
              )}
            </div>
          )}
        </FormSection>

        <FormSection icon={TypeIcon} tone="brand" title="Tipo de respuesta" hint={TYPE_HINTS[shown.type]}>
          <div
            style={toneChip(typeTone)}
            className="flex items-center gap-2.5 rounded-xl border border-border/60 px-3.5 py-2.5 text-[13px] font-semibold"
          >
            <TypeIcon className="h-4 w-4 shrink-0" strokeWidth={2} />
            {shown.typeLabel}
          </div>
        </FormSection>

        <FormSection
          icon={ListOrdered}
          tone="brand"
          title="Opciones de respuesta"
          hint="Los valores que los participantes pueden elegir al responder."
          badge={`${shown.optionLabels.length}`}
        >
          <div className="rounded-xl border border-border/60 bg-background p-2.5">
            <ul className="flex flex-col gap-2">
              {shown.optionLabels.map((option, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2.5 rounded-lg border border-border/60 bg-surface px-3.5 py-2.5 text-[13px] text-text-primary"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  {option}
                </li>
              ))}
            </ul>
          </div>
        </FormSection>
      </div>
    </DrawerShell>
  );
}
