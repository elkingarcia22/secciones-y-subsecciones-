const fs = require('fs');
const file = 'src/components/upload/UploadZone.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetClasses = `          !isAI ? 'bg-muted/30 border-border hover:bg-muted/30 hover:border-primary/50' : 'bg-ai-mesh-card border-border hover:border-ai-gradient-start/50',
          isDragActive && !isAI ? 'bg-primary/5 border-primary scale-[1.01] shadow-card' : '',
          isDragActive && isAI ? 'bg-ai-gradient-start/5 border-ai-gradient-start scale-[1.01] shadow-card' : '',`;

const replacementClasses = `          !isAI ? 'bg-muted/30 border-border hover:bg-muted/30 hover:border-primary/50' : 'bg-ai-mesh-card border-border hover:border-ai-gradient hover:border-transparent',
          isDragActive && !isAI ? 'bg-primary/5 border-primary scale-[1.01] shadow-card' : '',
          isDragActive && isAI ? 'bg-ai-mesh-card border-ai-gradient border-transparent scale-[1.01] shadow-card' : '',`;

content = content.replace(targetClasses, replacementClasses);

fs.writeFileSync(file, content, 'utf8');
console.log("Updated UploadZone.tsx again");
