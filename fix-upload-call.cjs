const fs = require('fs');
const file = 'src/components/survey-builder/ParticipantsEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('<UploadZone\n                  value={displayedFiles}', '<UploadZone\n                  isAI={true}\n                  value={displayedFiles}');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated ParticipantsEditor.tsx");
