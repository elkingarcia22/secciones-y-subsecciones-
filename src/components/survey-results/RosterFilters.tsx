import * as React from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Respondent } from "@/mocks/questionResponses";
import { bandForScore, FAVORABILITY_BANDS, NSNR } from "./favorabilityScale";
import { ScaleToggle } from "./ScaleToggle";

/**
 * Narrowing the roster by average and by demographic, through the same
 * "Filtros" control the rest of the report uses.
 *
 * The roster used to list every área as a row of toggle chips. That reads fine
 * at four areas and turns into a wall at ten — and it could only ever filter by
 * the one dimension somebody happened to wire up, while the person reading a
 * sheet wants "mujeres de Colombia" just as often as "Marketing". So the chips
 * are gone and this is the same popover Favorabilidad and Preguntas already
 * carry: one row per demographic, "Sin filtrar" as the default, a count on the
 * trigger, and the active ones as removable chips underneath.
 *
 * The average sits above them and behaves differently on purpose — see
 * `useRosterScoreBands`.
 */

/** Demographics a respondent carries that are worth narrowing by. */
export type RosterFacetKey = "area" | "country" | "gender" | "age" | "leader";

export interface RosterFacet {
  key: RosterFacetKey;
  label: string;
  options: readonly string[];
}

/**
 * The filters in force.
 *
 * A demographic is single-valued — nobody is in two áreas — so it stays one
 * chosen value per facet. `bands` is a set because the scale is ordered: the
 * question people bring to this roster is "who is *not* doing well", which is
 * two adjacent bands, not one. Absent or empty means every band.
 */
export interface RosterFilters extends Readonly<Partial<Record<RosterFacetKey, string>>> {
  readonly bands?: readonly string[];
}

const FACET_LABELS: readonly { key: RosterFacetKey; label: string }[] = [
  { key: "area", label: "Área" },
  { key: "country", label: "País" },
  { key: "gender", label: "Género" },
  { key: "age", label: "Edad" },
  { key: "leader", label: "Líder" },
];

/** Score with no band: a person the report deliberately shows no average for. */
export const NO_SCORE_BAND = "sin-promedio";

/** One band of the scale, as the filter offers it. */
export interface RosterScoreBand {
  id: string;
  label: string;
  /** Range as the scale states it, e.g. "2 a 2.9". */
  range: string;
  /** The band's own fill, so the toggle reads as the chip it selects. */
  color: string;
  background: string;
  border: string;
  foreground: string;
}

/**
 * The bands somebody in this roster actually lands in, in scale order.
 *
 * Derived from the data for the same reason the demographics are: an option
 * that returns nobody is a control that does nothing when pressed. Scale order,
 * never alphabetical — Desfavorable before Neutral before Favorable is the
 * reading, and sorting these by name destroys it.
 *
 * The band comes from the same `bandForScore` that colors the chip beside every
 * name, so picking "Desfavorable" selects exactly the rows carrying that color.
 */
export function useRosterScoreBands(
  respondents: readonly Respondent[]
): readonly RosterScoreBand[] {
  return React.useMemo(() => {
    const present = new Set(
      respondents
        .filter((person): person is Respondent & { score: number } => person.score !== null)
        .map((person) => bandForScore(person.score).id)
    );

    const bands: RosterScoreBand[] = FAVORABILITY_BANDS.filter((band) =>
      present.has(band.id)
    ).map((band) => ({
      id: band.id,
      label: band.label,
      range: band.range,
      color: band.color ?? band.border,
      background: band.background,
      border: band.border,
      foreground: band.foreground,
    }));

    // The masked case is a band of its own: below the anonymity threshold the
    // report shows no average, and those people are still in the roster.
    if (respondents.some((person) => person.score === null)) {
      bands.push({
        id: NO_SCORE_BAND,
        label: "Sin promedio",
        range: "Reservado",
        color: NSNR,
        background: "hsl(218 14% 93%)",
        border: "hsl(218 10% 66%)",
        foreground: "hsl(218 14% 38%)",
      });
    }
    return bands;
  }, [respondents]);
}

/**
 * The demographics this roster can actually be narrowed by.
 *
 * A facet with one value narrows nothing, and an anonymous survey carries no
 * leader at all — offering either would be a control that does nothing when
 * pressed.
 */
