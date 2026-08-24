import * as React from "react";
import { ArrowUpRight, Gauge, Info, MessageSquareQuote, PieChart, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SurveyResults } from "@/mocks/surveyResults";
import { FormulaBlock } from "./FormulaBlock";
import {
  FAVORABILITY_FLOOR,
  FAVORABILITY_TARGET,
  NEGATIVE,
  NSNR,
  POSITIVE,
  YELLOW,
  formatPercent,
} from "./favorabilityScale";
import { SENTIMENT_ORDER, SENTIMENT_STYLES } from "./sentimentScale";
import type { AlertTarget, ScopedMetrics, SentimentRollup, SummaryScope } from "./summaryModel";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(Math.round(value));

interface SummaryHeadlineProps {
  results: SurveyResults;
  scope: SummaryScope;
  metrics: ScopedMetrics;
  sentiment: SentimentRollup;
  /** True when a demographic filter is narrowing the population in view. */
  filtered: boolean;
  onNavigate: (target: AlertTarget) => void;
}

/**
 * The four numbers the measurement is about, and each one's shape underneath.
 *
 * A headline row of bare percentages is the classic summary failure: 62% means
 * nothing to a reader who does not know what went into it. So every card
 * carries three things — the figure, the explanation of how it is computed
 * behind the same "ⓘ" the rest of the report uses, and a micro-visual of the
 * underlying split whose every segment states what it is, how many answers it
 * holds and what share of the whole that is. And each card is a door: pressing
 * it opens the tab that can answer the next question, which is the only reason
 * a summary earns being the first screen.
 *
 * Participación and eNPS are survey-wide facts and say so when the page is
 * scoped or filtered; faking a per-section participation would be inventing a
 * number the rest of the report cannot corroborate.
 */
