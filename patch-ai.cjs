const fs = require('fs');
const file = 'src/components/survey-builder/aiSectionGenerator.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add subsubsectionCount to AiSectionsBrief
content = content.replace(
  'subsectionCount: number;\n  /** Questions per subsection. */',
  'subsectionCount: number;\n  /** Sub-subsections per subsection. */\n  subsubsectionCount: number;\n  /** Questions per subsection. */'
);

// 2. Add limits
content = content.replace(
  'subsectionCount: { min: 1, max: 6 },',
  'subsectionCount: { min: 1, max: 6 },\n  subsubsectionCount: { min: 0, max: 4 },'
);

// 3. Add to defaultBrief
content = content.replace(
  'subsectionCount: 1,\n    questionCount: 1,',
  'subsectionCount: 1,\n    subsubsectionCount: 0,\n    questionCount: 1,'
);

// 4. Update generateSections
content = content.replace(
  'function themeSection(theme: AiTheme, brief: AiSectionsBrief, seed: number): SurveySection {',
  'function themeSection(theme: AiTheme, brief: AiSectionsBrief, seed: number): SurveySection {'
);

// Wait, themeSection should be modified. Let's do it using replace carefully.
fs.writeFileSync(file, content);
