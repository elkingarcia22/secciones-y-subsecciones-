import * as React from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AI_GRADIENT,
  CHAT_HISTORY,
  COMPANIES,
  COMPANY_MENU_LINKS,
  NAV_TREE,
  type Company,
  type NavChild,
  type NavRoot,
} from "./appShellData";
import { SHELL_MENU_PANEL } from "./shellPanel";
import type { ShellMode } from "./shellTypes";

const GoogleMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className={className}>
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

const CompanyMark: React.FC<{ company: Company; size?: "sm" | "md" }> = ({ company, size = "md" }) => (
  <span
    className={cn(
      "flex shrink-0 items-center justify-center overflow-hidden rounded-lg text-[11px] font-extrabold text-white",
      size === "md" ? "h-8 w-8" : "h-6 w-6",
      company.isGoogle && "ring-1 ring-inset ring-border/50"
    )}
    style={{ background: company.bg }}
  >
    {company.isGoogle ? <GoogleMark className={size === "md" ? "h-5 w-5" : "h-4 w-4"} /> : company.initial}
  </span>
);

interface DrillLevel {
  title: string;
  items: readonly { id: string; label: string }[];
}

/**
 * Whether the active node lives anywhere under this root item — itself, a
 * direct child, or a grandchild leaf. Collapsed, an accordion's children are
 * hidden, so this is what lets its own icon stand in for "you are somewhere
 * inside here" (e.g. the Desempeño icon lighting up while on Encuestas).
 */
function accordionHoldsCurrentNode(item: NavRoot, currentNodeId: string): boolean {
  if (item.id === currentNodeId) return true;
  return (item.children ?? []).some(
    (child) =>
      child.id === currentNodeId ||
      (child.children ?? []).some((leaf) => leaf.id === currentNodeId)
  );
}

interface AppSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  mode: ShellMode;
  onModeChange: (mode: ShellMode) => void;
  /** Fired when the user lands on "Encuestas" in the nav — returns the app home. */
  onNavigateHome?: () => void;
  /** Closes the mobile drawer after any selection. */
  onCloseMobile?: () => void;
  onOpenFeedback: () => void;
}

const numberFormat = new Intl.NumberFormat("es-CO");