export function useRosterFacets(respondents: readonly Respondent[]): readonly RosterFacet[] {
  return React.useMemo(
    () =>
      FACET_LABELS.map((facet) => ({
        ...facet,
        options: [
          ...new Set(
            respondents
              .map((person) => person[facet.key])
              .filter((value): value is string => Boolean(value))
          ),
        ].sort((a, b) => a.localeCompare(b, "es")),
      })).filter((facet) => facet.options.length > 1),
    [respondents]
  );
}

/** Whether one person survives the active filters. */
export function matchesRosterFilters(person: Respondent, filters: RosterFilters): boolean {
  const bands = filters.bands;
  if (bands && bands.length > 0) {
    const band = person.score === null ? NO_SCORE_BAND : bandForScore(person.score).id;
    if (!bands.includes(band)) return false;
  }

  return FACET_LABELS.every((facet) => {
    const value = filters[facet.key];
    return !value || person[facet.key] === value;
  });
}

/**
 * How many filters are narrowing right now.
 *
 * Every chosen band counts on its own: two bands selected is two things the
 * reader has to remember, and a trigger that says "1" for a three-band
 * selection understates what is hiding the other rows.
 */
export const countRosterFilters = (filters: RosterFilters): number =>
  FACET_LABELS.filter((facet) => Boolean(filters[facet.key])).length + (filters.bands?.length ?? 0);

/**
 * Everything that narrows the roster, as one piece of state.
 *
 * It lives above the roster rather than inside it: the trigger sits in the
 * tab's toolbar next to "Personalizar", beside the other controls of its kind,
 * while the list it narrows is a pane further down the page. Both read the same
 * object, so the count beside the search and the badge on the toolbar can never
 * disagree.
 */
export interface RosterFilterState {
  filters: RosterFilters;
  facets: readonly RosterFacet[];
  bands: readonly RosterScoreBand[];
  activeCount: number;
  applyFilter: (key: RosterFacetKey, value: string) => void;
  removeFilter: (key: RosterFacetKey) => void;
  toggleBand: (id: string) => void;
  clear: () => void;
  /** Whether one person survives what is currently set. */
  matches: (person: Respondent) => boolean;
  /** Changes whenever the narrowing does — for resetting a paged list. */
  signature: string;
}

export function useRosterFilters(respondents: readonly Respondent[]): RosterFilterState {
  const [filters, setFilters] = React.useState<RosterFilters>({});

  const facets = useRosterFacets(respondents);
  const bands = useRosterScoreBands(respondents);

  const applyFilter = React.useCallback((key: RosterFacetKey, value: string) => {
    setFilters((current) => {
      const rest = Object.fromEntries(
        Object.entries(current).filter(([candidate]) => candidate !== key)
      );
      return value === "" ? rest : { ...rest, [key]: value };
    });
  }, []);

  const removeFilter = React.useCallback(
    (key: RosterFacetKey) => applyFilter(key, ""),
    [applyFilter]
  );

  /** Bands add up rather than replace each other: the filter is a set. */
  const toggleBand = React.useCallback((id: string) => {
    setFilters((current) => {
      const selected = current.bands ?? [];
      const next = selected.includes(id)
        ? selected.filter((candidate) => candidate !== id)
        : [...selected, id];
      return { ...current, bands: next.length > 0 ? next : undefined };
    });
  }, []);

  const clear = React.useCallback(() => setFilters({}), []);

  const matches = React.useCallback(
    (person: Respondent) => matchesRosterFilters(person, filters),
    [filters]
  );

  return {
    filters,
    facets,
    bands,
    activeCount: countRosterFilters(filters),
    applyFilter,
    removeFilter,
    toggleBand,
    clear,
    matches,
    signature: JSON.stringify(filters),
  };
}

