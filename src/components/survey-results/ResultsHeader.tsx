import { ArrowLeft, CalendarRange, Download, Info, Lock, ShieldCheck, Users, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { PageHeader } from "@/components/utility";
import { SURVEY_KIND_LABELS, type SurveyDraft } from "@/components/survey-builder";
import { formatPreviewDate } from "@/components/survey-preview/previewModel";
import type { SurveyResults } from "@/mocks/surveyResults";

interface ResultsHeaderProps {
  draft: SurveyDraft;
  results: SurveyResults;
  onBack: () => void;
}

/**
 * Header of the results screen, on the app's own `PageHeader`.
 *
 * Same facts the reference shows — audience, window, privacy, status — but
 * tucked behind the secondary "Información" button instead of a bar under the
 * title. The anonymity threshold hides in there too: it is the rule that
 * explains every "Reservado" cell further down, and a reader who meets those
 * cells without ever having been told the rule concludes the report is broken.
 */
export function ResultsHeader({
  draft,
  results,
  onBack,
}: ResultsHeaderProps) {
  const start = formatPreviewDate(draft.startDate);
  const end = formatPreviewDate(draft.endDate);
  const isAnonymous = draft.visibility === "anonymous";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 px-3 pt-2 pb-1 relative z-10">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="Volver a la lista de encuestas"
          className="h-9 w-9 shrink-0 rounded-full bg-surface shadow-card hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="truncate text-base font-bold tracking-tight text-text-primary">
          {draft.name}
        </span>
        <span className="inline-flex shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-[12px] font-bold shadow-card bg-status-positive/10 text-status-positive">
          Finalizada
        </span>
      </div>

    </header>
  );
}

function MetaItem({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Users;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" strokeWidth={2} />
        {label}
      </dt>
      <dd className="whitespace-nowrap text-right text-[13px] font-semibold tabular-nums text-text-primary">{children}</dd>
    </div>
  );
}
