const fs = require('fs');
const file = 'src/components/survey-builder/SubsectionAccordion.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldBadge = `{section.isAiGenerated && (
                  <span className="flex items-center gap-1 rounded-full bg-ai-gradient-surface/10 border-ai-gradient-surface px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-ai-gradient-start">
                    <Sparkles className="h-2.5 w-2.5" />
                    Generado con IA
                  </span>
                )}`;

const newBadge = `{section.isAiGenerated && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ai-gradient-surface/10 text-ai-gradient-start cursor-default">
                        <Sparkles className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      Generado con IA
                    </TooltipContent>
                  </Tooltip>
                )}`;

content = content.replace(oldBadge, newBadge);
fs.writeFileSync(file, content);
