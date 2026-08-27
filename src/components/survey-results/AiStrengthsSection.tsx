import {
  AI_RANK_CELL,
  AI_ROW_STATIC,
  AI_TBODY,
  AI_THEAD,
  AI_THEAD_ROW,
  AI_TABLE,
  AI_TITLE_CELL,
  AiSectionCard,
  AiSectionMeta,
} from "./AiSectionCard";
import { FAVORABILITY_TARGET, POSITIVE, YELLOW, formatPercent } from "./favorabilityScale";
import { type Finding, confidenceFor } from "./summaryModel";

const formatCount = (value: number) => new Intl.NumberFormat("es-CO").format(value);

/**
 * Fortalezas para apalancar, in the analysis tab's own chrome.
 *
 * In Resumen this was three hero cards, each with a 130px circular gauge, a
 * trophy pill and a sentence of celebration. That treatment belongs to a
 * summary screen whose job is partly to reassure; the analysis tab's job is to
 * be read down, and a row of gauges cannot be compared the way a column of
 * figures can. So the same three findings arrive here as the tab's own table —
 * one row each, the score in the column the reader is already scanning.
 */
export function AiStrengthsSection({
  strengths,
  numbering,
}: {
  strengths: readonly Finding[];
  numbering: number;
}) {
  return (
    <AiSectionCard
      numbering={numbering}
      heading="Fortalezas para apalancar"
      question="en qué apoyarse para comunicar los cambios"
      meta={
        <AiSectionMeta count={strengths.length} unit="fortaleza" unitPlural="fortalezas" />
      }
    >
      {strengths.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          Ningún bloque de la medición alcanza todavía el rango de fortaleza.
        </p>
      ) : (
        <table className={AI_TABLE}>
          <thead className={AI_THEAD}>
            <tr className={AI_THEAD_ROW}>
              <th className="w-10 px-4 py-2.5 text-center">#</th>
              <th className="py-2.5">Fortaleza</th>
              <th className="hidden w-[110px] py-2.5 text-right sm:table-cell">Respuestas</th>
              <th className="w-[130px] py-2.5 pr-4 text-right">Favorabilidad</th>
            </tr>
          </thead>
          <tbody className={AI_TBODY}>
            {strengths.map((finding, index) => (
              <tr key={finding.id} className={AI_ROW_STATIC}>
                <td className={AI_RANK_CELL}>{index + 1}</td>

                <td className={AI_TITLE_CELL}>
                  {finding.title}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="truncate text-[11px] font-medium text-muted-foreground">
                      {index === 0 ? "El aspecto mejor evaluado de la medición" : finding.parent}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-secondary">
                      Confianza {confidenceFor(finding.n)}
                    </span>
                  </div>
                </td>

                <td className="hidden py-3 text-right text-[12px] tabular-nums text-text-secondary sm:table-cell">
                  {formatCount(finding.n)}
                </td>

                <td className="py-3 pr-4 text-right">
                  <StrengthChip favorability={finding.favorability} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AiSectionCard>
  );
}

/** The score as the tab's own band chip, in the favorability scale's colours. */
function StrengthChip({ favorability }: { favorability: number }) {
  const color = favorability >= FAVORABILITY_TARGET ? POSITIVE : YELLOW;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none tabular-nums"
      style={{ backgroundColor: `${color}14`, borderColor: `${color}59`, color }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {formatPercent(favorability)}
    </span>
  );
}
