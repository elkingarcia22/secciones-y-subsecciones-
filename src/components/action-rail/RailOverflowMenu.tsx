import * as React from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface RailOverflowSubItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export interface RailOverflowItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
  /** Explains why the item is unavailable; when set, the row disables. */
  blockedReason?: string | null;
  /** When set, the row opens onto these instead of running `onClick` —
   *  "Compartir" becomes "Compartir enlace" / "Descargar QR" rather than a
   *  single guess at what the user meant. */
  subItems?: readonly RailOverflowSubItem[];
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
  onOpenChange,
}: {
  items: readonly RailOverflowItem[];
  label?: string;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  if (items.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={label}
              className={cn(
                "dock-item relative flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
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
        {items.map((item, index) => {
          const disabled = item.blockedReason != null;
          const rowStagger = {
            transition: open
              ? `opacity 200ms cubic-bezier(0.16,1,0.3,1) ${index * 30}ms, transform 200ms cubic-bezier(0.16,1,0.3,1) ${index * 30}ms`
              : "none",
          };
          const rowContent = (
            <>
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
              {item.subItems && (
                <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-white/40" strokeWidth={2} />
              )}
            </>
          );
          const rowClassName = cn(
            "group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40",
            item.tone === "danger"
              ? "hover:bg-status-negative/15 disabled:hover:bg-transparent"
              : "hover:bg-white/5 disabled:hover:bg-transparent",
            // Stagger: subtle fade and slide
            "opacity-0 translate-y-1",
            open && "opacity-100 translate-y-0"
          );

          if (item.subItems) {
            return (
              <Popover key={item.id}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={item.label}
                    title={item.blockedReason ?? undefined}
                    className={rowClassName}
                    style={rowStagger}
                  >
                    {rowContent}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  side="right"
                  sideOffset={8}
                  collisionPadding={16}
                  className="w-[220px] rounded-2xl border-white/10 bg-surface-nav p-2 text-white/60 shadow-rail"
                >
                  {item.subItems.map((subItem) => (
                    <button
                      key={subItem.id}
                      type="button"
                      aria-label={subItem.label}
                      onClick={() => {
                        handleOpenChange(false);
                        subItem.onClick();
                      }}
                      className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/60 transition-colors group-hover:bg-white/10 group-hover:text-white">
                        {subItem.icon}
                      </span>
                      <span className="text-[13px] font-semibold tracking-tight text-white">
                        {subItem.label}
                      </span>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              aria-label={item.label}
              title={item.blockedReason ?? undefined}
              onClick={() => {
                handleOpenChange(false);
                item.onClick();
              }}
              className={rowClassName}
              style={rowStagger}
            >
              {rowContent}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
