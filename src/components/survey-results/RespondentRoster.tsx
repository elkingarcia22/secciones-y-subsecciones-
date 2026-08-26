import * as React from "react";
import { Check, Search, ShieldCheck } from "lucide-react";
import { useResetOnChange } from "@/lib/useResetOnChange";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/feedback";
import type { Respondent } from "@/mocks/questionResponses";
import { bandForScore, formatScore } from "./favorabilityScale";
import { RosterFilterChips, type RosterFilterState } from "./RosterFilters";

/** How many people the list shows before asking for more. */
const PAGE_SIZE = 40;

interface RespondentRosterProps {
  respondents: readonly Respondent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Set when the reader arrived from an answer: only these people are listed. */
  drillIds: ReadonlySet<string> | null;
  drillLabel: string | null;
  /**
   * The narrowing, owned by the tab's toolbar. Only the chips and the count
   * live here now — "Filtros" itself sits beside "Personalizar", where the
   * report's other controls of that kind are.
   */
  filters: RosterFilterState;
}

/**
 * The people whose answers can be opened, as a searchable column.
 *
 * A roster, not a table: the reader is picking one person to read, and every
 * extra column is one more thing to skip past. Area and score ride along
 * because those are the two reasons someone picks a name out of 450 — on an
 * anonymous survey there is no área to ride along with, so the row falls back
 * to the send date and the filter popover disappears with its facets.
 */
export function RespondentRoster({
  respondents,
  selectedId,
  onSelect,
  drillIds,
  drillLabel,
  filters,
}: RespondentRosterProps) {
  const [query, setQuery] = React.useState("");
  const [limit, setLimit] = React.useState(PAGE_SIZE);

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return respondents.filter((person) => {
      if (drillIds && !drillIds.has(person.id)) return false;
      if (!filters.matches(person)) return false;
      if (!needle) return true;
      return (
        person.name.toLowerCase().includes(needle) ||
        (person.area?.toLowerCase().includes(needle) ?? false) ||
        (person.email?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [respondents, query, filters, drillIds]);

  // A new search, a new filter or a new drill-down starts from the top again.
  useResetOnChange(
    `${query}|${filters.signature}|${drillLabel ?? ""}`,
    () => setLimit(PAGE_SIZE)
  );

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-col gap-2.5">
        {/* Search only: "Filtros" moved up to the toolbar, so the column keeps
            just the field that belongs to this list and nothing else. */}
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar persona"
            className="h-9 pl-9 text-[12.5px]"
            aria-label="Buscar persona"
          />
        </div>

        {/* The chips stay with the list: they say what is hiding rows here, and
            the count right below them is what they are read against. */}
        <RosterFilterChips state={filters} />

        <p className="text-[11px] font-medium text-muted-foreground tabular-nums">
          {visible.length} de {respondents.length} personas
        </p>
      </div>

      <ul className="-mr-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-2">
        {visible.length === 0 ? (
          <li>
            <EmptyState
              icon={Search}
              title="Sin resultados"
              description="Ninguna persona coincide con la búsqueda."
              className="border-none bg-transparent shadow-none"
            />
          </li>
        ) : (
          <>
            {visible.slice(0, limit).map((person) => (
              <li key={person.id}>
                <RosterRow
                  person={person}
                  selected={person.id === selectedId}
                  onSelect={() => onSelect(person.id)}
                />
              </li>
            ))}
            {visible.length > limit && (
              <li>
                <button
                  type="button"
                  onClick={() => setLimit((current) => current + PAGE_SIZE)}
                  className="mt-1 w-full rounded-lg border border-border/60 bg-surface py-2 text-[11.5px] font-semibold text-text-secondary transition-colors hover:bg-muted/40"
                >
                  Mostrar {Math.min(PAGE_SIZE, visible.length - limit)} más
                </button>
              </li>
            )}
          </>
        )}
      </ul>
    </div>
  );
}

/**
 * The second line of a row: where they sit, or — when the survey is anonymous
 * and there is no demographic to print — when they sent it.
 */
function rowSubtitle(person: Respondent): string {
  const where = [person.area, person.country].filter(Boolean);
  return where.length > 0 ? where.join(" · ") : `Enviada el ${person.submittedLabel}`;
}

function RosterRow({
  person,
  selected,
  onSelect,
}: {
  person: Respondent;
  selected: boolean;
  onSelect: () => void;
}) {
  const band = person.score !== null ? bandForScore(person.score) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all",
        selected
          ? "border-primary/40 bg-primary/[0.06] shadow-sm"
          : "border-transparent hover:border-border/60 hover:bg-muted/30"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10.5px] font-extrabold",
          person.anonymous
            ? "bg-muted text-muted-foreground"
            : "bg-primary/10 text-primary"
        )}
      >
        {person.anonymous ? <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.4} /> : person.initials}
      </span>

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[12.5px] font-semibold text-text-primary">
          {person.name}
        </span>
        <span className="truncate text-[10.5px] font-medium text-muted-foreground">
          {rowSubtitle(person)}
        </span>
      </span>

      {person.status === "partial" && (
        <Badge variant="warning" className="shrink-0 px-1.5 text-[9.5px]">
          Parcial
        </Badge>
      )}

      {band && person.score !== null && (
        <span
          aria-hidden
          className="flex h-6 min-w-[30px] shrink-0 items-center justify-center rounded-md border text-[10.5px] font-bold tabular-nums"
          style={{
            backgroundColor: band.background,
            borderColor: band.border,
            color: band.foreground,
          }}
        >
          {formatScore(person.score)}
        </span>
      )}

      {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={3} />}
    </button>
  );
}
