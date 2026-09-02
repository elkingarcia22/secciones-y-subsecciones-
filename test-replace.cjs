const fs = require('fs');
const file = 'src/components/survey-builder/AiSectionsPreview.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add Tooltip imports
if (!content.includes('import { Tooltip, TooltipContent, TooltipTrigger }')) {
  content = content.replace(
    'import { ChevronDown, RefreshCw, Pencil, Trash2, Sparkles } from "lucide-react";',
    'import { ChevronDown, RefreshCw, Pencil, Trash2, Sparkles } from "lucide-react";\nimport { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";'
  );
}

// Extract CardAction from AiObjectiveReviewList and append it
const cardActionCode = `
function CardAction({
  label,
  onClick,
  disabled,
  isActive = false,
  isDanger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
  isDanger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-30",
            isDanger
              ? "text-text-muted hover:bg-status-negative/10 hover:text-status-negative"
              : "text-text-muted hover:bg-primary/5 hover:text-primary",
            isActive && "bg-primary/10 text-primary"
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  );
}
`;

if (!content.includes('function CardAction')) {
  content = content + '\n' + cardActionCode;
}

fs.writeFileSync(file, content);
