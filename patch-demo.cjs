const fs = require('fs');
const file = 'src/components/survey-builder/DemographicsEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

// replace <button and </button> in AccordionSection
content = content.replace(
  '<button\n        type="button"\n        onClick={onToggle}',
  '<div\n        role="button"\n        tabIndex={0}\n        onKeyDown={(e) => {\n          if (e.key === "Enter" || e.key === " ") {\n            e.preventDefault();\n            onToggle();\n          }\n        }}\n        onClick={onToggle}'
);
content = content.replace(
  '        <ChevronRight\n          className={cn(\n            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",\n            isOpen && "rotate-90"\n          )}\n        />\n      </button>',
  '        <ChevronRight\n          className={cn(\n            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",\n            isOpen && "rotate-90"\n          )}\n        />\n      </div>'
);

fs.writeFileSync(file, content);
