import * as React from "react";
import { Calendar, Pencil, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { DrawerShell } from "@/components/overlays/DrawerShell";
import { DEMOGRAPHIC_TYPES } from "@/components/survey-builder/demographics";
import { formatIsoDay, type DemographicRow } from "./demographicRows";

interface ViewDemographicDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The row being inspected. Null while closed, or right after its source disappears. */
  demographic: DemographicRow | null;
  onEdit: (id: string) => void;
}

/**
 * A read-only look at one demographic — what clicking its name, or "Ver" in
 * the rail, opens. Editing lives in its own drawer (`DemographicFormDrawer`);
 * this one only reads, so a system demographic (which can't be edited) is
 * just as much at home here as an author's own.
 */
export function ViewDemographicDrawer({
  open,
  onOpenChange,
  demographic,
  onEdit,
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
  const TypeIcon = typeEntry?.icon;
  const isSystem = shown.origin === "system";

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={shown.name}
      description="Detalle del dato demográfico"
      size="xl"
      className="!w-[min(560px,92vw)] !max-w-[min(560px,92vw)]"
      disablePadding
      footer={
        <SheetFooter className="border-t bg-background px-6 py-4">
          <div className="flex w-full items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
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
      <div className="flex flex-col gap-6 px-6 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isSystem ? "info" : "neutral"}>{shown.originLabel}</Badge>
          <Badge variant="neutral" className="gap-1.5">
            {TypeIcon && <TypeIcon className="h-3.5 w-3.5" strokeWidth={2} />}
            {shown.typeLabel}
          </Badge>
        </div>

        {(shown.createdAt !== null || shown.createdBy !== null) && (
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-4">
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

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-bold text-text-primary">
            Opciones de respuesta ({shown.optionLabels.length})
          </span>
          <ul className="flex flex-col gap-1.5">
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
      </div>
    </DrawerShell>
  );
}
