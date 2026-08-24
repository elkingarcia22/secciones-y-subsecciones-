import { ListChecks, MessageSquareQuote, UserRound } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** The three ways the Preguntas tab can be read. */
export type QuestionView = "breakdown" | "people" | "comments";

const VIEWS: readonly { id: QuestionView; label: string; icon: typeof ListChecks }[] = [
  { id: "breakdown", label: "Secciones", icon: ListChecks },
  { id: "people", label: "Por persona", icon: UserRound },
  { id: "comments", label: "Comentarios", icon: MessageSquareQuote },
];

interface QuestionViewSwitchProps {
  value: QuestionView;
  onChange: (value: QuestionView) => void;
}

/**
 * Secciones / Por persona / Comentarios, in the same shell the
 * Secciones–Heatmap switch uses. Three readings of the same responses:
 * the tally read down the survey's own outline, one person's sheet, and what
 * people wrote. The first is named for what it shows — the section tree — the
 * same way Favorabilidad and eNPS name theirs.
 */
export function QuestionViewSwitch({ value, onChange }: QuestionViewSwitchProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as QuestionView)}
      className="w-auto shrink-0"
    >
      <TabsList className="h-9 bg-muted/60 p-1">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="flex h-full items-center gap-2 rounded-md px-3 py-0 text-[13px] font-medium transition-all data-[state=active]:bg-surface data-[state=active]:text-brand data-[state=active]:shadow-sm text-muted-foreground hover:text-text-primary"
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
