const fs = require('fs');
const file = 'src/lib/cascadeAnimation.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('export const CASCADE_ITEM_DURATION = 0.4;', 'export const CASCADE_ITEM_DURATION = 0.25;');
content = content.replace('export const CASCADE_STAGGER = 0.08;', 'export const CASCADE_STAGGER = 0.04;');
content = content.replace('export const CASCADE_DELAY_CHILDREN = 0.05;', 'export const CASCADE_DELAY_CHILDREN = 0.02;');
content = content.replace('export const CASCADE_CONTENT_GAP = 0.05;', 'export const CASCADE_CONTENT_GAP = 0.02;');

// Update settle time to not wait for the FULL duration of the parent row
content = content.replace(
  'return baseDelay + CASCADE_DELAY_CHILDREN + index * CASCADE_STAGGER + CASCADE_ITEM_DURATION;',
  'return baseDelay + CASCADE_DELAY_CHILDREN + index * CASCADE_STAGGER + (CASCADE_ITEM_DURATION * 0.4);'
);

fs.writeFileSync(file, content);
