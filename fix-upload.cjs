const fs = require('fs');
const file = 'src/components/upload/UploadZone.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add isAI to props
content = content.replace('className?: string', 'className?: string\n  /** Whether to use AI styling */\n  isAI?: boolean');

// Add isAI to destruction
content = content.replace('className,', 'className,\n  isAI,');

// Replace the classes
const targetClasses = `          'bg-muted/30 border-border hover:bg-muted/30 hover:border-primary/50',
          isDragActive && 'bg-primary/5 border-primary scale-[1.01] shadow-card',
          hasError && 'bg-destructive/5 border-destructive/50 hover:border-destructive',
          disabled && 'opacity-50 cursor-not-allowed grayscale-[0.5] hover:border-border hover:bg-muted/30'`;

const replacementClasses = `          !isAI ? 'bg-muted/30 border-border hover:bg-muted/30 hover:border-primary/50' : 'bg-ai-mesh-card border-border hover:border-ai-gradient-start/50',
          isDragActive && !isAI ? 'bg-primary/5 border-primary scale-[1.01] shadow-card' : '',
          isDragActive && isAI ? 'bg-ai-gradient-start/5 border-ai-gradient-start scale-[1.01] shadow-card' : '',
          hasError && 'bg-destructive/5 border-destructive/50 hover:border-destructive',
          disabled && 'opacity-50 cursor-not-allowed grayscale-[0.5] hover:border-border hover:bg-muted/30'`;

content = content.replace(targetClasses, replacementClasses);

fs.writeFileSync(file, content, 'utf8');
console.log("Updated UploadZone.tsx");
