const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/survey-results/ParticipationTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

if (!content.includes('@/components/ui/tooltip')) {
  content = content.replace(
    'import { Progress } from "@/components/ui/progress";',
    'import { Progress } from "@/components/ui/progress";\nimport { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";'
  );
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Added Tooltip imports');
} else {
  console.log('Tooltip already imported');
}
