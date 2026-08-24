import * as React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  effectiveSentiment,
  sentimentTotals,
  type OpenComment,
  type Sentiment,
} from "@/mocks/questionResponses";
import { ScaleToggle } from "./ScaleToggle";
import { SENTIMENT_ORDER, SENTIMENT_STYLES } from "./sentimentScale";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

/** Everything that narrows the comment list, as one piece of state. */
export interface CommentFiltersState {
  query: string;
  setQuery: (value: string) => void;
  topic: string;
  setTopic: (value: string) => void;
  sentiment: Sentiment | null;
  setSentiment: (value: Sentiment | null) => void;
  onlyCorrected: boolean;
  setOnlyCorrected: (value: boolean) => void;
  /** How many filters are set, for the trigger's badge. The search is its own
   * control, so it doesn't count here. */
  activeCount: number;
  /** Whether anything at all narrows the list, search included. */
  isNarrowed: boolean;
  clear: () => void;
}

/**
 * The comment filters, owned by the header row rather than by the list.
 *
 * The view they narrow is rendered further down the page, so the state lives
 * with the toolbar's owner and travels to both — the same way "Vista" and
 * "Filtros" are held above the tree they act on.
 */
export function useCommentFilters(): CommentFiltersState {
  const [query, setQuery] = React.useState("");
  const [topic, setTopic] = React.useState("");
  const [sentiment, setSentiment] = React.useState<Sentiment | null>(null);
  const [onlyCorrected, setOnlyCorrected] = React.useState(false);

  const activeCount =
    (topic !== "" ? 1 : 0) +
    (sentiment !== null ? 1 : 0) +
    (onlyCorrected ? 1 : 0);

  const clear = React.useCallback(() => {
    setTopic("");
    setSentiment(null);
    setOnlyCorrected(false);
  }, []);

  return {
    query,
    setQuery,
    topic,
    setTopic,
    sentiment,
    setSentiment,
    onlyCorrected,
    setOnlyCorrected,
    activeCount,
    isNarrowed: activeCount > 0 || query.trim().length > 0,
    clear,
  };
}

/** How many comments each filter would leave, so the popover can say so. */
export interface CommentFilterCounts {
  sentiment: Readonly<Record<Sentiment, number>>;
  corrected: number;
}

export const commentFilterCounts = (
  comments: readonly OpenComment[],
  overrides: ReadonlyMap<string, Sentiment>
): CommentFilterCounts => ({
  sentiment: sentimentTotals(comments, overrides),
  corrected: comments.filter((comment) => overrides.has(comment.id)).length,
});

/** The themes the model tagged, as the filter offers them. */
export const commentTopics = (comments: readonly OpenComment[]): readonly string[] =>
  [...new Set(comments.map((comment) => comment.topic))].sort();

/** Whether a comment survives the filters — the one rule both counts and list use. */
export const matchesCommentFilters = (
  comment: OpenComment,
  filters: CommentFiltersState,
  overrides: ReadonlyMap<string, Sentiment>
): boolean => {
  if (filters.sentiment && effectiveSentiment(comment, overrides) !== filters.sentiment) return false;
  if (filters.topic && comment.topic !== filters.topic) return false;
  if (filters.onlyCorrected && !overrides.has(comment.id)) return false;

  const needle = filters.query.trim().toLowerCase();
  if (!needle) return true;
  return (
    comment.text.toLowerCase().includes(needle) ||
    comment.topic.toLowerCase().includes(needle) ||
    (comment.area?.toLowerCase().includes(needle) ?? false) ||
    comment.respondentName.toLowerCase().includes(needle)
  );
};

/**
 * The comment search, as the icon button the participation table uses.
 *
 * A search field spanning the row was the widest thing on the screen and the
 * first thing the reader met, for a control most readings never touch. Closed
 * it is one 36px button beside the other controls; it opens on click and stays
 * open while it holds a term.
 */
