const fs = require('fs');
const file = 'src/components/survey-builder/DemographicsEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '          strokeWidth={2.5}\n        />\n      </button>',
  '          strokeWidth={2.5}\n        />\n      </div>'
);

fs.writeFileSync(file, content);
