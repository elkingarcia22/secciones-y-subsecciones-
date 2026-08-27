import * as React from "react";
import { ListFilter, ListTree, Settings2, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SegmentDefinition, SegmentFilter } from "@/mocks/surveyResults";
import { FAVORABILITY_BANDS, THREE_TIER_FAVORABILITY_LEGEND } from "./favorabilityScale";
import { RESULT_LEVELS, type ResultLevel } from "./resultLevels";
import { ScaleToggle, type ScaleToggleOption } from "./ScaleToggle";

interface ResultsFilterControlsProps {
  segments: readonly SegmentDefinition[];
  activeSegment: SegmentDefinition;
  onSegmentChange: (key: string) => void;
  filterableSegments: readonly SegmentDefinition[];
  filters: readonly SegmentFilter[];
  onApplyFilter: (key: string, optionId: string) => void;
  onClearFilters: () => void;
  visibleLevels: ReadonlySet<ResultLevel>;
  hasHiddenLevels: boolean;
  onToggleLevel: (level: ResultLevel) => void;
  onResetLevels: () => void;
  highlightBands: ReadonlySet<string>;
  hasHiddenBands: boolean;
  onToggleBand: (bandId: string) => void;
  onResetBands: () => void;
  showViewBy?: boolean;
  /**
   * Whether "Personalizar" offers the highlight bands at all. Preguntas counts
   * answers rather than scoring them, so there is no band for a reader to
   * light there and the popover is just "Niveles".
   */
  showHighlight?: boolean;
  /**
   * What "Resaltar" bands by. Defaults to the 1–5 favorability scale; eNPS
   * passes its own -100..100 score bands so the popover reads in the units the
   * tab actually shows.
   */
  highlightScale?: HighlightScale;
  hiddenLevelOptions?: ResultLevel[];
  showFilters?: boolean;
  /**
   * Whether "Personalizar" appears at all. A view that draws no scores — the
   * eNPS depth reading — has neither levels to hide nor bands to light, and an
   * empty popover is worse than a missing button.
   */
  showCustomize?: boolean;
}

/**
 * A highlight axis: its wording and the bands a reader can keep lit.
 *
 * Each band carries its own palette so the popover renders as the legend it is
 * — the same `ScaleToggle` rows the roster's "Promedio" filter uses.
 */
export interface HighlightScale {
  title: string;
  description: string;
  bands: readonly ScaleToggleOption[];
}

/** A scale item — band, tier or NS/NR — as a `ScaleToggle` option. */
const toToggleOption = (item: {
  id: string;
  label: string;
  range?: string;
  color: string | null;
  background: string;
  border: string;
  foreground: string;
}): ScaleToggleOption => ({
  id: item.id,
  label: item.label,
  range: item.range ?? null,
  palette: {
    color: item.color,
    background: item.background,
    border: item.border,
    foreground: item.foreground,
  },
});

const FAVORABILITY_HIGHLIGHT: HighlightScale = {
  title: "Resaltar por favorabilidad",
  description: "Desmarca una banda para atenuar sus resultados; lo marcado mantiene su color.",
  bands: FAVORABILITY_BANDS.map(toToggleOption),
};

/**
 * The highlight axis for "Detalle por secciones": the same four buckets that
 * view's legend, KPI cards and breakdown dots already name. Unchecking one of
 * the three tiers dims every row whose result lands there; unchecking NS/NR
 * dims that column of the breakdown, which is the only place it exists.
 */
export const THREE_TIER_HIGHLIGHT: HighlightScale = {
  title: "Resaltar por favorabilidad",
  description:
    "Desmarca un grupo para atenuar sus resultados; lo marcado mantiene su color.",
  bands: THREE_TIER_FAVORABILITY_LEGEND.map(toToggleOption),
};

/**
 * "Ver por", its own "Filtros" popover for narrowing the population, and one
 * combined "Personalizar" popover for "Niveles" and "Resaltar" — display
 * concerns stacked behind a single trigger, kept apart from "Filtros" since
 * narrowing the data and just changing how it's displayed are different kinds
 * of action. It is not called "Vista": next to "Ver por" the two read as the
 * same control, and only one of them changes what is being looked at. Same controls in the heatmap and the questions view, so a reader
 * who narrowed down in one still sees that narrowing in the other.
 */
