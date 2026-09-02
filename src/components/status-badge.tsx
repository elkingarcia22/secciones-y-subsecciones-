import { AnimatePresence, motion, type Variants } from "framer-motion";
import { CheckCircle, Circle, Loader, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusState = "pending" | "failed" | "success" | "draft";

export interface StatusBadgeProps {
  state?: StatusState;
  labels?: Partial<Record<StatusState, string>>;
  className?: string;
}

const DEFAULT_LABELS: Record<StatusState, string> = {
  pending: "Pending",
  failed: "Failed",
  success: "Success",
  draft: "Draft",
};

const STATE_CLASSES: Record<StatusState, { icon: string; bg: string; text: string }> = {
  pending: {
    icon: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100/50 dark:bg-amber-500/15 border-transparent",
    text: "text-amber-800 dark:text-amber-300",
  },
  failed: {
    icon: "text-red-600 dark:text-red-400",
    bg: "bg-red-100/50 dark:bg-red-500/15 border-transparent",
    text: "text-red-800 dark:text-red-300",
  },
  success: {
    icon: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100/50 dark:bg-emerald-500/15 border-transparent",
    text: "text-emerald-800 dark:text-emerald-300",
  },
  draft: {
    icon: "text-muted-foreground",
    bg: "bg-muted/50 border-transparent",
    text: "text-muted-foreground",
  },
};

const ICON_VARIANTS: Variants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
  exit: { scale: 0.5, opacity: 0, transition: { duration: 0.15 } },
};

function StateIcon({ state }: { state: StatusState }) {
  const cls = STATE_CLASSES[state].icon;
  if (state === "pending") {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className={cn("flex", cls)}
      >
        <Loader size={12} strokeWidth={2.5} />
      </motion.div>
    );
  }
  if (state === "failed")
    return <XCircle size={12} strokeWidth={2.5} className={cls} />;
  if (state === "draft")
    return <Circle size={12} strokeWidth={2.5} className={cls} />;
  return <CheckCircle size={12} strokeWidth={2.5} className={cls} />;
}

const MotionBadge = motion.create(Badge);

export function StatusBadge({
  state = "pending",
  labels,
  className,
}: StatusBadgeProps) {
  const label = { ...DEFAULT_LABELS, ...labels }[state];
  const cls = STATE_CLASSES[state];

  return (
    <MotionBadge
      variant="outline"
      layout="position"
      className={cn(
        "relative h-5 cursor-default overflow-hidden rounded-full",
        "gap-1.5 px-2 py-0.5",
        "text-[11px] font-semibold tracking-wide leading-none",
        "transition-colors duration-300",
        cls.bg,
        cls.text,
        className,
      )}
    >
      <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={state}
            variants={ICON_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute flex items-center"
          >
            <StateIcon state={state} />
          </motion.span>
        </AnimatePresence>
      </span>

      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 4 }}
          transition={{ duration: 0.2 }}
          className="flex leading-none"
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </MotionBadge>
  );
}
