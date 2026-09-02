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

  const [transitionEnabled, setTransitionEnabled] = React.useState(false);
  const [renderedStep, setRenderedStep] = React.useState(activeStep);

  React.useEffect(() => {
    if (activeStep !== renderedStep) {
      // Step 1: Enable transition class
      setTransitionEnabled(true);
      
      // Step 2: Wait for React to render the transition class, then change the transform value
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setRenderedStep(activeStep);
          // Step 3: Remove transition class after animation finishes (500ms)
          setTimeout(() => {
            setTransitionEnabled(false);
          }, 550);
        });
      });
    }
  }, [activeStep, renderedStep]);

  return (
    <div ref={ref} className={cn("flex flex-col gap-1.5 w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="grid gap-4 sm:grid-cols-2 w-full">
            {/* Input Fecha de Inicio */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-text-primary">
                {startLabel}
              </span>
              <button
                type="button"
                onClick={handleOpenStart}
                disabled={disabled}
                aria-label={startLabel}
                className={cn(
                  "relative flex h-10 w-full items-center gap-2.5 rounded-lg border bg-surface px-3.5 text-left text-[13px] transition-all",
                  open && activeStep === "start"
                    ? "border-primary ring-2 ring-primary/20 bg-primary/[0.03] shadow-card"
                    : "border-border hover:border-primary/30",
                  startError && "border-destructive focus:border-destructive",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <CalendarIcon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    hasStart ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={2}
                />
                <span
                  className={cn(
                    "truncate font-medium text-[13px]",
                    hasStart ? "text-text-primary" : "text-muted-foreground/70"
                  )}
                >
                  {hasStart ? formatFlightDate(tempFrom, locale) : startPlaceholder}
                </span>

                {/* Subtle active indicator dot */}
                {open && activeStep === "start" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </button>
              {startError && (
                <span className="text-[12px] text-destructive">{startError}</span>
              )}
            </div>

            {/* Input Fecha de Cierre */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-text-primary">
                {endLabel}
              </span>
              <button
                type="button"
                onClick={handleOpenEnd}
                disabled={disabled}
                aria-label={endLabel}
                className={cn(
                  "relative flex h-10 w-full items-center gap-2.5 rounded-lg border bg-surface px-3.5 text-left text-[13px] transition-all",
                  open && activeStep === "end"
                    ? "border-primary ring-2 ring-primary/20 bg-primary/[0.03] shadow-card"
                    : "border-border hover:border-primary/30",
                  endError && "border-destructive focus:border-destructive",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <CalendarIcon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    hasEnd ? "text-primary" : "text-muted-foreground"
                  )}
                  strokeWidth={2}
                />
                <span
                  className={cn(
                    "truncate font-medium text-[13px]",
                    hasEnd ? "text-text-primary" : "text-muted-foreground/70"
                  )}
                >
                  {hasEnd ? formatFlightDate(tempTo, locale) : endPlaceholder}
                </span>

                {/* Subtle active indicator dot */}
                {open && activeStep === "end" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </button>
              {endError && (
                <span className="text-[12px] text-destructive">{endError}</span>
              )}
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-transparent border-none shadow-none z-50 data-open:animate-in data-open:fade-in data-open:slide-in-from-top-2 data-open:zoom-in-100 data-open:duration-200 data-open:[animation-timing-function:ease-out]"
          align="start"
          sideOffset={8}
          onPointerDownOutside={() => {
            // Keep selection when clicking outside
            onChange?.({ startDate: tempFrom, endDate: tempTo });
          }}
        >
          {/* Animated sliding container */}
          <div
            className={cn(
              "w-max rounded-2xl border border-border bg-popover shadow-[0_12px_40px_rgb(0,0,0,0.18)] overflow-hidden origin-top flex flex-col max-h-[var(--radix-popover-content-available-height)]",
              transitionEnabled && "transition-transform duration-500 ease-in-out"
            )}
            style={{
              transform: renderedStep === "start" ? "translateX(0)" : "translateX(calc(var(--radix-popover-trigger-width) - 100%))"
            }}
          >
            {/* Header step switcher tabs inside the popover */}
            <div className="flex items-center border-b border-border/60 bg-muted/30 px-4 py-2.5 shrink-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                <button
                  type="button"
                  onClick={() => setActiveStep("start")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer",
                    activeStep === "start"
                      ? "bg-surface text-primary shadow-card ring-1 ring-border font-bold"
                      : "text-muted-foreground hover:text-text-primary hover:bg-surface"
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
                      ? "bg-surface text-primary shadow-card ring-1 ring-border font-bold"
                      : "text-muted-foreground hover:text-text-primary hover:bg-surface"
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Cierre:</span>
                  <span className={cn(hasEnd ? "text-text-primary" : "text-muted-foreground italic")}>
                    {hasEnd ? formatFlightDate(tempTo, locale) : "Sin definir"}
                  </span>
                </button>
              </div>

              <div className="ml-auto text-[11px] font-medium text-muted-foreground pl-6 pr-2">
                {activeStep === "start" ? "Selecciona fecha de inicio" : (hasEnd ? "" : "Selecciona fecha de cierre")}
              </div>
            </div>

            {/* Dual Month Calendar */}
            <div
              className="p-3 overflow-y-auto min-h-0"
              style={{ paddingRight: "0.5rem" }}
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
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-5 py-3 shrink-0">
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
                  "flex h-9 items-center justify-center rounded-full bg-primary px-5 text-[13px] font-bold text-white shadow-card transition-all",
                  canApply
                    ? "hover:brightness-110 active:scale-95 cursor-pointer"
                    : "opacity-40 cursor-not-allowed"
                )}
              >
                Aplicar
              </button>
            </div>
          </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});

DualDateRangePicker.displayName = "DualDateRangePicker";
