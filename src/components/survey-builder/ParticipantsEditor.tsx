import * as React from "react";
import type { TableSelectionActions } from "@/components/action-rail";
import * as XLSX from "xlsx";
import {
  FileSearch,
  FileX2,
  TriangleAlert,
  Users,
  Sparkles,
  CheckIcon,
  ChevronDown,
  Eye,
  EyeOff,
  MinusIcon,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AiAnalyzingState } from "@/components/ai-interaction";
import { UploadZone } from "@/components/upload";
import { MagicCard } from "@/components/ui/magic-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { COLLABORATOR_COUNT, COLLABORATORS } from "@/mocks/collaborators";
import { CollaboratorTable } from "./CollaboratorTable";
import { SortableHeader, FilterMenu, PagerButton, type SortDir } from "./CollaboratorTableParts";
import { ImportedUsersTable } from "./ImportedUsersTable";
import {
  DEMOGRAPHIC_COLUMN_LABELS,
  PARTICIPANT_MODES,
  PARTICIPANT_MODE_COPY,
  SEGMENT_LABELS,
  clearedGroupSelection,
  effectiveIndividualIds,
  formatCount,
  groupMemberIds,
  humanizeColumn,
  participantCountForMode,
  resolveImportedRows,
  segmentCounts,
  totalParticipantCount,
  withGroupConvertedToIndividuals,
  withGroupDeselected,
  type ImportedUser,
} from "./participants";
import type {
  ImportedDemographic,
  ParticipantMode,
  ParticipantsSelection,
  SegmentKey,
} from "./surveyBuilderTypes";

interface ParticipantsEditorProps {
  participants: ParticipantsSelection;
  onChange: (patch: Partial<ParticipantsSelection>) => void;
  /** Flips on once the author tried to leave/finalize with nobody selected, so
   * the missing-participant hint only appears in response to that attempt. */
  showValidation?: boolean;
  onSelectionChange?: (count: number, actions: TableSelectionActions) => void;
}

/** Reads a single cell by header, tolerating the column being absent. */
function cell(row: unknown[], index: number): string {
  return index >= 0 ? String(row[index] ?? "").trim() : "";
}

interface ReadImportResult {
  users: ImportedUser[];
  demographics: readonly ImportedDemographic[];
}

/**
 * Reads a .csv or .xlsx the same way: SheetJS sniffs the format from the
 * bytes, so the two don't need separate code paths. The first row names the
 * columns ("username", "name", "email", …); every later row is a participant,
 * counted only when it carries at least a name or a username.
 *
 * Any column beyond the identity fields (`username`, `name`, `email`) is
 * treated as a *detected demographic*: `area` and `leader` count too — they
 * are demographic data, just ones the preview table also shows. The column's
 * header becomes an offerable filter once activated, and the distinct
 * non-empty values it holds become the answer options. A stray trailing
 * column without a single value is ignored — empty columns carry nothing a
 * filter could segment by.
 */
async function readImportedUsers(file: File): Promise<ReadImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { users: [], demographics: [] };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  });
  const [header, ...body] = rows;
  if (!header) return { users: [], demographics: [] };

  const findIndex = (name: string) =>
    header.findIndex((value) => String(value).trim().toLowerCase() === name);
  const usernameAt = findIndex("username");
  const nameAt = findIndex("name");
  const emailAt = findIndex("email");
  const areaAt = findIndex("area");
  const leaderAt = findIndex("leader");
  // Only identifiers are excluded from detection. `area` and `leader` stay in
  // the known user fields so the preview table still shows them, but they are
  // also demographic data — they are collected like any other column below.
  const identityColumns = new Set(["username", "name", "email"]);

  const users: ImportedUser[] = [];
  for (const row of body) {
    const username = cell(row, usernameAt);
    const name = cell(row, nameAt);
    if (username === "" && name === "") continue;
    users.push({
      username,
      name,
      email: cell(row, emailAt),
      area: cell(row, areaAt),
      leader: cell(row, leaderAt),
    });
  }

  const demographics: ImportedDemographic[] = header.flatMap((rawHeader, index) => {
    const columnName = String(rawHeader ?? "").trim().toLowerCase();
    if (columnName === "" || identityColumns.has(columnName)) return [];
    const values = [
      ...new Set(
        body
          .map((row) => cell(row, index))
          .filter((value) => value !== "")
      ),
    ];
    if (values.length === 0) return [];
    return [
      {
        key: columnName,
        label: DEMOGRAPHIC_COLUMN_LABELS[columnName] ?? humanizeColumn(String(rawHeader)),
        optionLabels: values,
      },
    ];
  });

  return { users, demographics };
}