export function ResultsFilterControls({
  segments,
  activeSegment,
  onSegmentChange,
  filterableSegments,
  filters,
  onApplyFilter,
  onClearFilters,
  visibleLevels,
  hasHiddenLevels,
  onToggleLevel,
  onResetLevels,
  highlightBands,
  hasHiddenBands,
  onToggleBand,
  onResetBands,
  showViewBy = true,
  showHighlight = true,
  highlightScale = FAVORABILITY_HIGHLIGHT,
  hiddenLevelOptions = [],
  showFilters = true,
  showCustomize = true,
}: ResultsFilterControlsProps) {
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);

  const availableLevels = RESULT_LEVELS.filter(option => !hiddenLevelOptions.includes(option.id));
  const hiddenLevelsCount = availableLevels.filter(option => !visibleLevels.has(option.id)).length;
  const hiddenBandsCount = showHighlight ? highlightScale.bands.length - highlightBands.size : 0;
  const activeAdjustments = hiddenLevelsCount + hiddenBandsCount;

  return (
    <div className="flex shrink-0 items-center gap-2">
      {showViewBy && (
        <>
          <span className="text-[13px] font-medium text-muted-foreground">Ver por:</span>
          <Select value={activeSegment.key} onValueChange={onSegmentChange}>
            <SelectTrigger className="h-9 w-[160px] rounded-lg border-border bg-surface px-3 text-[13px] transition-colors hover:bg-border/30 focus:ring-2 focus:ring-primary/20">
              <SelectValue className="truncate text-text-primary" />
            </SelectTrigger>
            <SelectContent position="popper">
              {segments.map((candidate) => (
                <SelectItem key={candidate.key} value={candidate.key} className="text-[13px]">
                  {candidate.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}

      {showFilters && (
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 justify-start gap-2 rounded-lg border-border bg-surface px-3 text-[13px] text-text-primary transition-colors hover:bg-border/30"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
              Filtros
              {filters.length > 0 && (
                <Badge variant="neutral" className="h-4.5 min-w-[18px] justify-center px-1 text-[11px]">
                  {filters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[280px] p-0">
            <PopoverTitle className="sr-only">Filtros</PopoverTitle>
            <div className="flex flex-col gap-3 p-3">
              <div className="flex flex-col gap-0.5">
                <PopoverTitle className="text-[13px]">Filtrar a fondo</PopoverTitle>
                <PopoverDescription className="text-[12px] leading-relaxed">
                  Limita la vista de {activeSegment.label} a ciertos valores de otros demográficos.
                </PopoverDescription>
              </div>
              {filterableSegments.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">
                  No hay otros demográficos con los que filtrar esta vista.
                </p>
              ) : (
                filterableSegments.map((candidate) => {
                  const activeFilter = filters.find((filter) => filter.key === candidate.key);
                  return (
                    <div
                      key={candidate.key}
                      className="flex items-center gap-2.5 border-t border-border/60 pt-3"
                    >
                      <span className="w-[85px] shrink-0 truncate text-[13px] font-medium text-text-secondary">
                        {candidate.label}
                      </span>
                      <Select
                        value={activeFilter?.optionId ?? ""}
                        onValueChange={(val) => onApplyFilter(candidate.key, val)}
                      >
                        <SelectTrigger className="h-8 flex-1 rounded-md border-transparent bg-muted/40 px-2.5 text-[13px] hover:bg-muted/60 focus:ring-1 focus:ring-primary/20">
                          {/* Un trigger vacío no dice si el demográfico está sin
                              tocar o si algo se rompió. Mismo texto que el
                              Resumen y el roster: "Sin filtrar". */}
                          <SelectValue placeholder="Sin filtrar" className="text-muted-foreground" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="" className="text-[13px]">
                            Sin filtrar
                          </SelectItem>
                          {candidate.options.map((option) => (
                            <SelectItem key={option.id} value={option.id} className="text-[13px]">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })
              )}
              {filters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearFilters}
                  className="justify-start border-t border-border/60 rounded-none px-0 pt-3 pb-1 text-[12px] text-primary hover:bg-transparent hover:underline"
                >
                  Quitar filtros
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {showCustomize && (
      <Popover open={viewOpen} onOpenChange={setViewOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 justify-start gap-2 rounded-lg border-border bg-surface px-3 text-[13px] text-text-primary transition-colors hover:bg-border/30"
          >
            <Settings2 className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
            Personalizar
            {activeAdjustments > 0 && (
              <Badge variant="neutral" className="h-4.5 min-w-[18px] justify-center px-1 text-[11px]">
                {activeAdjustments}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-[340px] max-h-[var(--radix-popover-content-available-height)] gap-0 overflow-y-auto p-0"
        >
          {availableLevels.length > 0 && (
            <div className="flex flex-col gap-0.5 p-2.5">
              <PopoverTitle className="flex items-center gap-1.5 px-2 pt-0.5 text-[13px]">
                <ListTree className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
                Niveles a mostrar
              </PopoverTitle>
              <PopoverDescription className="px-2 pb-1 text-[12px] leading-relaxed">
                Desmarca un nivel para ocultar sus totales y resultados; la fila y la anidación se
                mantienen.
              </PopoverDescription>
              <div className="flex flex-col gap-1.5 px-2 pt-1">
                {availableLevels.map((option) => (
                  <ScaleToggle
                    key={option.id}
                    option={{ id: option.id, label: option.label }}
                    active={visibleLevels.has(option.id)}
                    onToggle={() => onToggleLevel(option.id)}
                  />
                ))}
              </div>
              {hasHiddenLevels && (
                <button
                  type="button"
                  onClick={onResetLevels}
                  className="flex w-full items-center justify-start gap-1.5 border-t border-border/60 px-2 pt-2 pb-0.5 text-[12px] font-medium text-primary transition-colors hover:underline"
                >
                  Restablecer niveles
                </button>
              )}
            </div>
          )}

          {showHighlight && (
          <div className={`flex flex-col gap-0.5 p-2.5 ${availableLevels.length > 0 ? "border-t border-border/60" : ""}`}>
            <PopoverTitle className="flex items-center gap-1.5 px-2 pt-0.5 text-[13px]">
              <ListFilter className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
              {highlightScale.title}
            </PopoverTitle>
            <PopoverDescription className="px-2 pb-1 text-[12px] leading-relaxed">
              {highlightScale.description}
            </PopoverDescription>
            <div className="flex flex-col gap-1.5 px-2 pt-1">
              {highlightScale.bands.map((band) => (
                <ScaleToggle
                  key={band.id}
                  option={band}
                  active={highlightBands.has(band.id)}
                  onToggle={() => onToggleBand(band.id)}
                />
              ))}
            </div>
            {hasHiddenBands && (
              <button
                type="button"
                onClick={onResetBands}
                className="flex w-full items-center justify-start gap-1.5 border-t border-border/60 px-2 pt-2 pb-0.5 text-[12px] font-medium text-primary transition-colors hover:underline"
              >
                Restablecer resaltado
              </button>
            )}
          </div>
          )}
        </PopoverContent>
      </Popover>
      )}
    </div>
  );
}

interface ResultsFilterChipsProps {
  filters: readonly SegmentFilter[];
  segments: readonly SegmentDefinition[];
  onRemoveFilter: (key: string) => void;
  onClearFilters: () => void;
}

/** The active deep filters, as removable chips below the toolbar row. */
export function ResultsFilterChips({
  filters,
  segments,
  onRemoveFilter,
  onClearFilters,
}: ResultsFilterChipsProps) {
  if (filters.length === 0) return null;

  return (
    <div className="-mt-1 flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const candidate = segments.find((seg) => seg.key === filter.key);
        const option = candidate?.options.find((opt) => opt.id === filter.optionId);
        return (
          <Badge key={filter.key} variant="neutral" className="gap-1.5 pr-1 text-[12px] font-medium">
            {candidate?.label}: {option?.label}
            <button
              type="button"
              onClick={() => onRemoveFilter(filter.key)}
              aria-label={`Quitar filtro ${candidate?.label}`}
              className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-border/40 hover:text-text-primary"
            >
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          </Badge>
        );
      })}
      <button
        type="button"
        onClick={onClearFilters}
        className="text-[12px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-text-primary hover:underline"
      >
        Quitar todo
      </button>
    </div>
  );
}
