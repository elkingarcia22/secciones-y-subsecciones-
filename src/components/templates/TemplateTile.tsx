import * as React from "react";
import { ChevronRight, Clock, Layers, ListChecks, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NEUTRAL_ACCENT } from "@/lib/tone";
import type { TemplateSize, TemplateTone } from "./templateCatalog";

/**
 * The template "tile" the whole app uses: a survey page in miniature with the
 * template's badge pinned to its corner, then the name and what it holds. The
 * home strip shows the compact row; the picker's gallery shows the taller card
 * with the page sitting on a tinted stage and the objective under it. Same
 * object in both places, so a template you spotted on the home is the one you
 * recognize inside the drawer.
 */

/** Tones whose tint comes from a Tailwind opacity class — the three token
 *  colors (`status-positive`, `primary`, `status-warning`) are declared as
 *  `hsl(var(...) / <alpha-value>)`, so a `/10`-style modifier actually works
 *  on them. */
type ClassTone = "positive" | "brand" | "warning";

/** Tones whose tint is computed with `color-mix()` in a `style` prop instead
 *  of a Tailwind opacity class — both are one fixed accent rather than a
 *  token that already carries an alpha-ready hsl triple. */
type StyleTone = "ai" | "neutral";

function isStyleTone(tone: TemplateTone): tone is StyleTone {
  return tone === "ai" || tone === "neutral";
}

/** Flat badge treatment per tone — every tile reads as the same object. */
const TONE_BADGE_CLASSES: Readonly<Record<ClassTone, string>> = {
  positive: "bg-status-positive/10 text-status-positive",
  brand: "bg-primary/10 text-primary",
  warning: "bg-status-warning/10 text-status-warning",
};

/** The one colored line on the thumbnail — the template's "title" — in the
 *  same tone as its badge, so page and badge read as one object. */
const TONE_LINE_CLASSES: Readonly<Record<ClassTone, string>> = {
  positive: "bg-status-positive/70",
  brand: "bg-primary/70",
  warning: "bg-status-warning/70",
};

/** The stage a page sits on in the gallery: the same hue as the badge, washed
 *  down to a faint tint, so a shelf of cards reads by color before by name. */
const TONE_STAGE_CLASSES: Readonly<Record<ClassTone, string>> = {
  positive: "bg-status-positive/[0.07]",
  brand: "bg-primary/[0.07]",
  warning: "bg-status-warning/[0.09]",
};

interface ToneMix {
  badge: React.CSSProperties;
  line: React.CSSProperties;
  stage: React.CSSProperties;
}

/** @param color Any valid CSS color expression — a `var(--x)` reference or a
 *  literal hex — mixed with `transparent` at each alpha so the same accent
 *  drives the badge, the thumbnail's title line and the gallery stage. */
function toneMix(color: string, badgeAlpha: number, lineAlpha: number, stageAlpha: number): ToneMix {
  return {
    badge: {
      color,
      backgroundColor: `color-mix(in srgb, ${color} ${badgeAlpha}%, transparent)`,
    },
    line: {
      backgroundColor: `color-mix(in srgb, ${color} ${lineAlpha}%, transparent)`,
    },
    stage: {
      backgroundColor: `color-mix(in srgb, ${color} ${stageAlpha}%, transparent)`,
    },
  };
}

// NOM 035's shield icon is the "official / compliance" template family, so
// it takes the shared `neutral` accent (see `@/lib/tone`) — indigo, distinct
// from brand blue, positive green and warning orange.
const STYLE_TONE_MIX: Readonly<Record<StyleTone, ToneMix>> = {
  ai: toneMix("var(--color-ai-gradient-start)", 14, 70, 7),
  neutral: toneMix(NEUTRAL_ACCENT, 14, 65, 10),
};

type ThumbSize = "sm" | "md" | "lg";

const THUMB_SIZE_CLASSES: Readonly<Record<ThumbSize, string>> = {
  sm: "h-12 w-10",
  md: "h-14 w-[46px]",
  lg: "h-[68px] w-[56px]",
};

export interface PageThumbProps {
  icon: LucideIcon;
  tone: TemplateTone;
  /** A "more…" tile: dotted outline with the icon alone, no badge. */
  dashed?: boolean;
  size?: ThumbSize;
  className?: string;
}

/**
 * A survey page in miniature: a colored title line, a few grey question lines
 * and a row of five answer dots, with the template's badge pinned to the
 * bottom corner. Tilts a touch when its parent `.group` is hovered, the way a
 * card lifts off a stack.
 */
