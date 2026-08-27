import * as React from "react";
import {
  ChevronRight,
  GripVertical,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { canAddSubsection, countQuestions, isBranch, type SectionTreeEntry } from "./sectionTree";
import { depthLabel } from "./surveyBuilderTypes";

/** Horizontal indent per nesting level, in pixels. */
const INDENT_PER_LEVEL = 14;

interface SectionTreeItemProps {
  readOnly?: boolean;
  entry: SectionTreeEntry;
  isActive: boolean;
  isCollapsed: boolean;
  isDragging: boolean;
  /** True when a drop here would reorder this row's siblings. */
  isDropTarget: boolean;
  isRenaming: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onToggleCollapse: () => void;
  onStartRename: () => void;
  onRename: (title: string) => void;
  onCancelRename: () => void;
  onAddSubsection: () => void;
  onDelete: () => void;
  handleProps: React.HTMLAttributes<HTMLElement> & { draggable: true };
  dropTargetProps: React.HTMLAttributes<HTMLElement>;
}

/** One row of the sections tree. */
export function SectionTreeItem({
  readOnly,
  entry,
  isActive,
  isCollapsed,
  isDragging,
  isDropTarget,
  isRenaming,
  canDelete,
  onSelect,
  onToggleCollapse,
  onStartRename,
  onRename,
  onCancelRename,
  onAddSubsection,
  onDelete,
  handleProps,
  dropTargetProps,
}: SectionTreeItemProps) {
  const { section, depth, numbering } = entry;
  // Any section with children collapses, at any depth — not just roots.
  const canCollapse = isBranch(section);
  // Level 1 never holds questions of its own, so it always reports the whole
  // subtree. Deeper levels report only their own while expanded (their child
  // rows show the rest below); collapsed, they roll the subtree up too.
  const questionCount =
    depth === 1 || isCollapsed ? countQuestions([section]) : section.questions.length;

  return (
    <li
      {...dropTargetProps}
      style={{ paddingLeft: (depth - 1) * INDENT_PER_LEVEL }}
      className={cn(
        "relative rounded-xl transition-all",
        isDragging && "opacity-40",
        isDropTarget &&
          "before:absolute before:-top-px before:left-2 before:right-1 before:h-0.5 before:rounded-full before:bg-primary"
      )}
    >
      <div
        className={cn(
          "group/row flex items-center gap-0.5 rounded-xl py-1.5 pl-1 pr-1 transition-all",
          isActive ? "bg-primary/5" : "hover:bg-surface-muted"
        )}
      >
        {/* Every level reorders the same way: drag among siblings under the same parent. */}
        {readOnly ? (
          <span className="shrink-0 rounded-md p-0.5 text-muted-foreground/30 transition-colors">
            <span className="h-3.5 w-3.5 block" />
          </span>
        ) : (
          <span
            {...handleProps}
            aria-label={`Reordenar ${section.title}`}
            className="shrink-0 cursor-grab rounded-md p-0.5 text-muted-foreground/50 transition-colors hover:text-text-primary active:cursor-grabbing"
          >
            <GripVertical className="h-3.5 w-3.5" strokeWidth={2.5} />
          </span>
        )}

        {canCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? `Expandir ${section.title}` : `Contraer ${section.title}`}
            className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <ChevronRight
              className={cn("h-3.5 w-3.5 transition-transform duration-200", !isCollapsed && "rotate-90")}
              strokeWidth={2.5}
            />
          </button>
        ) : (
          // Reserves the same width as the chevron button so titles stay
          // aligned across rows — purely a spacer, no icon shown.
          <span className="h-3.5 w-[18px] shrink-0" aria-hidden="true" />
        )}

        {isRenaming && !readOnly ? (
          <RenameField initialValue={section.title} onCommit={onRename} onCancel={onCancelRename} />
        ) : (
          <button
            type="button"
            onClick={onSelect}
            onDoubleClick={readOnly ? undefined : onStartRename}
            title={`${numbering} · ${section.title}`}
            className="flex min-w-0 flex-1 cursor-text items-baseline gap-1.5 rounded-md py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <span
              className={cn(
                "shrink-0 text-[10px] font-semibold tabular-nums",
                isActive ? "text-primary/70" : "text-muted-foreground/60"
              )}
            >
              {numbering}
            </span>
            <span
              className={cn(
                "truncate text-[13px] tracking-tight transition-colors",
                isActive ? "font-semibold text-primary" : "font-medium text-text-primary"
              )}
            >
              {section.title}
            </span>
          </button>
        )}

        {!isRenaming && questionCount > 0 && (
          <span
            aria-label={`${questionCount} preguntas`}
            className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground"
          >
            {questionCount}
          </span>
        )}

      </div>
    </li>
  );
}

/**
 * Icon chip for a row's action menu. A plain inline icon reads as an
 * afterthought next to a full-width row of text; a small tinted square gives
 * every action equal visual weight and makes the destructive one legible at a
 * glance, not just by its red text.
 */
function MenuItemIcon({ icon: Icon, tone = "default" }: { icon: LucideIcon; tone?: "default" | "destructive" }) {
  return (
    <span
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
        tone === "destructive" ? "bg-status-negative/10 text-status-negative" : "bg-border/40 text-muted-foreground"
      )}
    >
      {/* size-3.5, not h-3.5 w-3.5: DropdownMenuItem's base styles force any
          svg lacking a "size-*" class to size-4, which would silently
          override plain height/width utilities here. */}
      <Icon className="size-3.5" strokeWidth={2} />
    </span>
  );
}

interface RenameFieldProps {
  initialValue: string;
  onCommit: (title: string) => void;
  onCancel: () => void;
}

/** Inline rename input: Enter commits, Escape cancels, blur commits. */
function RenameField({ initialValue, onCommit, onCancel }: RenameFieldProps) {
  const [value, setValue] = React.useState(initialValue);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Claim focus on the next frame, after any dropdown focus restoration settles.
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const commit = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      onCancel();
      return;
    }
    onCommit(trimmed);
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
      aria-label="Nuevo nombre de la sección"
      className="min-w-0 flex-1 rounded-md border border-primary/40 bg-surface px-1.5 py-0.5 text-[13px] font-medium tracking-tight text-text-primary outline-none ring-2 ring-primary/20"
    />
  );
}
