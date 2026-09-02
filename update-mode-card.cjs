const fs = require('fs');
const file = 'src/components/survey-builder/ParticipantsEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

const start = content.indexOf('function ModeCard(');
const end = content.indexOf('function AnalyzingState');

if (start !== -1 && end !== -1) {
  const newModeCard = `function ModeCard({
  mode,
  isActive,
  state,
  onSelect,
}: {
  mode: ParticipantMode;
  isActive: boolean;
  state: string;
  onSelect: () => void;
}) {
  const { icon: Icon, title, description } = PARTICIPANT_MODE_COPY[mode];
  const isAI = mode === "import";

  return (
    <MagicCard
      isSelected={isActive}
      variant={isAI ? "ai" : "primary"}
      onClick={onSelect}
      className={cn("w-full", isAI && isActive ? "p-[14px]" : "")}
      contentClassName="flex-col gap-3 h-full text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
            isActive && !isAI ? "bg-primary/10 text-primary" : "",
            !isActive && !isAI ? "bg-muted/60 text-muted-foreground" : "",
            isAI ? "bg-ai-bg text-primary" : ""
          )}
        >
          {isAI ? <Sparkles className="h-[18px] w-[18px]" strokeWidth={2} /> : <Icon className="h-[18px] w-[18px]" strokeWidth={2} />}
        </span>
        {isActive ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 fill-primary text-primary-foreground" strokeWidth={2} />
        ) : (
          <span aria-hidden className="h-5 w-5 shrink-0 rounded-full border border-border-strong/40" />
        )}
      </div>

      <div>
        <h3 className={cn("text-[13px] font-bold leading-none tracking-tight", isAI ? "text-ai-gradient-start" : isActive ? "text-text-primary" : "text-text-secondary")}>
          {isAI ? "Importar con IA" : title}
        </h3>
        <p className="mt-1.5 text-[11px] font-medium leading-[1.35] text-text-muted line-clamp-2">
          {description}
        </p>
      </div>

      <div className="mt-auto pt-1">
        <span className="inline-flex rounded-full bg-surface-muted px-2 py-0.5 text-[9.5px] font-bold tracking-tight text-text-secondary">
          {state}
        </span>
      </div>
    </MagicCard>
  );
}

`;
  
  // Find where `function AnalyzingState` is, maybe we need to find it differently because it's before ModeCard or after ModeCard. Let's see...
  
}
