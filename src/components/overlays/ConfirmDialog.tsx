import * as React from "react"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

export interface ConfirmDialogProps {
  /** Controlled open state */
  open?: boolean
  /** Event handler for open state changes */
  onOpenChange?: (open: boolean) => void
  /** The element that triggers the dialog */
  trigger?: React.ReactNode
  /** Main title of the confirmation */
  title: string
  /** Brief description or warning */
  description?: string
  /** Label for the confirmation button */
  confirmLabel?: string
  /** Label for the cancellation button */
  cancelLabel?: string
  /** Visual style variant */
  variant?: "default" | "warning" | "destructive"
  /** When set, the confirm button stays disabled until the reader types this
   * text back exactly — the extra friction a truly irreversible action (like
   * deleting a named record) needs, that a plain "¿Estás seguro?" doesn't. */
  confirmationText?: string
  /** Callback when confirmed */
  onConfirm?: () => void
  /** Callback when cancelled */
  onCancel?: () => void
  /** Whether the confirm action is loading */
  loading?: boolean
  /** Whether the dialog is disabled */
  disabled?: boolean
  /** Custom classes for the dialog content */
  className?: string
}

export function ConfirmDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "default",
  confirmationText,
  onConfirm,
  onCancel,
  loading = false,
  disabled = false,
  className,
}: ConfirmDialogProps) {
  // Map variant to button variant
  const actionVariant = variant === "destructive" ? "destructive" : "default"

  // For now, warning and default use the same button variant but could be extended

  const [typedConfirmation, setTypedConfirmation] = React.useState("")
  const confirmationInputRef = React.useRef<HTMLInputElement>(null)

  // The typed text is a one-time gate for this open — leaving it behind for
  // the next confirmation (of a different record, most of the time) would
  // either pre-arm an unrelated delete or block one that no longer applies.
  React.useEffect(() => {
    if (!open) setTypedConfirmation("")
  }, [open])

  const typedConfirmationMismatch = Boolean(confirmationText) && typedConfirmation !== confirmationText
  
  /**
   * PATRÓN UBITS: Cierre manual tras éxito
   * 
   * Debido al uso de e.preventDefault() en la acción de confirmación para soportar
   * procesos asíncronos (loading), el diálogo NO se cerrará automáticamente si el
   * componente se usa de forma controlada.
   * 
   * El consumidor debe establecer open={false} una vez que la operación
   * asíncrona haya finalizado exitosamente.
   */
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent
        className={className}
        aria-describedby={undefined}
        // Radix focuses the dialog surface itself on open, which wins over
        // the input's own `autoFocus` — so redirect that focus explicitly
        // when there's a confirmation field, straight to where typing starts.
        onOpenAutoFocus={
          confirmationText
            ? (event) => {
                event.preventDefault()
                confirmationInputRef.current?.focus()
              }
            : undefined
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle className={cn(
            variant === "destructive" && "text-destructive"
          )}>
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription>
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {confirmationText && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-dialog-typed-confirmation" className="text-sm text-muted-foreground">
              Escribe <span className="font-semibold text-foreground">{confirmationText}</span> para confirmar
            </label>
            <Input
              ref={confirmationInputRef}
              id="confirm-dialog-typed-confirmation"
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !typedConfirmationMismatch && !loading && !disabled) {
                  onConfirm?.()
                }
              }}
              // No placeholder: the label right above already spells out
              // the exact text, so echoing it here would read as if it were
              // already typed — indistinguishable from what the person is
              // about to enter themselves.
              autoComplete="off"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            disabled={loading || disabled}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={actionVariant}
            onClick={(e) => {
              if (onConfirm) {
                e.preventDefault()
                onConfirm()
              }
            }}
            disabled={loading || disabled || typedConfirmationMismatch}
            className="min-w-[100px]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {confirmLabel}
              </>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
