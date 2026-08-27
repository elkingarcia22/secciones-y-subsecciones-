import { Quote, ShieldCheck, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OpenComment, Sentiment } from "@/mocks/questionResponses";
import {
  AI_DETAIL_PANEL,
  AI_RANK_CELL,
  AI_ROW_STATIC,
  AI_TBODY,
  AI_THEAD,
  AI_THEAD_ROW,
  AI_TABLE,
  AI_TITLE_CELL,
  AiSectionCard,
  AiSectionMeta,
  AiSubHeading,
  type AiMetaDot,
} from "./AiSectionCard";
import { SENTIMENT_ORDER, SENTIMENT_STYLES } from "./sentimentScale";
import { type SentimentRollup, confidenceFor } from "./summaryModel";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

const share = (value: number, total: number) => (total === 0 ? 0 : (value / total) * 100);

/** Themes shown before the list stops being a shortlist. */
const TOPICS = 4;

/**
 * Voz de los colaboradores, in the analysis tab's own chrome.
 *
 * The block already reasoned the right way in Resumen — the split, then the
 * themes the negatives pile onto, then one real sentence — so what changes here
 * is only the chrome it wears: the tab's section card, its uppercase table
 * head, and the same muted panel its "Resumen general" strip sits on. The
 * distribution keeps the report's own sentiment colours, because a comment read
 * as negative has to be the same red wherever it is counted.
 */
export function AiVoiceSection({
  sentiment,
  numbering,
}: {
  sentiment: SentimentRollup;
  numbering: number;
}) {
  const dots: readonly AiMetaDot[] = SENTIMENT_ORDER.map((id) => ({
    id,
    color: SENTIMENT_STYLES[id].color,
    count: sentiment.counts[id],
    title: `${sentiment.counts[id]} ${SENTIMENT_STYLES[id].label.toLowerCase()}`,
  }));

  return (
    <AiSectionCard
      numbering={numbering}
      heading="Voz de los colaboradores"
      question="en qué palabras lo dijo la gente"
      meta={
        <AiSectionMeta
          count={sentiment.total}
          unit="comentario"
          unitPlural="comentarios"
          dots={dots}
        />
      }
    >
      {sentiment.total === 0 ? (
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Esta medición no recogió respuestas a preguntas abiertas, así que no hay sentimiento que
          interpretar.
        </p>
      ) : (
        <>
          {/* The split, stated once, on the ground the tab's own summary strip
              uses. Everything below is a cut of it. */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-wide leading-none text-muted-foreground/80">
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

          {sentiment.topics.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <AiSubHeading
                icon={TrendingDown}
                trailing={
                  <span
                    className="text-[11px] font-bold tabular-nums"
                    style={{ color: SENTIMENT_STYLES.negative.color }}
                  >
                    {Math.round(share(sentiment.counts.negative, sentiment.total))}%
                  </span>
                }
              >
                Temas que concentran lo negativo
              </AiSubHeading>

              <table className={AI_TABLE}>
                <thead className={AI_THEAD}>
                  <tr className={AI_THEAD_ROW}>
                    <th className="w-10 px-4 py-2.5 text-center">#</th>
                    <th className="py-2.5">Tema</th>
                    {(["positive", "neutral"] as const).map((id) => (
                      <th key={id} className="hidden w-[100px] py-2.5 text-right sm:table-cell">
                        {SENTIMENT_STYLES[id].label}
                      </th>
                    ))}
                    <th className="w-[100px] py-2.5 text-right">Coment.</th>
                    <th className="w-[100px] py-2.5 pr-4 text-right">Negativo</th>
                  </tr>
                </thead>
                <tbody className={AI_TBODY}>
                  {sentiment.topics.slice(0, TOPICS).map((topic, index) => (
                    <tr key={topic.topic} className={AI_ROW_STATIC}>
                      <td className={AI_RANK_CELL}>{index + 1}</td>
                      <td className={AI_TITLE_CELL}>
                        {topic.topic}
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-secondary">
                            Confianza {confidenceFor(topic.total)}
                          </span>
                        </div>
                      </td>
                      {(["positive", "neutral"] as const).map((id) => (
                        <td
                          key={id}
                          className="hidden py-3 text-right text-[12px] font-semibold tabular-nums text-text-primary sm:table-cell"
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
                      <td className="py-3 text-right text-[12px] tabular-nums text-text-secondary">
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
            <AiSubHeading icon={Quote}>Comentario del tema más crítico</AiSubHeading>
            <VerbatimCard comment={sentiment.worstQuote} kind="negative" />
          </div>
        </>
      )}
    </AiSectionCard>
  );
}

/** The negative share as a chip — the shape the tab's other bands use. */
function SentimentShareChip({ value }: { value: number }) {
  const style = SENTIMENT_STYLES.negative;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none tabular-nums"
      style={{
        backgroundColor: style.background,
        borderColor: style.color,
        color: style.foreground,
      }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.color }} />
      {Math.round(value)}%
    </span>
  );
}

/** One reading of the split: dot, label, share, comments behind it. */
function SentimentStat({ id, count, total }: { id: Sentiment; count: number; total: number }) {
  const style = SENTIMENT_STYLES[id];

  return (
    <span className="flex items-center gap-1.5 px-2 py-1 leading-none">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: style.color }} />
      <span className="text-[12px] font-medium text-text-secondary">{style.label}</span>
      <span className="text-[13px] font-bold tabular-nums text-text-primary">
        {Math.round(share(count, total))}%
      </span>
      <span className="text-[11px] tabular-nums text-muted-foreground">{formatCount(count)}</span>
    </span>
  );
}

/**
 * One real answer, quoted.
 *
 * It is the only thing in the tab nobody has to interpret, which is exactly why
 * it goes last: the numbers earn the reader's attention, the sentence tells them
 * what it feels like.
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
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-4 py-3.5 text-[12px] text-muted-foreground">
        Sin un comentario {style.plural} destacable en esta medición.
      </div>
    );
  }

  return (
    <figure className={cn(AI_DETAIL_PANEL, "flex flex-col gap-2")}>
      <blockquote className="text-[13px] leading-relaxed text-text-primary">
        “{comment.text}”
      </blockquote>
      <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          {comment.anonymous && <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2} />}
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
