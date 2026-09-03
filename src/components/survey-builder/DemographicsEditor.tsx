import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Database,
  FileSpreadsheet,
  PenLine,
  Plus,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toneAccent, toneChip, type Tone } from "@/lib/tone";
import { ANCHOR_ATTRIBUTE } from "@/hooks/useAnchorOffset";
import { useDragReorder } from "@/hooks/useDragReorder";
import { moveItemById } from "@/lib/reorder";
import { cascadeContainer, cascadeItem } from "@/lib/cascadeAnimation";
import { Switch } from "@/components/ui/switch";
import { DemographicCard, SaveToModuleButton } from "./DemographicCard";
import { useDeleteConfirmLock } from "./deleteConfirmLock";
import {
  GroupActionDivider,
  GroupActionsBar,
  RowVisibilityToggle,
  VisibilityBulkRow,
} from "./demographicVisibility";
import { DemographicEditor } from "./DemographicEditor";
import {
  SYSTEM_DEMOGRAPHICS,
  activateAllCatalogDemographics,
  buildCustomDemographic,
  buildImportedDemographic,
  buildSystemDemographic,
  bulkVisibilityOf,
  deactivateAllBySource,
  findFieldByCatalogKey,
  importedCatalogKey,
  toggleCatalogDemographic,
  visibleFields,
} from "./demographics";
import {
  addFieldToLibrary,
  addFieldsToLibrary,
  buildLibraryDemographic,
  isInLibrary,
  useDemographicsLibrary,
} from "./demographicsLibrary";
import type { LibraryDemographic } from "./demographicsLibrary";
import type {
  DemographicField,
  DemographicSource,
  DemographicsConfig,
  ImportedDemographic,
} from "./surveyBuilderTypes";

/** Which accordion sections are expanded. Independent of each other — an
 * author can have all four open, or just the one they're working in. */
export type DemographicSectionId = "system" | "library" | "import" | "custom";

interface DemographicsEditorProps {
  demographics: DemographicsConfig;
  onChange: (patch: Partial<DemographicsConfig>) => void;
  /** Lifted to the builder so the side rail's "Crear" button can open a fresh
   * custom field the same way clicking the accordion's own button does. */
  editingId: string | null;
  onEditingIdChange: (id: string | null) => void;
  openSections: ReadonlySet<DemographicSectionId>;
  onToggleSection: (id: DemographicSectionId) => void;
  /** Demographic columns detected in the file that brought the new
   * participants. Offered as preloadable fields for those users only. */
  importedDemographics: readonly ImportedDemographic[];
  /** How many imported rows matched no directory entry — when none, the
   * detected columns belong to nobody and the accordion stays hidden. */
  importedNewCount: number;
}

/**
 * Datos demográficos.
 *
 * Four sources, four accordions, none of them alternatives to the others:
 *
 *   Datos precargados del sistema        the platform's own variables. Turn
 *     each on individually or all at once; the ones the platform can fill in
 *     also let you choose whether the participant sees them.
 *   Datos creados en el módulo de encuestas   questions already written for
 *     some other survey, reusable here the same way — all at once or one by
 *     one — and still fully editable once added.
 *   Datos detectados en el archivo      columns the import file brought for
 *     the new participants. Preloadable like the system ones — the file
 *     already holds each value — but editable like everything else.
 *   Datos creados solo para esta encuesta     written from scratch, just for
 *     this survey. The only one of the four that is a real ordered list,
 *     since these are the questions a participant might actually see in a
 *     particular order.
 */