export function SummaryHeadline({
  results,
  scope,
  metrics,
  sentiment,
  filtered,
  onNavigate,
}: SummaryHeadlineProps) {
  const scoped = scope.section !== null;
  // eNPS is a survey-wide fact the mock cannot re-cut, so it says so instead of
  // letting a narrowed page imply a number that was never narrowed.
  const npsCaveat = scoped || filtered ? " · toda la encuesta" : "";

  const [unfavorable, neutral, favorable] = [
    metrics.distribution[0] + metrics.distribution[1],
    metrics.distribution[2],
    metrics.distribution[3] + metrics.distribution[4],
  ];

  const favorabilityVerdict =
    metrics.favorability >= FAVORABILITY_TARGET
      ? { label: "En objetivo", variant: "positive" as const }
      : metrics.favorability >= FAVORABILITY_FLOOR
        ? { label: "Por debajo del objetivo", variant: "warning" as const }
        : { label: "Lejos del objetivo (70%)", variant: "negative" as const };

  const participationVerdict =
    results.participation.rate >= 80
      ? { label: "Alta representatividad", variant: "positive" as const }
      : results.participation.rate >= 60
        ? { label: "Representatividad media", variant: "warning" as const }
        : { label: "Baja representatividad", variant: "negative" as const };

  const negativeShare =
    sentiment.total === 0 ? 0 : (sentiment.counts.negative / sentiment.total) * 100;
  const positiveShare =
    sentiment.total === 0 ? 0 : (sentiment.counts.positive / sentiment.total) * 100;
  const voiceVerdict =
    negativeShare > positiveShare + 5
      ? { label: "Predomina percepción negativa", variant: "negative" as const }
      : positiveShare > negativeShare + 5
        ? { label: "Predomina percepción positiva", variant: "positive" as const }
        : { label: "Percepción mixta", variant: "warning" as const };

  const voiceCaption =
    negativeShare > positiveShare + 5
      ? `${Math.round(negativeShare)}% negativos`
      : positiveShare > negativeShare + 5
        ? `${Math.round(positiveShare)}% positivos`
        : `${Math.round(positiveShare)}% positivos · ${Math.round(negativeShare)}% negativos`;

  const notStarted = Math.max(
    0,
    results.participation.invited -
      results.participation.completed -
      results.participation.inProgress
  );

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <HeadlineCard
        icon={Gauge}
        label="Favorabilidad"
        value={formatPercent(metrics.favorability)}
        caption={
          scoped ? `en ${scope.label}` : `sobre ${metrics.scoredQuestions} preguntas de escala`
        }
        verdict={favorabilityVerdict}
        onOpen={() => onNavigate("favorability")}
        openLabel="Ver favorabilidad"
        help={
          <>
            <p className="text-[12px]">
              <strong>Favorabilidad:</strong>
              <br />
              El porcentaje de respuestas favorables en una escala de 1 a 5, donde se consideran
              favorables las respuestas de 4 y 5. Los NS/NR quedan fuera del total.
            </p>
            <FormulaBlock
              numerator="Respuestas favorables"
              denominator="Total de respuestas"
              result="% de favorabilidad"
            />
          </>
        }
      >
        <MicroBar
          unit="respuestas"
          parts={[
            { id: "fav", value: favorable, color: POSITIVE, label: "Favorables" },
            { id: "neu", value: neutral, color: YELLOW, label: "Neutrales" },
            { id: "unf", value: unfavorable, color: NEGATIVE, label: "Desfavorables" },
            { id: "nsnr", value: metrics.nsnr, color: NSNR, label: "No sabe / No responde" },
          ]}
        />
      </HeadlineCard>

      <HeadlineCard
        icon={PieChart}
        label="Participación"
        value={formatPercent(results.participation.rate)}
        caption={`${formatCount(results.participation.completed)} de ${formatCount(
          results.participation.invited
        )} personas${scoped && !filtered ? " · toda la encuesta" : ""}`}
        verdict={participationVerdict}
        onOpen={() => onNavigate("participation")}
        openLabel="Ver participación"
        help={
          <>
            <p className="text-[12px]">
              <strong>Participación:</strong>
              <br />
              El porcentaje de personas invitadas que completaron la encuesta. Quien la dejó a
              medias cuenta como invitado, no como respuesta.
            </p>
            <FormulaBlock
              numerator="Personas que completaron"
              denominator="Personas invitadas"
              result="% de participación"
            />
          </>
        }
      >
        <MicroBar
          unit="personas"
          parts={[
            {
              id: "done",
              value: results.participation.completed,
              color: POSITIVE,
              label: "Completaron",
            },
            {
              id: "wip",
              value: results.participation.inProgress,
              color: YELLOW,
              label: "En progreso",
            },
            { id: "none", value: notStarted, color: NSNR, label: "Sin abrir" },
          ]}
        />
      </HeadlineCard>

      {results.nps ? (
        <HeadlineCard
          icon={Target}
          label="eNPS"
          value={`${results.nps.score > 0 ? "+" : ""}${results.nps.score}`}
          caption={`${Math.round((results.nps.promoters / results.nps.n) * 100)}% promotores · ${Math.round(
            (results.nps.detractors / results.nps.n) * 100
          )}% detractores${npsCaveat}`}
          verdict={
            results.nps.score >= 20
              ? { label: "Zona favorable", variant: "positive" }
              : results.nps.score >= 0
                ? { label: "Zona neutra", variant: "warning" }
                : { label: "Zona de riesgo", variant: "negative" }
          }
          onOpen={() => onNavigate("nps")}
          openLabel="Ver eNPS"
          help={
            <>
              <p className="text-[12px]">
                <strong>eNPS:</strong>
                <br />
                Qué tan dispuesta está la gente a recomendar la organización, en una escala de 0 a
                10. Promotores 9 y 10, neutros 7 y 8, detractores de 0 a 6. Va de −100 a +100.
              </p>
              <FormulaBlock
                numerator="Promotores − Detractores"
                denominator="Total de respuestas"
                result="eNPS"
              />
            </>
          }
        >
          <MicroBar
            unit="respuestas"
            parts={[
              {
                id: "prom",
                value: results.nps.promoters,
                color: POSITIVE,
                label: "Promotores (9-10)",
              },
              { id: "pass", value: results.nps.passives, color: YELLOW, label: "Neutros (7-8)" },
              {
                id: "detr",
                value: results.nps.detractors,
                color: NEGATIVE,
                label: "Detractores (0-6)",
              },
            ]}
          />
        </HeadlineCard>
      ) : (
        <EmptyHeadlineCard
          icon={Target}
          label="eNPS"
          title="Esta encuesta no lo midió"
          description="Aparece cuando la encuesta incluye una pregunta de recomendabilidad."
        />
      )}

      {sentiment.total > 0 ? (
        <HeadlineCard
          icon={MessageSquareQuote}
          label="Voz de los colaboradores"
          value={formatCount(sentiment.total)}
          suffix="comentarios"
          caption={voiceCaption}
          verdict={voiceVerdict}
          onOpen={() => onNavigate("questions")}
          openLabel="Ver comentarios"
          help={
            <>
              <p className="text-[12px]">
                <strong>Voz de los colaboradores:</strong>
                <br />
                Todo lo que la gente escribió en las preguntas abiertas, con el sentimiento que la
                IA leyó en cada comentario: positivo, neutral o negativo. Cada lectura se puede
                corregir a mano en la vista de comentarios.
              </p>
              <FormulaBlock
                numerator="Comentarios de cada lectura"
                denominator="Total de comentarios"
                result="% por sentimiento"
              />
            </>
          }
        >
          <MicroBar
            unit="comentarios"
            parts={SENTIMENT_ORDER.map((id) => ({
              id,
              value: sentiment.counts[id],
              color: SENTIMENT_STYLES[id].color,
              label: SENTIMENT_STYLES[id].label,
            }))}
          />
        </HeadlineCard>
      ) : (
        <EmptyHeadlineCard
          icon={MessageSquareQuote}
          label="Voz de los colaboradores"
          title="Sin comentarios en este alcance"
          description="Esta lectura se construye sobre las respuestas a preguntas abiertas."
        />
      )}
    </div>
  );
}

