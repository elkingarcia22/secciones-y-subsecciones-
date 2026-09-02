const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/survey-analytics/pulseCharts.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(
  /export function RingGauge\(\{ value, ariaLabel \}: \{ value: number; ariaLabel: string \}\) \{([\s\S]*?)(const share = Math.max[\s\S]*?)const RING_RADIUS = \(RING_SIZE - RING_STROKE\) \/ 2;\s*const RING_LENGTH = 2 \* Math\.PI \* RING_RADIUS;/,
  `export function RingGauge({ value, ariaLabel, size = 56, strokeWidth = 6 }: { value: number; ariaLabel: string; size?: number; strokeWidth?: number }) {\n$2`
);

content = content.replace(
  /const RING_SIZE = 56;\s*const RING_STROKE = 6;\s*const RING_RADIUS = \(RING_SIZE - RING_STROKE\) \/ 2;\s*const RING_LENGTH = 2 \* Math\.PI \* RING_RADIUS;\s*\/\*\* A share of a whole \(0–100\), drawn as how much of the circle it fills\. \*\/\s*export function RingGauge\(\{ value, ariaLabel, size = 56, strokeWidth = 6 \}: \{ value: number; ariaLabel: string; size\?: number; strokeWidth\?: number \}\) \{([\s\S]*?)const share =/,
  `/** A share of a whole (0–100), drawn as how much of the circle it fills. */\nexport function RingGauge({ value, ariaLabel, size = 56, strokeWidth = 6 }: { value: number; ariaLabel: string; size?: number; strokeWidth?: number }) {\n  const radius = (size - strokeWidth) / 2;\n  const length = 2 * Math.PI * radius;\n  const share =`
);

content = content.replace(
  /width=\{RING_SIZE\}\s+height=\{RING_SIZE\}\s+viewBox=\{`0 0 \$\{RING_SIZE\} \$\{RING_SIZE\}`\}/g,
  `width={size}\n      height={size}\n      viewBox={\`0 0 \${size} \${size}\`}`
);

content = content.replace(
  /cx=\{RING_SIZE \/ 2\}\s+cy=\{RING_SIZE \/ 2\}\s+r=\{RING_RADIUS\}\s+fill="none"\s+strokeWidth=\{RING_STROKE\}/g,
  `cx={size / 2}\n        cy={size / 2}\n        r={radius}\n        fill="none"\n        strokeWidth={strokeWidth}`
);

content = content.replace(
  /strokeDasharray=\{RING_LENGTH\}\s+strokeDashoffset=\{drawn \? RING_LENGTH \* \(1 - share\) : RING_LENGTH\}/g,
  `strokeDasharray={length}\n        strokeDashoffset={drawn ? length * (1 - share) : length}`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Patched RingGauge');
