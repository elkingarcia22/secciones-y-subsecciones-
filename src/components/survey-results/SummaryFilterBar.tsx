import * as React from "react";
import { Check, ChevronDown, ChevronRight, Eye, Layers, ListTree, SlidersHorizontal, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { SectionResult, SegmentDefinition, SegmentFilter } from "@/mocks/surveyResults";
import { ScaleToggle } from "./ScaleToggle";
import { sectionHasContent } from "./sectionTotals";
import {
  FINDING_LEVELS,
  SCOPE_ALL,
  SUMMARY_BLOCKS,
  VIEW_GENERAL,
  type FindingLevel,
  type SummaryBlock,
  type SummaryScope,
} from "./summaryModel";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

interface SummaryFilterBarProps {
  sections: readonly SectionResult[];
  scope: SummaryScope;
  onScopeChange: (id: string) => void;

  /** Demographics the population can be narrowed by. */
  segments: readonly SegmentDefinition[];

  /** The demographic the page is read through, or `VIEW_GENERAL`. */
  viewBy: string;
  onViewByChange: (key: string) => void;

  filters: readonly SegmentFilter[];
  onApplyFilter: (key: string, optionId: string) => void;
  onRemoveFilter: (key: string) => void;
  onClearFilters: () => void;

  level: FindingLevel;
  availableLevels: readonly FindingLevel[];
  onLevelChange: (level: FindingLevel) => void;

  visibleBlocks: ReadonlySet<SummaryBlock>;
  onToggleBlock: (block: SummaryBlock) => void;
  onResetBlocks: () => void;
}

/**
 * The one control bar of the Resumen, in the report's own toolbar shape.
 *
 * Same chrome as "Detalle por secciones" and the heatmap: a title with its
 * count on the left, the controls grouped on the right, and the whole row stuck
 * under the tabs so it never scrolls away from the numbers it governs. Three
 * screens that each invented their own toolbar is how a report stops reading as
 * one product.
 *
 * The split between the two buttons is the split the rest of the report already
 * makes, and it is a real one: **Filtros** changes *which people and which part
 * of the survey* the figures are computed over — the answer moves. **Vista**
 * changes only *how much of it is drawn* — the answer stays, the page gets
 * shorter. Mixing the two is what makes a reader stop trusting that a number
 * changed for a reason.
 */
export function SummaryFilterBar({
  sections,
  scope,
  onScopeChange,
  segments,
  viewBy,
  onViewByChange,
  filters,
  onApplyFilter,
  onRemoveFilter,
  onClearFilters,
  level,
  availableLevels,
  onLevelChange,
  visibleBlocks,
  onToggleBlock,
  onResetBlocks,
}: SummaryFilterBarProps) {
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [viewOpen, setViewOpen] = React.useState(false);

  const scoped = scope.id !== SCOPE_ALL;
  // One per narrowed demographic, not one per picked value: three areas is
  // still a single filter on Área.
  const filteredKeys = new Set(filters.map((filter) => filter.key)).size;
  const activeFilters = filteredKeys + (scoped ? 1 : 0);
  const hiddenBlocks = SUMMARY_BLOCKS.length - visibleBlocks.size;
  const levelOptions = FINDING_LEVELS.filter((option) => availableLevels.includes(option.id));

  return (
    <div className="sticky top-4 z-30 -mx-1 flex flex-col gap-2 rounded-2xl bg-background px-1 pb-2 pt-1">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border/60 bg-surface px-4 py-2.5 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="text-[13px] font-bold text-text-primary">Resumen de la medición</h2>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/*
            "Ver por", the same control the heatmap and Participación carry, so
            the choice reads as one idea across the report. The difference is
            the first option: this page can stand on the whole measurement,
            which is where a summary should open — the cuts are the second
            question, not the first.
          */}
          {segments.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="hidden text-[12.5px] font-medium text-muted-foreground lg:inline">
                Ver por:
              </span>
              <Select value={viewBy} onValueChange={onViewByChange}>
                <SelectTrigger className="h-9 w-[150px] rounded-lg border-border bg-surface px-3 text-[12.5px] transition-colors hover:bg-border/30 focus:ring-2 focus:ring-primary/20">
                  <SelectValue className="truncate text-text-primary" />
                </SelectTrigger>
                <SelectContent position="popper" align="end">
                  <SelectItem value={VIEW_GENERAL} className="text-[13px]">
                    General
                  </SelectItem>
                  {segments.map((candidate) => (
                    <SelectItem key={candidate.key} value={candidate.key} className="text-[13px]">
                      {candidate.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 justify-start gap-2 rounded-lg border-border bg-surface px-3 text-[12.5px] text-text-primary transition-colors hover:bg-border/30"
              >
                <SlidersHorizontal
                  className="h-3.5 w-3.5 text-muted-foreground"
                  strokeWidth={2.2}
                />
                Filtros
                {activeFilters > 0 && (
                  <Badge
                    variant="neutral"
                    className="h-4.5 min-w-[18px] justify-center px-1 text-[10.5px]"
                  >
                    {activeFilters}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[340px] max-h-[var(--radix-popover-content-available-height)] gap-0 overflow-y-auto p-0"
            >
              <ScopeSection
                sections={sections}
                scope={scope}
                onScopeChange={onScopeChange}
              />
              <DemographicsSection
                segments={segments}
                filters={filters}
                onApplyFilter={onApplyFilter}
                onClearFilters={onClearFilters}
              />
            </PopoverContent>
          </Popover>

          <Popover open={viewOpen} onOpenChange={setViewOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 justify-start gap-2 rounded-lg border-border bg-surface px-3 text-[12.5px] text-text-primary transition-colors hover:bg-border/30"
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
                Vista
                {hiddenBlocks > 0 && (
                  <Badge
                    variant="neutral"
                    className="h-4.5 min-w-[18px] justify-center px-1 text-[10.5px]"
                  >
                    {hiddenBlocks}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[320px] max-h-[var(--radix-popover-content-available-height)] gap-0 overflow-y-auto p-0"
            >
              {levelOptions.length > 1 && (
                <div className="flex flex-col gap-0.5 p-2.5">
                  <PopoverTitle className="flex items-center gap-1.5 px-2 pt-0.5 text-[13px]">
                    <ListTree className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
                    Nivel de los hallazgos
                  </PopoverTitle>
                  <PopoverDescription className="px-2 pb-1 text-[12px] leading-relaxed">
                    A qué altura del árbol se rankean los focos y las fortalezas.
                  </PopoverDescription>
                  <div role="radiogroup" className="flex flex-col gap-1.5 px-2 pt-1">
                    {levelOptions.map((option) => (
                      <ScaleToggle
                        key={option.id}
                        singleChoice
                        option={{ id: option.id, label: option.label }}
                        active={level === option.id}
                        onToggle={() => onLevelChange(option.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div
                className={cn(
                  "flex flex-col gap-0.5 p-2.5",
                  levelOptions.length > 1 && "border-t border-border/30"
                )}
              >
                <PopoverTitle className="flex items-center gap-1.5 px-2 pt-0.5 text-[13px]">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
                  Bloques a mostrar
                </PopoverTitle>
                <PopoverDescription className="px-2 pb-1 text-[12px] leading-relaxed">
                  Oculta lo que no vayas a usar en esta lectura. No cambia ninguna cifra.
                </PopoverDescription>
                <div className="flex flex-col gap-1.5 px-2 pt-1">
                  {SUMMARY_BLOCKS.map((block) => (
                    <ScaleToggle
                      key={block.id}
                      option={{ id: block.id, label: block.label }}
                      active={visibleBlocks.has(block.id)}
                      onToggle={() => onToggleBlock(block.id)}
                    />
                  ))}
                </div>
                {hiddenBlocks > 0 && (
                  <button
                    type="button"
                    onClick={onResetBlocks}
                    className="flex w-full items-center justify-start gap-1.5 border-t border-border/30 px-2 pb-0.5 pt-2 text-[12px] font-medium text-primary transition-colors hover:underline"
                  >
                    Mostrar todo
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <ActiveFilterChips
        scope={scope}
        onClearScope={() => onScopeChange(SCOPE_ALL)}
        segments={segments}
        filters={filters}
        onRemoveFilter={onRemoveFilter}
        onClearAll={() => {
          onClearFilters();
          onScopeChange(SCOPE_ALL);
        }}
      />
    </div>
  );
}

/**
 * The branch in view, as three cascading selects.
 *
 * The reader's move is always downward — *la compañía → este bloque → dentro de
 * él, qué parte* — so the control is the chain itself. Choosing a section drops
 * whatever was selected below it: staying on "3.2.1" while the reader moves to
 * block 5 is how a dashboard shows the wrong numbers under the right title.
 */
function ScopeSection({
  sections,
  scope,
  onScopeChange,
}: {
  sections: readonly SectionResult[];
  scope: SummaryScope;
  onScopeChange: (id: string) => void;
}) {
  const level1 = sections.filter(sectionHasContent);
  const selected1 = scope.path[0] ?? null;
  const selected2 = scope.path[1] ?? null;
  const selected3 = scope.path[2] ?? null;
  const level2 = (selected1?.children ?? []).filter(sectionHasContent);
  const level3 = (selected2?.children ?? []).filter(sectionHasContent);

  return (
    <div className="flex flex-col gap-0.5 p-2.5">
      <PopoverTitle className="flex items-center gap-1.5 px-2 pt-0.5 text-[13px]">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
        Alcance
      </PopoverTitle>
      <PopoverDescription className="px-2 pb-1 text-[12px] leading-relaxed">
        Limita todo el resumen a una sección y, dentro de ella, a una subsección de segundo o
        tercer nivel.
      </PopoverDescription>

      <div className="flex flex-col gap-1.5 px-2 pt-1">
        <ScopeSelect
          label="Sección"
          value={selected1?.id ?? SCOPE_ALL}
          clearLabel="Toda la encuesta"
          options={level1}
          onChange={onScopeChange}
        />
        {level2.length > 0 && (
          <ScopeSelect
            label="Subsección"
            value={selected2?.id ?? selected1?.id ?? SCOPE_ALL}
            fallbackValue={selected1?.id ?? SCOPE_ALL}
            clearLabel="Todas las subsecciones"
            options={level2}
            onChange={onScopeChange}
          />
        )}
        {level3.length > 0 && (
          <ScopeSelect
            label="Sub-subsección"
            value={selected3?.id ?? selected2?.id ?? SCOPE_ALL}
            fallbackValue={selected2?.id ?? SCOPE_ALL}
            clearLabel="Todas las sub-subsecciones"
            options={level3}
            onChange={onScopeChange}
          />
        )}
      </div>
    </div>
  );
}

function ScopeSelect({
  label,
  value,
  fallbackValue,
  clearLabel,
  options,
  onChange,
}: {
  label: string;
  value: string;
  /** What "todas" means at this level: the parent's own id, or the survey. */
  fallbackValue?: string;
  clearLabel: string;
  options: readonly SectionResult[];
  onChange: (id: string) => void;
}) {
  const clearValue = fallbackValue ?? SCOPE_ALL;
  // A select whose value equalled a sibling's clear token would render the
  // wrong row as chosen, so "todas" carries its own value and is mapped back.
  const CLEAR = "__clear__";

  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[92px] shrink-0 truncate text-[12.5px] font-medium text-text-secondary">
        {label}
      </span>
      <Select
        value={value === clearValue ? CLEAR : value}
        onValueChange={(next) => onChange(next === CLEAR ? clearValue : next)}
      >
        <SelectTrigger className="h-8 min-w-0 flex-1 rounded-md border-transparent bg-muted/40 px-2.5 text-[12.5px] hover:bg-muted/60 focus:ring-1 focus:ring-primary/20">
          <SelectValue className="truncate" />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-[280px]">
          <SelectItem value={CLEAR} className="text-[12.5px] text-muted-foreground">
            {clearLabel}
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id} className="text-[12.5px]">
              <span className="mr-1.5 font-bold tabular-nums text-muted-foreground">
                {option.numbering}
              </span>
              {option.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** One select per demographic — the same "filtrar a fondo" the other tabs have. */
function DemographicsSection({
  segments,
  filters,
  onApplyFilter,
  onClearFilters,
}: {
  segments: readonly SegmentDefinition[];
  filters: readonly SegmentFilter[];
  onApplyFilter: (key: string, optionId: string) => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-border/30 p-2.5">
      <PopoverTitle className="flex items-center gap-1.5 px-2 pt-0.5 text-[13px]">
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
        Demográficos
      </PopoverTitle>
      <PopoverDescription className="px-2 pb-1 text-[12px] leading-relaxed">
        Limita el resumen a una parte de la población. Cada cifra se recalcula sobre esa gente.
      </PopoverDescription>

      {segments.length === 0 ? (
        <p className="px-2 pt-1 text-[12px] text-muted-foreground">
          Esta encuesta no recogió datos demográficos con los que filtrar.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5 px-2 pt-1">
          {segments.map((segment) => (
            <DemographicPicker
              key={segment.key}
              segment={segment}
              selected={filters
                .filter((filter) => filter.key === segment.key)
                .map((filter) => filter.optionId)}
              onToggle={(optionId) => onApplyFilter(segment.key, optionId)}
              onClear={() => onApplyFilter(segment.key, "")}
            />
          ))}
        </div>
      )}

      {filters.length > 0 && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mx-2 mt-2 flex items-center justify-start border-t border-border/30 pb-0.5 pt-2 text-[12px] font-medium text-primary transition-colors hover:underline"
        >
          Quitar demográficos
        </button>
      )}
    </div>
  );
}

/**
 * One demographic as a multi-select.
 *
 * A single-choice select could only ask "which one area?", and the question a
 * reader actually has is often "how do Producto y Tecnología look together" —
 * or "all the areas except the two we just spun off". So the values are
 * checkboxes: picking several reads the summary over their union, and picking
 * none is the unfiltered whole.
 *
 * The values open in their own floating layer *over* the panel, exactly like
 * the `Select` the Favorabilidad toolbar uses: same portal, same trigger-width
 * anchoring, same collision handling. Expanding the list inside the panel
 * instead pushed every row below it down and made the panel scroll under the
 * reader's cursor.
 */
function DemographicPicker({
  segment,
  selected,
  onToggle,
  onClear,
}: {
  segment: SegmentDefinition;
  selected: readonly string[];
  onToggle: (optionId: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const chosen = new Set(selected);
  const allChosen = segment.options.length > 0 && chosen.size === segment.options.length;

  const summary =
    chosen.size === 0
      ? "Sin filtrar"
      : allChosen
        ? `Todas (${formatCount(segment.options.length)})`
        : chosen.size === 1
          ? (segment.options.find((option) => chosen.has(option.id))?.label ?? "1 seleccionada")
          : `${formatCount(chosen.size)} seleccionadas`;

  return (
    <div className="flex items-center gap-2.5">
      <span className="w-[92px] shrink-0 truncate text-[12.5px] font-medium text-text-secondary">
        {segment.label}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-expanded={open}
            className={cn(
              "flex h-8 min-w-0 flex-1 items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 text-[12.5px] transition-colors hover:bg-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/20",
              chosen.size > 0 ? "text-text-primary" : "text-muted-foreground"
            )}
          >
            <span className="truncate">{summary}</span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 opacity-50 transition-transform duration-200",
                open && "rotate-180"
              )}
              strokeWidth={2.2}
            />
          </button>
        </PopoverTrigger>
        {/*
          Same chrome as `SelectContent`: it is the same kind of list, so it
          should not look like a second invention. Width follows the trigger and
          the height is capped by whatever room the viewport actually has.
        */}
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={12}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="z-[60] w-[var(--radix-popover-trigger-width)] min-w-[220px] max-h-[min(300px,var(--radix-popover-content-available-height))] gap-0 overflow-hidden rounded-md border border-border p-1.5 shadow-md"
        >
          <PopoverTitle className="sr-only">{segment.label}</PopoverTitle>
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
            <span className="text-[11.5px] font-semibold text-muted-foreground">
              {segment.options.length} opciones
            </span>
            {chosen.size > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-[11.5px] font-medium text-primary transition-colors hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="flex max-h-[236px] flex-col overflow-y-auto">
            {segment.options.map((option) => (
              <OptionRow
                key={option.id}
                label={option.label}
                checked={chosen.has(option.id)}
                onToggle={() => onToggle(option.id)}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

/**
 * One value of a demographic, as a checkbox row.
 *
 * Same shape as `ScaleToggle`: the row *is* the checkbox — `role="checkbox"` on
 * the button with a decorative box inside — rather than a real checkbox nested
 * in a button, which is invalid markup and leaves two things to click for one
 * decision.
 */
function OptionRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors hover:bg-muted/60",
        checked ? "font-medium text-text-primary" : "text-text-primary"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-[5px] border transition-colors",
          checked ? "border-primary bg-primary" : "border-border bg-surface"
        )}
      >
        {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3.6} />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  );
}

/**
 * What is currently narrowing the page, as removable chips.
 *
 * The controls live behind two buttons now, so without this row a reader who
 * scrolled past the bar has no way of knowing that the 62% they are reading is
 * of Colombia only. Scope is a chip like any other filter, because it narrows
 * the figures exactly the same way.
 */
function ActiveFilterChips({
  scope,
  onClearScope,
  segments,
  filters,
  onRemoveFilter,
  onClearAll,
}: {
  scope: SummaryScope;
  onClearScope: () => void;
  segments: readonly SegmentDefinition[];
  filters: readonly SegmentFilter[];
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}) {
  const scoped = scope.id !== SCOPE_ALL;
  if (!scoped && filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-1">
      {scoped && (
        <Chip label={`Alcance: ${scope.label}`} onRemove={onClearScope} tone="scope" />
      )}
      {/* One chip per demographic, not per value: "Área: Producto, Tecnología"
          is the filter the reader applied, and removing it removes the whole
          thing — the values live in the popover. */}
      {groupFilterLabels(segments, filters).map((group) => (
        <Chip
          key={group.key}
          label={`${group.segmentLabel}: ${group.valueLabels.join(", ")}`}
          onRemove={() => onRemoveFilter(group.key)}
        />
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-[11.5px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-text-primary hover:underline"
      >
        Quitar todo
      </button>
    </div>
  );
}

/** The active filters as one entry per demographic, labels already resolved. */
function groupFilterLabels(
  segments: readonly SegmentDefinition[],
  filters: readonly SegmentFilter[]
): readonly { key: string; segmentLabel: string; valueLabels: readonly string[] }[] {
  const byKey = new Map<string, string[]>();
  for (const filter of filters) {
    const segment = segments.find((candidate) => candidate.key === filter.key);
    const label =
      segment?.options.find((candidate) => candidate.id === filter.optionId)?.label ??
      filter.optionId;
    const group = byKey.get(filter.key);
    if (group) group.push(label);
    else byKey.set(filter.key, [label]);
  }

  return [...byKey.entries()].map(([key, valueLabels]) => ({
    key,
    segmentLabel: segments.find((candidate) => candidate.key === key)?.label ?? key,
    valueLabels,
  }));
}

function Chip({
  label,
  onRemove,
  tone,
}: {
  label: string;
  onRemove: () => void;
  tone?: "scope";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border py-1 pl-2.5 pr-1 text-[11.5px] font-medium",
        tone === "scope"
          ? "border-primary/25 bg-primary/[0.07] text-primary"
          : "border-transparent bg-muted text-muted-foreground"
      )}
    >
      {tone === "scope" && <ChevronRight className="h-3 w-3 shrink-0 opacity-70" />}
      <span className="max-w-[280px] truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${label}`}
        className="rounded-full p-0.5 transition-colors hover:bg-border/50 hover:text-text-primary"
      >
        <X className="h-3 w-3" strokeWidth={2.4} />
      </button>
    </span>
  );
}
