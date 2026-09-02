const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/survey-results/ParticipationTab.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Find the end of the newly injected section
const endOfSection = '</section>}';
const sectionIndex = content.indexOf(endOfSection);
if (sectionIndex !== -1) {
  // We want to delete everything from `</section>}` to the next `/>` that was closing ResultsSummaryCard
  const nextPropsIndex = content.indexOf('/>', sectionIndex);
  if (nextPropsIndex !== -1) {
    const stringToRemove = content.substring(sectionIndex, nextPropsIndex + 2);
    content = content.replace(stringToRemove, '</section>');
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Fixed extraneous props');
  } else {
    console.log('Could not find the closing />');
  }
} else {
  console.log('Could not find </section>}');
}
