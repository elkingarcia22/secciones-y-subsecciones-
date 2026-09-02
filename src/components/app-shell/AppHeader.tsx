import * as React from "react";
import {
  Bell,
  ChevronRight,
  HelpCircle,
  LogOut,
  Moon,
  PanelLeft,
  Plug,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { SHELL_MENU_PANEL } from "./shellPanel";
import { AI_GRADIENT, CURRENT_USER, NEWS_ITEMS, NOTIFICATIONS } from "./appShellData";
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

/**
 * Radix's own `--radix-popover-content-transform-origin` only approximates a
 * corner from side+align — close enough for a plain fade, but the reveal
 * needs to visibly open from the trigger itself. This measures the button's
 * actual center relative to the content box and exposes it as the
 * `--reveal-x`/`--reveal-y` custom properties the `liquid` clip-path
 * keyframes read, so the mask opens from exactly where the button sits
 * instead of an approximated corner.
 *
 * Measuring can't hang off the `open` boolean alone: Radix mounts
 * `PopoverContent` one render after `open` flips true, so a layout effect
 * keyed on `open` fires while the content ref is still null. A callback ref
 * fires the instant the node is actually attached instead — but even then,
 * Radix's own floating-ui positioning hasn't run yet, so a same-tick read
 * still gets the content at its pre-position (0,0) rect. Deferring the read
 * with `setTimeout(…, 0)` pushes it past that positioning pass; the mask
 * starts fully transparent (see `shell-reveal-in`'s `0%` keyframe) so the
 * one-tick gap between mount and measurement is never visible.
 */
function useLiquidOrigin() {
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  const measure = React.useCallback((content: HTMLDivElement) => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const x = triggerRect.left + triggerRect.width / 2 - contentRect.left;
    const y = triggerRect.top + triggerRect.height / 2 - contentRect.top;
    setStyle({
      "--reveal-x": `${x}px`,
      "--reveal-y": `${y}px`,
      // The pop's scale() overshoot needs to grow from the same point the
      // clip-path mask opens from — otherwise the scale reads as centered on
      // the panel while the mask reads as centered on the button.
      transformOrigin: "var(--reveal-x, 100%) var(--reveal-y, 0%)",
    } as React.CSSProperties);
  }, []);

  const contentRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      // A microtask fires too early (before Radix's own floating-ui
      // positioning effect has placed the content), and requestAnimationFrame
      // is unreliable in backgrounded/automated tabs — a macrotask reliably
      // lands after both.
      if (node) setTimeout(() => measure(node), 0);
    },
    [measure]
  );

  return { triggerRef, contentRef, style };
}

interface AppHeaderProps {
  breadcrumb: ShellBreadcrumb;
  onToggleSidebar: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  /** @deprecated – Novedades is now self-contained in the header. Kept for backward compat. */
  onOpenNews: () => void;
  /** Receives the crumb-area host that screens portal their identity into. */
  onSlotRef: (element: HTMLDivElement | null) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  breadcrumb,
  onToggleSidebar,
  isDark,
  onToggleDark,
  onSlotRef,
}) => {
  const [avatarMenuOpen, setAvatarMenuOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [newsOpen, setNewsOpen] = React.useState(false);

  const newsOrigin = useLiquidOrigin();
  const notifOrigin = useLiquidOrigin();
  const avatarOrigin = useLiquidOrigin();

  // Primeras 2 notificaciones marcadas como "nuevas" en los datos de demo
  const unreadCount = 2;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 px-1">
      {/* ---------- Sidebar toggle ---------- */}
      <button
        onClick={onToggleSidebar}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/70 bg-surface text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
        title="Menú"
        aria-label="Menú"
      >
        <PanelLeft className="h-4 w-4" strokeWidth={2} />
      </button>

      {/* ---------- Breadcrumb ---------- */}
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

      {/* ---------- Right actions ---------- */}
      <div className="ml-auto flex shrink-0 items-center gap-3">

        {/* ---------- Novedades popover ---------- */}
        <Popover open={newsOpen} onOpenChange={setNewsOpen}>
          <PopoverTrigger asChild>
            <button
              ref={newsOrigin.triggerRef}
              className="rounded-md border border-border/70 bg-surface px-4 py-1.5 text-[13px] font-semibold text-text-primary transition-colors hover:bg-surface-muted"
            >
              Novedades
            </button>
          </PopoverTrigger>
          <PopoverContent
            ref={newsOrigin.contentRef}
            align="end"
            sideOffset={8}
            liquid
            style={newsOrigin.style}
            className="w-[360px] overflow-hidden rounded-2xl border border-border/60 p-0 shadow-drawer ring-0"
          >
            {/* Header con fondo de malla sutil */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60 bg-ai-mesh-agent">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: AI_GRADIENT }}
              >
                <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-text-primary leading-tight">Novedades</div>
                <div className="text-[11px] text-text-muted">Agosto 2026</div>
              </div>
              <span className="shrink-0 inline-flex h-5 items-center rounded-full bg-primary/10 px-2 text-[10px] font-extrabold text-primary">
                2 nuevas
              </span>
            </div>

            {/* Items con stagger */}
            <div className="flex flex-col gap-0.5 p-2">
              {NEWS_ITEMS.map((item, index) => (
                <button
                  key={item.title}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-background",
                    "opacity-0 translate-y-2",
                    newsOpen && "opacity-100 translate-y-0"
                  )}
                  style={{
                    transition: newsOpen
                      ? `opacity 280ms cubic-bezier(0.16,1,0.3,1) ${index * 50}ms, transform 280ms cubic-bezier(0.16,1,0.3,1) ${index * 50}ms`
                      : "none",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-text-primary">{item.title}</span>
                    {item.isNew && (
                      <span className="flex h-4 items-center rounded-full bg-primary/10 px-2 text-[10px] font-extrabold text-primary">
                        Nuevo
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs leading-snug text-text-secondary">{item.description}</p>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* ---------- Ayuda ---------- */}
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
              ref={notifOrigin.triggerRef}
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
            ref={notifOrigin.contentRef}
            align="end"
            sideOffset={8}
            liquid
            style={notifOrigin.style}
            className={cn("w-[340px] p-0 overflow-hidden", SHELL_MENU_PANEL)}
          >
            {/* Header */}
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
              ref={avatarOrigin.triggerRef}
              className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border/70 transition-transform hover:scale-105"
              title={CURRENT_USER.name}
              aria-label="Perfil"
            >
              <img src={CURRENT_USER.avatarUrl} alt={CURRENT_USER.name} className="h-full w-full object-cover" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            ref={avatarOrigin.contentRef}
            align="end"
            sideOffset={8}
            liquid
            style={avatarOrigin.style}
            className={cn("w-[230px] overflow-hidden", SHELL_MENU_PANEL)}
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
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
              )}
              style={{
                opacity: avatarMenuOpen ? 1 : 0,
                transform: avatarMenuOpen ? "translateY(0)" : "translateY(4px)",
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
