import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export type MultiSelectOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export type MultiSelectProps = {
  options: MultiSelectOption[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

export function MultiSelect({
  options,
  value = [],
  onValueChange,
  placeholder = "Seleccionar opciones",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados.",
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (optionValue: string) => {
    onValueChange?.(value.filter((val) => val !== optionValue))
  }

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      handleUnselect(optionValue)
    } else {
      onValueChange?.([...value, optionValue])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-auto min-h-10 w-full items-center justify-between rounded-md border border-border/70 bg-muted px-5 py-3 text-sm text-foreground font-medium transition-all hover:bg-muted/60 focus:ring-2 focus:ring-primary/20",
            className
          )}
        >
          <div className="flex flex-wrap gap-1.5">
            {value.length > 0 ? (
              value.map((val) => {
                const option = options.find((o) => o.value === val)
                return (
                  <Badge
                    key={val}
                    variant="secondary"
                    className="flex items-center gap-1.5 pr-1 pl-2.5 h-7 border-none bg-surface text-primary text-[11px] font-bold rounded-lg shadow-card"
                  >
                    {option?.label}
                    <div
                      role="button"
                      tabIndex={0}
                      className="ml-0.5 rounded-full outline-none hover:bg-primary/10 p-0.5 transition-colors"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleUnselect(val)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnselect(val)
                      }}
                    >
                      <X className="h-3 w-3 text-primary" />
                    </div>
                  </Badge>
                )
              })
            ) : (
              <span className="text-foreground/60 font-medium">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-40 text-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border border-border/60 shadow-drawer bg-surface mt-1 overflow-hidden">
        <Command className="bg-transparent">
          <div className="px-2 py-2 border-b border-border/60">
            <Input 
              placeholder={searchPlaceholder} 
              className="h-9 rounded-lg bg-surface-muted px-3 text-sm border-0 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <CommandList className="max-h-[280px] overflow-y-auto px-2 py-2 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
            <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={() => handleSelect(option.value)}
                  className="flex items-center px-4 py-3 rounded-xl cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-all mb-1 hover:bg-surface-subtle"
                >
                  <div className="flex items-center w-full gap-3">
                    <span className="flex-1 text-[13px] font-bold tracking-tight leading-none">{option.label}</span>
                    {value.includes(option.value) && (
                      <div className="bg-primary/10 p-1 rounded-full">
                        <Check className={cn("h-3 w-3 text-primary")} />
                      </div>
                    )}
                  </div>
                  {option.description && (
                    <span className="text-[11px] text-muted-foreground leading-tight mt-1 font-medium">
                      {option.description}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

