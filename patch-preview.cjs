const fs = require('fs');
const file = 'src/components/survey-builder/AiSectionsPreview.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update AiSectionsPreviewProps
if (!content.includes('editingId?: string | null;')) {
  content = content.replace(
    '  onRegenerate: () => void;\n}',
    '  onRegenerate: () => void;\n  editingId?: string | null;\n  onEditingIdChange?: (id: string | null) => void;\n}'
  );
}

// 2. Update AiSectionsPreview signature
if (!content.includes('editingId = null, onEditingIdChange')) {
  content = content.replace(
    'export function AiSectionsPreview({ proposal, excludedIds, onToggle, onRegenerate }: AiSectionsPreviewProps) {',
    'export function AiSectionsPreview({ proposal, excludedIds, onToggle, onRegenerate, editingId = null, onEditingIdChange }: AiSectionsPreviewProps) {'
  );
}

// 3. Pass to PreviewNode
content = content.replace(
  'onToggle={onToggle}\n          isParentExcluded={false}',
  'onToggle={onToggle}\n          isParentExcluded={false}\n          editingId={editingId}\n          onEditingIdChange={onEditingIdChange}'
);

// 4. Update PreviewNodeProps
if (!content.includes('editingId?: string | null;')) {
  content = content.replace(
    '  defaultOpen?: boolean;\n}',
    '  defaultOpen?: boolean;\n  editingId?: string | null;\n  onEditingIdChange?: (id: string | null) => void;\n}'
  );
}

// 5. Update PreviewNode signature
content = content.replace(
  'isParentExcluded,\n  defaultOpen = false,\n}: PreviewNodeProps) {',
  'isParentExcluded,\n  defaultOpen = false,\n  editingId = null,\n  onEditingIdChange,\n}: PreviewNodeProps) {'
);

// 6. Pass to QuestionRow
content = content.replace(
  'onExclude={onToggle} />',
  'onExclude={onToggle} editingId={editingId} onEditingIdChange={onEditingIdChange} />'
);

// 7. Pass to child PreviewNodes
content = content.replace(
  'onToggle={onToggle}\n                  isParentExcluded={isExcluded}',
  'onToggle={onToggle}\n                  isParentExcluded={isExcluded}\n                  editingId={editingId}\n                  onEditingIdChange={onEditingIdChange}'
);

// 8. Update QuestionRow props
content = content.replace(
  'function QuestionRow({ question, index, onExclude }: { question: SurveyQuestion; index: number; onExclude?: (id: string) => void }) {',
  'function QuestionRow({ question, index, onExclude, editingId, onEditingIdChange }: { question: SurveyQuestion; index: number; onExclude?: (id: string) => void; editingId?: string | null; onEditingIdChange?: (id: string | null) => void; }) {'
);

// 9. Update QuestionRow state
content = content.replace(
  'const [isEditorOpen, setEditorOpen] = React.useState(false);',
  'const isEditorOpen = editingId === question.id;\n  const setEditorOpen = (open: boolean) => onEditingIdChange?.(open ? question.id : null);'
);

fs.writeFileSync(file, content);
