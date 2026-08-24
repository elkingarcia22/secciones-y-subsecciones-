import { ArrowRight, MessageSquareQuote, Quote, ShieldCheck, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OpenComment, Sentiment } from "@/mocks/questionResponses";
import { SENTIMENT_ORDER, SENTIMENT_STYLES } from "./sentimentScale";
import type { SentimentRollup } from "./summaryModel";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

const share = (value: number, total: number) => (total === 0 ? 0 : (value / total) * 100);

/** Themes shown before the list stops being a shortlist. */
const TOPICS = 4;

interface SummarySentimentCardProps {
  sentiment: SentimentRollup;
  onOpenComments: () => void;
}

/**
 * The words, summarised without being flattened.
 *
 * A single sentiment percentage is the least useful number a report can print:
 * it says the mood is 54 and leaves the reader with no idea what to do on
 * Monday. What makes comments actionable is *which theme* the negative ones pile
 * onto — so the card leads with the split, then ranks the themes by how badly
 * they are read, and closes with one real sentence from each end so the reader
 * leaves with a voice and not only a bar.
 *
 * The scale is the report's own: a comment read as negative is the same red as
 * a 1 on the Likert, because to the reader they mean the same thing.
 *
 * And so is the *shape*. This card is a preview of the Comentarios view, so it
 * is built out of that view's own parts — the same distribution strip above the
 * outline, the same three-dot breakdown its section headers carry, the same
 * quote row. Reading the split here as one lone red bar and then again there as
 * three dots made the reader stop to check whether the two agreed.
 */
export function SummarySentimentCard({ sentiment, onOpenComments }: SummarySentimentCardProps) {
  if (sentiment.total === 0) {
    return (
      <section className="flex min-w-0 flex-col justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
          <MessageSquareQuote className="h-3.5 w-3.5" strokeWidth={2.2} />
          Comentarios
        </div>
        <p className="text-[13.5px] font-bold text-text-primary">
          Este alcance no tiene preguntas abiertas
        </p>
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          El sentimiento se lee de lo que la gente escribe. Sin preguntas abiertas en la sección
          seleccionada no hay nada que interpretar.
        </p>
      </section>
    );
  }

  const topics = sentiment.topics.slice(0, TOPICS);

  return (
    <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border/50 bg-surface">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border/50 bg-muted/40 px-5 py-3.5">
        <MessageSquareQuote className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={2.2} />
        <h2 className="text-[13px] font-bold text-text-primary">Voz de los colaboradores</h2>
        <span className="text-[11px] text-muted-foreground">
          {formatCount(sentiment.total)} comentarios en el alcance
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenComments}
          className="ml-auto h-7 gap-1.5 px-2 text-[11.5px] font-semibold text-muted-foreground hover:text-primary"
        >
          Ver los comentarios
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </header>

      <div className="flex flex-col gap-4 px-5 py-4">
        {/* The split, stated once, in the strip the Comentarios view puts above
            its outline. Everything below is a cut of it. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5">
          <span className="mr-1 text-[12px] font-semibold leading-none text-text-secondary">
            Distribución de sentimiento
          </span>
          <div className="ml-auto flex flex-wrap items-center justify-end gap-x-1 gap-y-1.5">
            {SENTIMENT_ORDER.map((id) => (
              <SentimentStat
                key={id}
                id={id}
                count={sentiment.counts[id]}
                total={sentiment.total}
              />
            ))}
          </div>
        </div>

        {topics.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {/* Icon, label, and the figure the list is ranked by — the heading
                row of the brechas block, so the two ranked tables on the page
                are introduced the same way. */}
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
              <h3 className="text-[11.5px] font-bold text-text-secondary">
                Temas que concentran lo negativo
              </h3>
              <span
                className="text-[11px] font-bold tabular-nums"
                style={{ color: SENTIMENT_STYLES.negative.color }}
              >
                {Math.round(share(sentiment.counts.negative, sentiment.total))}%
              </span>
            </div>

            {/*
              Column for column, the table the brechas block uses: rank, the
              thing being ranked, then one right-aligned column per figure. The
              three readings were a single merged cell before — which meant the
              only two ranked tables on the page were laid out two different
              ways.
            */}
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/10">
                <tr className="border-b border-border/30 text-[11px] font-semibold text-muted-foreground">
                  <th className="w-10 px-4 py-2.5 text-center font-semibold">#</th>
                  <th className="py-2.5 font-semibold">Tema</th>
                  {(["positive", "neutral"] as const).map((id) => (
                    <th key={id} className="w-[100px] py-2.5 text-right font-semibold">
                      {SENTIMENT_STYLES[id].label}
                    </th>
                  ))}
                  <th className="w-[100px] py-2.5 text-right font-semibold">Coment.</th>
                  <th className="w-[100px] py-2.5 pr-4 text-right font-semibold">Negativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/25">
                {topics.map((topic, index) => (
                  <tr key={topic.topic} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-center text-[11px] font-extrabold tabular-nums text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="py-3 pr-4 text-[12.5px] font-semibold leading-snug text-text-primary">
                      {topic.topic}
                    </td>
                    {(["positive", "neutral"] as const).map((id) => (
                      <td
                        key={id}
                        className="py-3 text-right text-[11.5px] font-semibold tabular-nums text-text-primary"
                      >
                        <span className="inline-flex items-center justify-end gap-1.5">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: SENTIMENT_STYLES[id].color }}
                          />
                          {Math.round(share(topic[id], topic.total))}%
                        </span>
                      </td>
                    ))}
                    <td className="py-3 text-right text-[11.5px] tabular-nums text-text-secondary">
                      {formatCount(topic.total)}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <SentimentShareChip value={share(topic.negative, topic.total)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-1.5">
            <Quote className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2.2} />
            <h3 className="text-[11.5px] font-bold text-text-secondary">
              Comentario del tema más crítico
            </h3>
          </div>
          <VerbatimCard comment={sentiment.worstQuote} kind="negative" />
        </div>
      </div>
    </section>
  );
}

