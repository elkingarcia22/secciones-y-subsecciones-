import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UbitsLogo } from "@/components/ui/UbitsLogo";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { AgentView } from "./AgentView";
import { ShellHeaderSlotProvider } from "./shellHeaderSlot";
import { ShellRailSlotProvider } from "./shellRailSlot";
import { AI_GRADIENT, NEWS_ITEMS } from "./appShellData";
import type { ShellBreadcrumb, ShellMode } from "./shellTypes";

interface AdminShellProps {
  breadcrumb: ShellBreadcrumb;
  /**
   * When true the content area scrolls (dashboard-style pages) and shows the
   * legal footer; app-like screens that manage their own scroll pass false.
   */
  scrollContent?: boolean;
  /** Fired when the user navigates back to Encuestas from the sidebar. */
  onNavigateHome?: () => void;
  children: React.ReactNode;
}


export const AdminShell: React.FC<AdminShellProps> = ({
  breadcrumb,
  scrollContent = true,
  onNavigateHome,
  children,
}) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mode, setMode] = React.useState<ShellMode>("workspace");
  const [isDark, setIsDark] = React.useState(() =>
    typeof document !== "undefined" ? document.documentElement.classList.contains("dark") : false
  );
  const [newsOpen, setNewsOpen] = React.useState(false);
  const [feedbackOpen, setFeedbackOpen] = React.useState(false);
  const [feedbackSent, setFeedbackSent] = React.useState(false);
  const [headerSlot, setHeaderSlot] = React.useState<HTMLDivElement | null>(null);
  const [railSlot, setRailSlot] = React.useState<HTMLDivElement | null>(null);
  // Pending auto-collapse: fires once, shortly after mount, so the sidebar
  // shows its labels first and then tucks itself away. Any manual toggle
  // before it fires cancels it — the user has already made the call.
  const autoCollapseTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  React.useEffect(() => {
    const AUTO_COLLAPSE_DELAY_MS = 2200;
    autoCollapseTimeoutRef.current = setTimeout(() => {
      setCollapsed(true);
      autoCollapseTimeoutRef.current = null;
    }, AUTO_COLLAPSE_DELAY_MS);
    return () => {
      if (autoCollapseTimeoutRef.current) clearTimeout(autoCollapseTimeoutRef.current);
    };
  }, []);

  const toggleSidebar = () => {
    if (autoCollapseTimeoutRef.current) {
      clearTimeout(autoCollapseTimeoutRef.current);
      autoCollapseTimeoutRef.current = null;
    }
    // Below lg the sidebar is a floating drawer instead of a collapsible rail.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setMobileOpen((open) => !open);
      return;
    }
    setCollapsed((value) => !value);
  };

  const isAgent = mode === "agent";
  const headerBreadcrumb: ShellBreadcrumb = isAgent ? { label: "Agente IA" } : breadcrumb;

  return (
    <div
      className={cn(
        "flex h-dvh w-full gap-2 overflow-hidden bg-background p-2 font-sans",
        isAgent && "bg-ai-mesh-agent"
      )}
    >
      <AppSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        mode={mode}
        onModeChange={setMode}
        onNavigateHome={onNavigateHome}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenFeedback={() => {
          setFeedbackSent(false);
          setFeedbackOpen(true);
        }}
      />

      {/* Mobile scrim behind the drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          breadcrumb={headerBreadcrumb}
          onToggleSidebar={toggleSidebar}
          isDark={isDark}
          onToggleDark={() => setIsDark((value) => !value)}
          onOpenNews={() => setNewsOpen(true)}
          onSlotRef={setHeaderSlot}
        />

        <main className="relative flex min-h-0 flex-1 flex-col">
          <ShellHeaderSlotProvider value={headerSlot}>
            <ShellRailSlotProvider value={railSlot}>
              {isAgent ? (
                <AgentView />
              ) : scrollContent ? (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {/* Full available width, on the same gutters the app-like
                      screens use — the sidebar already narrows the column, so a
                      max-width on top of it reads as an extra pair of margins.
                      Padding matches the header's own px-1 so the content
                      column lines up with the sidebar toggle above it. */}
                  <div className="w-full px-1 pb-6 pt-1">{children}</div>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
              )}
            </ShellRailSlotProvider>
          </ShellHeaderSlotProvider>

          {/* Floating-rail anchor: outside the scroller, so a screen's rail
              stays put while its content scrolls underneath. */}
          <div
            ref={setRailSlot}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-50 flex justify-center"
          />
        </main>

        {(scrollContent || isAgent) && (
          <footer className="flex shrink-0 flex-wrap items-center justify-center gap-2 px-4 py-2.5 text-xs text-text-muted">
            <UbitsLogo size={16} color="var(--color-text-muted)" className="hover:scale-100" />
            <span className="font-bold tracking-tight">UBITS</span>
            <span className="opacity-50">|</span>
            <button className="transition-colors hover:text-text-secondary hover:underline">
              Términos y condiciones de uso de la plataforma
            </button>
            <span className="opacity-50">|</span>
            <button className="transition-colors hover:text-text-secondary hover:underline">
              Política de privacidad
            </button>
          </footer>
        )}
      </div>

      {/* ---------- Novedades ---------- */}
      <Dialog open={newsOpen} onOpenChange={setNewsOpen}>
        <DialogContent className="max-w-md gap-0 overflow-hidden rounded-3xl border-border/60 p-0">
          <div className="relative px-6 py-5 text-white" style={{ background: AI_GRADIENT }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-white">Novedades en UBITS</DialogTitle>
                <DialogDescription className="text-xs text-white/80">
                  Lo último que agregamos a tu plataforma
                </DialogDescription>
              </div>
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-3">
            {NEWS_ITEMS.map((item) => (
              <button
                key={item.title}
                onClick={() => setNewsOpen(false)}
                className="w-full rounded-2xl px-3 py-3 text-left transition-colors hover:bg-background"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">{item.title}</span>
                  {item.isNew && (
                    <span className="flex h-4 items-center rounded-full bg-surface-muted px-2 text-[10px] font-extrabold text-primary">
                      Nuevo
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-snug text-text-secondary">{item.description}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------- Feedback ---------- */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-border/60">
          {feedbackSent ? (
            <div className="py-6 text-center">
              <DialogTitle className="text-base font-bold text-text-primary">¡Gracias por tu feedback!</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-text-secondary">
                Tu comentario nos ayuda a mejorar la plataforma.
              </DialogDescription>
            </div>
          ) : (
            <>
              <DialogTitle className="text-base font-bold text-text-primary">Enviar feedback</DialogTitle>
              <DialogDescription className="text-sm text-text-secondary">
                Cuéntanos qué podemos mejorar de tu experiencia.
              </DialogDescription>
              <textarea
                rows={4}
                placeholder="Escribe tu comentario…"
                className="w-full resize-none rounded-xl border border-border/70 bg-surface p-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-primary"
              />
              <button
                onClick={() => setFeedbackSent(true)}
                className={cn(
                  "w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-brand-hover)]"
                )}
              >
                Enviar
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