export function RosterFilterButton({ state }: { state: RosterFilterState }) {
  const { facets, bands, filters, activeCount, applyFilter: onApply, toggleBand: onToggleBand, clear: onClear } = state;
  const [open, setOpen] = React.useState(false);
  const selectedBands = filters.bands ?? [];

  // One band in the whole roster narrows nothing, the same rule the facets follow.
  const showBands = bands.length > 1;
  if (facets.length === 0 && !showBands) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 shrink-0 justify-start gap-2 rounded-lg border-border bg-surface px-2.5 text-[12px] text-text-primary transition-colors hover:bg-border/30"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
          Filtros
          {activeCount > 0 && (
            <Badge variant="neutral" className="h-4.5 min-w-[18px] justify-center px-1 text-[10.5px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[300px] max-h-[var(--radix-popover-content-available-height)] gap-3.5 overflow-y-auto p-4"
      >
        <PopoverTitle className="text-[13px]">Filtrar personas</PopoverTitle>
        <PopoverDescription className="text-[12px] leading-relaxed">
          Limita la lista por su promedio en la escala de 1 a 5 o por sus datos
          demográficos.
        </PopoverDescription>

        {showBands && (
          <div className="flex flex-col gap-1.5 border-t border-border/30 pt-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[12px] font-medium text-text-primary">Promedio</span>
              {selectedBands.length > 0 && (
                <span className="text-[10.5px] font-medium text-muted-foreground tabular-nums">
                  {selectedBands.length} de {bands.length}
                </span>
              )}
            </div>
            {bands.map((band) => (
              <ScaleToggle
                key={band.id}
                option={{
                  id: band.id,
                  label: band.label,
                  range: band.range,
                  palette: band,
                }}
                active={selectedBands.includes(band.id)}
                onToggle={() => onToggleBand(band.id)}
              />
            ))}
          </div>
        )}

        {facets.map((facet) => (
          <div key={facet.key} className="flex items-center gap-2.5 border-t border-border/30 pt-3">
            <span className="w-[54px] shrink-0 text-[12px] font-medium text-text-primary">
              {facet.label}
            </span>
            <Select
              value={filters[facet.key] ?? ""}
              onValueChange={(value) => onApply(facet.key, value)}
            >
              <SelectTrigger className="h-9 w-full rounded-lg border-border bg-surface px-2.5 text-[12px] transition-colors hover:bg-border/30 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Sin filtrar" className="text-muted-foreground" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="" className="text-[12.5px]">
                  Sin filtrar
                </SelectItem>
                {facet.options.map((option) => (
                  <SelectItem key={option} value={option} className="text-[12.5px]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="justify-start rounded-none border-t border-border/30 px-0 pb-1 pt-3 text-[12px] text-primary hover:bg-transparent hover:underline"
          >
            Quitar filtros
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** The active filters as removable chips, so what is narrowing stays visible. */
export function RosterFilterChips({ state }: { state: RosterFilterState }) {
  const { facets, bands, filters, removeFilter: onRemove, toggleBand: onToggleBand } = state;
  const activeFacets = facets.filter((facet) => Boolean(filters[facet.key]));
  const activeBands = bands.filter((band) => (filters.bands ?? []).includes(band.id));
  if (activeFacets.length === 0 && activeBands.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Band chips wear their band's colors: the same reading as the score
          chips in the rows they are keeping. */}
      {activeBands.map((band) => (
        <span
          key={band.id}
          className="inline-flex max-w-full items-center gap-1 rounded-md border py-0.5 pl-2 pr-1 text-[11px] font-semibold"
          style={{
            backgroundColor: band.background,
            borderColor: band.border,
            color: band.foreground,
          }}
        >
          <span className="truncate">{band.label}</span>
          <button
            type="button"
            onClick={() => onToggleBand(band.id)}
            aria-label={`Quitar promedio ${band.label}`}
            className="shrink-0 rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-2.5 w-2.5" strokeWidth={2.6} />
          </button>
        </span>
      ))}
      {activeFacets.map((facet) => (
        <Badge
          key={facet.key}
          variant="neutral"
          className="max-w-full gap-1 pr-1 text-[11px] font-medium"
        >
          <span className="truncate">
            {facet.label}: {filters[facet.key]}
          </span>
          <button
            type="button"
            onClick={() => onRemove(facet.key)}
            aria-label={`Quitar filtro ${facet.label}`}
            className="shrink-0 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-border/40 hover:text-text-primary"
          >
            <X className="h-2.5 w-2.5" strokeWidth={2.6} />
          </button>
        </Badge>
      ))}
    </div>
  );
}