/**
 * The negative share as a chip, in the scale's own colours.
 *
 * The figure a table is ranked by closes its row as a chip — that is how the
 * brechas table states the average it ranks groups on, and it is what puts the
 * two tables on the same row rhythm rather than one reading tighter than the
 * other.
 */
function SentimentShareChip({ value }: { value: number }) {
  const style = SENTIMENT_STYLES.negative;

  return (
    <span
      className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums"
      style={{
        backgroundColor: style.background,
        borderColor: style.color,
        color: style.foreground,
      }}
    >
      {Math.round(value)}%
    </span>
  );
}

/** One reading of the split: dot, label, share, comments behind it. */
function SentimentStat({
  id,
  count,
  total,
}: {
  id: Sentiment;
  count: number;
  total: number;
}) {
  const style = SENTIMENT_STYLES[id];

  return (
    <span className="flex items-center gap-1.5 px-2 py-1 leading-none">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: style.color }} />
      <span className="text-[11.5px] font-medium text-text-secondary">{style.label}</span>
      <span className="text-[13px] font-bold tabular-nums text-text-primary">
        {Math.round(share(count, total))}%
      </span>
      <span className="text-[11px] tabular-nums text-muted-foreground">
        {formatCount(count)} {count === 1 ? "comentario" : "comentarios"}
      </span>
    </span>
  );
}

/**
 * One real answer, quoted.
 *
 * It is the only thing on the page nobody has to interpret, which is exactly why
 * it goes last: the numbers earn the reader's attention, the sentence tells them
 * what it feels like.
 *
 * Rendered as the row it is in the Comentarios view — quote at reading weight,
 * meta line under it, the theme as a pill — rather than as a tinted block. A
 * full-bleed red card shouted the sentiment the reader had already read three
 * times above it, and buried the sentence it was there to carry.
 */
function VerbatimCard({
  comment,
  kind,
}: {
  comment: OpenComment | null;
  kind: "negative" | "positive";
}) {
  const style = SENTIMENT_STYLES[kind];

  if (!comment) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3.5 text-[11.5px] text-muted-foreground">
        Sin un comentario {style.plural} destacable en este alcance.
      </div>
    );
  }

  return (
    <figure className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-3.5">
      <blockquote className="text-[12.5px] leading-relaxed text-text-primary">
        “{comment.text}”
      </blockquote>
      <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          {comment.anonymous && <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2.2} />}
          <span className="font-medium text-text-secondary">
            {comment.anonymous ? "Respuesta anónima" : comment.respondentName}
          </span>
        </span>
        <span>
          {comment.sectionNumbering} {comment.sectionTitle}
        </span>
        <span className="rounded-full bg-muted/60 px-1.5 py-px font-medium text-text-secondary">
          {comment.topic}
        </span>
        {/* The reading, in the same words and the same colour the Comentarios
            view labels it with — a dot and a name, not a painted card. */}
        <span
          className="ml-auto inline-flex items-center gap-1 font-semibold"
          style={{ color: style.foreground }}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: style.color }}
          />
          {style.label}
        </span>
      </figcaption>
    </figure>
  );
}
