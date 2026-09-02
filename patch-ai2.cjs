const fs = require('fs');
const file = 'src/components/survey-builder/aiSectionGenerator.ts';
let content = fs.readFileSync(file, 'utf8');

const themeSectionSrc = `function themeSection(theme: AiTheme, brief: AiSectionsBrief, seed: number): SurveySection {
  return {
    id: newId("section"),
    title: theme.title,
    description: theme.description,
    questions: themeQuestions(theme, brief.questionCount, briefStyle(brief), seed),
    children: [],
  };
}`;

const themeSectionDst = `function themeSection(theme: AiTheme, brief: AiSectionsBrief, seed: number): SurveySection {
  const hasSubsubs = brief.subsubsectionCount > 0;
  
  const children = hasSubsubs 
    ? Array.from({ length: brief.subsubsectionCount }).map((_, i) => {
        const subTheme = rotate(theme.themes || AI_FOCUSES[0].themes, seed + i)[0] || theme;
        return {
          id: newId("section"),
          title: \`Sub-subsección \${i + 1} (\${theme.title})\`,
          description: \`Detalle de \${theme.title.toLowerCase()}\`,
          questions: themeQuestions(subTheme, brief.questionCount, briefStyle(brief), seed + i + 100),
          children: [],
          isAiGenerated: true
        };
      })
    : [];

  return {
    id: newId("section"),
    title: theme.title,
    description: theme.description,
    questions: hasSubsubs ? [] : themeQuestions(theme, brief.questionCount, briefStyle(brief), seed),
    children,
    isAiGenerated: true
  };
}`;

content = content.replace(themeSectionSrc, themeSectionDst);

// Add isAiGenerated to the root sections in generateSections
content = content.replace(
  'id: newId("section"),\n      title: focus.label,',
  'id: newId("section"),\n      title: focus.label,\n      isAiGenerated: true,'
);

// Add to scope="section" logic
content = content.replace(
  'sections: themes.map((theme, index) => themeSection(theme, brief, seed + index)),',
  'sections: themes.map((theme, index) => ({ ...themeSection(theme, brief, seed + index), isAiGenerated: true })),'
);

fs.writeFileSync(file, content);
