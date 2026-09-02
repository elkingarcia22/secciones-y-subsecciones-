const fs = require('fs');
const file = 'src/components/upload/UploadZone.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `{/* 1. Fondo luminoso interno en el hover */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
          style={isAI ? {
            opacity: isHovered ? 0.08 : 0,
            background: \`linear-gradient(135deg, hsl(var(--ai-gradient-start)), hsl(var(--ai-gradient-end)))\`,
            maskImage: \`radial-gradient(80px circle at \${position.x}px \${position.y}px, black 0%, transparent 100%)\`,
            WebkitMaskImage: \`radial-gradient(80px circle at \${position.x}px \${position.y}px, black 0%, transparent 100%)\`
          } : {
            opacity: isHovered ? 1 : 0,
            background: \`radial-gradient(80px circle at \${position.x}px \${position.y}px, hsl(var(--primary) / 0.05) 0%, transparent 100%)\`,
          }}
        />
        {/* 2. Borde luminoso en el hover */}
        {isAI ? (
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0,
              background: \`linear-gradient(135deg, hsl(var(--ai-gradient-start)), hsl(var(--ai-gradient-end)))\`,
              maskImage: \`radial-gradient(70px circle at \${position.x}px \${position.y}px, black 0%, transparent 100%)\`,
              WebkitMaskImage: \`radial-gradient(70px circle at \${position.x}px \${position.y}px, black 0%, transparent 100%)\`
            }}
          >
            <div className="absolute inset-[1.5px] rounded-[inherit] bg-ai-mesh-card" />
          </div>
        ) : (
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300"
            style={{
              opacity: isHovered ? 1 : 0,
              background: \`radial-gradient(70px circle at \${position.x}px \${position.y}px, hsl(var(--primary) / 0.9) 0%, transparent 100%)\`,
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              padding: "1.5px",
            }}
          />
        )}`;

const searchStart = '{/* 1. Fondo luminoso interno en el hover */}';
const searchEnd = '<div className="flex flex-col items-center text-center gap-3">';

const startIndex = content.indexOf(searchStart);
const endIndex = content.indexOf(searchEnd);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + replacement + "\n      " + content.substring(endIndex);
  fs.writeFileSync(file, content, 'utf8');
  console.log("Updated UploadZone.tsx 4");
} else {
  console.log("Not found in UploadZone");
}
