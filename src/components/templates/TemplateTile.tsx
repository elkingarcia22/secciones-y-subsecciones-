import * as React from "react";
import { ChevronRight, Clock, Layers, ListChecks, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

/** Tones whose tint is computed with `color-mix()` in a `style` prop instead.
 *  `ai` needs this because its look is one specific accent, not a token's
 *  opacity class. `neutral` needs it because `--color-text-secondary` is a
 *  plain hex value rather than an hsl triple with an alpha slot, so
 *  Tailwind's opacity modifier — `bg-text-secondary/10` — silently generates
 *  no rule at all; `color-mix()` reads the same variable and always
 *  resolves, in both themes. */
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

function toneMix(cssVar: string, badgeAlpha: number, lineAlpha: number, stageAlpha: number): ToneMix {
  return {
    badge: {
      color: `var(${cssVar})`,
      backgroundColor: `color-mix(in srgb, var(${cssVar}) ${badgeAlpha}%, transparent)`,
    },
    line: {
      backgroundColor: `color-mix(in srgb, var(${cssVar}) ${lineAlpha}%, transparent)`,
    },
    stage: {
      backgroundColor: `color-mix(in srgb, var(${cssVar}) ${stageAlpha}%, transparent)`,
    },
  };
}

const STYLE_TONE_MIX: Readonly<Record<StyleTone, ToneMix>> = {
  ai: toneMix("--color-ai-gradient-start", 14, 70, 7),
  // A gray tint needs more opacity than a saturated one to still read as a
  // tint rather than nothing — bumped up from the colored tones' 7-9%.
  neutral: toneMix("--color-text-secondary", 16, 55, 12),
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
  const mixed = isStyleTone(tone) ? STYLE_TONE_MIX[tone] : undefined;
  const badgeClassName = mixed ? undefined : TONE_BADGE_CLASSES[tone];
  const lineClassName = mixed ? undefined : TONE_LINE_CLASSES[tone];
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
        !mixed && TONE_STAGE_CLASSES[tone],
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
   */
  variant?: "compact" | "card";
  /** The objective, shown only by the `card` variant. */
  description?: string;
  /** Section / question / minute counts, shown only by the `card` variant. */
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
  const mixed = isStyleTone(tone) ? STYLE_TONE_MIX[tone] : undefined;

  // The compact row (the home strip) carries the same faint tone tint the
  // gallery card's stage uses, instead of a plain surface — so a shelf of
  // shortcuts reads by color the same way the gallery's cards do.
  const tintClassName = !dashed && !isCard && !mixed ? TONE_STAGE_CLASSES[tone] : undefined;
  const tintStyle = !dashed && !isCard ? mixed?.stage : undefined;

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
        dashed
          ? "border-dashed border-border bg-surface-muted/50 hover:border-primary/40"
          : cn("border-border/60", tintClassName ?? "bg-surface"),
        className
      )}
    >
      {!isCard && !dashed && (
        // Same top-left light the gallery stage has, so the tint reads as a
        // soft glow instead of a flat swatch.
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(120%_140%_at_8%_0%,hsl(var(--card)/0.55),transparent_60%)]"
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
