import * as React from "react";
import { motion } from "framer-motion";
import { ChevronRight, MessageSquareQuote, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  cascadeContainer,
  cascadeItem,
  cascadeItemSettleTime,
  CASCADE_CONTENT_GAP,
} from "@/lib/cascadeAnimation";
import {
  AI_RANK_CELL,
  AI_ROW,
  AI_TBODY,
  AI_THEAD,
  AI_THEAD_ROW,
  AI_TABLE,
  AI_TITLE_CELL,
  AiSectionCard,
  AiSectionMeta,
  type AiMetaDot,
} from "./AiSectionCard";
import {
  FAVORABILITY_TARGET,
  NEGATIVE,
  NSNR,
  YELLOW,
  formatPercent,
} from "./favorabilityScale";
import type { AlertTarget, Priority } from "./summaryModel";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

/**
 * Prioridades de esta medición, in the analysis tab's own chrome.
 *
 * In Resumen this block was a stack of tall rows, each with its own rank
 * medallion, badge cluster and prose column. That shape is the one the analysis
 * tab does not use, so moving it across unchanged would have made the tab read
 * as two documents. Here it is what every other block of the tab is: a table
 * whose rows open onto what they rest on — the score, the reason, and the
 * comments that confirm it — which is the same "claim, then its evidence"
 * reading the AI's own lecturas get one block above.
 */

const SEVERITY_STYLE = {
  critical: { label: "Crítica", color: NEGATIVE },
  high: { label: "Alta", color: YELLOW },
  watch: { label: "Seguimiento", color: NSNR },
} as const;

export function AiPrioritiesSection({
  priorities,
  numbering,
  onNavigate,
}: {
  priorities: readonly Priority[];
  numbering: number;
  onNavigate: (target: AlertTarget) => void;
}) {
  const dots = React.useMemo<readonly AiMetaDot[]>(() => {
    const tally = { critical: 0, high: 0, watch: 0 } as Record<Priority["severity"], number>;
    for (const priority of priorities) tally[priority.severity] += 1;
    return (["critical", "high", "watch"] as const).map((id) => ({
      id,
      color: SEVERITY_STYLE[id].color,
      count: tally[id],
      title: `${tally[id]} de prioridad ${SEVERITY_STYLE[id].label.toLowerCase()}`,
    }));
  }, [priorities]);

  // This card's own rows wait for the card itself to arrive in the tab's
  // shared cascade, not for every other card in the stack to finish.
  const revealDelay = cascadeItemSettleTime(0, numbering - 1) + CASCADE_CONTENT_GAP;

  return (
    <AiSectionCard
      numbering={numbering}
      heading="Prioridades de esta medición"
      question="qué atender primero, y con qué respaldo"
      meta={
        <AiSectionMeta
          count={priorities.length}
          unit="prioridad"
          unitPlural="prioridades"
          dots={dots}
        />
      }
    >
      {priorities.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Ningún bloque de la medición está por debajo del objetivo de {FAVORABILITY_TARGET}%.
          Sostener el resultado es la tarea de este periodo.
        </p>
      ) : (
        <table className={AI_TABLE}>
          <thead className={AI_THEAD}>
            <tr className={AI_THEAD_ROW}>
              <th className="w-10 px-4 py-2.5 text-center">#</th>
              <th className="py-2.5">Prioridad</th>
              <th className="hidden w-[110px] py-2.5 text-right sm:table-cell">Respuestas</th>
              <th className="w-[110px] py-2.5 text-right">Favorabilidad</th>
              <th className="w-[130px] py-2.5 pr-4 text-right">Severidad</th>
              <th className="w-10 py-2.5 pr-4" aria-label="Detalle" />
            </tr>
          </thead>
          <motion.tbody
            className={AI_TBODY}
            initial="hidden"
            animate="show"
            custom={revealDelay}
            variants={cascadeContainer}
          >
            {priorities.map((priority, index) => (
              <PriorityRows
                key={priority.finding.id}
                priority={priority}
                index={index + 1}
                onNavigate={onNavigate}
              />
            ))}
          </motion.tbody>
        </table>
      )}
    </AiSectionCard>
  );
}

