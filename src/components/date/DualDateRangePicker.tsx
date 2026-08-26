import * as React from "react";
import { CalendarIcon, ArrowRight } from "lucide-react";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { isValidDate } from "./dateUtils";

export interface DualDateRangePickerProps {
  /** Start date value */
  startDate?: Date | null;
  /** End date value */
  endDate?: Date | null;
  /** Callback when dates change */
  onChange?: (range: { startDate: Date | undefined; endDate: Date | undefined }) => void;
  /** Label for start date */
  startLabel?: string;
  /** Label for end date */
  endLabel?: string;
  /** Start date placeholder */
  startPlaceholder?: string;
  /** End date placeholder */
  endPlaceholder?: string;
  /** Error message for start date */
  startError?: string;
  /** Error message for end date */
  endError?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Disabled state */
  disabled?: boolean;
  /** Locale (default: 'es') */
  locale?: string;
  /** Additional container classes */
  className?: string;
}

/**
 * Format date in Despegar/Avianca flight booking style: "Mié. 9 sep. 2026"
 */
function formatFlightDate(date: Date | null | undefined, locale: string = "es"): string {
  if (!date || !isValidDate(date)) return "";
  try {
    const weekday = date.toLocaleDateString(locale, { weekday: "short" });
    const day = date.getDate();
    const month = date.toLocaleDateString(locale, { month: "short" });
    const year = date.getFullYear();
    const capW = weekday.charAt(0).toUpperCase() + weekday.slice(1).replace(".", "");
    const capM = month.replace(".", "");
    return `${capW}. ${day} ${capM}. ${year}`;
  } catch {
    return date.toLocaleDateString();
  }
}

export const DualDateRangePicker = React.forwardRef<
  HTMLDivElement,
  DualDateRangePickerProps
