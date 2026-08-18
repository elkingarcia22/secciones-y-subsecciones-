import * as React from "react";
import { BadgeCheck, UserPlus, UserRoundX } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Collaborator } from "@/mocks/collaborators";
import { formatCount, resolveImportedRows, type ImportedUser, type ResolvedImportRow } from "./participants";
import {
  CollaboratorRow,
  FilterMenu,
  PagerButton,
  SortableHeader,
} from "./CollaboratorTableParts";
import { initials } from "./collaboratorTableShared";

interface ImportedUsersTableProps {
  /** The directory the import is resolved against: rows found in it (by
   * username or email) get the platform's real data; the rest are new to this
   * survey. */
  collaborators: readonly Collaborator[];
  /** Rows read from the imported file, in file order. */
  users: readonly ImportedUser[];
  /** How many people the file resolved to (what will actually load). */
  collaboratorCount: number;
  /** Loaded file's name, shown so the message ties to what was uploaded. */
  fileName: string | null;
}

type Tab = "new" | "existing";

const PAGE_SIZES = [10, 25, 50] as const;

type SortKey = "name" | "email";
type SortDir = "asc" | "desc";

/** "ana.hernandez0" -> "Ana Hernandez": a readable display name for a row
 * that only carries a username. */
function fallbackLabel(username: string): string {
  return username
    .replace(/\d+$/, "")
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** How the row shows up in the "Colaborador" column. */
function displayName(row: ResolvedImportRow): string {
  return row.person
    ? row.person.name
    : row.user.name || fallbackLabel(row.user.username);
}

/** How the row shows up in the email column. */
function displayEmail(row: ResolvedImportRow): string {
  if (row.person) return row.person.email;
  return row.user.email || (row.user.username ? `${row.user.username}@ubits.co` : "—");
}

/** The string a row is filtered by for the Área column. */
function areaKey(row: ResolvedImportRow): string {
  return row.person ? row.person.area : row.user.area || "—";
}

/** The string a row is filtered by for the Líder column. */
function leaderKey(row: ResolvedImportRow): string {
  return row.person ? (row.person.leader ?? "—") : row.user.leader || "—";
}

/**
 * Preview of what an imported file will load, rendered with the directory's
 * own table so "lo que se carga" y "el directorio" se leen como lo mismo.
 *
 * Rows are split in two by whether they matched an existing platform user
 * (by username or email): "Usuarios nuevos" only exist for this survey, the
 * rest already belong to the directory. When every row lands on one side, the
 * tabs disappear and that single list is shown as-is.
 */
export function ImportedUsersTable({
  collaborators,
  users,
  collaboratorCount,
  fileName,
}: ImportedUsersTableProps) {
  const [tab, setTab] = React.useState<Tab>("new");
  const [sortKey, setSortKey] = React.useState<SortKey | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDir>("asc");
  const [areaFilter, setAreaFilter] = React.useState<ReadonlySet<string>>(() => new Set());
  const [leaderFilter, setLeaderFilter] = React.useState<ReadonlySet<string>>(() => new Set());
  const [pageSize, setPageSize] = React.useState<number>(PAGE_SIZES[0]);
  const [page, setPage] = React.useState(1);

  // Resolved once, with the same rule the editor uses to count new users — a
  // row is "existing" when its username or its email matches an entry in the
  // directory; either identifier is enough.
  const rows = React.useMemo(
    () => resolveImportedRows(users, collaborators),
    [users, collaborators]
  );

  const newRows = React.useMemo(() => rows.filter((row) => row.person === null), [rows]);
  const existingRows = React.useMemo(() => rows.filter((row) => row.person !== null), [rows]);

  // Only one tab exists when the import landed entirely on one side. The tab
  // state then refers to a group that may be empty (it defaults to "new"), so
  // the rows to show must follow whichever side actually has people in it —
  // otherwise an all-existing file would render the empty new group.
  const showTabs = newRows.length > 0 && existingRows.length > 0;
  const activeTab: Tab = showTabs ? tab : newRows.length > 0 ? "new" : "existing";
  const activeRows = activeTab === "new" ? newRows : existingRows;

  const switchTab = (next: Tab) => {
    setTab(next);
    setAreaFilter(new Set());
    setLeaderFilter(new Set());
    setPage(1);
  };

  // Filter options come from the rows the active tab shows, so each tab's
  // menus match the columns it can actually filter.
  const areas = React.useMemo(
    () => [...new Set(activeRows.map(areaKey))].sort((a, b) => a.localeCompare(b, "es")),
    [activeRows]
  );
  const leaders = React.useMemo(
    () => [...new Set(activeRows.map(leaderKey))].sort((a, b) => a.localeCompare(b, "es")),
    [activeRows]
  );

  const filtered = React.useMemo(
    () =>
      activeRows.filter(
        (row) =>
          (areaFilter.size === 0 || areaFilter.has(areaKey(row))) &&
          (leaderFilter.size === 0 || leaderFilter.has(leaderKey(row)))
      ),
    [activeRows, areaFilter, leaderFilter]
  );

  const sorted = React.useMemo(() => {
    if (sortKey === null) return filtered;
    const direction = sortDir === "asc" ? 1 : -1;
    const value = (row: ImportRow) =>
      sortKey === "name" ? displayName(row) : displayEmail(row);
    return [...filtered].sort((a, b) => direction * value(a).localeCompare(value(b), "es"));
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstIndex = (currentPage - 1) * pageSize;
  const visible = sorted.slice(firstIndex, firstIndex + pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
    }
    setPage(1);
  };

  const toggleAreaFilter = (value: string) => {
    setAreaFilter((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    setPage(1);
  };

  const toggleLeaderFilter = (value: string) => {
    setLeaderFilter((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
    setPage(1);
  };

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {showTabs ? (
        <>
          {/* Single source of the file's headline — the tabs below split the
              total, so this line only carries what they cannot. */}
          <p className="text-[12.5px] font-semibold text-text-primary">
            Se cargarán{" "}
            <span className="font-bold text-text-primary">
              {formatCount(collaboratorCount)}{" "}
              {collaboratorCount === 1 ? "persona" : "personas"}
            </span>{" "}
            de {fileName}.
          </p>
          <ImportTabs
            newCount={newRows.length}
            existingCount={existingRows.length}
            active={tab}
            onChange={switchTab}
          />
        </>
      ) : (
        // With a single group there is nothing to switch between — one message
        // says the whole story instead.
        <SingleGroupNotice tab={activeTab} count={activeRows.length} fileName={fileName} />
      )}

      <div className="overflow-hidden rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
              <TableHead
                aria-sort={sortKey === "name" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                className="min-w-[200px] py-3"
              >
                <SortableHeader
                  label="Colaborador"
                  active={sortKey === "name"}
                  direction={sortDir}
                  onToggle={() => toggleSort("name")}
                />
              </TableHead>
              <TableHead
                aria-sort={sortKey === "email" ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                className="py-3"
              >
                <SortableHeader
                  label="Correo electrónico"
                  active={sortKey === "email"}
                  direction={sortDir}
                  onToggle={() => toggleSort("email")}
                />
              </TableHead>
              <TableHead className="py-3">
                <FilterMenu
                  label="Área"
                  options={areas}
                  selected={areaFilter}
                  onToggle={toggleAreaFilter}
                  onClear={() => {
                    setAreaFilter(new Set());
                    setPage(1);
                  }}
                />
              </TableHead>
              <TableHead className="py-3 pr-4">
                <FilterMenu
                  label="Líder"
                  options={leaders}
                  selected={leaderFilter}
                  onToggle={toggleLeaderFilter}
                  onClear={() => {
                    setLeaderFilter(new Set());
                    setPage(1);
                  }}
                />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {visible.map((row) => (
              <TableRow key={row.user.username + row.user.email} className="border-border/50">
                {row.person ? (
                  <CollaboratorRow person={row.person} />
                ) : (
                  <NewUserRow user={row.user} />
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sorted.length === 0 && (
          <div className="flex flex-col items-center gap-1.5 px-4 py-10 text-center">
            <UserRoundX className="h-6 w-6 text-muted-foreground/50" strokeWidth={1.8} />
            <p className="text-[13px] font-semibold text-text-primary">Sin resultados</p>
            <p className="max-w-xs text-[12px] leading-relaxed text-muted-foreground">
              Ninguna persona del archivo coincide con el filtro actual.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12px] text-muted-foreground">
          {sorted.length === 0
            ? "0 personas"
            : `${formatCount(firstIndex + 1)}–${formatCount(firstIndex + visible.length)} de ${formatCount(sorted.length)}`}
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
              aria-label="Personas por página"
              className="h-8 w-[130px] rounded-lg px-2.5 text-[12px]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={6}>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-[12.5px]">
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
  );
}

/** Segmented two-way switch. Only rendered when both sides have rows. */
function ImportTabs({
  newCount,
  existingCount,
  active,
  onChange,
}: {
  newCount: number;
  existingCount: number;
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const base =
    "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-colors sm:flex-none";
  const badge =
    "rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums";

  return (
    <div
      role="tablist"
      aria-label="Resultado de la importación"
      className="flex w-full flex-col gap-2 sm:w-fit sm:flex-row sm:items-center sm:gap-1 sm:rounded-xl sm:border sm:border-border/60 sm:bg-muted/30 sm:p-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={active === "new"}
        onClick={() => onChange("new")}
        className={cn(
          base,
          active === "new"
            ? "bg-surface text-text-primary shadow-sm sm:bg-surface"
            : "text-muted-foreground hover:text-text-primary"
        )}
      >
        Usuarios nuevos
        <span
          className={cn(
            badge,
            active === "new" ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"
          )}
        >
          {formatCount(newCount)}
        </span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={active === "existing"}
        onClick={() => onChange("existing")}
        className={cn(
          base,
          active === "existing"
            ? "bg-surface text-text-primary shadow-sm sm:bg-surface"
            : "text-muted-foreground hover:text-text-primary"
        )}
      >
        Usuarios ya en Ubits
        <span
          className={cn(
            badge,
            active === "existing" ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground"
          )}
        >
          {formatCount(existingCount)}
        </span>
      </button>
    </div>
  );
}

/** When every imported row landed on one side, this is the one message that
 * carries the whole story — how many people load, from which file, and what
 * that means for their accounts. */
function SingleGroupNotice({ tab, count, fileName }: { tab: Tab; count: number; fileName: string | null }) {
  const people = count === 1 ? "persona" : "personas";
  const from = fileName ?? "el archivo";
  if (tab === "new") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/25 px-4 py-3">
        <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={2.2} />
        <p className="text-[12.5px] leading-relaxed text-text-secondary">
          Se cargarán <span className="font-bold text-text-primary">{formatCount(count)}</span>{" "}
          {people} de {from}. Ninguna existe aún en la plataforma: solo se cargarán en esta
          encuesta y no se crean ni se modifican en el sistema.
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/25 px-4 py-3">
      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-positive" strokeWidth={2.2} />
      <p className="text-[12.5px] leading-relaxed text-text-secondary">
        Se cargarán <span className="font-bold text-text-primary">{formatCount(count)}</span>{" "}
        {people} de {from}. Todas ya son usuarios de Ubits: se identificaron por username o correo
        y recibirán la encuesta en su cuenta existente.
      </p>
    </div>
  );
}

/** A row that has no directory entry yet: it shows the file's own data, the
 * derived email and dashes for whatever the file did not provide. */
function NewUserRow({ user }: { user: ImportedUser }) {
  const label = user.name || fallbackLabel(user.username);
  const subtitle = user.username || user.email || "Usuario nuevo";
  const email = user.email || (user.username ? `${user.username}@ubits.co` : "—");
  return (
    <>
      <TableCell className="min-w-[200px] py-2.5">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground"
            )}
          >
            {initials(label)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-text-primary">{label}</p>
            <p className="truncate text-[11.5px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-[12.5px] text-text-secondary">{email}</TableCell>
      <TableCell className="text-[12.5px] text-text-secondary">{user.area || "—"}</TableCell>
      <TableCell className="pr-4 text-[12.5px] text-text-secondary">{user.leader || "—"}</TableCell>
    </>
  );
}