export function DemographicsEditor({
  demographics,
  onChange,
  editingId,
  onEditingIdChange,
  openSections,
  onToggleSection,
  importedDemographics,
  importedNewCount,
}: DemographicsEditorProps) {
  const { enabled, fields } = demographics;
  // The reusable module library lives outside the survey (localStorage-backed)
  // and the save buttons below can grow it, so the hook re-reads it whenever
  // anything is saved — the count only stays honest by subscribing.
  const library = useDemographicsLibrary();

  // At most one form open at a time, across all three accordions. Lifted to
  // the builder — see the prop doc — so both the accordion's own button and
  // the side rail's "Crear" button land in the same place.
  // The custom accordion gives up the rail anchor while a field is open, since
  // that field's editor card anchors instead — see `isDefaultAnchor`.
  const isEditingAny = editingId !== null;
  const setEditingId = onEditingIdChange;

  // True while a custom field's inline "¿eliminar esto?" banner is open, or
  // a field's full editor has replaced its row — every other row and every
  // add/toggle action here goes inert until that's resolved. Sections and
  // questions are a different panel entirely, so this is self-contained.
  const isDeletingItem = useDeleteConfirmLock();
  const isLocked = isDeletingItem || isEditingAny;

  const toggleSection = (id: DemographicSectionId) => {
    onToggleSection(id);
  };

  const setFields = (next: readonly DemographicField[]) => onChange({ fields: next });

  const patchField = (id: string, patch: Partial<DemographicField>) =>
    setFields(fields.map((field) => (field.id === id ? { ...field, ...patch } : field)));

  /** Closes the editor if the field it was showing just stopped existing. */
  const closeEditorIfGone = (removedId: string | undefined) => {
    if (removedId && removedId === editingId) setEditingId(null);
  };

  const toggleSystemField = (key: string, active: boolean) => {
    if (!active) closeEditorIfGone(findFieldByCatalogKey(fields, key)?.id);
    setFields(toggleCatalogDemographic(fields, key, active, buildSystemDemographic));
  };

  const toggleLibraryField = (key: string, active: boolean) => {
    if (!active) closeEditorIfGone(findFieldByCatalogKey(fields, key)?.id);
    setFields(toggleCatalogDemographic(fields, key, active, buildLibraryDemographic));
  };

  const activateAllLibrary = () =>
    setFields(activateAllCatalogDemographics(fields, library, buildLibraryDemographic));
  const deactivateAllLibrary = () => {
    closeEditorIfGone(
      fields.find((field) => field.id === editingId && field.source === "library")?.id
    );
    setFields(deactivateAllBySource(fields, "library"));
  };

  // The import catalog is the file itself, namespace-prefixed so `area` never
  // collides with the system's `area`. Its builder looks the entry up by key
  // the same way the system one does — nothing here is global.
  const importedByKey = (entryKey: string) =>
    importedDemographics.find((entry) => entry.key === entryKey) ?? null;
  const importedIsActive = (entryKey: string) =>
    findFieldByCatalogKey(fields, importedCatalogKey(entryKey)) !== null;
  const toggleImportedField = (entryKey: string, active: boolean) => {
    if (!active) closeEditorIfGone(findFieldByCatalogKey(fields, importedCatalogKey(entryKey))?.id);
    setFields(
      toggleCatalogDemographic(fields, importedCatalogKey(entryKey), active, (key) => {
        const entry = importedByKey(key.replace(/^import:/, ""));
        return entry ? buildImportedDemographic(entry) : null;
      })
    );
  };

  const activateAllSystem = () =>
    setFields(activateAllCatalogDemographics(fields, SYSTEM_DEMOGRAPHICS, buildSystemDemographic));
  const deactivateAllSystem = () => {
    closeEditorIfGone(fields.find((field) => field.id === editingId && field.source === "system")?.id);
    setFields(deactivateAllBySource(fields, "system"));
  };

  const activateAllImported = () => {
    const missing = importedDemographics.filter((entry) => !importedIsActive(entry.key));
    setFields([...fields, ...missing.map((entry) => buildImportedDemographic(entry))]);
  };
  const deactivateAllImported = () => {
    closeEditorIfGone(fields.find((field) => field.id === editingId && field.source === "import")?.id);
    setFields(deactivateAllBySource(fields, "import"));
  };

  const setPreloadedVisible = (key: string, visible: boolean) =>
    setFields(fields.map((field) => (field.catalogKey === key ? { ...field, visible } : field)));

  // The bulk mostrar/ocultar pair only belongs to the two preloadable sections
  // (system + imported) — the module and custom lists are per-row territory,
  // so only those two compute a bulk state.
  const sourceFields = (source: DemographicSource) => fields.filter((field) => field.source === source);
  const applyBulkVisibility = (source: DemographicSource) => (visible: boolean) =>
    setFields(fields.map((field) => (field.source === source ? { ...field, visible } : field)));
  const systemBulk = bulkVisibilityOf(sourceFields("system"));
  const importedBulk = bulkVisibilityOf(sourceFields("import"));

  // The save-to-module pair: per-row and "all at once". Both grow the module
  // library, which the `library` hook above subscribes to — saving a field is
  // what turns the row's button into the check state.
  const saveFieldToLibrary = (field: DemographicField) => {
    addFieldToLibrary(field);
  };
  const saveAllImportedToLibrary = () => {
    addFieldsToLibrary(sourceFields("import"));
  };

  // The only true reorderable list of the three — the others are checklists
  // rendered in fixed catalog order, so where their fields sit in the array
  // never affects what the author sees.
  const customFields = fields.filter((field) => field.source === "custom");
  const handleReorder = (fromId: string, toId: string) =>
    setFields(moveItemById([...fields], fromId, toId));
  const { draggingId, overId, getHandleProps, getDropTargetProps } = useDragReorder(handleReorder);

  const addCustomField = () => {
    const field = buildCustomDemographic();
    setFields([...fields, field]);
    setEditingId(field.id);
  };
  const removeCustomField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
    closeEditorIfGone(id);
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col self-start rounded-2xl border border-border/60 bg-surface shadow-card">
      {/* Sticky against the workspace's own scroll container (no nested
          overflow here) so it stays put while the panel below scrolls, with
          just the one scrollbar the workspace already owns. */}
      <div className="sticky top-0 z-10 flex items-center gap-3 rounded-t-2xl border-b border-border/60 bg-surface px-6 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
          <BarChart3 className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[14px] font-bold tracking-tight text-text-primary">
          Datos demográficos
        </h2>

        {enabled && fields.length > 0 && (
          <span className="shrink-0 rounded-full bg-status-positive/10 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-status-positive">
            {fields.length === 1 ? "1 dato" : `${fields.length} datos`}
          </span>
        )}

        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[12px] font-medium text-text-primary">
          <span>Usar datos demográficos</span>
          <Switch
            checked={enabled}
            disabled={isLocked}
            onCheckedChange={(next) => onChange({ enabled: next })}
            aria-label="Usar datos demográficos"
            className="data-[state=checked]:bg-status-positive"
          />
        </label>
      </div>

      {/* `cascade-enter` staggers the accordions in one at a time on entry,
          instead of the whole block settling as one. */}
      <div className="flex flex-col gap-3 px-6 py-6 cascade-enter">
        {enabled ? (
          <>
            <p className="text-[13px] leading-relaxed text-text-secondary">
              Estos son los datos con los que después vas a poder filtrar los resultados. Puedes
              combinarlos a la vez: activa los que ya tenemos en la plataforma, los que detectamos
              en tu archivo de usuarios, agrega los que ya se usaron en otras encuestas, o crea
              los que sean exclusivos de esta.
            </p>

            {customFields.length > 0 && (
              <AccordionSection
                icon={PenLine}
                tone="brand"
                title="Datos creados solo para esta encuesta"
                description="Datos demográficos nuevos, que se usarán solo en esta encuesta."
                countLabel={`${customFields.length} creados`}
                isOpen={openSections.has("custom")}
                onToggle={() => toggleSection("custom")}
                isDefaultAnchor={!isEditingAny}
                isLocked={isLocked}
              >
                <CustomAccordionContent
                  customFields={customFields}
                  editingId={editingId}
                  isLocked={isLocked}
                  draggingId={draggingId}
                  overId={overId}
                  getHandleProps={getHandleProps}
                  getDropTargetProps={getDropTargetProps}
                  onOpen={setEditingId}
                  onRemove={removeCustomField}
                  onAdd={addCustomField}
                  onChangeField={(next) => patchField(next.id, next)}
                  onClose={() => setEditingId(null)}
                  onSaveToModule={saveFieldToLibrary}
                  isSavedInModule={isInLibrary}
                />
              </AccordionSection>
            )}

            <AccordionSection
              icon={BookOpen}
              tone="brand"
              title="Datos creados en el módulo de encuestas"
              description="Datos demográficos reutilizables, ya creados dentro de la plataforma."
              countLabel={`${library.filter((entry) => findFieldByCatalogKey(fields, entry.key)).length}/${library.length} agregados`}
              isOpen={openSections.has("library")}
              onToggle={() => toggleSection("library")}
              isModuleActive={library.length > 0 && library.some((entry) => findFieldByCatalogKey(fields, entry.key))}
              onToggleModule={(active) => {
                if (active) {
                  activateAllLibrary();
                  if (!openSections.has("library")) toggleSection("library");
                } else {
                  deactivateAllLibrary();
                  if (openSections.has("library")) toggleSection("library");
                }
              }}
              isLocked={isLocked}
            >
              <LibraryAccordionContent
                library={library}
                fields={fields}
                editingId={editingId}
                isLocked={isLocked}
                onToggleField={toggleLibraryField}
                onActivateAll={activateAllLibrary}
                onDeactivateAll={deactivateAllLibrary}
                onOpen={setEditingId}
                onChangeField={(next) => patchField(next.id, next)}
                onClose={() => setEditingId(null)}
              />
            </AccordionSection>

            {/* Only for a file that actually brought new people — a detected
                column with nobody to belong to would be a phantom filter. */}
            {importedNewCount > 0 && importedDemographics.length > 0 && (
              <AccordionSection
                icon={FileSpreadsheet}
                tone="brand"
                title="Datos demográficos en usuarios nuevos"
                description="Área, líder y las demás columnas que trae el archivo de los nuevos."
                countLabel={`${importedDemographics.filter((entry) => importedIsActive(entry.key)).length}/${importedDemographics.length} activos`}
                isOpen={openSections.has("import")}
                onToggle={() => toggleSection("import")}
                isModuleActive={importedDemographics.length > 0 && importedDemographics.some((entry) => importedIsActive(entry.key))}
                onToggleModule={(active) => {
                  if (active) {
                    activateAllImported();
                    if (!openSections.has("import")) toggleSection("import");
                  } else {
                    deactivateAllImported();
                    if (openSections.has("import")) toggleSection("import");
                  }
                }}
                isLocked={isLocked}
              >
                <ImportedAccordionContent
                  entries={importedDemographics}
                  fields={fields}
                  editingId={editingId}
                  isLocked={isLocked}
                  bulk={importedBulk}
                  onToggleField={toggleImportedField}
                  onActivateAll={activateAllImported}
                  onDeactivateAll={deactivateAllImported}
                  onOpen={setEditingId}
                  onChangeField={(next) => patchField(next.id, next)}
                  onClose={() => setEditingId(null)}
                  onBulkVisible={applyBulkVisibility("import")}
                  onSaveToModule={saveFieldToLibrary}
                  onSaveAllToModule={saveAllImportedToLibrary}
                  isSavedInModule={isInLibrary}
                />
              </AccordionSection>
            )}

            <AccordionSection
              icon={Database}
              tone="brand"
              title="Datos precargados del sistema"
              description="Los que ya tenemos de cada colaborador en la plataforma."
              countLabel={`${SYSTEM_DEMOGRAPHICS.filter((entry) => findFieldByCatalogKey(fields, entry.key)).length}/${SYSTEM_DEMOGRAPHICS.length} activos`}
              isOpen={openSections.has("system")}
              onToggle={() => toggleSection("system")}
              isModuleActive={SYSTEM_DEMOGRAPHICS.some((entry) => findFieldByCatalogKey(fields, entry.key))}
              onToggleModule={(active) => {
                if (active) {
                  activateAllSystem();
                  if (!openSections.has("system")) toggleSection("system");
                } else {
                  deactivateAllSystem();
                  if (openSections.has("system")) toggleSection("system");
                }
              }}
              isLocked={isLocked}
            >
              <SystemAccordionContent
                fields={fields}
                editingId={editingId}
                isLocked={isLocked}
                bulk={systemBulk}
                onToggleField={toggleSystemField}
                onVisibleChange={setPreloadedVisible}
                onBulkVisible={applyBulkVisibility("system")}
                onActivateAll={activateAllSystem}
                onDeactivateAll={deactivateAllSystem}
                onOpen={setEditingId}
                onChangeField={(next) => patchField(next.id, next)}
                onClose={() => setEditingId(null)}
              />
            </AccordionSection>

            {/* What the participant will actually go through, stated in one
                line: the number that is easy to lose track of once part of the
                list is hidden. */}
            {fields.length > 0 && (
              <p className="px-1 text-[12px] leading-relaxed text-muted-foreground">
                {summarizeVisibility(fields.length, visibleFields(fields).length)}
              </p>
            )}
          </>
        ) : (
          <DisabledNotice count={fields.length} />
        )}
      </div>
    </section>
  );
}

