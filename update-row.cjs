const fs = require('fs');
const file = 'src/components/survey-builder/AiSectionsPreview.tsx';
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf('/** One proposed question: its wording, and how it will be answered. */');
const endIdx = content.indexOf('/** Include/exclude tick. A square, because it decides membership, not a mode. */');

const newQuestionRow = `/** One proposed question: its wording, and how it will be answered. */
function QuestionRow({ question, index, onExclude }: { question: SurveyQuestion; index: number; onExclude?: (id: string) => void }) {
  const [isEditorOpen, setEditorOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [pendingLabel, setPendingLabel] = React.useState("");
  const [pendingProgress, setPendingProgress] = React.useState(0);
  const [draft, setDraft] = React.useState("");

  const caption =
    question.type === "scale" && question.scale.kind
      ? scaleTypeLabel(question.scale.kind)
      : questionTypeLabel(question.type);

  const closeEditor = () => {
    setEditorOpen(false);
    setDraft("");
  };

  const handleApplyEdit = () => {
    const instruction = draft.trim();
    if (instruction === "") return;
    
    closeEditor();
    setIsPending(true);
    setPendingLabel("Aplicando tu cambio...");
    setPendingProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setPendingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate AI loading state completion
    setTimeout(() => {
      clearInterval(interval);
      setIsPending(false);
    }, 2000);
  };

  const handleRegenerate = () => {
    setIsPending(true);
    setPendingLabel("Generando otra propuesta...");
    setPendingProgress(0);
    
    // Simulate progress
    const interval = setInterval(() => {
      setPendingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setIsPending(false);
    }, 2000);
  };

  return (
    <li className={cn(
      "group relative flex flex-col border-b border-border/40 py-2 transition-all last:border-b-0",
      isEditorOpen && "border-primary/40 rounded-xl bg-surface shadow-card my-1 border-b" // Added styling for open editor mode
    )}>
      <div className="flex items-start gap-2.5 px-1 py-1">
        <span className="mt-[3px] w-4 shrink-0 text-right text-[11px] font-bold tabular-nums text-text-muted">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-medium leading-snug text-text-primary">
            {question.statement}
          </span>
          <span className="mt-0.5 block text-[11px] font-semibold text-text-muted">{caption}</span>
        </div>
        
        {!isEditorOpen && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <CardAction
              label="Editar"
              onClick={() => setEditorOpen(true)}
              disabled={isPending}
            >
              <Pencil className="size-4" strokeWidth={2.2} />
            </CardAction>

            <CardAction
              label="Proponer otra versión"
              onClick={handleRegenerate}
              disabled={isPending}
            >
              <RefreshCw className="size-4" strokeWidth={2.2} />
            </CardAction>

            <CardAction 
              label="Eliminar" 
              onClick={() => onExclude && onExclude(question.id)} 
              disabled={isPending} 
              isDanger
            >
              <Trash2 className="size-4" strokeWidth={2.2} />
            </CardAction>
          </div>
        )}
      </div>

      {isEditorOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="flex flex-col gap-3 border-t border-border/60 bg-surface-muted/30 px-4 py-3.5 mt-2 rounded-b-xl">
            <label className="flex flex-col gap-2">
              <span className="text-[12.5px] font-bold text-text-primary">
                ¿Qué quieres cambiar de esta pregunta?
              </span>
              <textarea
                rows={2}
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    handleApplyEdit();
                  }
                  if (event.key === "Escape") closeEditor();
                }}
                placeholder="Ej. Haz que la pregunta sea más directa y cambie a escala Likert"
                className="w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
              />
            </label>

            <div className="flex flex-wrap gap-1.5">
              {["Hazla más formal", "Hazla más directa", "Lenguaje más sencillo", "Cámbiala a pregunta abierta"].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setDraft(chip)}
                  className="h-7 rounded-full border border-border/70 bg-surface px-3 text-[11.5px] font-semibold text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={closeEditor}
                className="h-9 rounded-xl border border-border bg-surface px-3.5 text-[12.5px] font-semibold text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyEdit}
                disabled={draft.trim() === ""}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-ai-gradient px-4 text-[12.5px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:hover:brightness-100"
              >
                <Sparkles className="size-3.5" strokeWidth={2.4} />
                Editar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {isPending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none absolute inset-0 z-10 flex rounded-2xl bg-ai-gradient p-px shadow-card mx-[-4px] my-[-4px]"
        >
          <div className="flex h-full w-full flex-col items-center justify-center gap-2.5 rounded-[calc(var(--radius-2xl)-1px)] bg-surface px-5 py-4">
            <div className="flex w-full max-w-[240px] items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-ai-gradient text-white">
                <Sparkles className="size-3.5" strokeWidth={2.4} />
              </span>
              <span className="truncate text-[12.5px] font-semibold text-text-primary">
                {pendingLabel}
              </span>
              <span className="ml-auto shrink-0 text-[11px] font-bold text-ai-gradient tabular-nums">
                {Math.round(pendingProgress)}%
              </span>
            </div>
            <div className="h-1.5 w-full max-w-[240px] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-ai-gradient transition-all duration-200"
                style={{ width: \`\${Math.max(4, Math.round(pendingProgress))}%\` }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </li>
  );
}

`;

content = content.substring(0, startIdx) + newQuestionRow + content.substring(endIdx);
fs.writeFileSync(file, content);
