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
import { SHELL_MENU_PANEL } from "./shellPanel";
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
  const [notifOpen, setNotifOpen] = React.useState(false);

  // Número de notificaciones "nuevas" (las primeras 2 en los datos de demo)
  const unreadCount = 2;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 px-1">
      <button
        onClick={onToggleSidebar}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
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
          className="rounded-md border border-border/70 bg-surface px-4 py-1.5 text-[13px] font-semibold text-text-primary transition-colors hover:bg-surface-muted"
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
        <Popover open={notifOpen} onOpenChange={setNotifOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary",
                notifOpen && "bg-surface-muted text-text-primary"
              )}
              title="Notificaciones"
              aria-label="Notificaciones"
            >
              <Bell className="h-4 w-4" strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full border-[1.5px] border-surface bg-primary" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className={cn("w-[340px] p-0 overflow-hidden", SHELL_MENU_PANEL)}
          >
            {/* Header del panel */}
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <span className="text-[13px] font-bold text-text-primary">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="inline-flex h-5 items-center rounded-full bg-primary px-2 text-[11px] font-bold text-white">
                  {unreadCount} nuevas
                </span>
              )}
            </div>

            {/* Lista con stagger */}
            <div className="flex flex-col gap-0.5 overflow-y-auto p-2" style={{ maxHeight: "380px" }}>
              {NOTIFICATIONS.map((notification, index) => (
                <button
                  key={notification.title}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-background",
                    "opacity-0 translate-y-2",
                    notifOpen && "opacity-100 translate-y-0"
                  )}
                  style={{
                    transition: notifOpen
                      ? `opacity 280ms cubic-bezier(0.16,1,0.3,1) ${index * 45}ms, transform 280ms cubic-bezier(0.16,1,0.3,1) ${index * 45}ms`
                      : "none",
                  }}
                >
                  {/* Punto de no leído para las primeras */}
                  <div className="flex items-start gap-2.5">
                    {index < unreadCount && (
                      <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                    <div className={cn("min-w-0 flex-1", index >= unreadCount && "pl-[14px]")}>
                      <div className={cn(
                        "text-[13px] text-text-primary",
                        index < unreadCount ? "font-bold" : "font-semibold"
                      )}>
                        {notification.title}
                      </div>
                      <div className="mt-0.5 text-xs leading-snug text-text-secondary">{notification.description}</div>
                      <div className="mt-1 text-[11px] text-text-muted">{notification.date}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-border/60 px-4 py-2.5">
              <button className="text-[12px] font-semibold text-primary transition-colors hover:text-primary/80">
                Ver todas las notificaciones
              </button>
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
            className={cn("w-[230px]", SHELL_MENU_PANEL)}
          >
            <div className="-mx-2 mb-2 border-b border-border/60 px-5 pb-3 pt-1">
              <div className="text-sm font-bold text-text-primary">{CURRENT_USER.name}</div>
              <div className="mt-0.5 text-xs text-text-muted">{CURRENT_USER.email}</div>
              <span className="mt-2 inline-flex h-5 items-center rounded-full bg-surface-muted px-2.5 text-[11px] font-bold text-primary">
                {CURRENT_USER.role}
              </span>
            </div>
            {(
              [
                { icon: Users, label: "Ver como colaborador" },
                { icon: Plug, label: "Conectores" },
              ] as const
            ).map(({ icon: Icon, label }, index) => (
              <button
                key={label}
                onClick={() => setAvatarMenuOpen(false)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
                  "opacity-0 translate-y-1",
                  avatarMenuOpen && "opacity-100 translate-y-0"
                )}
                style={{
                  transition: avatarMenuOpen
                    ? `opacity 260ms cubic-bezier(0.16,1,0.3,1) ${index * 40}ms, transform 260ms cubic-bezier(0.16,1,0.3,1) ${index * 40}ms`
                    : "none",
                }}
              >
                <Icon className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
                {label}
              </button>
            ))}
            <div
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-text-secondary",
                "opacity-0 translate-y-1",
                avatarMenuOpen && "opacity-100 translate-y-0"
              )}
              style={{
                transition: avatarMenuOpen
                  ? `opacity 260ms cubic-bezier(0.16,1,0.3,1) 80ms, transform 260ms cubic-bezier(0.16,1,0.3,1) 80ms`
                  : "none",
              }}
            >
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
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10",
                "opacity-0 translate-y-1",
                avatarMenuOpen && "opacity-100 translate-y-0"
              )}
              style={{
                transition: avatarMenuOpen
                  ? `opacity 260ms cubic-bezier(0.16,1,0.3,1) 120ms, transform 260ms cubic-bezier(0.16,1,0.3,1) 120ms`
                  : "none",
              }}
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