/** One priority: its headline row, and what the ranking rests on when open. */
function PriorityRows({
  priority,
  index,
  onNavigate,
}: {
  priority: Priority;
  index: number;
  onNavigate: (target: AlertTarget) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const toggle = () => setOpen((current) => !current);

  const { finding, severity, confidence, why, qual } = priority;
  const style = SEVERITY_STYLE[severity];

  return (
    <>
      <motion.tr
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        variants={cascadeItem}
        className={cn(AI_ROW, open && "bg-primary/[0.03]")}
      >
        <td className={AI_RANK_CELL}>{index}</td>

        <td className={AI_TITLE_CELL}>
          {finding.title}
          <span className="mt-0.5 block truncate text-[11px] font-medium text-muted-foreground">
            {finding.parent}
          </span>
        </td>

        <td className="hidden py-3 text-right text-[12px] tabular-nums text-text-secondary sm:table-cell">
          {formatCount(finding.n)}
        </td>

        <td
          className="py-3 text-right text-[13px] font-bold tabular-nums"
          style={{ color: style.color }}
        >
          {formatPercent(finding.favorability)}
        </td>

        <td className="py-3 pr-4 text-right">
          <SeverityChip severity={severity} />
        </td>

        <td className="py-3 pr-4 text-right">
          <ChevronRight
            className={cn(
              "ml-auto h-4 w-4 text-muted-foreground/60 transition-transform duration-200 group-hover:text-text-primary",
              open && "rotate-90"
            )}
            strokeWidth={2}
          />
        </td>
      </motion.tr>

      {open && (
        <tr className="bg-muted/30">
          <td colSpan={6} className="px-4 py-4">
            <motion.div
              className="flex flex-col gap-3"
              initial="hidden"
              animate="show"
              variants={cascadeContainer}
            >
              <motion.p variants={cascadeItem} className="max-w-4xl text-[13px] leading-relaxed text-text-primary">
                {why}
              </motion.p>

              {/* The factors behind the ranking, quoted the way the AI's own
                  readings quote the figure they rest on. In Resumen these hid
                  behind a "¿por qué?" tooltip; the analysis tab shows a claim's
                  evidence in the open, so they do too. */}
              {priority.evidence.map((item) => (
                <motion.p
                  key={item.label}
                  variants={cascadeItem}
                  className="flex items-start gap-2 text-[11px] leading-relaxed text-text-secondary"
                >
                  <Quote className="mt-px h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={2} />
                  <span>
                    <span className="font-semibold uppercase tracking-wide text-muted-foreground">
                      {item.label}
                    </span>{" "}
                    <span className="font-medium tabular-nums">{item.detail}</span>
                  </span>
                </motion.p>
              ))}

              <motion.div
                variants={cascadeItem}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-0.5"
              >
                <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-secondary">
                  Confianza {confidence}
                </span>

                {qual && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border/70 bg-muted/30 px-2 py-0.5 text-[11px] font-medium tabular-nums text-text-secondary">
                    <MessageSquareQuote
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      strokeWidth={2}
                    />
                    {formatCount(qual.mentions)} comentarios sobre {qual.topic.toLowerCase()} ·{" "}
                    {Math.round(qual.negativeShare)}% negativos
                  </span>
                )}

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onNavigate("favorability");
                  }}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[12px] font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  Ver en Favorabilidad
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </motion.div>
            </motion.div>
          </td>
        </tr>
      )}
    </>
  );
}

/** The severity as the tab's own band chip — the shape confidence uses. */
function SeverityChip({ severity }: { severity: Priority["severity"] }) {
  const style = SEVERITY_STYLE[severity];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none"
      style={{
        backgroundColor: `${style.color}14`,
        borderColor: `${style.color}59`,
        color: style.color,
      }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.color }} />
      {style.label}
    </span>
  );
}