/**
 * Who receives the survey.
 *
 * Four mutually exclusive ways to answer that, laid out as one choice: the
 * whole company, a set of groups, a list built by hand, or a file. The panel
 * underneath belongs to whichever is active, so the page only ever asks one
 * question at a time.
 *
 * "Por grupos" and "Por colaborador" share one another's state, though: a
 * group brought in from the first shows up already ticked in the second. A
 * selected group is all-or-nothing, so "Por colaborador" can't carve one
 * person out of it — unchecking one of its members there instead asks
 * whether to drop the whole group (see `groupProtectedIds` below).
 */
export function ParticipantsEditor({
  participants,
  onChange,
  showValidation = false,
  onSelectionChange
}: ParticipantsEditorProps) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analyzingProgress, setAnalyzingProgress] = React.useState(0);
  const total = totalParticipantCount(participants);

  // "Por colaborador" checked set = group carry-over union with ad-hoc picks
  // — see the class doc above.
  const individualEffectiveIds = React.useMemo(
    () => [...effectiveIndividualIds(participants)],
    [participants]
  );
  const groupProtectedIds = React.useMemo(
    () => groupMemberIds(participants.groupSegmentBy, participants.selectedGroups),
    [participants.groupSegmentBy, participants.selectedGroups]
  );
  const groupLabelById = React.useMemo(() => {
    const map = new Map<string, string>();
    if (participants.selectedGroups.length === 0) return map;
    const groups = new Set(participants.selectedGroups);
    COLLABORATORS.forEach((person) => {
      const value = person[participants.groupSegmentBy] ?? "Sin asignar";
      if (groups.has(value)) map.set(person.id, value);
    });
    return map;
  }, [participants.groupSegmentBy, participants.selectedGroups]);

  const handleFiles = async (next: File[]) => {
    setFiles(next);
    const file = next[0];

    if (!file) {
      onChange({
        importedFileName: null,
        importedUsers: [],
        importedCount: 0,
        importedNewCount: 0,
        importedDemographics: [],
        importedFailed: false,
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalyzingProgress(0);

    const interval = setInterval(() => {
      setAnalyzingProgress((p) => {
        if (p >= 95) {
          clearInterval(interval);
          return p;
        }
        return p + 5;
      });
    }, 150);

    // Simulate AI extraction time
    await new Promise((resolve) => setTimeout(resolve, 2500));
    clearInterval(interval);
    setAnalyzingProgress(100);
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Parsed from the file itself rather than assumed — the preview reports
    // what was actually loaded. A file that isn't really a spreadsheet
    // (corrupt upload wearing a .csv name) makes SheetJS throw, which lands
    // in its own message instead of being lumped in with "the file was empty".
    try {
      const { users, demographics } = await readImportedUsers(file);
      const resolved = resolveImportedRows(users, COLLABORATORS);
      const newCount = resolved.filter((row) => row.person === null).length;
      onChange({
        importedFileName: file.name,
        importedUsers: users,
        importedCount: users.length,
        importedNewCount: newCount,
        importedDemographics: demographics,
        importedFailed: false,
      });
    } catch {
      onChange({
        importedFileName: file.name,
        importedUsers: [],
        importedCount: 0,
        importedNewCount: 0,
        importedDemographics: [],
        importedFailed: true,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // The parsed rows and the corrupt-flag live in the draft (see
  // `importedUsers`/`importedFailed`), so leaving this step and coming back
  // restores the preview instead of resetting it. The chip in the dropzone
  // needs a File to render, so a loaded file is re-derived from its name when
  // the local selection was wiped by the remount.
  const displayedFiles = React.useMemo(() => {
    if (files.length > 0) return files;
    if (participants.importedFileName) return [new File([], participants.importedFileName)];
    return files;
  }, [files, participants.importedFileName]);

  const handleRemoveImportedUsers = (identifiers: string[]) => {
    const toRemove = new Set(identifiers);
    const updatedUsers = participants.importedUsers.filter(u => {
      const id = u.username + "|" + u.email;
      return !toRemove.has(id);
    });
    const resolved = resolveImportedRows(updatedUsers, COLLABORATORS);
    const newCount = resolved.filter((row) => row.person === null).length;
    onChange({
      importedUsers: updatedUsers,
      importedCount: updatedUsers.length,
      importedNewCount: newCount,
    });
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col self-start rounded-2xl border border-border/60 bg-surface shadow-card">
      <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
          <Users className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[14px] font-bold tracking-tight text-text-primary">
          Participantes
        </h2>

        {/* The running total is the one number that survives every mode, so it
            lives in the header rather than inside whichever panel is open. */}
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold tabular-nums",
            total > 0 ? "bg-status-positive/10 text-status-positive" : "bg-border/40 text-muted-foreground"
          )}
        >
          {total === 1 ? "1 participante" : `${formatCount(total)} participantes`}
        </span>
      </div>

      {/* `cascade-enter` staggers this step's own pieces in one at a time —
          the validation hint (when present), the mode choice, then whichever
          panel that choice opens — instead of the whole block settling as one. */}
      <div className="flex flex-col gap-6 px-6 py-6 cascade-enter">
        {showValidation && total === 0 && (
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-destructive animate-in fade-in duration-200">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Selecciona al menos un participante para poder continuar.
          </p>
        )}

        <div role="radiogroup" aria-label="Cómo asignar participantes" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PARTICIPANT_MODES.map((mode) => (
            <ModeCard
              key={mode}
              mode={mode}
              isActive={participants.mode === mode}
              hasSelection={hasModeSelection(mode, participants)}
              state={modeState(mode, participants)}
              onSelect={() => onChange({ mode })}
            />
          ))}
        </div>

        {participants.mode === "company" && (
          <CompanySummary
            autoInclude={participants.companyAutoInclude}
            onAutoIncludeChange={(companyAutoInclude) => onChange({ companyAutoInclude })}
          />
        )}

        {participants.mode === "groups" && (
          <GroupsPanel
            segmentBy={participants.groupSegmentBy}
            onSegmentByChange={(groupSegmentBy) => onChange({ groupSegmentBy, ...clearedGroupSelection() })}
            selectedGroups={participants.selectedGroups}
            onToggleGroup={(value) => {
              onChange(
                participants.selectedGroups.includes(value)
                  ? withGroupDeselected(participants, value)
                  : { selectedGroups: [...participants.selectedGroups, value] }
              );
            }}
            onSelectAll={(values) => onChange({ selectedGroups: values })}
            onClearAll={() => onChange(clearedGroupSelection())}
            autoInclude={participants.groupsAutoInclude}
            onAutoIncludeChange={(groupsAutoInclude) => onChange({ groupsAutoInclude })}
            onSelectionChange={onSelectionChange}
          />
        )}

        {participants.mode === "individual" && (
          <CollaboratorTable
            collaborators={COLLABORATORS}
            selectedIds={individualEffectiveIds}
            onChange={(selectedIds) => onChange({ selectedIds, ...clearedGroupSelection() })}
            onToggleIndividual={(id) => {
              const next = new Set(participants.selectedIds);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              onChange({ selectedIds: [...next] });
            }}
            onSelectionChange={onSelectionChange}
            groupProtectedIds={groupProtectedIds}
            groupLabelFor={(id) => groupLabelById.get(id) ?? null}
            onDeselectGroup={(groupValue) => onChange(withGroupDeselected(participants, groupValue))}
            onKeepGroupRestIndividually={(groupValue, personId) =>
              onChange(withGroupConvertedToIndividuals(participants, groupValue, personId))
            }
          />
        )}

        {participants.mode === "import" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-text-primary">Importar archivo</p>
            </div>

            {isAnalyzing ? (
              <AnalyzingState progress={analyzingProgress} />
            ) : (
              <>
                <UploadZone
                  isAI={true}
                  value={displayedFiles}
                  onChange={handleFiles}
                  accept=".csv,.xlsx"
                  maxFiles={1}
                  maxSizeMB={5}
                  idleText="Arrastra el archivo aquí o haz clic para buscarlo"
                  activeText="Suelta el archivo para cargarlo"
                  description="Un archivo .csv o .xlsx con nombre o username como mínimo, hasta 5 MB."
                />

                {participants.importedFileName &&
                  (participants.importedFailed ? (
                    <ImportErrorState fileName={participants.importedFileName} />
                  ) : participants.importedUsers.length === 0 ? (
                    <EmptyImportState />
                  ) : (
                    <ImportedUsersTable
                      key={participants.importedFileName}
                      users={participants.importedUsers}
                      collaboratorCount={participants.importedCount}
                      fileName={participants.importedFileName}
                      collaborators={COLLABORATORS}
                      onRemoveUsers={handleRemoveImportedUsers}
                      onSelectionChange={onSelectionChange}
                    />
                  ))}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function AnalyzingState({ progress }: { progress: number }) {
  return (
    <AiAnalyzingState
      title="Analizando el archivo"
      progress={progress}
      detail="Participantes y datos demográficos"
      caption="Estamos leyendo el archivo y validando qué columnas podemos usar como datos demográficos."
    />
  );
}

/** The one line under each card's description: what that mode holds right now. */
function modeState(mode: ParticipantMode, participants: ParticipantsSelection): string {
  switch (mode) {
    case "company":
      return `${formatCount(COLLABORATOR_COUNT)} colaboradores`;
    case "groups":
      return participants.selectedGroups.length === 0
        ? "Ningún grupo seleccionado"
        : `${formatCount(participants.selectedGroups.length)} grupos · ${formatCount(participantCountForMode("groups", participants))} personas`;
    case "individual": {
      const total = participantCountForMode("individual", participants);
      if (total === 0) return "Sin seleccionar";
      const groupCount = participants.selectedGroups.length;
      // No groups feeding in: the plain, pre-existing reading.
      if (groupCount === 0) return `${formatCount(total)} de ${formatCount(COLLABORATOR_COUNT)} seleccionados`;
      const fromGroups = groupMemberIds(participants.groupSegmentBy, participants.selectedGroups).size;
      const extra = total - fromGroups;
      const groupsLabel = `${formatCount(groupCount)} ${groupCount === 1 ? "grupo" : "grupos"} (${formatCount(fromGroups)})`;
      return extra > 0 ? `${groupsLabel} + ${formatCount(extra)} individuales` : groupsLabel;
    }
    case "import":
      return participants.importedFileName ?? "Ningún archivo cargado";
  }
}

/**
 * Whether a mode already has people in it, independent of which panel is
 * currently open below. "Toda la empresa" is the one exclusive choice — it
 * only counts while it is the active mode, since picking it makes every
 * other source stop contributing (see `totalParticipantCount`). Groups,
 * hand-picked collaborators and an import all combine freely, so each shows
 * as selected the moment it holds anyone, even while a different one of
 * those three is the mode currently open.
 */
function hasModeSelection(mode: ParticipantMode, participants: ParticipantsSelection): boolean {
  switch (mode) {
    case "company":
      return participants.mode === "company";
    case "groups":
      return participants.mode !== "company" && participants.selectedGroups.length > 0;
    case "individual":
      return participants.mode !== "company" && participantCountForMode("individual", participants) > 0;
    case "import":
      return participants.importedCount > 0;
  }
}

function ModeCard({
  mode,
  isActive,
  hasSelection,
  state,
  onSelect,
}: {
  mode: ParticipantMode;
  /** Whether this mode's panel is the one open below. */
  isActive: boolean;
  /** Whether this mode already contributes people to the audience — shown
   * checked even while a different mode's panel is open, so mixing several
   * ways of adding participants stays visible. */
  hasSelection: boolean;
  state: string;
  onSelect: () => void;
}) {
  const { icon: Icon, title, description } = PARTICIPANT_MODE_COPY[mode];
  const isAI = mode === "import";
  const isMarked = isActive || hasSelection;

  return (
    <MagicCard
      isSelected={isMarked}
      variant={isAI ? "ai" : "primary"}
      onClick={onSelect}
      className={cn("w-full", isAI && isMarked ? "p-[14px]" : "")}
      contentClassName="flex-col gap-3 h-full text-left w-full"
    >
      <div className="flex items-start justify-between gap-2 w-full">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
            isMarked && !isAI ? "bg-primary/10 text-primary" : "",
            !isMarked && !isAI ? "bg-muted/60 text-muted-foreground" : "",
            isAI ? "bg-ai-bg text-primary" : ""
          )}
        >
          {isAI ? <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} /> : <Icon className="h-[18px] w-[18px]" strokeWidth={2} />}
        </span>
        {/* Una marca dibujada, no un `Checkbox`: la tarjeta entera ya es el
            botón que alterna este modo, y meter el checkbox real dentro
            anidaría un botón en otro —HTML inválido, y dos cosas pulsables
            para una sola decisión—. */}
        <span
          aria-hidden
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-sm border transition-colors",
            isMarked
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-surface"
          )}
        >
          {isMarked && <CheckIcon className="size-3.5" strokeWidth={2.5} />}
        </span>
      </div>

      <div className="w-full">
        <h3 className={cn("text-[13px] font-bold leading-none tracking-tight", isAI ? "text-ai-gradient-start" : isMarked ? "text-text-primary" : "text-text-secondary")}>
          {isAI ? "Importar con IA" : title}
        </h3>
        <p className="mt-1.5 text-[11px] font-medium leading-[1.35] text-text-muted line-clamp-2">
          {description}
        </p>
      </div>

      <div className="mt-auto pt-1 w-full">
        <span className="inline-flex rounded-full bg-surface-muted px-2 py-0.5 text-[9.5px] font-bold tracking-tight text-text-secondary">
          {state}
        </span>
      </div>
    </MagicCard>
  );
}

/**
 * "Everyone" is an abstraction until you can see what it contains, so the
 * company option shows how that total breaks down instead of a blank panel.
 *
 * A real table, not a metric: this is reference data to scan and compare by
 * number, not a magnitude to feel at a glance — so it reads as rows with
 * hairline dividers, ranked, the count as the one bold figure per row and its
 * share as quiet context beside it.
 */
function CompanySummary({
  autoInclude,
  onAutoIncludeChange,
}: {
  autoInclude: boolean;
  onAutoIncludeChange: (value: boolean) => void;
}) {
  const [segmentBy, setSegmentBy] = React.useState<SegmentKey>("area");
  const [sortKey, setSortKey] = React.useState<"segment" | "count" | null>("count");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [segmentFilter, setSegmentFilter] = React.useState<ReadonlySet<string>>(() => new Set());

  // Whenever the segment category changes, clear the filter and reset sort to default.
  const handleSegmentByChange = (val: SegmentKey) => {
    setSegmentBy(val);
    setSegmentFilter(new Set());
    setSortKey("count");
    setSortDir("desc");
  };

  const segments = React.useMemo(() => {
    let entries = [...segmentCounts(segmentBy).entries()];

    if (segmentFilter.size > 0) {
      entries = entries.filter(([segment]) => segmentFilter.has(segment));
    }

    if (sortKey) {
      const direction = sortDir === "asc" ? 1 : -1;
      entries.sort((a, b) => {
        if (sortKey === "segment") {
          return direction * a[0].localeCompare(b[0], "es");
        } else {
          return direction * (a[1] - b[1]);
        }
      });
    }

    return entries;
  }, [segmentBy, segmentFilter, sortKey, sortDir]);

  const toggleSort = (key: "segment" | "count") => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
    }
  };

  const toggleSegmentFilter = (value: string) => {
    setSegmentFilter((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  // Extract all unique segments for the filter dropdown (regardless of current filter)
  const allSegments = React.useMemo(() => {
    const set = new Set<string>();
    COLLABORATORS.forEach((person) => set.add(person[segmentBy] ?? "Sin asignar"));
    return [...set].sort((a, b) => a.localeCompare(b, "es"));
  }, [segmentBy]);

  return (
    <div className="flex flex-col gap-5">
      <AutoIncludeToggle
        checked={autoInclude}
        onCheckedChange={onAutoIncludeChange}
        title="Incluir automáticamente nuevos colaboradores"
        description="Si alguien se une a la empresa después de lanzar la encuesta, se agrega solo a la lista de participantes."
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pb-2">
        <div className="shrink-0">
          <p className="text-[13px] text-text-secondary font-medium mb-1">
            Se asignarán
          </p>
          <p className="text-3xl font-bold tracking-tight text-primary leading-none">
            {formatCount(COLLABORATOR_COUNT)}{" "}
            <span className="text-[16px] font-semibold text-text-secondary">colaboradores</span>
          </p>
        </div>
        <div className="hidden sm:block w-px h-10 bg-border/60" />
        <p className="text-[13px] leading-relaxed text-muted-foreground max-w-2xl">
          La lista de destinatarios se cerrará de forma automática al momento de lanzar la encuesta. Quienes entren a la empresa antes de esa fecha también la recibirán.
        </p>
      </div>

      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[13px] font-bold text-text-primary">
            Detalle de la distribución
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-muted-foreground">Ver por:</span>
            <Select value={segmentBy} onValueChange={(val) => handleSegmentByChange(val as SegmentKey)}>
              <SelectTrigger className="h-8 w-[140px] rounded-lg border-border/60 bg-surface px-3 text-[12px] shadow-card focus:ring-2 focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {Object.entries(SEGMENT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-[12px]">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                <TableHead
                  aria-sort={sortKey === "segment" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                  className="py-3 pl-6"
                >
                  <div className="flex items-center gap-2">
                    <SortableHeader
                      label={SEGMENT_LABELS[segmentBy]}
                      active={sortKey === "segment"}
                      direction={sortDir}
                      onToggle={() => toggleSort("segment")}
                    />
                    <FilterMenu
                      label=""
                      options={allSegments}
                      selected={segmentFilter}
                      onToggle={toggleSegmentFilter}
                      onClear={() => setSegmentFilter(new Set())}
                    />
                  </div>
                </TableHead>
                <TableHead
                  aria-sort={sortKey === "count" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                  className="w-[120px] py-3 text-right"
                >
                  <div className="flex justify-end">
                    <SortableHeader
                      label="Cantidad"
                      active={sortKey === "count"}
                      direction={sortDir}
                      onToggle={() => toggleSort("count")}
                    />
                  </div>
                </TableHead>
                <TableHead className="w-[80px] py-3 pr-6 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  %
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map(([segment, count]) => {
                const share = Math.round((count / COLLABORATOR_COUNT) * 100);
                return (
                  <TableRow key={segment} className="border-border/60 bg-surface hover:bg-border/20 transition-colors">
                    <TableCell className="py-2.5 pl-7 text-[13px] text-text-secondary">
                      {segment}
                    </TableCell>
                    <TableCell className="w-[120px] py-2.5 text-right tabular-nums text-[13px] text-text-secondary">
                      {formatCount(count)}
                    </TableCell>
                    <TableCell className="w-[80px] py-2.5 pr-6 text-right tabular-nums text-[13px] text-text-secondary">
                      {share}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

/**
 * "Por grupos" mode: the audience is every collaborator inside whichever
 * areas, leaders, or other category values the author checks off. Same
 * bucketing as the company breakdown table, but the values become a
 * selection instead of a read-only ranking.
 */
function HeaderSelectionMark({ state }: { state: boolean | "indeterminate" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-xs border transition-colors",
        state === false ? "border-input" : "border-primary bg-primary text-primary-foreground"
      )}
    >
      {state === "indeterminate" && <MinusIcon className="size-3.5" strokeWidth={2.5} />}
      {state === true && <CheckIcon className="size-3.5" />}
    </span>
  );
}

const PAGE_SIZES = [10, 25, 50] as const;

function GroupsPanel({
  segmentBy,
  onSegmentByChange,
  selectedGroups,
  onToggleGroup,
  onSelectAll,
  onClearAll,
  autoInclude,
  onAutoIncludeChange,
  onSelectionChange,
}: {
  segmentBy: SegmentKey;
  onSegmentByChange: (value: SegmentKey) => void;
  selectedGroups: readonly string[];
  onToggleGroup: (value: string) => void;
  onSelectAll: (values: readonly string[]) => void;
  onClearAll: () => void;
  autoInclude: boolean;
  onAutoIncludeChange: (value: boolean) => void;
  onSelectionChange?: (count: number, actions: TableSelectionActions) => void;
}) {
  const groups = React.useMemo(
    () => [...segmentCounts(segmentBy).entries()].sort((a, b) => b[1] - a[1]),
    [segmentBy]
  );
  
  const [query, setQuery] = React.useState("");
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [onlySelected, setOnlySelected] = React.useState(false);
  const [pageSize, setPageSize] = React.useState<number>(PAGE_SIZES[0]);
  const [page, setPage] = React.useState(1);


  const selectedSet = React.useMemo(() => new Set(selectedGroups), [selectedGroups]);
  const selectedCount = React.useMemo(
    () => groupMemberIds(segmentBy, selectedGroups).size,
    [segmentBy, selectedGroups]
  );
  
  const terms = React.useMemo(
    () => query.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/\s+/).filter(Boolean),
    [query]
  );

  const filtered = React.useMemo(() => {
    return groups.filter(([group]) => {
      const g = group.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      const matchesSearch = terms.every((t) => g.includes(t));
      const matchesSelected = !onlySelected || selectedSet.has(group);
      return matchesSearch && matchesSelected;
    });
  }, [groups, terms, onlySelected, selectedSet]);

  
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const visible = filtered.slice(firstIndex, firstIndex + pageSize);

  const selectedOnPage = visible.filter(([group]) => selectedSet.has(group)).length;

  const headerState =
    filtered.length > 0 && selectedOnPage === filtered.length
      ? true
      : selectedOnPage > 0
        ? "indeterminate"
        : false;

  const callbacksRef = React.useRef({ onSelectionChange, onClearAll });
  React.useEffect(() => {
    callbacksRef.current = { onSelectionChange, onClearAll };
  });
  React.useEffect(() => {
    const { onSelectionChange: currentChange, onClearAll: currentClear } = callbacksRef.current;
    currentChange?.(selectedCount, { clear: () => currentClear() });
  }, [selectedCount]);

  const selectAllMatches = () => {
    const toAdd = filtered.map(([group]) => group).filter(g => !selectedSet.has(g));
    onSelectAll([...selectedGroups, ...toAdd]);
  };
  
  const deselectAllMatches = () => {
    const toRemove = new Set(filtered.map(([group]) => group));
    onSelectAll(selectedGroups.filter((g) => !toRemove.has(g)));
  };

  const clearSelection = () => {
    onClearAll();
    setOnlySelected(false);
  };

  const allMatchesSelected = filtered.length > 0 && filtered.every(([group]) => selectedSet.has(group));
  const showSelectAll = filtered.length > 0 && !allMatchesSelected;
  const showDeselectAll = allMatchesSelected;

  return (
    <div className="flex flex-col gap-5">
      <AutoIncludeToggle
        checked={autoInclude}
        onCheckedChange={onAutoIncludeChange}
        title="Incluir automáticamente nuevos colaboradores"
        description="Si alguien se une a uno de los grupos seleccionados después de lanzar la encuesta, se agrega solo a la lista de participantes."
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pb-2">
        <div className="shrink-0">
          <p className="text-[13px] text-text-secondary font-medium mb-1">
            Se asignarán
          </p>
          <p className="text-3xl font-bold tracking-tight text-primary leading-none">
            {formatCount(selectedCount)}{" "}
            <span className="text-[16px] font-semibold text-text-secondary">colaboradores</span>
          </p>
        </div>
        <div className="hidden sm:block w-px h-10 bg-border/60" />
        <p className="text-[13px] leading-relaxed text-muted-foreground max-w-2xl">
          Elige cómo agrupar a tus colaboradores y marca los grupos que deben responder la encuesta.
        </p>
      </div>

      <div className="flex flex-col gap-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-muted-foreground">Agrupar por:</span>
            <Select value={segmentBy} onValueChange={(val) => {
              onSegmentByChange(val as SegmentKey);
              setQuery("");
              setOnlySelected(false);
              setPage(1);
            }}>
              <SelectTrigger className="h-8 w-[140px] rounded-lg border-border/60 bg-surface px-3 text-[12px] shadow-card focus:ring-2 focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {Object.entries(SEGMENT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} className="text-[12px]">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div
              className={cn(
                "relative flex h-9 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden rounded-lg border bg-surface",
                (isSearchExpanded || query !== "")
                  ? "w-[300px] border-primary/50 ring-1 ring-primary/15"
                  : "w-9 border-border hover:bg-border/50 cursor-pointer"
              )}
              onClick={() => {
                if (!isSearchExpanded && query === "") {
                  setIsSearchExpanded(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }
              }}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget) && query === "") {
                  setIsSearchExpanded(false);
                }
              }}
            >
              <div
                className={cn(
                  "absolute left-0 -ml-px -mt-px flex h-9 w-9 items-center justify-center transition-colors",
                  (isSearchExpanded || query !== "") ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Search className="h-4 w-4 translate-x-[0.667px] translate-y-[0.667px]" strokeWidth={2} />
              </div>
              
              <input
                ref={searchInputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Busca por nombre del grupo"
                aria-label="Buscar grupos"
                className={cn(
                  "h-full w-[300px] bg-transparent pl-9 pr-8 text-[13px] text-text-primary outline-none transition-all placeholder:text-muted-foreground/70",
                  (isSearchExpanded || query !== "") ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
              />
              {query !== "" && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-border/60 hover:text-text-primary"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              )}
            </div>

            <div
              className={cn(
                "flex shrink-0 items-center overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                (selectedGroups.length > 0 || onlySelected)
                  ? "max-w-[200px] opacity-100"
                  : "max-w-0 opacity-0 pointer-events-none"
              )}
            >
              <button
                type="button"
                onClick={() => {
                  setOnlySelected((value) => !value);
                  setPage(1);
                }}
                className={cn(
                  "flex h-9 whitespace-nowrap shrink-0 items-center gap-2 rounded-lg border px-3 text-[13px] font-semibold transition-colors",
                  onlySelected
                    ? "border-primary/40 bg-primary/5 text-primary"
                    : "border-border text-text-secondary hover:border-primary/30 hover:text-primary"
                )}
              >
                {onlySelected ? (
                  <EyeOff className="h-3.5 w-3.5" strokeWidth={2} />
                ) : (
                  <Eye className="h-3.5 w-3.5" strokeWidth={2} />
                )}
                {onlySelected ? "Ver todos" : `Ver seleccionados (${formatCount(selectedGroups.length)})`}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-16 px-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          disabled={filtered.length === 0}
                          aria-label="Opciones de selección"
                          className="group flex h-8 w-full items-center gap-1 pl-6"
                        >
                          <HeaderSelectionMark state={headerState} />
                          <ChevronDown
                            className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-text-primary"
                            strokeWidth={2.5}
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-96">
                        {showSelectAll && (
                          <DropdownMenuItem onClick={selectAllMatches}>
                            Seleccionar todos los grupos ({formatCount(filtered.length)})
                          </DropdownMenuItem>
                        )}
                        {showSelectAll && showDeselectAll && (
                          <DropdownMenuSeparator />
                        )}
                        {showDeselectAll && (
                          <DropdownMenuItem onClick={deselectAllMatches}>
                            Deseleccionar todos los grupos
                          </DropdownMenuItem>
                        )}
                        {selectedGroups.length > 0 && (
                          <>
                            <div className="my-1 h-px bg-border" role="separator" />
                            <DropdownMenuItem
                              onClick={clearSelection}
                              className="text-status-negative focus:text-status-negative focus:bg-status-negative/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar seleccionados ({selectedGroups.length})
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableHead>
                  <TableHead className="min-w-[200px] py-3 text-[12px] font-semibold text-muted-foreground">
                    Grupo
                  </TableHead>
                  <TableHead className="w-[120px] py-3 text-right text-[12px] font-semibold text-muted-foreground">
                    Cantidad
                  </TableHead>
                  <TableHead className="w-[80px] py-3 pr-6 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    %
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map(([group, count]) => {
                  const isSelected = selectedSet.has(group);
                  const share = Math.round((count / COLLABORATOR_COUNT) * 100);
                  return (
                    <TableRow
                      key={group}
                      data-state={isSelected ? "selected" : undefined}
                      onClick={() => onToggleGroup(group)}
                      className="cursor-pointer border-border/60 transition-colors"
                    >
                      <TableCell className="px-0">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onToggleGroup(group)}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Seleccionar grupo ${group}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-[13px] text-text-secondary">
                        {group}
                      </TableCell>
                      <TableCell className="w-[120px] py-2.5 text-right tabular-nums text-[13px] text-text-secondary">
                        {formatCount(count)}
                      </TableCell>
                      <TableCell className="w-[80px] py-2.5 pr-6 text-right tabular-nums text-[13px] text-muted-foreground">
                        {share}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {filtered.length === 0 && (
              <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center border-t border-border/60">
                <p className="text-[13px] font-semibold text-text-primary">
                  {onlySelected ? "Aún no has seleccionado ningún grupo" : "Sin resultados"}
                </p>
                <p className="max-w-xs text-[12px] leading-relaxed text-muted-foreground">
                  {onlySelected
                    ? "Vuelve a la lista completa para elegir grupos."
                    : "Prueba con otro nombre."}
                </p>
              </div>
            )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12px] text-muted-foreground">
            {filtered.length === 0
              ? "0 grupos"
              : `${formatCount(firstIndex + 1)}–${formatCount(firstIndex + visible.length)} de ${formatCount(filtered.length)}`}
          </p>

          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPage(1);
              }}
            >
              <SelectTrigger
                aria-label="Grupos por página"
                className="h-8 w-[130px] rounded-lg px-2.5 text-[12px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={6}>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)} className="text-[13px]">
                    {size} por página
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <PagerButton
              label="Página anterior"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Anterior
            </PagerButton>
            <span className="text-[12px] tabular-nums text-text-secondary">
              {formatCount(currentPage)} / {formatCount(pageCount)}
            </span>
            <PagerButton
              label="Página siguiente"
              disabled={currentPage >= pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              Siguiente
            </PagerButton>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A named on/off switch for whether future joiners are swept into the
 * audience automatically. Shared by "Toda la empresa" and "Por grupos" —
 * same question, scoped to a different population. */
function AutoIncludeToggle({
  checked,
  onCheckedChange,
  title,
  description,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5">
      <div className="flex flex-col gap-0.5 pr-2">
        <p className="text-[13px] font-semibold text-text-primary">{title}</p>
        <p className="text-[12px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5 shrink-0" />
    </div>
  );
}

/** The file's bytes could not be read as a spreadsheet at all. Centered empty
 * state in a subtle tone — a failed parse is a broken input to replace, not
 * an error to argue with. */
function ImportErrorState({ fileName }: { fileName: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-status-warning/25 bg-status-warning/5 px-6 py-10 text-center">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-status-warning/10 text-status-warning">
        <FileX2 className="h-6 w-6" strokeWidth={2} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-bold tracking-tight text-text-primary">
          No pudimos leer el archivo
        </p>
        <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          “{fileName}” parece estar corrupto o no ser una planilla válida. Revisa el archivo y
          vuelve a intentarlo.
        </p>
      </div>
    </div>
  );
}

/** The file parsed fine — it really is a spreadsheet — but its structure has
 * no columns the screen reads as users. Same empty-state shape as the corrupt
 * case, in neutral tones: wrong input, not broken bytes. */
function EmptyImportState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-muted/30 px-6 py-10 text-center">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
        <FileSearch className="h-6 w-6" strokeWidth={2} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-bold tracking-tight text-text-primary">
          No encontramos usuarios en el archivo
        </p>
        <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          El archivo es válido, pero su estructura no nos permite detectar usuarios. Revisa que
          tenga una columna “nombre” o “username” con al menos una fila.
        </p>
      </div>
    </div>
  );
}