>(({
  startDate,
  endDate,
  onChange,
  startLabel = "Fecha de inicio",
  endLabel = "Fecha de cierre",
  startPlaceholder = "Selecciona fecha",
  endPlaceholder = "Selecciona fecha",
  startError,
  endError,
  minDate,
  maxDate,
  disabled = false,
  locale = "es",
  className,
}, ref) => {
  const [open, setOpen] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState<"start" | "end">("start");
  const [tempFrom, setTempFrom] = React.useState<Date | undefined>(
    startDate && isValidDate(startDate) ? startDate : undefined
  );
  const [tempTo, setTempTo] = React.useState<Date | undefined>(
    endDate && isValidDate(endDate) ? endDate : undefined
  );
  const [hoverDate, setHoverDate] = React.useState<Date | undefined>(undefined);

  // Synchronize internal state with props when open changes or values change from outside
  React.useEffect(() => {
    if (startDate && isValidDate(startDate)) {
      setTempFrom(startDate);
    } else {
      setTempFrom(undefined);
    }
  }, [startDate]);

  React.useEffect(() => {
    if (endDate && isValidDate(endDate)) {
      setTempTo(endDate);
    } else {
      setTempTo(undefined);
    }
  }, [endDate]);

  const calendarLocale = locale.startsWith("es") ? es : undefined;

  const handleOpenStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setActiveStep("start");
    setOpen(true);
  };

  const handleOpenEnd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    setActiveStep("end");
    setOpen(true);
  };

  const handleDayClick = (day: Date) => {
    if (minDate && day < minDate) return;
    if (maxDate && day > maxDate) return;

    if (activeStep === "start") {
      setTempFrom(day);
      // If previously selected end date is before the new start date, clear it
      if (tempTo && day > tempTo) {
        setTempTo(undefined);
        onChange?.({ startDate: day, endDate: undefined });
      } else {
        onChange?.({ startDate: day, endDate: tempTo });
      }
      // Flight booking UX: automatically advance to the return/end date selection
      setActiveStep("end");
    } else {
      // activeStep === "end"
      if (!tempFrom) {
        setTempFrom(day);
        onChange?.({ startDate: day, endDate: undefined });
        setActiveStep("end");
      } else if (day < tempFrom) {
        // If clicked date is before start date, set it as new start date and stay in 'end' step
        setTempFrom(day);
        setTempTo(undefined);
        onChange?.({ startDate: day, endDate: undefined });
        setActiveStep("end");
      } else {
        // Valid end date >= start date
        setTempTo(day);
        onChange?.({ startDate: tempFrom, endDate: day });
      }
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempFrom(undefined);
    setTempTo(undefined);
    setHoverDate(undefined);
    setActiveStep("start");
    onChange?.({ startDate: undefined, endDate: undefined });
  };

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.({ startDate: tempFrom, endDate: tempTo });
    setOpen(false);
  };

  // Preview range during hover if selecting end date
  const displaySelectedRange: DateRange | undefined = React.useMemo(() => {
    if (tempFrom && tempTo) {
      return { from: tempFrom, to: tempTo };
    }
    if (tempFrom && !tempTo && activeStep === "end" && hoverDate && hoverDate >= tempFrom) {
      return { from: tempFrom, to: hoverDate };
    }
    if (tempFrom) {
      return { from: tempFrom, to: undefined };
    }
    return undefined;
  }, [tempFrom, tempTo, activeStep, hoverDate]);

  const hasStart = !!tempFrom;
  const hasEnd = !!tempTo;
  const canApply = hasStart;

  return (
    <div ref={ref} className={cn("flex flex-col gap-1.5 w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex flex-col gap-1.5 w-full">
            {/* Unified Input Container */}
            <div
              className={cn(
                "relative flex w-full rounded-xl border bg-surface transition-all",
                open ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-border hover:border-border-hover",
                (startError || endError) && !open && "border-destructive",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Animated active background pill (slides left to right) */}
              {open && (
                <div
                  className={cn(
                    "absolute top-1 bottom-1 w-[calc(50%-6px)] rounded-lg bg-primary/10 transition-transform duration-300 ease-out z-0",
                    activeStep === "start" ? "translate-x-1" : "translate-x-[calc(100%+8px)]"
                  )}
                />
              )}

              {/* Left Side: Fecha de Inicio */}
              <button
                type="button"
                onClick={handleOpenStart}
                disabled={disabled}
                aria-label={startLabel}
                className="relative z-10 flex flex-1 flex-col items-start justify-center gap-0.5 px-4 py-2.5 text-left outline-none rounded-l-xl"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{startLabel}</span>
                </div>
                <span className={cn("text-[14px] font-medium leading-tight", hasStart ? "text-text-primary" : "text-muted-foreground/50")}>
                  {hasStart ? formatFlightDate(tempFrom, locale) : startPlaceholder}
                </span>
              </button>

              {/* Vertical Divider */}
              <div className="relative z-10 w-px bg-border my-2" />

              {/* Right Side: Fecha de Cierre */}
              <button
                type="button"
                onClick={handleOpenEnd}
                disabled={disabled}
                aria-label={endLabel}
                className="relative z-10 flex flex-1 flex-col items-start justify-center gap-0.5 px-4 py-2.5 text-left outline-none rounded-r-xl"
              >
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{endLabel}</span>
                </div>
                <span className={cn("text-[14px] font-medium leading-tight", hasEnd ? "text-text-primary" : "text-muted-foreground/50")}>
                  {hasEnd ? formatFlightDate(tempTo, locale) : endPlaceholder}
                </span>
              </button>
            </div>
            
            {/* Error Messages */}
            {(startError || endError) && (
              <span className="text-[11.5px] text-destructive px-1">
                {startError || endError}
              </span>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-0 rounded-2xl border-border/80 bg-popover shadow-[0_12px_40px_rgb(0,0,0,0.18)] z-50 overflow-hidden"
          align="start"
          sideOffset={8}
          onPointerDownOutside={() => {
            // Keep selection when clicking outside
            onChange?.({ startDate: tempFrom, endDate: tempTo });
          }}
        >
          {/* Header step switcher tabs inside the popover */}
          <div className="flex items-center border-b border-border/50 bg-muted/20 px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
              <button
                type="button"
                onClick={() => setActiveStep("start")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer",
                  activeStep === "start"
                    ? "bg-surface text-primary shadow-xs ring-1 ring-border font-bold"
                    : "text-muted-foreground hover:text-text-primary hover:bg-surface/50"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Inicio:</span>
                <span className={cn(hasStart ? "text-text-primary" : "text-muted-foreground italic")}>
                  {hasStart ? formatFlightDate(tempFrom, locale) : "Sin definir"}
                </span>
              </button>

              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />

              <button
                type="button"
                onClick={() => setActiveStep("end")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer",
                  activeStep === "end"
                    ? "bg-surface text-primary shadow-xs ring-1 ring-border font-bold"
                    : "text-muted-foreground hover:text-text-primary hover:bg-surface/50"
                )}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>Cierre:</span>
                <span className={cn(hasEnd ? "text-text-primary" : "text-muted-foreground italic")}>
                  {hasEnd ? formatFlightDate(tempTo, locale) : "Sin definir"}
                </span>
              </button>
            </div>

            <div className="ml-auto text-[11px] font-medium text-muted-foreground">
              {activeStep === "start" ? "Selecciona fecha de inicio" : "Selecciona fecha de cierre"}
            </div>
          </div>

          {/* Dual Month Calendar */}
          <div
            className="p-3"
            onMouseLeave={() => setHoverDate(undefined)}
          >
            <Calendar
              mode="range"
              locale={calendarLocale}
              selected={displaySelectedRange}
              onSelect={(_, triggerDate) => {
                if (triggerDate) {
                  handleDayClick(triggerDate);
                }
              }}
              onDayClick={(day) => {
                handleDayClick(day);
              }}
              onDayMouseEnter={(day) => {
                if (activeStep === "end" && tempFrom && !tempTo) {
                  setHoverDate(day);
                }
              }}
              disabled={(date: any) => {
                if (minDate && date < minDate) return true;
                if (maxDate && date > maxDate) return true;
                return false;
              }}
              numberOfMonths={2}
            />
          </div>

          {/* Footer with Borrar and Aplicar buttons (Despegar / Avianca style) */}
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/15 px-5 py-3">
            <button
              type="button"
              onClick={handleClear}
              className="text-[13px] font-semibold text-text-secondary hover:text-text-primary transition-colors hover:underline focus-visible:outline-none cursor-pointer"
            >
              Borrar
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleApply}
                disabled={!canApply}
                className={cn(
                  "flex h-9 items-center justify-center rounded-full bg-primary px-5 text-[13px] font-bold text-white shadow-xs transition-all",
                  canApply
                    ? "hover:brightness-110 active:scale-95 cursor-pointer"
                    : "opacity-40 cursor-not-allowed"
                )}
              >
                Aplicar
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

DualDateRangePicker.displayName = "DualDateRangePicker";
