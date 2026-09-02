const fs = require('fs');
const file = 'src/components/upload/UploadZone.tsx';
let content = fs.readFileSync(file, 'utf8');

const stateStart = content.indexOf('const [isDragActive');
if (stateStart !== -1) {
  content = content.slice(0, stateStart) + 
    `  const [position, setPosition] = React.useState({ x: 0, y: 0 })\n` +
    `  const [isHovered, setIsHovered] = React.useState(false)\n` +
    `  const zoneRef = React.useRef<HTMLDivElement>(null)\n\n` +
    `  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {\n` +
    `    if (!zoneRef.current) return\n` +
    `    const rect = zoneRef.current.getBoundingClientRect()\n` +
    `    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })\n` +
    `  }\n\n` +
    content.slice(stateStart);
}

const renderStart = content.indexOf('<div\n        onDragEnter={handleDrag}');
if (renderStart !== -1) {
  const replacement = `<div\n        ref={zoneRef}\n        onMouseMove={handleMouseMove}\n        onMouseEnter={() => setIsHovered(true)}\n        onMouseLeave={() => setIsHovered(false)}\n        onDragEnter={handleDrag}`;
  content = content.replace('<div\n        onDragEnter={handleDrag}', replacement);
}

const classStart = content.indexOf(`          !isAI ? 'bg-muted/30 border-border`);
if (classStart !== -1) {
  const classReplacement = `          !isAI ? 'bg-surface hover:bg-background border-border' : 'bg-ai-mesh-card hover:bg-background border-border',\n          'overflow-hidden border',`;
  const classEnd = content.indexOf(')', classStart);
  content = content.substring(0, classStart) + classReplacement + "\n" + content.substring(content.indexOf('isDragActive && !isAI', classStart));
}

// We need to insert the gradient divs inside the UploadZone div, right after <input />
const inputEnd = content.indexOf('aria-hidden="true"\n        />') + 33;
if (inputEnd !== -1) {
  const gradients = `\n        {/* 1. Fondo luminoso interno en el hover */}\n` +
    `        <div\n` +
    `          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100" style={{ opacity: isHovered ? 1 : 0, background: \`radial-gradient(80px circle at \${position.x}px \${position.y}px, \${isAI ? 'hsl(var(--ai-gradient-start) / 0.08)' : 'hsl(var(--primary) / 0.05)'} 0%, transparent 100%)\` }}\n` +
    `        />\n` +
    `        {/* 2. Borde luminoso en el hover */}\n` +
    `        <div\n` +
    `          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 hover:opacity-100" style={{ opacity: isHovered ? 1 : 0, background: \`radial-gradient(70px circle at \${position.x}px \${position.y}px, \${isAI ? 'hsl(var(--ai-gradient-start) / 0.9)' : 'hsl(var(--primary) / 0.9)'} 0%, transparent 100%)\`, WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", padding: "1.5px" }}\n` +
    `        />\n`;
  content = content.substring(0, inputEnd) + gradients + content.substring(inputEnd);
}

fs.writeFileSync(file, content, 'utf8');
console.log("Updated UploadZone.tsx 3");