/**
 * One collapsible case. Built to match the outline's own expand/collapse
 * language (chevron, rotate, animate) rather than a generic accordion
 * primitive, so the whole builder reads as one product.
 */
function AccordionSection({
  icon: Icon,
  tone,
  title,
  description,
  countLabel,
  isOpen,
  onToggle,
  children,
  isDefaultAnchor = false,
  isModuleActive,
  onToggleModule,
  isLocked = false,
}: {
  icon: LucideIcon;
  /** Where this data comes from, as a color: the three sources are three
   *  different origins, not three copies of the same block. */
  tone: Tone;
  title: string;
  description: string;
  countLabel: string | null;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  /** Where the rail parks when no field anywhere is being edited. At most one
   * accordion should set this. */
  isDefaultAnchor?: boolean;
  /** Toggle state for the whole module */
  isModuleActive?: boolean;
  onToggleModule?: (active: boolean) => void;
  /** True while a field anywhere in "Datos demográficos" is mid delete-confirm
   *  or mid-edit — this accordion can't be expanded/collapsed or bulk-toggled
   *  until that's resolved (its rows lock themselves the same way). */
  isLocked?: boolean;
}) {
  return (
    <div
      {...(isDefaultAnchor ? { [ANCHOR_ATTRIBUTE]: true } : {})}
      className="rounded-xl border border-border/60 bg-surface"
    >
      <div
        role="button"
        tabIndex={isLocked ? -1 : 0}
        aria-disabled={isLocked}
        onKeyDown={(e) => {
          if (isLocked) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        onClick={isLocked ? undefined : onToggle}
        aria-expanded={isOpen}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
          isLocked ? "cursor-not-allowed" : "hover:bg-border/10",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        )}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={toneChip(tone)}
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-text-primary">{title}</span>
          <span className="mt-0.5 block text-[12px] leading-relaxed text-text-secondary">
            {description}
          </span>
        </span>

        {countLabel && (
          <span className="shrink-0 rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-text-secondary">
            {countLabel}
          </span>
        )}

        {onToggleModule && (
          <div className="shrink-0 pl-2 pr-1" onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={isModuleActive}
              disabled={isLocked}
              onCheckedChange={onToggleModule}
              aria-label={`Activar todo en ${title}`}
              className="data-[state=checked]:bg-status-positive"
            />
          </div>
        )}

        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-90"
          )}
          strokeWidth={2.5}
        />
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { height: 0, opacity: 0 },
              visible: {
                height: "auto",
                opacity: 1,
                transition: {
                  height: { duration: 0.3, ease: "easeInOut" },
                  opacity: { duration: 0.3, ease: "easeInOut" },
                },
              },
            }}
            className="border-t border-border/60 overflow-hidden px-4 py-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** One row of a checklist accordion: a switch to activate it, an optional
 * extra control once active (the visibility toggle, for preloadable rows). */
