import * as React from "react";
import { toast } from "sonner";
import { ShellRailSlot } from "@/components/app-shell";
import {
  CreateDemographicDrawer,
  DemographicsActionRail,
  DemographicsTable,
  buildDemographicRows,
} from "@/components/demographics";
import { useDemographicsLibrary } from "@/components/survey-builder/demographicsLibrary";

/**
 * DATOS DEMOGRÁFICOS
 *
 * The catalog of variables every survey can cut its results by, as a list.
 * Deliberately the survey screen's twin: same table shell, same floating rail,
 * so the second tab is not a second app.
 */
export const DatosDemograficosDashboard: React.FC = () => {
  // The library is localStorage-backed and lives outside React, so this
  // subscription is what makes a demographic created here appear immediately.
  const library = useDemographicsLibrary();
  const rows = React.useMemo(() => buildDemographicRows(library), [library]);

  const [selectedIds, setSelectedIds] = React.useState<ReadonlySet<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  // Rows can disappear from under a selection (a filter, a deletion), and a
  // rail acting on ids that no longer exist is worse than one acting on none.
  React.useEffect(() => {
    const present = new Set(rows.map((row) => row.id));
    const stale = [...selectedIds].some((id) => !present.has(id));
    if (stale) setSelectedIds(new Set([...selectedIds].filter((id) => present.has(id))));
  }, [rows, selectedIds]);

  const selectedRows = rows.filter((row) => selectedIds.has(row.id));
  const loneSelection = selectedRows.length === 1 ? selectedRows[0] : null;

  const takenNames = React.useMemo(() => rows.map((row) => row.name), [rows]);

  const notYetBuilt = (action: string) =>
    toast.info(`${action} todavía no está disponible`, {
      description: "Por ahora puedes crear demográficos nuevos.",
    });

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <DemographicsTable
        rows={rows}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <ShellRailSlot>
        <DemographicsActionRail
          selectedCount={selectedRows.length}
          selected={
            loneSelection
              ? {
                  id: loneSelection.id,
                  name: loneSelection.name,
                  origin: loneSelection.origin,
                }
              : null
          }
          onCreate={() => setIsCreateOpen(true)}
          onEdit={() => notYetBuilt("Editar")}
          onDuplicate={() => notYetBuilt("Duplicar")}
          onDelete={() => notYetBuilt("Eliminar")}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      </ShellRailSlot>

      <CreateDemographicDrawer
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={() => setSelectedIds(new Set())}
        takenNames={takenNames}
      />
    </div>
  );
};
