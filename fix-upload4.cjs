const fs = require('fs');
const file = 'src/components/upload/UploadZone.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "!isAI ? 'bg-surface hover:bg-background border-border' : 'bg-ai-mesh-card hover:bg-background border-border'",
  "!isAI ? 'bg-surface hover:bg-background border-border' : 'bg-ai-mesh-card border-border'"
);

fs.writeFileSync(file, content, 'utf8');
console.log("Updated UploadZone.tsx 5");