function CatalogRow({
  label,
  description,
  isActive,
  onToggle,
  onOpen,
  extra,
  locked = false,
}: {
  label: string;
  description?: string;
  isActive: boolean;
  onToggle: (active: boolean) => void;
  onOpen: () => void;
  extra?: React.ReactNode;
  /** True while a field elsewhere is mid delete-confirm or mid-edit — this
   *  row's own toggle and open button go inert until that's resolved. */
  locked?: boolean;
}) {
  return (
    <motion.li
      variants={cascadeItem}
      className={cn(
        "group flex items-center gap-3 bg-surface px-3.5 py-2.5 transition-all",
        isActive && !locked && "hover:bg-border/20"
      )}
    >
      <Switch
        checked={isActive}
        disabled={locked}
        onCheckedChange={onToggle}
        aria-label={`Usar ${label}`}
      />

      <button
        type="button"
        onClick={onOpen}
        disabled={!isActive || locked}
        data-click-outside-ignore
        className="min-w-0 flex-1 text-left outline-none focus-visible:underline disabled:cursor-default"
      >
        <span
          className={cn(
            "block truncate text-[13px] font-medium",
            isActive ? "text-text-primary" : "text-muted-foreground/70"
          )}
        >
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block truncate text-[11px] font-semibold text-muted-foreground/80">
            {description}
          </span>
        )}
      </button>

      {isActive && extra}
    </motion.li>
  );
}

