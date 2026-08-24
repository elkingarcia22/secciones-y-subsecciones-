/**
 * Visual formula block — the same fraction layout the heatmap "Total" legend
 * uses: numerator over denominator, then the operator chain ends in the result.
 * Colors inherit from the tooltip's own text color, so it works on both light
 * and dark tooltips.
 */
export function FormulaBlock({
  numerator,
  denominator,
  multiplier = 100,
  result,
}: {
  numerator: string;
  denominator: string;
  multiplier?: string | number;
  result: string;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
        Fórmula
      </span>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <div className="flex flex-col items-center text-center leading-tight">
          <span className="border-b border-current px-2 pb-0.5 leading-tight">{numerator}</span>
          <span className="px-2 pt-0.5 leading-tight opacity-80">{denominator}</span>
        </div>
        <span className="text-[13px] font-semibold">× {multiplier}</span>
        <span className="text-[13px] font-semibold">=</span>
        <span className="font-semibold">{result}</span>
      </div>
    </div>
  );
}