export function PageThumb({ icon: Icon, tone, dashed = false, size = "sm", className }: PageThumbProps) {
  // Each ternary calls the type guard directly (rather than branching on a
  // `mixed` variable computed once) so TypeScript narrows `tone` to
  // `ClassTone` right where it indexes these two maps.
  const mixed = isStyleTone(tone) ? STYLE_TONE_MIX[tone] : undefined;
  const badgeClassName = isStyleTone(tone) ? undefined : TONE_BADGE_CLASSES[tone];
  const lineClassName = isStyleTone(tone) ? undefined : TONE_LINE_CLASSES[tone];
  const isLarge = size === "lg";

  return (
    <span className={cn("relative z-[1] mb-1 mr-1 block shrink-0", className)}>
      <span
        className={cn(
          "flex flex-col gap-[3px] rounded-[7px] border px-1.5 pt-2 shadow-sm transition-transform duration-300 ease-out",
          THUMB_SIZE_CLASSES[size],
          isLarge && "gap-[4px] rounded-[9px] px-2 pt-2.5",
          "group-hover:-translate-y-0.5 group-hover:-rotate-2",
          dashed ? "items-center justify-center border-dashed border-border bg-surface pt-0" : "border-border/70 bg-surface"
        )}
      >
        {dashed ? (
          <Icon className="h-4 w-4 text-text-muted" strokeWidth={2} />
        ) : (
          <>
            <span className={cn("h-[3px] w-4 rounded-full", lineClassName)} style={mixed?.line} />
            <span className="mt-[2px] h-[2px] w-full rounded-full bg-border" />
            <span className="h-[2px] w-4/5 rounded-full bg-border" />
            <span className="h-[2px] w-3/5 rounded-full bg-border" />
            {isLarge && <span className="h-[2px] w-4/5 rounded-full bg-border" />}
            <span className="mt-auto mb-1.5 flex justify-between px-px">
              {Array.from({ length: 5 }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-[4px] w-[4px] rounded-full border border-border",
                    index === 3 && cn("border-transparent", lineClassName)
                  )}
                  style={index === 3 ? mixed?.line : undefined}
                />
              ))}
            </span>
          </>
        )}
      </span>
      {!dashed && (
        <span
          className={cn(
            "absolute -bottom-1.5 -right-2 flex items-center justify-center rounded-full ring-2 ring-surface transition-transform duration-300 group-hover:scale-110",
            isLarge ? "h-[26px] w-[26px]" : "h-[22px] w-[22px]",
            badgeClassName
          )}
          style={mixed?.badge}
        >
          <Icon className={isLarge ? "h-3.5 w-3.5" : "h-3 w-3"} strokeWidth={2.25} />
        </span>
      )}
    </span>
  );
}

export interface ToneStageProps {
  tone: TemplateTone;
  children: React.ReactNode;
  className?: string;
}