/** Wraps the inline card an open row turns into, in every accordion alike. */
function EditorCard({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <div
      {...{ [ANCHOR_ATTRIBUTE]: true }}
      className="rounded-xl border bg-surface p-4 shadow-card animate-in fade-in zoom-in-[0.99] duration-200"
      style={{
        borderColor: toneAccent(tone),
        boxShadow: `0 0 0 2px color-mix(in srgb, ${toneAccent(tone)} 18%, transparent)`,
      }}
    >
      {children}
    </div>
  );
}

interface SystemAccordionContentProps {
  fields: readonly DemographicField[];
  editingId: string | null;
  isLocked: boolean;
  bulk: boolean | "mixed" | null;
  onToggleField: (key: string, active: boolean) => void;
  onVisibleChange: (key: string, visible: boolean) => void;
  onBulkVisible: (visible: boolean) => void;
  onActivateAll: () => void;
  onDeactivateAll: () => void;
  onOpen: (id: string) => void;
  onChangeField: (field: DemographicField) => void;
  onClose: () => void;
}

function SystemAccordionContent({
  fields,
  editingId,
  isLocked,
  bulk,
  onToggleField,
  onVisibleChange,
  onBulkVisible,
  onActivateAll,
  onDeactivateAll,
  onOpen,
  onChangeField,
  onClose,
}: SystemAccordionContentProps) {
  const activeCount = SYSTEM_DEMOGRAPHICS.filter((entry) =>
    findFieldByCatalogKey(fields, entry.key)
  ).length;

  const editingIndex = SYSTEM_DEMOGRAPHICS.findIndex(
    (entry) => findFieldByCatalogKey(fields, entry.key)?.id === editingId
  );
  const isEditingHere = editingIndex !== -1;
  const editingField = isEditingHere
    ? findFieldByCatalogKey(fields, SYSTEM_DEMOGRAPHICS[editingIndex].key)
    : null;

  const rowsBefore = isEditingHere ? SYSTEM_DEMOGRAPHICS.slice(0, editingIndex) : SYSTEM_DEMOGRAPHICS;
  const rowsAfter = isEditingHere ? SYSTEM_DEMOGRAPHICS.slice(editingIndex + 1) : [];

  const renderEntries = (entries: typeof SYSTEM_DEMOGRAPHICS) => (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={cascadeContainer}
      className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/70 bg-surface"
    >
      {entries.map((entry) => {
        const field = findFieldByCatalogKey(fields, entry.key);
        return (
          <CatalogRow
            key={entry.key}
            label={field?.label || entry.label}
            description={entry.origin}
            isActive={field !== null}
            onToggle={(active) => onToggleField(entry.key, active)}
            onOpen={() => field && onOpen(field.id)}
            locked={isLocked}
            extra={
              field ? (
                <RowVisibilityToggle
                  visible={field.visible}
                  onChange={(visible) => onVisibleChange(entry.key, visible)}
                  disabled={isLocked}
                />
              ) : null
            }
          />
        );
      })}
    </motion.ul>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-md text-[12px] leading-relaxed text-text-secondary">
          Los que se pueden precargar también dejan elegir si el participante los ve o si se usan
          solo para filtrar.
        </p>

        <GroupActionsBar>
          {activeCount > 0 && (
            <VisibilityBulkRow bulk={bulk} onVisibleChange={onBulkVisible} disabled={isLocked} />
          )}
        </GroupActionsBar>
      </div>

      <div className="flex flex-col gap-2">
        {rowsBefore.length > 0 && renderEntries(rowsBefore)}

        {isEditingHere && editingField && (
          <EditorCard tone="positive">
            <DemographicEditor
              tone="positive"
              field={editingField}
              index={editingIndex}
              onChange={onChangeField}
              onRemove={() => onToggleField(SYSTEM_DEMOGRAPHICS[editingIndex].key, false)}
              onClose={onClose}
            />
          </EditorCard>
        )}

        {rowsAfter.length > 0 && renderEntries(rowsAfter)}
      </div>
    </div>
  );
}

