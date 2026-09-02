const fs = require('fs');
const file = 'src/components/upload/UploadZone.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "!isAI ? 'bg-surface hover:bg-background border-border' : 'bg-ai-mesh-card border-border',",
  "!isAI ? 'bg-surface hover:bg-background border-border' : 'bg-transparent border-border',"
);

// Also remove bg-ai-mesh-card from the inner hover mask
content = content.replace('<div className="absolute inset-[1.5px] rounded-[inherit] bg-ai-mesh-card" />', '<div className="absolute inset-[1.5px] rounded-[inherit] bg-surface" />');

// And remove bg-ai-mesh-card from the active drag state just in case
content = content.replace(
  "isDragActive && isAI ? 'bg-ai-mesh-card border-ai-gradient border-transparent scale-[1.01] shadow-card' : ''",
  "isDragActive && isAI ? 'bg-surface border-ai-gradient border-transparent scale-[1.01] shadow-card' : ''"
);

fs.writeFileSync(file, content, 'utf8');
console.log("Updated UploadZone.tsx 6");