export function CommentsSearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const open = expanded || value !== "";

  return (
    <div
      className={cn(
        "relative flex h-9 shrink-0 overflow-hidden rounded-lg border bg-surface transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        open ? "w-[260px] border-primary/50 ring-1 ring-primary/15" : "w-9 cursor-pointer border-border hover:bg-border/50"
      )}
      onClick={() => {
        if (!open) {
          setExpanded(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget) && value === "") {
          setExpanded(false);
        }
      }}
    >
      <div
        className={cn(
          "absolute left-0 -ml-px -mt-px flex h-9 w-9 items-center justify-center transition-colors",
          open ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Search
          className="h-4 w-4 translate-x-[0.667px] translate-y-[0.667px]"
          strokeWidth={2.2}
        />
      </div>

      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar en los comentarios"
        aria-label="Buscar en los comentarios"
        className={cn(
          "h-full w-[260px] bg-transparent pl-9 pr-8 text-[12.5px] text-text-primary outline-none transition-all placeholder:text-muted-foreground/70",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      {value !== "" && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          aria-label="Limpiar la búsqueda"
          className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-border/60 hover:text-text-primary"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

/**
 * "Filtros" for the comments, in the shape Favorabilidad already gives it.
 *
 * Theme, sentiment and the corrections check used to be a string of chips
 * across the row above the list — a filter bar wider than the title,
 * repeating counts the section headers already carry. They are the same kind of
 * control as "Filtrar a fondo" by demographics, so they sit behind the same
 * trigger, with the counts kept beside each option instead of on the row.
 */
export function CommentsFiltersButton({
  filters,
  topics,
  counts,
}: {
  filters: CommentFiltersState;
  topics: readonly string[];
  counts: CommentFilterCounts;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 shrink-0 justify-start gap-2 rounded-lg border-border bg-surface px-3 text-[12.5px] text-text-primary transition-colors hover:bg-border/30"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
          Filtros
          {filters.activeCount > 0 && (
            <Badge variant="neutral" className="h-4.5 min-w-[18px] justify-center px-1 text-[10.5px]">
              {filters.activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-0">
        <div className="flex flex-col gap-3 p-3">
          <div className="flex flex-col gap-0.5">
            <PopoverTitle className="text-[13px]">Filtrar comentarios</PopoverTitle>
            <PopoverDescription className="text-[12px] leading-relaxed">
              Limita la lista al tema, al sentimiento o a las lecturas que ya corregiste.
            </PopoverDescription>
          </div>

          <div className="flex items-center gap-2.5 border-t border-border/30 pt-3">
            <span className="w-[85px] shrink-0 truncate text-[12.5px] font-medium text-text-secondary">
              Tema
            </span>
            <Select value={filters.topic} onValueChange={filters.setTopic}>
              <SelectTrigger
                aria-label="Filtrar los comentarios por tema"
                className="h-8 flex-1 rounded-md border-transparent bg-muted/40 px-2.5 text-[12.5px] hover:bg-muted/60 focus:ring-1 focus:ring-primary/20"
              >
                <SelectValue placeholder="Todos los temas" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="" className="text-[12.5px]">
                  Todos los temas
                </SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic} value={topic} className="text-[12.5px]">
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-border/30 pt-3">
            <span className="text-[12.5px] font-medium text-text-secondary">Sentimiento</span>
            {SENTIMENT_ORDER.map((id) => {
              const style = SENTIMENT_STYLES[id];
              return (
                <ScaleToggle
                  key={id}
                  option={{
                    id,
                    label: style.label,
                    range: formatCount(counts.sentiment[id]),
                    palette: {
                      color: style.color,
                      background: style.background,
                      border: style.border,
                      foreground: style.foreground,
                    },
                  }}
                  active={filters.sentiment === id}
                  // One sentiment at a time: the three counts are already read
                  // together on every section header, so this is "solo estos".
                  onToggle={() => filters.setSentiment(filters.sentiment === id ? null : id)}
                />
              );
            })}
          </div>

          {/* One row, so no group label over it: "Corregidos" says what it
              keeps on its own. */}
          <div className="flex flex-col border-t border-border/30 pt-3">
            <ScaleToggle
              option={{
                id: "corrected",
                label: "Solo los corregidos",
                range: formatCount(counts.corrected),
              }}
              active={filters.onlyCorrected}
              onToggle={() => filters.setOnlyCorrected(!filters.onlyCorrected)}
            />
          </div>

          {filters.activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={filters.clear}
              className="justify-start rounded-none border-t border-border/30 px-0 pb-1 pt-3 text-[12px] text-primary hover:bg-transparent hover:underline"
            >
              Quitar filtros
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
