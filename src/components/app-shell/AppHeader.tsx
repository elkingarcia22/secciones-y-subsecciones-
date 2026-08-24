import * as React from "react";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  LogOut,
  Moon,
  PanelLeft,
  Plug,
  Sun,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CURRENT_USER, NOTIFICATIONS } from "./appShellData";
import type { ShellBreadcrumb, ShellBreadcrumbBadge } from "./shellTypes";

/**
 * Status pill palettes. Sized against the breadcrumb next to it: the label is a
 * step below the crumb's own text so the pill reads as an attribute of the
 * title rather than competing with it.
 */
const BADGE_TONES: Record<ShellBreadcrumbBadge["tone"], string> = {
  positive: "bg-status-positive/10 text-status-positive",
  neutral: "bg-surface-muted text-text-secondary",
  warning: "bg-status-warning/10 text-status-warning",
};

interface AppHeaderProps {
  breadcrumb: ShellBreadcrumb;
  onToggleSidebar: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenNews: () => void;
  /** Receives the crumb-area host that screens portal their identity into. */
  onSlotRef: (element: HTMLDivElement | null) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  breadcrumb,
  onToggleSidebar,
  isDark,
  onToggleDark,
  onOpenNews,
  onSlotRef,
}) => {
  const [avatarMenuOpen, setAvatarMenuOpen] = React.useState(false);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 px-1">
      <button
        onClick={onToggleSidebar}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-border/70 bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
        title="Menú"
        aria-label="Menú"
      >
        <PanelLeft className="h-4 w-4" strokeWidth={2} />
      </button>

      <div className="flex min-w-0 items-center gap-1.5 text-sm">
        {breadcrumb.parent && (
          <>
            {breadcrumb.onParentClick ? (
              <button
                onClick={breadcrumb.onParentClick}
                className="truncate rounded font-medium text-text-muted transition-colors hover:text-text-primary hover:underline"
              >
                {breadcrumb.parent}
              </button>
            ) : (
              <span className="truncate font-medium text-text-muted">{breadcrumb.parent}</span>
            )}
            <ChevronRight className="h-3 w-3 shrink-0 text-text-muted" strokeWidth={2.5} />
          </>
        )}
        {breadcrumb.label && (
          <span className="truncate font-semibold text-text-primary">{breadcrumb.label}</span>
        )}
        {/* Where the mounted screen renders its own live identity. */}
        <div ref={onSlotRef} className="flex min-w-0 items-center gap-2" />
        {breadcrumb.badge && (
          <span
            className={cn(
              "ml-0.5 inline-flex h-[22px] shrink-0 items-center rounded-full px-2.5 text-[11px] font-bold leading-none",
              BADGE_TONES[breadcrumb.badge.tone]
            )}
          >
            {breadcrumb.badge.label}
          </span>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <button
          onClick={onOpenNews}
          className="rounded-[10px] border border-border/70 bg-surface px-4 py-1.5 text-[13px] font-semibold text-text-primary transition-colors hover:bg-surface-muted"
        >
          Novedades
        </button>

        <button
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          title="Ayuda"
          aria-label="Ayuda"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={2} />
        </button>

        {/* ---------- Notifications ---------- */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
              title="Notificaciones"
              aria-label="Notificaciones"
            >
              <Bell className="h-4 w-4" strokeWidth={2} />
              <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full border-[1.5px] border-surface bg-primary" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="max-h-[340px] w-[300px] overflow-y-auto rounded-2xl border-border/60 p-2 shadow-[var(--shadow-drawer)]"
          >
            <div className="flex flex-col gap-1">
              {NOTIFICATIONS.map((notification) => (
                <button
                  key={notification.title}
                  className="w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-background"
                >
                  <div className="text-[13px] font-bold text-text-primary">{notification.title}</div>
                  <div className="mt-1 text-xs leading-snug text-text-secondary">{notification.description}</div>
                  <div className="mt-1 text-xs text-text-muted">{notification.date}</div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* ---------- Avatar ---------- */}
        <Popover open={avatarMenuOpen} onOpenChange={setAvatarMenuOpen}>
          <PopoverTrigger asChild>
            <button
              className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border/70 transition-transform hover:scale-105"
              title={CURRENT_USER.name}
              aria-label="Perfil"
            >
              <img src={CURRENT_USER.avatarUrl} alt={CURRENT_USER.name} className="h-full w-full object-cover" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-[230px] rounded-2xl border-border/60 p-2 shadow-[var(--shadow-drawer)]"
          >
            <div className="-mx-2 mb-2 border-b border-border/60 px-5 pb-3 pt-1">
              <div className="text-sm font-bold text-text-primary">{CURRENT_USER.name}</div>
              <div className="mt-0.5 text-xs text-text-muted">{CURRENT_USER.email}</div>
              <span className="mt-2 inline-flex h-5 items-center rounded-full bg-surface-muted px-2.5 text-[11px] font-bold text-primary">
                {CURRENT_USER.role}
              </span>
            </div>
            <button
              onClick={() => setAvatarMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
            >
              <Users className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
              Ver como colaborador
            </button>
            <button
              onClick={() => setAvatarMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
            >
              <Plug className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
              Conectores
            </button>
            <div className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary">
              {isDark ? (
                <Moon className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
              ) : (
                <Sun className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
              )}
              <span className="flex-1">{isDark ? "Modo oscuro" : "Modo claro"}</span>
              <Switch checked={isDark} onCheckedChange={onToggleDark} aria-label="Cambiar tema" />
            </div>
            <button
              onClick={() => setAvatarMenuOpen(false)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" strokeWidth={2} />
              Cerrar sesión
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
};