/** The tinted panel a page thumbnail sits on inside a gallery card. */
export function ToneStage({ tone, children, className }: ToneStageProps) {
  const mixed = isStyleTone(tone) ? STYLE_TONE_MIX[tone] : undefined;
  return (
    <span
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl ring-1 ring-inset ring-border/40",
        !isStyleTone(tone) && TONE_STAGE_CLASSES[tone],
        className
      )}
      style={mixed?.stage}
    >
      {/* A faint light from the top-left, so the stage has a little depth
          instead of reading as a flat swatch. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_10%_0%,hsl(var(--card)/0.55),transparent_60%)]"
      />
      {children}
    </span>
  );
}

/** "4 secciones · 8 preguntas · 4 min" with a small icon before each figure. */
export function TemplateSizeMeta({ size, className }: { size: TemplateSize; className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-medium text-text-muted", className)}>
      <span className="inline-flex items-center gap-1 tabular-nums">
        <Layers className="h-3 w-3" strokeWidth={2} />
        {size.sections}
      </span>
      <span className="inline-flex items-center gap-1 tabular-nums">
        <ListChecks className="h-3 w-3" strokeWidth={2} />
        {size.questions}
      </span>
      <span className="inline-flex items-center gap-1 tabular-nums">
        <Clock className="h-3 w-3" strokeWidth={2} />
        {size.minutes} min
      </span>
    </span>
  );
}

export interface TemplateTileProps {
  icon: LucideIcon;
  tone: TemplateTone;
  label: string;
  /** The one-line size summary under the name (compact variant). */
  meta: string;
  /** Native tooltip — the full name plus whatever the tile had to truncate. */
  title: string;
  onClick: () => void;
  /**
   * `compact`: one row, thumb + name + meta (the home strip).
   * `card`: taller — the page on a tinted stage, then the name, the objective
   * and its size, with a chevron that slides in on hover. A gallery entry you
   * open, not a shortcut you press.
   * `list`: one full-width row — thumb, name, objective on one truncated
   * line, then its size — for browsing many templates at a glance instead of
   * scanning a grid.
   */
  variant?: "compact" | "card" | "list";
  /** The objective — shown by the `card` variant (two lines) and the `list`
   *  variant (one, truncated). */
  description?: string;
  /** Section / question / minute counts, shown by the `card` and `list`
   *  variants. */
  size?: TemplateSize;
  /** A "more…" tile: dotted outline, no badge. */
  dashed?: boolean;
  className?: string;
}

export function TemplateTile({
  icon,
  tone,
  label,
  meta,
  title,
  onClick,
  variant = "compact",
  description,
  size,
  dashed = false,
  className,
}: TemplateTileProps) {
  const isCard = variant === "card";
  const isList = variant === "list";
  const mixed = isStyleTone(tone) ? STYLE_TONE_MIX[tone] : undefined;

  // Both non-card shapes tint their whole background, `card`'s own thumbnail
  // stage carries the tint instead. The light overlay that sits on top of
  // that tint (below) is what keeps it a wash rather than a flat block of
  // color — it just needs to reach much further across a `list` row than
  // across a small square `compact` tile, which is why the two variants use
  // different gradients there instead of sharing one.
  const tintsWholeTile = !isCard;
  const tintClassName = !dashed && tintsWholeTile && !isStyleTone(tone) ? TONE_STAGE_CLASSES[tone] : undefined;
  const tintStyle = !dashed && tintsWholeTile ? mixed?.stage : undefined;

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={tintStyle}
      className={cn(
        "group relative flex w-full overflow-hidden rounded-2xl border text-left",
        // Same wash + 1px lift as the survey-builder mode cards, so these
        // tiles hover like every other card in the app.
        "magic-card-sweep magic-card-lift",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        isCard ? "flex-col gap-3 p-3 pb-3.5" : "items-center gap-3 py-2.5 pl-3 pr-3",
        isList && "sm:gap-4",
        dashed
          ? "border-dashed border-border bg-surface-muted/50 hover:border-primary/40"
          : cn("border-border/60", tintClassName ?? "bg-surface"),
        className
      )}
    >
      {tintsWholeTile && !dashed && (
        // The light that keeps the tint a wash instead of a flat block of
        // color. On the small square `compact` tile a corner radial already
        // reaches every edge; stretched across a full-width `list` row the
        // same radial faded out around a third of the way in, leaving the
        // rest of the row solid color — so `list` gets a left-to-right wash
        // that keeps going, and stays mostly light past its icon.
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 z-0",
            isList
              ? "bg-[linear-gradient(to_right,hsl(var(--card)/0.15)_0%,hsl(var(--card)/0.94)_42%)]"
              : "bg-[radial-gradient(120%_140%_at_8%_0%,hsl(var(--card)/0.55),transparent_60%)]"
          )}
        />
      )}
      {isCard ? (
        <>
          <ToneStage tone={tone} className="z-[1] h-[92px] w-full">
            <PageThumb icon={icon} tone={tone} dashed={dashed} size="lg" className="mb-0 mr-0" />
          </ToneStage>
          <span className="relative z-[1] flex min-w-0 flex-col gap-1 px-1">
            <span className="flex items-start gap-2">
              {/* Two lines rather than an ellipsis: "(- 50 colaboradores)" is
                  the part of a NOM 035 name that tells the guides apart. */}
              <span className="min-w-0 flex-1 line-clamp-2 text-[13.5px] font-semibold leading-snug text-text-primary">
                {label}
              </span>
              <ChevronRight
                aria-hidden
                className="mt-px h-4 w-4 shrink-0 -translate-x-1 text-text-muted opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100"
                strokeWidth={2}
              />
            </span>
            {description && (
              <span className="line-clamp-2 text-[12px] leading-relaxed text-text-secondary">{description}</span>
            )}
            {size && <TemplateSizeMeta size={size} className="mt-1" />}
          </span>
        </>
      ) : isList ? (
        <>
          <PageThumb icon={icon} tone={tone} dashed={dashed} />
          {/* One truncated line: the two texts have to shrink together, so
              `truncate` sits on this wrapper rather than on each span —
              truncating them separately would let the name run long while
              the objective vanished first. */}
          <span className="relative z-[1] min-w-0 flex-1 truncate text-[13px] leading-tight">
            <span className="font-semibold text-text-primary">{label}</span>
            {description && <span className="text-text-secondary"> — {description}</span>}
          </span>
          {size && (
            <span className="relative z-[1] hidden shrink-0 sm:block">
              <TemplateSizeMeta size={size} />
            </span>
          )}
          <ChevronRight
            aria-hidden
            className="relative z-[1] h-4 w-4 shrink-0 -translate-x-1 text-text-muted opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100"
            strokeWidth={2}
          />
        </>
      ) : (
        <>
          <PageThumb icon={icon} tone={tone} dashed={dashed} />
          <span className="relative z-[1] flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-[13px] font-semibold leading-tight text-text-primary">{label}</span>
            <span className="truncate text-[11px] font-medium leading-tight text-text-muted">{meta}</span>
          </span>
        </>
      )}
    </button>
  );
}