interface MicroPart {
  id: string;
  value: number;
  color: string;
  label: string;
}

/**
 * The split under a headline number, at the height of a rule.
 *
 * Full-size stacked bars belong to the Favorabilidad tab; here the job is to
 * say *is this number mostly green or mostly red* in the half-second before the
 * reader moves on. But a bar nobody can interrogate is decoration, so every
 * segment answers the three questions it raises — what it is, how many answers
 * it holds, and what share of the whole that is — on hover, in the report's own
 * tooltip rather than a browser `title` that arrives a second late and cannot
 * be styled.
 */
function MicroBar({ parts, unit }: { parts: readonly MicroPart[]; unit: string }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (total === 0) return <div className="h-2 w-full rounded-full bg-muted" />;

  return (
    <div className="relative z-10 flex h-2 w-full gap-px overflow-hidden rounded-full bg-muted">
      {parts.map((part) => {
        const share = (part.value / total) * 100;
        if (share <= 0) return null;
        return (
          <Tooltip key={part.id}>
            <TooltipTrigger asChild>
              <div
                role="presentation"
                onClick={(event) => event.stopPropagation()}
                style={{ width: `${share}%`, backgroundColor: part.color }}
                className="h-full cursor-default transition-[filter] duration-150 first:rounded-l-full last:rounded-r-full hover:brightness-110"
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="px-3 py-2">
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-1.5 text-[11.5px] font-semibold">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: part.color }}
                  />
                  {part.label}
                </span>
                <span className="text-[11px] tabular-nums opacity-80">
                  {formatCount(part.value)} {unit} · {formatPercent(share)} del total
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

function HeadlineCard({
  icon: Icon,
  label,
  value,
  suffix,
  caption,
  verdict,
  help,
  children,
  onOpen,
  openLabel,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  /** Unit that reads with the figure, when the figure is a count. */
  suffix?: string;
  caption: string;
  /** The plain-language reading of the figure, as a status badge. */
  verdict: { label: string; variant: BadgeProps["variant"] };
  /** What the number means and how it is computed, behind the "ⓘ". */
  help: React.ReactNode;
  children: React.ReactNode;
  onOpen: () => void;
  openLabel: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={openLabel}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group flex cursor-pointer flex-col gap-3 rounded-2xl border border-border/60 bg-surface p-5 text-left",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      )}
    >
      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} />
        <span className="truncate">{label}</span>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Cómo se calcula ${label}`}
              onClick={(event) => event.stopPropagation()}
              className="relative z-10 rounded-md bg-muted/40 p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-text-primary"
            >
              <Info className="h-3 w-3" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[400px] border-none bg-slate-900 p-4 text-slate-100 shadow-xl"
          >
            <div className="flex flex-col items-start gap-3 leading-relaxed">{help}</div>
          </TooltipContent>
        </Tooltip>

        {/* The card as a whole is the target; this is the affordance that says
            so. It keeps its space at rest so the header never reflows, and it
            comes back on keyboard focus — a control that only exists under a
            mouse is a control half the readers never find. */}
        <Button
          variant="secondary"
          size="icon-sm"
          tabIndex={-1}
          aria-hidden
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="ml-auto h-7 w-7 shrink-0 rounded-lg border-border/60 bg-transparent opacity-0 transition-opacity hover:bg-primary/[0.08] hover:text-primary group-hover:opacity-100 group-focus-visible:opacity-100 [&_svg]:size-3.5"
        >
          <ArrowUpRight />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[30px] font-extrabold leading-none tabular-nums text-text-primary">
          {value}
        </span>
        {suffix && (
          <span className="text-[11.5px] font-semibold text-muted-foreground">{suffix}</span>
        )}
      </div>

      {children}

      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <p className="min-w-0 text-[11.5px] leading-snug text-muted-foreground">{caption}</p>
        <Badge variant={verdict.variant} className="shrink-0 text-[10.5px]">
          {verdict.label}
        </Badge>
      </div>
    </div>
  );
}

function EmptyHeadlineCard({
  icon: Icon,
  label,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-5">
      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
        <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
        {label}
      </div>
      <p className="text-[13.5px] font-bold text-text-primary">{title}</p>
      <p className="text-[11.5px] leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
