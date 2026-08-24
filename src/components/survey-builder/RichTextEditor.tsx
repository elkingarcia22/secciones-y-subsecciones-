import * as React from "react";
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  ariaLabel: string;
}

/** Selection-state commands `queryCommandState` can answer directly. */
const TOGGLE_COMMANDS = [
  "bold",
  "italic",
  "underline",
  "strikeThrough",
  "insertUnorderedList",
  "insertOrderedList",
] as const;
type ToggleCommand = (typeof TOGGLE_COMMANDS)[number];

function isHtmlEmpty(html: string): boolean {
  const trimmed = html.trim();
  return trimmed === "" || trimmed === "<br>";
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Minimal WYSIWYG editor over `contentEditable` + `execCommand`. No rich-text
 * library is installed in this project, and the fixed pages only need basic
 * formatting — this keeps the surface small instead of adding a dependency
 * for a handful of buttons.
 */
export function RichTextEditor({ value, onChange, placeholder, ariaLabel }: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null);
  // `null` until the first sync, so the initial value always reaches the DOM:
  // a contentEditable has no `value` attribute React could render it from, and
  // seeding this with `value` would make the sync below skip its first run —
  // leaving an editor that opens blank on a survey that already has content.
  const lastEmittedRef = React.useRef<string | null>(null);
  const [activeCommands, setActiveCommands] = React.useState<ReadonlySet<ToggleCommand>>(new Set());
  const [currentBlock, setCurrentBlock] = React.useState("");
  const [isEmpty, setIsEmpty] = React.useState(() => isHtmlEmpty(value));

  // Only pushes the prop into the DOM when it changed from outside — never
  // while the editor itself is the source, or every keystroke would reset
  // the caret back to the start of the field.
  React.useEffect(() => {
    const el = editorRef.current;
    if (!el || value === lastEmittedRef.current) return;
    el.innerHTML = value;
    lastEmittedRef.current = value;
    setIsEmpty(isHtmlEmpty(value));
  }, [value]);

  const emitChange = () => {
    const html = editorRef.current?.innerHTML ?? "";
    lastEmittedRef.current = html;
    setIsEmpty(isHtmlEmpty(html));
    onChange(html);
  };

  const refreshToolbarState = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current?.contains(selection.anchorNode)) return;

    const next = new Set<ToggleCommand>();
    TOGGLE_COMMANDS.forEach((command) => {
      if (document.queryCommandState(command)) next.add(command);
    });
    setActiveCommands(next);
    setCurrentBlock(document.queryCommandValue("formatBlock").toLowerCase());
  };

  React.useEffect(() => {
    document.addEventListener("selectionchange", refreshToolbarState);
    return () => document.removeEventListener("selectionchange", refreshToolbarState);
  }, []);

  const runCommand = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
    refreshToolbarState();
  };

  // formatBlock toggles: applying the same block twice returns to a plain
  // paragraph instead of stacking, so H1/quote/code behave like on/off marks.
  const toggleBlock = (tag: string) => {
    runCommand("formatBlock", currentBlock === tag.toLowerCase() ? "P" : tag);
  };

  const insertLink = () => {
    const url = window.prompt("URL del enlace");
    if (!url) return;
    runCommand("createLink", url);
  };

  const insertInlineCode = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    runCommand("insertHTML", `<code>${escapeHtml(selection.toString())}</code>`);
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-surface transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border/60 px-4 py-3.5">
        <ToolbarButton icon={Bold} label="Negrita" active={activeCommands.has("bold")} onClick={() => runCommand("bold")} />
        <ToolbarButton icon={Italic} label="Cursiva" active={activeCommands.has("italic")} onClick={() => runCommand("italic")} />
        <ToolbarButton icon={Underline} label="Subrayado" active={activeCommands.has("underline")} onClick={() => runCommand("underline")} />
        <ToolbarButton icon={Strikethrough} label="Tachado" active={activeCommands.has("strikeThrough")} onClick={() => runCommand("strikeThrough")} />

        <ToolbarSeparator />
        <ToolbarButton icon={Code} label="Código en línea" onClick={insertInlineCode} />

        <ToolbarSeparator />
        <ToolbarButton icon={Heading1} label="Encabezado" active={currentBlock === "h1"} onClick={() => toggleBlock("H1")} />

        <ToolbarSeparator />
        <ToolbarButton
          icon={List}
          label="Lista con viñetas"
          active={activeCommands.has("insertUnorderedList")}
          onClick={() => runCommand("insertUnorderedList")}
        />
        <ToolbarButton
          icon={ListOrdered}
          label="Lista numerada"
          active={activeCommands.has("insertOrderedList")}
          onClick={() => runCommand("insertOrderedList")}
        />
        <ToolbarButton icon={Quote} label="Cita" active={currentBlock === "blockquote"} onClick={() => toggleBlock("BLOCKQUOTE")} />

        <ToolbarSeparator />
        <ToolbarButton icon={Link2} label="Enlace" onClick={insertLink} />

        <ToolbarSeparator />
        <ToolbarButton icon={Code2} label="Bloque de código" active={currentBlock === "pre"} onClick={() => toggleBlock("PRE")} />

        <ToolbarSeparator />
        <ToolbarButton icon={Minus} label="Separador" onClick={() => runCommand("insertHorizontalRule")} />

        <ToolbarSeparator />
        <ToolbarButton icon={Undo2} label="Deshacer" onClick={() => runCommand("undo")} />
        <ToolbarButton icon={Redo2} label="Rehacer" onClick={() => runCommand("redo")} />
      </div>

      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={ariaLabel}
          onInput={emitChange}
          onBlur={emitChange}
          onFocus={refreshToolbarState}
          onKeyUp={refreshToolbarState}
          onMouseUp={refreshToolbarState}
          className="min-h-[280px] px-5 py-4 text-[13px] leading-relaxed text-text-primary outline-none [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_h1]:text-lg [&_h1]:font-bold [&_h1]:tracking-tight [&_hr]:my-3 [&_hr]:border-border [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:text-[12px] [&_ul]:list-disc [&_ul]:pl-5"
        />
        {isEmpty && (
          <p className="pointer-events-none absolute left-5 top-4 text-[13px] text-muted-foreground/70">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          // A mousedown here would move focus off the editor before the click
          // fires, collapsing the selection the command is meant to act on.
          onMouseDown={(event) => event.preventDefault()}
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            active && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.3} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

function ToolbarSeparator() {
  return <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border/70" />;
}
