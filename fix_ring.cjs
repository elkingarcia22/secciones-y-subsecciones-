const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/survey-analytics/pulseCharts.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

const functionStart = '/** A share of a whole (0–100), drawn as how much of the circle it fills. */';
const svgEnd = '</svg>\n  );\n}';

const startIdx = content.indexOf(functionStart);
const endIdx = content.indexOf(svgEnd, startIdx) + svgEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
  const newFunction = `/** A share of a whole (0–100), drawn as how much of the circle it fills. */
export function RingGauge({ value, ariaLabel, size = 56, strokeWidth = 6 }: { value: number; ariaLabel: string; size?: number; strokeWidth?: number }) {
  const share = Math.max(0, Math.min(100, value)) / 100;
  const radius = (size - strokeWidth) / 2;
  const length = 2 * Math.PI * radius;

  // Starts closed and eases open after mount — a transition on the offset,
  // since a keyframe cannot know where each ring should stop.
  const [drawn, setDrawn] = React.useState(false);
  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => setDrawn(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox={\`0 0 \${size} \${size}\`}
      role="img"
      aria-label={ariaLabel}
      className="-rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-muted dark:stroke-white/10"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={drawn ? length * (1 - share) : length}
        className="pulse-ring-draw"
      />
    </svg>
  );
}`;

  const oldString = content.substring(startIdx, endIdx);
  content = content.replace(oldString, newFunction);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Fixed RingGauge successfully');
} else {
  console.log('Could not find function bounds');
}