interface LibraryAccordionContentProps {
  /** The whole module library: built-ins plus whatever the author saved. */
  library: readonly LibraryDemographic[];
  fields: readonly DemographicField[];
  editingId: string | null;
  isLocked: boolean;
  onToggleField: (key: string, active: boolean) => void;
  onActivateAll: () => void;
  onDeactivateAll: () => void;
  onOpen: (id: string) => void;
  onChangeField: (field: DemographicField) => void;
  onClose: () => void;
}

function LibraryAccordionContent({
  library,
  fields,
  editingId,
  isLocked,
  onToggleField,
  onActivateAll,
  onDeactivateAll,
  onOpen,
  onChangeField,
  onClose,
}: LibraryAccordionContentProps) {
  const activeCount = library.filter((entry) => findFieldByCatalogKey(fields, entry.key)).length;
  const editingIndex = library.findIndex(
    (entry) => findFieldByCatalogKey(fields, entry.key)?.id === editingId
  );
  const isEditingHere = editingIndex !== -1;
  const editingField = isEditingHere
    ? findFieldByCatalogKey(fields, library[editingIndex].key)
    : null;

  const rowsBefore = isEditingHere ? library.slice(0, editingIndex) : library;
  const rowsAfter = isEditingHere ? library.slice(editingIndex + 1) : [];

  const renderEntries = (entries: readonly LibraryDemographic[]) => (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={cascadeContainer}
      className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/70 bg-surface"
    >
      {entries.map((entry) => {
        const field = findFieldByCatalogKey(fields, entry.key);
        return (
          <CatalogRow
            key={entry.key}
            label={field?.label || entry.label}
            isActive={field !== null}
            onToggle={(active) => onToggleField(entry.key, active)}
            onOpen={() => field && onOpen(field.id)}
            locked={isLocked}
          />
        );
      })}
    </motion.ul>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-md text-[12px] leading-relaxed text-text-secondary">
          Se agregan con su redacción original, pero siguen siendo tuyas para editar en esta
          encuesta. Los que guardes en otras encuestas también aparecen aquí.
        </p>

      </div>

      <div className="flex flex-col gap-2">
        {rowsBefore.length > 0 && renderEntries(rowsBefore)}

        {isEditingHere && editingField && (
          <EditorCard tone="brand">
            <DemographicEditor
              tone="brand"
              field={editingField}
              index={editingIndex}
              onChange={onChangeField}
              onRemove={() => onToggleField(library[editingIndex].key, false)}
              onClose={onClose}
            />
          </EditorCard>
        )}

        {rowsAfter.length > 0 && renderEntries(rowsAfter)}
      </div>
    </div>
  );
}

interface ImportedAccordionContentProps {
  /** Detected columns, in the order the file presented them. */
  entries: readonly ImportedDemographic[];
  fields: readonly DemographicField[];
  editingId: string | null;
  isLocked: boolean;
  bulk: boolean | "mixed" | null;
  onToggleField: (key: string, active: boolean) => void;
  onActivateAll: () => void;
  onDeactivateAll: () => void;
  onOpen: (id: string) => void;
  onChangeField: (field: DemographicField) => void;
  onClose: () => void;
  onBulkVisible: (visible: boolean) => void;
  onSaveToModule: (field: DemographicField) => void;
  onSaveAllToModule: () => void;
  isSavedInModule: (label: string) => boolean;
}

/**
 * The columns the import file detected. Preloadable like the system rows —
 * the file already holds each new user's value — so an active row carries the
 * same mostrar/ocultar choice, and the field stays editable like any other
 * wording.
 */
