const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/survey-results/ParticipationTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const startStr = '</section>';
const endStr = '<div className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-surface p-6 shadow-card">';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const stringToRemove = content.substring(startIndex + startStr.length, endIndex);
  content = content.replace(stringToRemove, '\n');
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Fixed extraneous props completely');
} else {
  console.log('Could not find boundaries', { startIndex, endIndex });
}
