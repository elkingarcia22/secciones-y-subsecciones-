import * as React from "react";
import type { SegmentDefinition, SegmentFilter } from "@/mocks/surveyResults";
import { FAVORABILITY_BANDS, FAVORABILITY_TIER_IDS } from "./favorabilityScale";
import { RESULT_LEVELS, type ResultLevel } from "./resultLevels";

export interface ResultsFiltersState {
  filters: readonly SegmentFilter[];
  filterableSegments: readonly SegmentDefinition[];
  applyFilter: (key: string, optionId: string) => void;
  removeFilter: (key: string) => void;
  clearFilters: () => void;
  /** Wraps the screen's own segment change: a filter on the new breakdown
   * dimension is meaningless once it becomes the rows, so it's dropped. */
  handleSegmentChange: (key: string) => void;

  visibleLevels: ReadonlySet<ResultLevel>;
  hasHiddenLevels: boolean;
  toggleLevel: (level: ResultLevel) => void;
  resetLevels: () => void;

  highlightBands: ReadonlySet<string>;
  hasHiddenBands: boolean;
  toggleBand: (bandId: string) => void;
  resetBands: () => void;

  /**
   * The second highlight axis: Favorables / Neutrales / Desfavorables / NS/NR.
   * "Detalle por secciones" reads results in those four buckets, the heatmap
   * in the five 1–5 bands above, so each keeps its own set instead of one
   * scale pretending to serve both.
   */
  tierBands: ReadonlySet<string>;
  hasHiddenTierBands: boolean;
  toggleTierBand: (tierId: string) => void;
  resetTierBands: () => void;

  highlightedRows: ReadonlySet<string>;
  hasHighlights: boolean;
  /** Toggles highlight for a row and its whole subtree — the ids the caller
   * collected from its own tree shape (heatmap rows, section results, ...). */
  toggleRowHighlight: (ids: readonly string[]) => void;
  resetHighlights: () => void;
}

const FAVORABILITY_BAND_IDS = FAVORABILITY_BANDS.map((band) => band.id);

/**
 * Filter and highlight state shared by every view that slices this result by
 * demographic — the heatmap, the questions view and eNPS today. One instance
 * lives above the views that share a screen, so narrowing to "País: Colombia"
 * or resaltando a band in one view is still narrowed when the reader switches
 * to the other.
 *
 * `bandIds` is the highlight axis: favorability's five bands by default, the
 * eNPS score bands when the caller reads that scale instead.
 */
export function useResultsFilters(
  activeSegment: SegmentDefinition,
  segments: readonly SegmentDefinition[],
  onSegmentChange: (key: string) => void,
  bandIds: readonly string[] = FAVORABILITY_BAND_IDS
): ResultsFiltersState {
  // The identity of a literal default changes every render; the ids don't.
  const allBandIds = React.useMemo(() => bandIds.join("|"), [bandIds]);

  const [filters, setFilters] = React.useState<readonly SegmentFilter[]>([]);
  const [visibleLevels, setVisibleLevels] = React.useState<ReadonlySet<ResultLevel>>(
    () => new Set(RESULT_LEVELS.map((option) => option.id))
  );
  const [highlightBands, setHighlightBands] = React.useState<ReadonlySet<string>>(
    () => new Set(bandIds)
  );
  const [tierBands, setTierBands] = React.useState<ReadonlySet<string>>(
    () => new Set(FAVORABILITY_TIER_IDS)
  );
  const [highlightedRows, setHighlightedRows] = React.useState<ReadonlySet<string>>(new Set());

  // Deep filters narrow the population through every demographic except the
  // one already being broken down.
  const filterableSegments = React.useMemo(
    () => segments.filter((candidate) => candidate.key !== activeSegment.key),
    [segments, activeSegment.key]
  );

  const applyFilter = React.useCallback((key: string, optionId: string) => {
    setFilters((current) => {
      const rest = current.filter((candidate) => candidate.key !== key);
      return optionId === "" ? rest : [...rest, { key, optionId }];
    });
  }, []);

  const removeFilter = React.useCallback((key: string) => applyFilter(key, ""), [applyFilter]);
  const clearFilters = React.useCallback(() => setFilters([]), []);

  const handleSegmentChange = React.useCallback(
    (key: string) => {
      setFilters((current) => current.filter((candidate) => candidate.key !== key));
      onSegmentChange(key);
    },
    [onSegmentChange]
  );

  const toggleLevel = React.useCallback((level: ResultLevel) => {
    setVisibleLevels((current) => {
      const next = new Set(current);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }, []);
  const resetLevels = React.useCallback(
    () => setVisibleLevels(new Set(RESULT_LEVELS.map((option) => option.id))),
    []
  );

  const toggleBand = React.useCallback((bandId: string) => {
    setHighlightBands((current) => {
      const next = new Set(current);
      if (next.has(bandId)) next.delete(bandId);
      else next.add(bandId);
      return next;
    });
  }, []);
  const resetBands = React.useCallback(
    () => setHighlightBands(new Set(allBandIds.split("|"))),
    [allBandIds]
  );

  const toggleTierBand = React.useCallback((tierId: string) => {
    setTierBands((current) => {
      const next = new Set(current);
      if (next.has(tierId)) next.delete(tierId);
      else next.add(tierId);
      return next;
    });
  }, []);
  const resetTierBands = React.useCallback(
    () => setTierBands(new Set(FAVORABILITY_TIER_IDS)),
    []
  );

  const toggleRowHighlight = React.useCallback((ids: readonly string[]) => {
    const [id] = ids;
    if (id === undefined) return;
    setHighlightedRows((current) => {
      const next = new Set(current);
      if (next.has(id)) ids.forEach((rowId) => next.delete(rowId));
      else ids.forEach((rowId) => next.add(rowId));
      return next;
    });
  }, []);

  const resetHighlights = React.useCallback(() => {
    setHighlightedRows(new Set());
    resetBands();
  }, [resetBands]);

  return {
    filters,
    filterableSegments,
    applyFilter,
    removeFilter,
    clearFilters,
    handleSegmentChange,
    visibleLevels,
    hasHiddenLevels: visibleLevels.size < RESULT_LEVELS.length,
    toggleLevel,
    resetLevels,
    highlightBands,
    hasHiddenBands: highlightBands.size < bandIds.length,
    toggleBand,
    resetBands,
    tierBands,
    hasHiddenTierBands: tierBands.size < FAVORABILITY_TIER_IDS.length,
    toggleTierBand,
    resetTierBands,
    highlightedRows,
    hasHighlights: highlightedRows.size > 0 || highlightBands.size < bandIds.length,
    toggleRowHighlight,
    resetHighlights,
  };
}