function ImportedAccordionContent({
  entries,
  fields,
  editingId,
  isLocked,
  bulk,
  onToggleField,
  onActivateAll,
  onDeactivateAll,
  onOpen,
  onChangeField,
  onClose,
  onBulkVisible,
  onSaveToModule,
  onSaveAllToModule,
  isSavedInModule,
}: ImportedAccordionContentProps) {
  const activeCount = entries.filter((entry) =>
    findFieldByCatalogKey(fields, importedCatalogKey(entry.key))
  ).length;

  // Only the rows actually activated are batch-savable — grabbing the wording
  // of a column the author hasn't even turned on would be presumptuous.
  const activeFields = entries
    .map((entry) => findFieldByCatalogKey(fields, importedCatalogKey(entry.key)))
    .filter((field): field is DemographicField => field !== null);
  const savableCount = activeFields.filter(
    (field) => field.label.trim() !== "" && !isSavedInModule(field.label)
  ).length;

  const editingIndex = entries.findIndex(
    (entry) => findFieldByCatalogKey(fields, importedCatalogKey(entry.key))?.id === editingId
  );
  const isEditingHere = editingIndex !== -1;
  const editingField = isEditingHere
    ? findFieldByCatalogKey(fields, importedCatalogKey(entries[editingIndex].key))
    : null;

  const rowsBefore = isEditingHere ? entries.slice(0, editingIndex) : entries;
  const rowsAfter = isEditingHere ? entries.slice(editingIndex + 1) : [];

  const renderEntries = (slice: readonly ImportedDemographic[]) => (
    <motion.ul
      initial="hidden"
      animate="show"
      variants={cascadeContainer}
      className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/70 bg-surface"
    >
      {slice.map((entry) => {
        const field = findFieldByCatalogKey(fields, importedCatalogKey(entry.key));
        const valueCount = entry.optionLabels.length;
        return (
          <CatalogRow
            key={entry.key}
            label={field?.label || entry.label}
            description={`${valueCount} ${valueCount === 1 ? "valor detectado" : "valores detectados"}`}
            isActive={field !== null}
            onToggle={(active) => onToggleField(entry.key, active)}
            onOpen={() => field && onOpen(field.id)}
            locked={isLocked}
            extra={
              field ? (
                <div className="flex shrink-0 items-center gap-1.5">
                  <SaveToModuleButton
                    saved={isSavedInModule(field.label)}
                    disabled={isLocked || field.label.trim() === ""}
                    onSave={() => onSaveToModule(field)}
                  />
                  <RowVisibilityToggle
                    visible={field.visible}
                    onChange={(visible) =>
                      onChangeField({ ...field, visible })
                    }
                    disabled={isLocked}
                  />
                </div>
              ) : null
            }
          />
        );
      })}
    </motion.ul>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="max-w-md text-[12px] leading-relaxed text-text-secondary">
          El valor de cada nuevo usuario ya viene en el archivo, así que se puede precargar. Elige
          si el participante lo ve o si se usa solo para filtrar.
        </p>

        <GroupActionsBar>
          <TextToggleButton
            label="Guardar todas para reutilizar"
            disabled={isLocked || savableCount === 0}
            onSelect={onSaveAllToModule}
          />
          {activeCount > 0 && (
            <>
              <GroupActionDivider />
              <VisibilityBulkRow bulk={bulk} onVisibleChange={onBulkVisible} disabled={isLocked} />
            </>
          )}
        </GroupActionsBar>
      </div>

      <div className="flex flex-col gap-2">
        {rowsBefore.length > 0 && renderEntries(rowsBefore)}

        {isEditingHere && editingField && (
          <EditorCard tone="ai">
            <DemographicEditor
              tone="ai"
              field={editingField}
              index={editingIndex}
              onChange={onChangeField}
              onRemove={() => onToggleField(entries[editingIndex].key, false)}
              onClose={onClose}
            />
          </EditorCard>
        )}

        {rowsAfter.length > 0 && renderEntries(rowsAfter)}
      </div>
    </div>
  );
}

interface CustomAccordionContentProps {
  customFields: readonly DemographicField[];
  editingId: string | null;
  /** True while a field's delete-confirm or full editor is open anywhere in
   *  this list — every row except the active one, and "Crear dato
   *  demográfico", go inert until that's resolved. */
  isLocked: boolean;
  draggingId: string | null;
  overId: string | null;
  getHandleProps: (id: string) => React.HTMLAttributes<HTMLElement> & { draggable: true };
  getDropTargetProps: (id: string) => React.HTMLAttributes<HTMLElement>;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onChangeField: (field: DemographicField) => void;
  onClose: () => void;
  onSaveToModule: (field: DemographicField) => void;
  isSavedInModule: (label: string) => boolean;
}

