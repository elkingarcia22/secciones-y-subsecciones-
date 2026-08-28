import * as React from "react";
import { toast } from "sonner";
import { ShellRailSlot } from "@/components/app-shell";
import { ConfirmDialog } from "@/components/overlays";
import {
  DemographicFormDrawer,
  DemographicsActionRail,
  DemographicsTable,
  ViewDemographicDrawer,
  buildDemographicRows,
  type DemographicRow,
  type EditingDemographic,
} from "@/components/demographics";
import {
  deleteLibraryDemographic,
  duplicateAsLibraryDemographic,
  useDemographicsLibrary,
} from "@/components/survey-builder/demographicsLibrary";

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
  const rowById = React.useMemo(() => new Map(rows.map((row) => [row.id, row])), [rows]);

  const [selectedIds, setSelectedIds] = React.useState<ReadonlySet<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [viewingId, setViewingId] = React.useState<string | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<readonly string[] | null>(null);

  // Rows can disappear from under a selection (a filter, a deletion), and a
  // rail acting on ids that no longer exist is worse than one acting on none.
  React.useEffect(() => {
    const present = new Set(rows.map((row) => row.id));
    const stale = [...selectedIds].some((id) => !present.has(id));
    if (stale) setSelectedIds(new Set([...selectedIds].filter((id) => present.has(id))));
  }, [rows, selectedIds]);

  const selectedRows = rows.filter((row) => selectedIds.has(row.id));
  const loneSelection = selectedRows.length === 1 ? selectedRows[0] : null;
  const viewingRow = viewingId !== null ? rowById.get(viewingId) ?? null : null;
  const editingRow = editingId !== null ? rowById.get(editingId) ?? null : null;

  // Excludes whatever is being edited, so a demographic never collides with
  // its own name while its form is open.
  const formTakenNames = React.useMemo(
    () => rows.filter((row) => row.id !== editingId).map((row) => row.name),
    [rows, editingId]
  );

  const isFormOpen = isCreateOpen || editingId !== null;
  const closeForm = () => {
    setIsCreateOpen(false);
    setEditingId(null);
  };

  const editingDescriptor: EditingDemographic | null = editingRow
    ? {
        key: editingRow.id,
        label: editingRow.name,
        type: editingRow.type,
        optionLabels: editingRow.optionLabels,
      }
    : null;

  const handleView = (id: string) => setViewingId(id);

  const handleEdit = (id: string) => {
    const row = rowById.get(id);
    if (!row || row.origin === "system") return;
    setEditingId(id);
  };

  const handleDuplicate = () => {
    if (selectedRows.length === 0) return;
    let duplicated = 0;
    let lastLabel = "";
    for (const row of selectedRows) {
      const created = duplicateAsLibraryDemographic({
        label: row.name,
        type: row.type,
        optionLabels: row.optionLabels,
      });
      if (created) {
        duplicated += 1;
        lastLabel = created.label;
      }
    }

    if (duplicated === 0) {
      toast.error("No se pudo duplicar", { description: "Inténtalo de nuevo en unos segundos." });
      return;
    }
    toast.success(duplicated === 1 ? "Demográfico duplicado" : `${duplicated} demográficos duplicados`, {
      description: duplicated === 1 ? `“${lastLabel}” ya está disponible.` : undefined,
    });
    setSelectedIds(new Set());
  };

  const requestDelete = (ids: readonly string[]) => {
    // System demographics refuse deletion — silently drop them rather than
    // blocking the whole batch over a row the rail already marked disabled.
    const deletable = ids.filter((id) => rowById.get(id)?.origin !== "system");
    if (deletable.length > 0) setPendingDeleteIds(deletable);
  };

  const pendingDeleteRows: readonly DemographicRow[] = (pendingDeleteIds ?? [])
    .map((id) => rowById.get(id))
    .filter((row): row is DemographicRow => row !== undefined);

  const confirmDelete = () => {
    if (!pendingDeleteIds) return;
    let deletedCount = 0;
    for (const id of pendingDeleteIds) {
      if (deleteLibraryDemographic(id)) deletedCount += 1;
    }
    setPendingDeleteIds(null);
    setSelectedIds(new Set());
    if (deletedCount > 0) {
      toast.success(deletedCount === 1 ? "Demográfico eliminado" : `${deletedCount} demográficos eliminados`);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <DemographicsTable
        rows={rows}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onViewRow={handleView}
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
          onView={handleView}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onDelete={() => requestDelete(selectedRows.map((row) => row.id))}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      </ShellRailSlot>

      <DemographicFormDrawer
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
        mode={editingId !== null ? "edit" : "create"}
        editing={editingDescriptor}
        onSaved={() => {
          closeForm();
          setSelectedIds(new Set());
        }}
        takenNames={formTakenNames}
      />

      <ViewDemographicDrawer
        open={viewingId !== null}
        onOpenChange={(open) => {
          if (!open) setViewingId(null);
        }}
        demographic={viewingRow}
        onEdit={(id) => {
          setViewingId(null);
          handleEdit(id);
        }}
      />

      <ConfirmDialog
        open={pendingDeleteIds !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteIds(null);
        }}
        title={
          pendingDeleteRows.length === 1
            ? `¿Eliminar “${pendingDeleteRows[0].name}”?`
            : `¿Eliminar ${pendingDeleteRows.length} demográficos?`
        }
        description="Esta acción no se puede deshacer. Los filtros de resultados que usen este demográfico dejarán de funcionar."
        variant="destructive"
        confirmLabel="Eliminar"
        confirmationText={pendingDeleteRows.length === 1 ? pendingDeleteRows[0].name : undefined}
        onConfirm={confirmDelete}
      />
    </div>
  );
};
