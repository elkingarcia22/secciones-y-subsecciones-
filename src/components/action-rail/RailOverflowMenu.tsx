import * as React from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface RailOverflowItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
  /** Explains why the item is unavailable; when set, the row disables. */
  blockedReason?: string | null;
}

/**
 * The actions that did not fit on the bar, behind one "⋯".
 *
 * They keep the order they had in the full list rather than being re-sorted by
 * importance — a reader who knows an action sits after another finds it in the
 * same place whether it landed on the bar or in here. Labels are spelled out,
 * since the reason these ones folded away is that a sixth icon stops being
 * recognisable on sight.
 */
export function RailOverflowMenu({
  items,
  label = "Más acciones",
}: {
  items: readonly RailOverflowItem[];
  label?: string;
}) {
  const [open, setOpen] = React.useState(false);

  if (items.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={label}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95",
                open && "bg-white/10 text-white"
              )}
            >
              <MoreHorizontal className="h-[20px] w-[20px]" strokeWidth={2} />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>

      <PopoverContent
        align="end"
        side="top"
        sideOffset={16}
        className="w-[248px] rounded-2xl border-white/10 bg-surface-nav p-2 text-white/60 shadow-rail"
      >
        <PopoverTitle className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/45">
          {label}
        </PopoverTitle>
        {items.map((item) => {
          const disabled = item.blockedReason != null;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              aria-label={item.label}
              title={item.blockedReason ?? undefined}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                item.tone === "danger"
                  ? "hover:bg-status-negative/15 disabled:hover:bg-transparent"
                  : "hover:bg-white/5 disabled:hover:bg-transparent"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                  item.tone === "danger"
                    ? "bg-status-negative/10 text-status-negative"
                    : "bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white group-disabled:group-hover:bg-white/5"
                )}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  "text-[13px] font-semibold tracking-tight",
                  item.tone === "danger"
                    ? "text-status-negative"
                    : "text-white"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
