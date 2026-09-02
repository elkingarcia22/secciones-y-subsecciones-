const fs = require('fs');
const file = 'src/components/survey-builder/AiSectionsComposer.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add editingId state
if (!content.includes('const [editingId, setEditingId] = React.useState<string | null>(null);')) {
  content = content.replace(
    'const [excludedIds, setExcludedIds] = React.useState<ReadonlySet<string>>(new Set());',
    'const [excludedIds, setExcludedIds] = React.useState<ReadonlySet<string>>(new Set());\n  const [editingId, setEditingId] = React.useState<string | null>(null);'
  );
}

// 2. Pass editingId to AiSectionsPreview
if (!content.includes('editingId={editingId}')) {
  content = content.replace(
    '<AiSectionsPreview',
    '<AiSectionsPreview\n              editingId={editingId}\n              onEditingIdChange={setEditingId}'
  );
}

// 3. Hide footer when editing
if (!content.includes('stage !== "generating" && !editingId &&')) {
  content = content.replace(
    '{stage !== "generating" && (',
    '{stage !== "generating" && !editingId && ('
  );
}

fs.writeFileSync(file, content);
