import * as React from "react";
import type { TableSelectionActions } from "@/components/action-rail";
import * as XLSX from "xlsx";
import { CheckCircle2, FileSearch, FileX2, TriangleAlert, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadZone } from "@/components/upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { SortableHeader, FilterMenu, type SortDir } from "./CollaboratorTableParts";
import { ImportedUsersTable } from "./ImportedUsersTable";
import {
  DEMOGRAPHIC_COLUMN_LABELS,
  PARTICIPANT_MODES,
  PARTICIPANT_MODE_COPY,
  formatCount,
  humanizeColumn,
  participantCount,
  resolveImportedRows,
  type ImportedUser,
} from "./participants";
import type {
  ImportedDemographic,
  ParticipantMode,
  ParticipantsSelection,
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
 * Three mutually exclusive ways to answer that, laid out as one choice: the
 * whole company, a list built by hand, or a file. The panel underneath belongs
 * to whichever is active, so the page only ever asks one question at a time.
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
  const total = participantCount(participants);

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

      <div className="flex flex-col gap-6 px-6 py-6">
        {showValidation && total === 0 && (
          <p className="flex items-center gap-1.5 text-[12px] font-medium text-destructive animate-in fade-in duration-200">
            <TriangleAlert className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            Selecciona al menos un participante para poder continuar.
          </p>
        )}

        <div role="radiogroup" aria-label="Cómo asignar participantes" className="grid gap-4 lg:grid-cols-3">
          {PARTICIPANT_MODES.map((mode) => (
            <ModeCard
              key={mode}
              mode={mode}
              isActive={participants.mode === mode}
              state={modeState(mode, participants)}
              onSelect={() => onChange({ mode })}
            />
          ))}
        </div>

        {participants.mode === "company" && <CompanySummary />}

        {participants.mode === "individual" && (
          <CollaboratorTable
            collaborators={COLLABORATORS}
            selectedIds={participants.selectedIds}
            onChange={(selectedIds) => onChange({ selectedIds })}
            onSelectionChange={onSelectionChange}
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
    <div className="relative flex flex-col min-h-[300px] p-[2px] rounded-xl bg-ai-gradient shimmer-mirror shadow-card animate-in fade-in duration-300 select-none">
      <div className="relative z-10 flex-1 w-full bg-ai-mesh-card rounded-[calc(var(--radius-xl)-2px)] flex flex-col items-center justify-center p-6 gap-6">
        
        {/* Pulsing UBITS AI Icon */}
        <div className="relative w-16 h-16 flex items-center justify-center mb-1">
          <div className="absolute w-11 h-11 rounded-full bg-ai-gradient opacity-20 blur-xl animate-pulse" />
          <svg width="42" height="42" viewBox="0 0 24 24" className="relative">
            <defs>
              <linearGradient id="aiLoaderIconGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="hsl(var(--ai-gradient-start))" />
                <stop offset="100%" stopColor="hsl(var(--ai-gradient-end))" />
              </linearGradient>
            </defs>
            <path
              d="M12,3 Q12,12 3,12 Q12,12 12,21 Q12,12 21,12 Q12,12 12,3 Z"
              fill="none"
              stroke="url(#aiLoaderIconGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-[pulse_1.8s_infinite_ease-in-out]"
            />
            <path
              d="M19,5 Q19,7 17,7 Q19,7 19,9 Q19,7 21,7 Q19,7 19,5 Z"
              fill="url(#aiLoaderIconGrad)"
              className="animate-[pulse_1.3s_infinite_ease-in-out] [animation-delay:0.3s]"
            />
            <circle
              cx="5.5"
              cy="18.5"
              r="1.75"
              fill="url(#aiLoaderIconGrad)"
              className="animate-[pulse_1.5s_infinite_ease-in-out] [animation-delay:0.6s]"
            />
          </svg>
        </div>
        
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-[16px] font-bold text-ai-gradient">
            Analizando archivos
          </p>
        </div>

        <div className="w-full max-w-sm flex flex-col gap-2">
          <div className="flex justify-between items-end text-[12px] font-bold">
            <span className="text-text-secondary">0 objetivos en 0 usuarios</span>
            <span className="text-ai-gradient">
              {progress}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden relative">
            <div 
              className="h-full bg-ai-gradient rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-[11px] text-text-secondary mt-2">
            Estamos extrayendo y validando la información de tus objetivos.
          </p>
        </div>
      </div>
    </div>
  );
}

/** The one line under each card's description: what that mode holds right now. */
function modeState(mode: ParticipantMode, participants: ParticipantsSelection): string {
  switch (mode) {
    case "company":
      return `${formatCount(COLLABORATOR_COUNT)} colaboradores`;
    case "individual":
      return participants.selectedIds.length === 0
        ? "Sin seleccionar"
        : `${formatCount(participants.selectedIds.length)} de ${formatCount(COLLABORATOR_COUNT)} seleccionados`;
    case "import":
      return participants.importedFileName ?? "Ningún archivo cargado";
  }
}

function ModeCard({
  mode,
  isActive,
  state,
  onSelect,
}: {
  mode: ParticipantMode;
  isActive: boolean;
  state: string;
  onSelect: () => void;
}) {
  const { icon: Icon, title, description } = PARTICIPANT_MODE_COPY[mode];
  const isAI = mode === "import";

  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col rounded-xl overflow-hidden transition",
        isAI && isActive ? "p-[2px] bg-ai-gradient" : "",
        !isAI && isActive ? "border p-4 border-primary bg-primary/[0.04] shadow-card ring-1 ring-primary/20" : "",
        !isActive && !isAI ? "border p-4 border-border/60 hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-card" : "",
        !isActive && isAI ? "border p-4 border-border/60 hover:border-primary/30 hover:shadow-card bg-ai-mesh-card" : ""
      )}
    >
      <input
        type="radio"
        name="participant-mode"
        checked={isActive}
        onChange={onSelect}
        className="sr-only"
      />

      <div 
        className={cn(
          "flex flex-col gap-3 h-full",
          isAI && isActive ? "p-[14px] rounded-[calc(var(--radius-xl)-2px)] bg-ai-mesh-card" : ""
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
              isActive && !isAI ? "bg-primary/10 text-primary" : "",
              !isActive && !isAI ? "bg-muted/60 text-muted-foreground" : "",
              isAI ? "bg-ai-bg text-primary" : ""
            )}
          >
            {isAI ? <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} /> : <Icon className="h-[18px] w-[18px]" strokeWidth={2} />}
          </span>

          {isActive ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 fill-primary text-primary-foreground" strokeWidth={2} />
          ) : (
            <span aria-hidden className="h-5 w-5 shrink-0 rounded-full border border-border-strong/40" />
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[14px] font-semibold tracking-tight text-text-primary">
            {isAI ? "Importar archivo con IA" : title}
          </span>
          <p className="text-[12px] leading-relaxed text-text-secondary">{description}</p>
        </div>

        <span
          className={cn(
            "w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums mt-auto",
            isActive ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"
          )}
        >
          {state}
        </span>
      </div>
    </label>
  );
}

// Add this type and these options outside the function
type SegmentKey = "area" | "leader" | "country" | "age" | "gender";
const SEGMENT_LABELS: Record<SegmentKey, string> = {
  area: "Área",
  leader: "Líder",
  country: "País",
  age: "Edad",
  gender: "Sexo",
};

/**
 * "Everyone" is an abstraction until you can see what it contains, so the
 * company option shows how that total breaks down instead of a blank panel.
 *
 * A real table, not a metric: this is reference data to scan and compare by
 * number, not a magnitude to feel at a glance — so it reads as rows with
 * hairline dividers, ranked, the count as the one bold figure per row and its
 * share as quiet context beside it.
 */
function CompanySummary() {
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
    const counts = new Map<string, number>();
    COLLABORATORS.forEach((person) => {
      const value = person[segmentBy] ?? "Sin asignar";
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });
    
    let entries = [...counts.entries()];

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
    <div className="flex flex-col gap-5 rounded-xl border border-border/60 p-6 shadow-card bg-surface">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 border-b border-border/60 pb-5">
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

      <div className="flex flex-col gap-4">
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