export const AppSidebar: React.FC<AppSidebarProps> = ({
  collapsed,
  mobileOpen,
  mode,
  onModeChange,
  onNavigateHome,
  onCloseMobile,
  onOpenFeedback,
}) => {
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({ desempeno: true });
  const [currentNodeId, setCurrentNodeId] = React.useState("encuestas");
  const [drillStack, setDrillStack] = React.useState<readonly DrillLevel[]>([]);
  const [drillDirection, setDrillDirection] = React.useState<"forward" | "back">("forward");
  const [activeCompanyId, setActiveCompanyId] = React.useState("google");
  const [companyMenuOpen, setCompanyMenuOpen] = React.useState(false);
  const [adDismissed, setAdDismissed] = React.useState(false);
  const [activeChatIndex, setActiveChatIndex] = React.useState(0);

  const activeCompany = COMPANIES.find((company) => company.id === activeCompanyId) ?? COMPANIES[0];

  // Collapsing wipes the drill: the collapsed rail always shows the root icons.
  React.useEffect(() => {
    if (collapsed) setDrillStack([]);
  }, [collapsed]);

  const selectNode = (id: string) => {
    setCurrentNodeId(id);
    onCloseMobile?.();
    if (id === "encuestas") onNavigateHome?.();
  };

  const pushDrill = (item: NavChild) => {
    if (!item.children) return;
    setDrillDirection("forward");
    setDrillStack((stack) => [...stack, { title: item.label, items: item.children! }]);
  };

  const popDrill = () => {
    setDrillDirection("back");
    setDrillStack((stack) => stack.slice(0, -1));
  };

  const renderRootLeaf = (item: NavRoot) => {
    const isCurrent = currentNodeId === item.id;
    const row = (
      <button
        key={item.id}
        onClick={() => selectNode(item.id)}
        className={cn(
          "relative flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
          item.id === "inicio" && "font-semibold",
          isCurrent && "bg-surface-muted font-semibold text-primary hover:bg-surface-muted hover:text-primary",
          collapsed && "justify-center px-0"
        )}
      >
        <item.icon className={cn("h-4 w-4 shrink-0", isCurrent ? "text-primary" : "text-text-muted")} strokeWidth={2} />
        {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
        {!collapsed && item.badge && (
          <span
            className={cn(
              "flex h-4 shrink-0 items-center rounded-full px-2 text-[10px] font-extrabold tracking-wide",
              isCurrent ? "bg-primary text-white" : "bg-surface-muted text-primary"
            )}
          >
            {item.badge}
          </span>
        )}
        {collapsed && item.badge && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        )}
      </button>
    );
    if (!collapsed) return row;
    return (
      <Tooltip key={item.id} delayDuration={0}>
        <TooltipTrigger asChild>{row}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  const renderChildRow = (child: NavChild) => {
    const hasChildren = !!child.children;
    const isCurrent = currentNodeId === child.id;
    return (
      <button
        key={child.id}
        onClick={() => (hasChildren ? pushDrill(child) : selectNode(child.id))}
        className={cn(
          "relative flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
          isCurrent && "font-semibold text-primary hover:text-primary"
        )}
      >
        {isCurrent && <span className="absolute -left-[9px] bottom-0.5 top-0.5 w-0.5 rounded-full bg-primary" />}
        <span className="min-w-0 flex-1 truncate text-left">{child.label}</span>
        {hasChildren && <ChevronRight className="h-3 w-3 shrink-0 text-border-strong" strokeWidth={2.5} />}
      </button>
    );
  };

  const renderAccordion = (item: NavRoot) => {
    const isOpen = !!openSections[item.id];
    // Expanded, the active leaf's own bar already marks "where you are" — the
    // header doesn't need to repeat it. Collapsed, that leaf is invisible, so
    // this is the only signal left that the module is the active one.
    const isCurrentCollapsed = collapsed && accordionHoldsCurrentNode(item, currentNodeId);
    const head = (
      <button
        onClick={() => !collapsed && setOpenSections((sections) => ({ ...sections, [item.id]: !isOpen }))}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
          collapsed && "justify-center px-0",
          isCurrentCollapsed && "bg-surface-muted font-semibold text-primary hover:bg-surface-muted hover:text-primary"
        )}
      >
        <item.icon
          className={cn("h-4 w-4 shrink-0", isCurrentCollapsed ? "text-primary" : "text-text-muted")}
          strokeWidth={2}
        />
        {!collapsed && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
        {!collapsed && item.badge && (
          <span className="flex h-4 shrink-0 items-center rounded-full bg-surface-muted px-2 text-[10px] font-extrabold tracking-wide text-primary">
            {item.badge}
          </span>
        )}
        {!collapsed && (
          <ChevronDown
            className={cn("h-3 w-3 shrink-0 text-text-muted transition-transform duration-200", isOpen && "rotate-180")}
            strokeWidth={2.5}
          />
        )}
      </button>
    );

    return (
      <div key={item.id}>
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>{head}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          head
        )}
        {!collapsed && (
          <div
            className={cn(
              "grid transition-[grid-template-rows,margin-top] duration-200 ease-out",
              isOpen ? "mt-1 grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="ml-4 flex flex-col gap-1 border-l border-border/60 pl-2">
                {item.children!.map((child) => renderChildRow(child))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const drillLevel = drillStack[drillStack.length - 1];

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col rounded-2xl border border-border/60 bg-surface p-3 pt-4 shadow-card transition-[width,transform] duration-200",
        collapsed ? "w-16" : "w-60",
        // Mobile: the sidebar floats as a drawer above the content.
        "max-lg:fixed max-lg:bottom-2 max-lg:left-2 max-lg:top-2 max-lg:z-50 max-lg:w-60 max-lg:shadow-drawer",
        mobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-[calc(100%+16px)]"
      )}
    >
      {/* ---------- Company identity ---------- */}
      <Popover open={companyMenuOpen} onOpenChange={setCompanyMenuOpen}>
        {/* The whole identity row is the anchor — not the trigger — so the menu
            hangs from the sidebar's left edge in both states instead of
            jumping to wherever the "..." button happens to sit. */}
        <PopoverAnchor asChild>
          <div className={cn("mb-4 flex h-8 items-center gap-1", collapsed && "justify-center")}>
            {collapsed ? (
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  title={activeCompany.name}
                  aria-label={`Menú de ${activeCompany.name}`}
                >
                  <CompanyMark company={activeCompany} />
                </button>
              </PopoverTrigger>
            ) : (
              <>
                <div className="flex h-8 min-w-0 flex-1 items-center gap-2 px-1" title={activeCompany.name}>
                  <CompanyMark company={activeCompany} />
                  <span className="min-w-0 flex-1 truncate text-base font-bold tracking-tight text-text-primary">
                    {activeCompany.name}
                  </span>
                </div>
                {/* Trigger scoped to the "..." button, not the whole row, so
                    the row itself stays a plain label rather than a control. */}
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Más opciones de la empresa"
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background hover:text-text-primary",
                      companyMenuOpen && "bg-background text-text-primary"
                    )}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
              </>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          sideOffset={8}
          className={cn("w-[248px]", SHELL_MENU_PANEL)}
        >
          <div className="flex flex-col py-0.5">
            <div className="flex min-h-6 items-center justify-between gap-3 rounded-lg px-2 text-xs hover:bg-background">
              <span className="font-medium text-text-muted">Licencias:</span>
              <span className="font-semibold tabular-nums text-text-primary">
                {numberFormat.format(activeCompany.licenses[0])}/{numberFormat.format(activeCompany.licenses[1])}
              </span>
            </div>
            <div className="flex min-h-6 items-center justify-between gap-3 rounded-lg px-2 text-xs hover:bg-background">
              <span className="font-medium text-text-muted">Créditos:</span>
              <span className="font-semibold tabular-nums text-text-primary">
                {numberFormat.format(activeCompany.credits[0])}/{numberFormat.format(activeCompany.credits[1])}
              </span>
            </div>
          </div>
          <div className="-mx-2 my-2 h-px bg-border/60" />
          <div className="px-2 pb-1.5 pt-1 text-xs font-medium text-text-muted">Configuración</div>
          {COMPANY_MENU_LINKS.map((label, index) => (
            <button
              key={label}
              onClick={() => setCompanyMenuOpen(false)}
              className={cn(
                "flex w-full items-center rounded-lg px-2 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
                "opacity-0 translate-y-1.5",
                companyMenuOpen && "opacity-100 translate-y-0"
              )}
              style={{
                transition: companyMenuOpen
                  ? `opacity 260ms cubic-bezier(0.16,1,0.3,1) ${index * 40}ms, transform 260ms cubic-bezier(0.16,1,0.3,1) ${index * 40}ms`
                  : "none",
              }}
            >
              {label}
            </button>
          ))}
          <div className="-mx-2 my-2 h-px bg-border/60" />
          <div className="px-2 pb-1.5 pt-1 text-xs font-medium text-text-muted">Empresas</div>
          <div className="flex flex-col gap-0.5">
            {COMPANIES.map((company, index) => {
              const isActive = company.id === activeCompanyId;
              return (
                <button
                  key={company.id}
                  onClick={() => {
                    setActiveCompanyId(company.id);
                    setCompanyMenuOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-background",
                    isActive && "font-semibold text-text-primary",
                    "opacity-0 translate-y-1.5",
                    companyMenuOpen && "opacity-100 translate-y-0"
                  )}
                  style={{
                    transition: companyMenuOpen
                      ? `opacity 260ms cubic-bezier(0.16,1,0.3,1) ${(COMPANY_MENU_LINKS.length * 40) + index * 40}ms, transform 260ms cubic-bezier(0.16,1,0.3,1) ${(COMPANY_MENU_LINKS.length * 40) + index * 40}ms`
                      : "none",
                  }}
                >
                  <CompanyMark company={company} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{company.name}</span>
                  {isActive && <Check className="h-4 w-4 shrink-0 text-primary" strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* ---------- Workspace / Agente IA segmented ---------- */}
      {!collapsed && (
        <div className="relative mb-4 flex shrink-0 rounded-md bg-background p-1">
          <span
            className="absolute bottom-1 left-1 top-1 z-0 w-[calc(50%-4px)] rounded-lg bg-surface shadow-card transition-transform duration-300 ease-[cubic-bezier(.34,1.4,.5,1)]"
            style={{ transform: mode === "agent" ? "translateX(100%)" : "translateX(0)" }}
          />
          <span
            className="pointer-events-none absolute bottom-1 left-1 top-1 z-0 w-[calc(50%-4px)] rounded-lg transition-[transform,opacity] duration-300 ease-[cubic-bezier(.34,1.4,.5,1)]"
            style={{
              background: AI_GRADIENT,
              opacity: mode === "agent" ? 1 : 0,
              transform: mode === "agent" ? "translateX(100%)" : "translateX(0)",
            }}
          />
          <button
            onClick={() => onModeChange("workspace")}
            className={cn(
              "relative z-10 flex-1 rounded-lg py-1.5 text-[13px] font-medium text-text-muted transition-colors active:scale-95",
              mode === "workspace" && "font-semibold text-text-primary"
            )}
          >
            Workspace
          </button>
          <button
            onClick={() => onModeChange("agent")}
            className={cn(
              "relative z-10 flex-1 rounded-lg py-1.5 text-[13px] font-medium text-text-muted transition-colors active:scale-95",
              mode === "agent" && "font-semibold text-white"
            )}
          >
            Agente IA
          </button>
        </div>
      )}

      {/* ---------- Nav viewport ---------- */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {mode === "agent" && !collapsed ? (
          <nav className="flex h-full flex-col gap-1 overflow-y-auto pr-1 animate-in fade-in duration-200">
            <button
              onClick={() => setActiveChatIndex(-1)}
              className="mb-2 flex w-full shrink-0 items-center justify-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm font-bold text-text-primary transition-colors hover:border-primary hover:bg-surface-muted hover:text-primary"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Nuevo chat
            </button>
            {CHAT_HISTORY.map((group, groupIndex) => (
              <React.Fragment key={group.label}>
                <div className="shrink-0 px-2 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  {group.label}
                </div>
                {group.items.map((chat, itemIndex) => {
                  const flatIndex = groupIndex * 100 + itemIndex;
                  return (
                    <button
                      key={chat}
                      onClick={() => setActiveChatIndex(flatIndex)}
                      className={cn(
                        "shrink-0 truncate rounded-lg px-2 py-2 text-left text-[13px] font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
                        activeChatIndex === flatIndex && "bg-surface-muted font-semibold text-primary hover:bg-surface-muted hover:text-primary"
                      )}
                    >
                      {chat}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </nav>
        ) : drillLevel && !collapsed ? (
          <nav
            key={`drill-${drillStack.length}-${drillLevel.title}`}
            className={cn(
              "flex h-full flex-col gap-1 overflow-y-auto pr-1 duration-200 animate-in fade-in",
              drillDirection === "forward" ? "slide-in-from-right-2" : "slide-in-from-left-2"
            )}
          >
            <div className="relative mb-1 flex shrink-0 items-center justify-center border-b border-border/60 px-8 pb-3 pt-1">
              <button
                onClick={popDrill}
                className="absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-background hover:text-text-primary"
                aria-label="Volver"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <span className="truncate text-sm font-semibold text-text-primary">{drillLevel.title}</span>
            </div>
            {drillLevel.items.map((leaf) => (
              <button
                key={leaf.id}
                onClick={() => selectNode(leaf.id)}
                className={cn(
                  "relative flex w-full shrink-0 items-center rounded-lg px-2 py-2 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary",
                  currentNodeId === leaf.id && "bg-surface-muted font-semibold text-primary hover:bg-surface-muted hover:text-primary"
                )}
              >
                <span className="min-w-0 flex-1 truncate">{leaf.label}</span>
              </button>
            ))}
          </nav>
        ) : (
          <nav
            key={`root-${collapsed}`}
            className={cn(
              "flex h-full flex-col gap-1 overflow-y-auto duration-200 animate-in fade-in",
              !collapsed && "pr-1",
              drillDirection === "back" && "slide-in-from-left-2"
            )}
          >
            {NAV_TREE.map((entry, index) => {
              if (entry.kind === "group") {
                return collapsed ? (
                  <div key={`group-${index}`} className="mx-2 my-2 h-px shrink-0 bg-border/60" />
                ) : (
                  <div key={`group-${index}`} className="shrink-0 truncate px-2 pb-0.5 pt-3 text-xs font-medium text-text-muted">
                    {entry.label}
                  </div>
                );
              }
              return entry.children ? renderAccordion(entry) : renderRootLeaf(entry);
            })}
          </nav>
        )}
      </div>

      {/* ---------- LMS promo card ---------- */}
      {!collapsed && !adDismissed && mode === "workspace" && (
        <div className="relative mt-2 shrink-0 rounded-2xl bg-surface-muted p-4 text-center">
          <button
            onClick={() => setAdDismissed(true)}
            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded text-text-muted transition-colors hover:bg-surface hover:text-text-secondary"
            aria-label="Cerrar"
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
          </button>
          <div
            className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: AI_GRADIENT }}
          >
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <h4 className="mb-1 text-[13px] font-bold leading-tight text-text-primary">El LMS que trabaja por ti</h4>
          <p className="mb-3 text-xs font-medium leading-snug text-text-secondary">
            Conoce nuestro nuevo sistema inteligente para crear contenido.
          </p>
          <button className="w-full rounded-lg bg-primary py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-brand-hover)]">
            Conocer más
          </button>
        </div>
      )}

      {/* ---------- Footer: feedback ---------- */}
      <div className="mt-2 shrink-0 border-t border-border/60 pt-2">
        <button
          onClick={onOpenFeedback}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-background hover:text-text-secondary",
            collapsed && "justify-center px-0"
          )}
        >
          <MessageSquare className="h-4 w-4 shrink-0" strokeWidth={2} />
          {!collapsed && <span>Feedback</span>}
        </button>
      </div>
    </aside>
  );
};