/**
 * The only true list of the three: fields written just for this survey, in an
 * order the author controls, because these are the questions a participant
 * might actually see one after another.
 */
function CustomAccordionContent({
  customFields,
  editingId,
  isLocked,
  draggingId,
  overId,
  getHandleProps,
  getDropTargetProps,
  onOpen,
  onRemove,
  onAdd,
  onChangeField,
  onClose,
  onSaveToModule,
  isSavedInModule,
}: CustomAccordionContentProps) {
  const editingIndex = customFields.findIndex((field) => field.id === editingId);
  const isEditingHere = editingIndex !== -1;
  const rowsBefore = isEditingHere ? customFields.slice(0, editingIndex) : customFields;
  const rowsAfter = isEditingHere ? customFields.slice(editingIndex + 1) : [];

  const renderRows = (slice: readonly DemographicField[], offset: number) => (
    <ul className="divide-y divide-border/50 overflow-hidden rounded-md border border-border/70 bg-surface">
      {slice.map((field, index) => (
        <DemographicCard
          key={field.id}
          field={field}
          index={offset + index}
          locked={isLocked}
          isDragging={draggingId === field.id}
          isDropTarget={overId === field.id && draggingId !== field.id}
          onOpen={() => onOpen(field.id)}
          onRemove={() => onRemove(field.id)}
          savedInLibrary={isSavedInModule(field.label)}
          onSaveToModule={() => onSaveToModule(field)}

          handleProps={getHandleProps(field.id)}
          dropTargetProps={getDropTargetProps(field.id)}
        />
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-3">
      {customFields.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-text-secondary">
          Aún no has creado ningún dato demográfico para esta encuesta. Crea el primero.
        </p>
      ) : (
        <>
          <p className="max-w-md text-[12px] leading-relaxed text-text-secondary">
            Cada dato tiene un botón para guardarlo en el módulo de encuestas y reutilizarlo en
            otras. Guárdalos antes de que desaparezcan con esta encuesta.
          </p>

          <div className="flex flex-col gap-2">
            {rowsBefore.length > 0 && renderRows(rowsBefore, 0)}

            {isEditingHere && (
              <EditorCard tone="brand">
                <DemographicEditor
                  tone="brand"
                  field={customFields[editingIndex]}
                  index={editingIndex}
                  onChange={onChangeField}
                  onRemove={() => onRemove(customFields[editingIndex].id)}
                  onClose={onClose}
                />
              </EditorCard>
            )}

            {rowsAfter.length > 0 && renderRows(rowsAfter, editingIndex + 1)}
          </div>
        </>
      )}

      <button
        type="button"
        onClick={onAdd}
        disabled={isLocked}
        data-click-outside-ignore
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border/70 px-3 py-2.5 text-[12px] font-semibold text-muted-foreground transition-all",
          "hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border/70 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        )}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
        {customFields.length === 0 ? "Crear el primer dato demográfico" : "Crear dato demográfico"}
      </button>
    </div>
  );
}

/** Icon plus visible text — for the section-level bulk actions. */
function TextToggleButton({
  label,
  disabled,
  onSelect,
}: {
  label: string;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "flex h-8 items-center rounded-md px-2.5 text-[12px] font-semibold text-text-secondary transition-all",
        "hover:bg-primary/5 hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "disabled:cursor-default disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-text-secondary"
      )}
    >
      {label}
    </button>
  );
}

/**
 * What the participant is actually put through, in one line. Easy to lose
 * track of once part of the list is hidden.
 */
function summarizeVisibility(total: number, visible: number): string {
  if (visible === 0) {
    return "El participante no verá ninguna pregunta demográfica: todos los datos se toman de los registros ya disponibles sin mostrarse.";
  }
  if (visible === total) {
    return total === 1
      ? "El participante responderá 1 pregunta demográfica."
      : `El participante responderá ${total} preguntas demográficas.`;
  }
  return `El participante responderá ${visible} de ${total}; el resto se oculta y solo se usa para filtrar los resultados.`;
}

/**
 * What switching the block off actually costs, plus the reassurance that the
 * configuration is still there — the switch above is reversible and this
 * should read that way rather than as a warning.
 */
function DisabledNotice({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-muted/30 px-4 py-3.5">
      <p className="text-[13px] font-semibold text-text-primary">
        Esta encuesta no pedirá ni guardará datos demográficos.
      </p>
      <p className="max-w-2xl text-[13px] leading-relaxed text-text-secondary">
        El participante no verá preguntas demográficas y los resultados no se podrán filtrar por
        área, nivel, antigüedad ni ningún otro dato.
        {count > 0 &&
          ` Tu configuración se guarda: si vuelves a activarlos, encontrarás ${
            count === 1 ? "el dato que ya tenías" : `los ${count} datos que ya tenías`
          }.`}
      </p>
    </div>
  );
}
