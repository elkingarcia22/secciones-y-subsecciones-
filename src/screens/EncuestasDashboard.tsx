import * as React from "react";
import { cn } from "@/lib/utils";
import { MagicCard } from "@/components/ui/magic-card";
import { 
 Search,
 RotateCw,
 Filter,
 LayoutGrid,
 GripVertical,
 MoreVertical,
 ChevronDown,
 ChevronLeft,
 ChevronRight,
 BarChart3,
 Calendar,
 Check,
 Info,
  Sun,
  Globe,
  Cpu,
  Heart,
  Sprout,
  Gauge,
  Lock,
  ArrowUpDown,
  Eye,
  X,
  Pencil,
} from "lucide-react";
import { TemplatesDrawer } from "@/components/survey-list/TemplatesDrawer";
import type { SurveyDraft } from "@/components/survey-builder/surveyBuilderTypes";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ShellRailSlot } from "@/components/app-shell";
import { SurveyListActionRail } from "@/components/survey-list/SurveyListActionRail";
import { SurveyListTable, type SurveyListRow } from "@/components/survey-list/SurveyListTable";
import type { SurveyListFilters } from "@/components/survey-list/surveyListFilters";
import type { SurveyActionId } from "@/components/survey-list/surveyListActions";
import type { DateEditMode } from "@/components/survey-list/SurveyDateCell";
import { formatSurveyDate } from "@/components/survey-list/surveyListDates";
import { ConfirmDialog, DrawerShell } from "@/components/overlays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
 Table, 
 TableBody, 
 TableCell, 
 TableHead, 
 TableHeader, 
 TableRow 
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, Layout } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createPublishedSurveyDraft } from "@/mocks/surveyPreviewMocks";
import { SurveyPreviewDrawer } from "@/components/survey-preview";


/**
 * EncuestasDashboard
 * 
 * Main view for the "Encuestas" tab.
 * Implements the survey list and the comparison wizard.
 */

// --- Redesigned UI Components (UBITS Standard) ---

// --- Redesigned UI Components (UBITS Premium Standard) ---



const TypeCard: React.FC<{ 
 title: string, 
 description: string, 
 icon: any, 
 selected: boolean, 
 onSelect: (val: string) => void 
}> = ({ title, description, icon: Icon, selected, onSelect }) => (
 <MagicCard 
  isSelected={selected}
  onClick={() => onSelect(title)}
  className="w-full p-2.5 mb-2 hover-icon-pop"
  contentClassName="flex-row items-center gap-3 text-left"
 >
  <div className="flex w-full items-center gap-3">
    <div className={cn(
    "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-500 shrink-0 relative z-10",
    selected ? "bg-primary text-text-inverse shadow-md shadow-primary/20" : "bg-surface-muted text-text-muted"
    )}>
      <Icon className="h-4 w-4" strokeWidth={2.5} />
    </div>
    
    <div className="flex-1 min-w-0 relative z-10">
      <h4 className={cn(
      "text-[13px] font-bold transition-colors mb-0.5 tracking-tight",
      selected ? "text-primary" : "text-text-primary"
      )}>{title}</h4>
      <p className="text-[10px] text-text-muted font-medium leading-tight line-clamp-2">
      {description}
      </p>
    </div>

    <div className={cn(
      "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 shrink-0 relative z-10",
      selected ? "border-primary shadow-sm shadow-primary/10" : "border-border-strong/40 bg-surface-muted"
    )}>
      <div className={cn(
        "h-2.5 w-2.5 rounded-full bg-primary transition-all duration-500 transform",
        selected ? "scale-100 opacity-100" : "scale-0 opacity-0"
      )} />
    </div>
  </div>
 </MagicCard>
);

const SurveySelectionItem: React.FC<{
 survey: any;
 selected: boolean;
 onSelect: (id: string) => void;
 isComparative?: boolean;
}> = ({ survey, selected, onSelect, isComparative }) => (
 <MagicCard 
  isSelected={selected}
  onClick={() => onSelect(survey.id)}
  className="w-full p-2.5 mb-2 hover-icon-pop"
  contentClassName="flex-row items-center gap-3 text-left"
 >
  <div className="flex w-full items-center gap-3">
    <div className={cn(
    "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-500 shrink-0 relative z-10",
    selected ? "bg-primary text-text-inverse shadow-md shadow-primary/20" : "bg-surface-muted text-text-muted"
    )}>
      <Calendar className="h-4 w-4" strokeWidth={2} />
    </div>
    
    <div className="flex-1 min-w-0 relative z-10">
      <div className="flex items-center gap-2 mb-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <h4 className={cn(
              "text-[13px] font-bold transition-colors tracking-tight line-clamp-1 cursor-default",
              selected ? "text-primary" : "text-text-primary"
            )}>{survey.name}</h4>
          </TooltipTrigger>
          <TooltipContent side="top" className="tooltip-premium">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] opacity-60 font-medium">Nombre de la encuesta</span>
              <span>{survey.name}</span>
            </div>
          </TooltipContent>
        </Tooltip>
        {survey.status === 'Finalizado' && (
          <Badge className="bg-status-positive-bg text-status-positive border-none text-[10px] font-bold px-2 py-0 rounded-full shrink-0 pointer-events-none">
          Finalizado
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-text-muted font-medium tracking-tight">
        <span className="flex items-center gap-1.5">
          <RotateCw className="h-2 w-2" />
          {survey.startDate}
        </span>
        <span className="flex items-center gap-1.5">
          <LayoutGrid className="h-2 w-2" />
          {survey.participants} participantes
        </span>
      </div>
    </div>

    {/* Selection Indicator */}
    <div className="relative z-10 shrink-0">
      {isComparative ? (
        <Checkbox 
          checked={selected} 
          onCheckedChange={() => onSelect(survey.id)}
          className="h-5 w-5 rounded border-2 border-border bg-muted data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      ) : (
        <div className={cn(
          "h-4 w-4 border-2 rounded-full flex items-center justify-center transition-all duration-400 shrink-0",
          selected ? "bg-primary border-primary shadow-sm shadow-primary/10" : "border-border-strong/40 bg-surface-muted"
        )}>
          {selected && (
            <div className="h-1.5 w-1.5 rounded-full bg-white shadow-card" />
          )}
        </div>
      )}
    </div>
  </div>
 </MagicCard>
);



interface EncuestasDashboardProps {
 onGenerateComparative?: (baseId: string, comparativeIds: string[], type: string) => void;
 /** Opens the survey builder from "Crear encuesta > Crear en blanco". */
 onCreateBlank?: () => void;
 onCreateFromTemplate?: (template: SurveyDraft) => void;
 initialIsDrawerOpen?: boolean;
 initialBaseId?: string | null;
 initialComparativeIds?: string[];
 initialType?: string | null;
 initialStep?: number;
 surveys?: any[];
 onEdit?: (id: string) => void;
 onViewResults?: (id: string) => void;
 /** Opens the builder straight on its participants step. */
 onEditParticipants?: (id: string) => void;
 onDuplicate?: (id: string) => void;
 onDelete?: (ids: readonly string[]) => void;
 /** Closes a running survey for good. */
 onFinish?: (id: string) => void;
 /** Puts a finished survey back in the field until the given closing date. */
 onReopen?: (id: string, endDate: Date) => void;
 /** Moves a running survey's closing date. */
 onChangeEndDate?: (id: string, endDate: Date) => void;
 /** Moves a running survey's start date. */
 onChangeStartDate?: (id: string, startDate: Date) => void;
 /** Column filters, owned above so the home metric chips can set them. */
 listFilters: SurveyListFilters;
 onListFiltersChange: (filters: SurveyListFilters) => void;
}

export const EncuestasDashboard: React.FC<EncuestasDashboardProps> = ({
 onGenerateComparative,
 onCreateBlank,
 onCreateFromTemplate,
 initialIsDrawerOpen = false,
 initialBaseId = null,
 initialComparativeIds = [],
 initialType = null,
 initialStep,
 surveys = [],
 onEdit,
 onViewResults,
 onEditParticipants,
 onDuplicate,
 onDelete,
 onFinish,
 onReopen,
 onChangeEndDate,
 onChangeStartDate,
 listFilters,
 onListFiltersChange,
}) => {
 const [isDrawerOpen, setIsDrawerOpen] = React.useState(initialIsDrawerOpen);
 const [isTemplateDrawerOpen, setIsTemplateDrawerOpen] = React.useState(false);
 
 // Selection State
 const [selectedType, setSelectedType] = React.useState<string | null>(initialType);
 const [selectedBaseId, setSelectedBaseId] = React.useState<string | null>(initialBaseId);
 const [selectedComparativeIds, setSelectedComparativeIds] = React.useState<string[]>(initialComparativeIds);
  const [activeStep, setActiveStep] = React.useState(() => {
    if (initialStep !== undefined) return initialStep;
    if (initialType) return 2;
    return 1;
  });

  const [sortOrder, setSortOrder] = React.useState<'recent' | 'oldest' | 'name' | 'name-desc'>('recent');

 const [searchQuery, setSearchQuery] = React.useState("");

  // Mock data no longer hardcoded


  // Survey being previewed from the list, or null while the drawer is closed.
  // The row only carries metadata, so the content is reconstructed on demand —
  // memoized by row so re-renders don't rebuild (and re-key) the same survey.
  const [previewSurveyId, setPreviewSurveyId] = React.useState<string | null>(null);
  const previewDraft = React.useMemo(() => {
    const item = surveys.find((survey) => survey.id === previewSurveyId);
    return item ? createPublishedSurveyDraft(item) : null;
  }, [previewSurveyId, surveys]);

  // Rows ticked in the table. This is what the floating rail acts on: one row
  // selected surfaces that survey's own actions, several surfaces the batch
  // ones — which is why the per-row "⋮" menu is gone.
  const [checkedIds, setCheckedIds] = React.useState<ReadonlySet<string>>(() => new Set());

  const toggleChecked = (id: string) => {
    setCheckedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allChecked = surveys.length > 0 && surveys.every((survey) => checkedIds.has(survey.id));
  const toggleAllChecked = () =>
    setCheckedIds(allChecked ? new Set() : new Set(surveys.map((survey) => survey.id)));

  // Rows can disappear (a filter, a deletion) while still ticked, so the rail
  // reads the survey back from the list rather than trusting a stored copy.
  const soleCheckedSurvey =
    checkedIds.size === 1 ? surveys.find((survey) => checkedIds.has(survey.id)) ?? null : null;


  // The row whose closing date is being changed. "Editar fechas" and "Reabrir
  // encuesta" are the same gesture on the table — they differ only in what
  // saving it means — so they share one piece of state.
  const [dateEdit, setDateEdit] = React.useState<{
    surveyId: string;
    mode: DateEditMode;
  } | null>(null);

  // Finishing asks first, in a modal — it is irreversible, unlike the
  // in-place edits above. Held as an id rather than a boolean so the dialog
  // can name the survey it is about.
  const [pendingFinishId, setPendingFinishId] = React.useState<string | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<readonly string[] | null>(null);

  const surveyById = (id: string) => surveys.find((survey) => survey.id === id) ?? null;
  const nameOf = (id: string) => surveyById(id)?.name ?? "la encuesta";

  /**
   * Runs one of a single survey's actions.
   *
   * Everything the rail can do to one survey arrives here, so what an action
   * means lives in one place rather than being spread across a dozen callbacks
   * threaded through the rail.
   */
  const runSurveyAction = (action: SurveyActionId, id: string) => {
    switch (action) {
      case "results":
        onViewResults?.(id);
        return;
      case "preview":
        setPreviewSurveyId(id);
        return;
      case "edit":
        onEdit?.(id);
        return;
      case "editParticipants":
        onEditParticipants?.(id);
        return;
      case "duplicate": {
        const name = nameOf(id);
        onDuplicate?.(id);
        toast.success(`${name} duplicada`);
        return;
      }
      case "editDates":
        setDateEdit({ surveyId: id, mode: "editDates" });
        return;
      case "reopen":
        setDateEdit({ surveyId: id, mode: "reopen" });
        return;
      case "finish":
        setPendingFinishId(id);
        return;
      case "delete":
        setPendingDeleteIds([id]);
        return;
      case "shareLink":
        toast.success(`Enlace de ${nameOf(id)} copiado al portapapeles`);
        return;
      case "downloadQr":
        toast.success(`Código QR de ${nameOf(id)} descargado`);
        return;
      case "share":
        return;
    }
  };

  const surveyTypes = [
    { title: "Clima", description: "Mide la percepción del ambiente laboral y bienestar.", icon: Sprout },
    { title: "Cultura", description: "Analiza valores y comportamientos compartidos.", icon: Heart },
    { title: "NPS", description: "Net Promoter Score: Mide la lealtad externa.", icon: Gauge },
  ];

 // Logic
 const filteredSurveys = React.useMemo(() => {
 if (!selectedType) return [];
 return surveys
 .filter(s => s.type === selectedType)
 .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
 }, [selectedType, searchQuery]);

 const baseSurveyOptions = React.useMemo(() => {
 return filteredSurveys.filter(s => s.status === "Finalizado");
 }, [filteredSurveys]);

 const comparativeOptions = React.useMemo(() => {
    const result = filteredSurveys.filter(s => s.status === "Finalizado");

    
    return [...result].sort((a, b) => {
      if (sortOrder === 'recent') return b.id.localeCompare(a.id, undefined, { numeric: true });
      if (sortOrder === 'oldest') return a.id.localeCompare(b.id, undefined, { numeric: true });
      if (sortOrder === 'name') return a.name.localeCompare(b.name);
      if (sortOrder === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });
  }, [filteredSurveys, selectedBaseId, sortOrder]);

  const handleTypeSelect = (val: string) => {
    setSelectedType(val);
    
    // Find latest survey of this type as base
    const typeSurveys = surveys.filter(s => s.type === val && s.status === "Finalizado");
    
    const latest = [...typeSurveys].sort((a, b) => {
      // Robust sorting by year and quarter
      const getScore = (item: any) => {
        const yearMatch = item.name.match(/202\d/);
        const year = yearMatch ? parseInt(yearMatch[0]) : 0;
        
        const quarterMatch = item.name.match(/Q(\d)/);
        const quarter = quarterMatch ? parseInt(quarterMatch[1]) : 0;
        
        // Month fallback for Cultura surveys that might just have years
        const monthMap: Record<string, number> = { 'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12 };
        const monthStr = item.startDate?.split(' ')[1]?.toLowerCase();
        const month = monthMap[monthStr] || 0;

        return year * 1000 + quarter * 100 + month;
      };

      return getScore(b) - getScore(a);
    })[0];

    setSelectedBaseId(latest?.id || null);
    setSelectedComparativeIds([]);
    setSearchQuery("");
    // Automatic transition removed to allow manual "Next" button usage
  };

 const toggleComparative = (id: string) => {
 setSelectedComparativeIds(prev => {
 if (prev.includes(id)) return prev.filter(item => item !== id);
  if (prev.length < 5) return [...prev, id];

 return prev;
 });
 };

 const handleCreate = () => {
 if (onGenerateComparative && selectedBaseId && selectedType) {
 onGenerateComparative(selectedBaseId, selectedComparativeIds, selectedType);
 }
 setIsDrawerOpen(false);
 };

  return (
  <div className="flex flex-col flex-1 min-h-0">
  {/* The list is the participation table with survey content: same shell,
      same header controls, same selection model and pager. */}
  <SurveyListTable
    surveys={surveys as SurveyListRow[]}
    selectedIds={checkedIds}
    onSelectionChange={setCheckedIds}
    onOpenSurvey={(id) => {
      const survey = surveys.find((candidate) => candidate.id === id);
      // Anything that has been launched opens its results — a measurement in
      // the field has partial results worth watching, and that is what someone
      // clicking its name is after. Only a draft, which has nothing to show
      // yet, opens in the editor instead.
      if (survey && survey.status !== "Borrador") onViewResults?.(id);
      else onEdit?.(id);
    }}
    filters={listFilters}
    onFiltersChange={onListFiltersChange}
    dateEdit={dateEdit}
    onDateEditStart={(surveyId, mode) => setDateEdit({ surveyId, mode })}
    onDateEditCancel={() => setDateEdit(null)}
    onDateEditSave={(id, date) => {
      if (dateEdit?.mode === "reopen") {
        onReopen?.(id, date);
      } else if (dateEdit?.mode === "editStartDate") {
        onChangeStartDate?.(id, date);
      } else {
        onChangeEndDate?.(id, date);
      }
      setDateEdit(null);
      toast.success(
        dateEdit?.mode === "reopen"
          ? `${nameOf(id)} vuelve a estar en curso hasta el ${formatSurveyDate(date)}`
          : dateEdit?.mode === "editStartDate"
            ? `${nameOf(id)} ahora inicia el ${formatSurveyDate(date)}`
            : `${nameOf(id)} ahora cierra el ${formatSurveyDate(date)}`
      );
    }}
  />

  {/* Floating action rail, anchored by the shell so it stays above the fold
      while the table scrolls. It carries what the header and the per-row
      menus used to. */}
  <ShellRailSlot>
    <SurveyListActionRail
      // A row already committed to an in-place date edit cannot also take an
      // action from the rail; the menu closes rather than let the two compete.
      locked={dateEdit !== null}
      selectedCount={checkedIds.size}
      selectedSurvey={soleCheckedSurvey}
      onCreateBlank={() => onCreateBlank?.()}
      onCreateFromTemplate={() => setIsTemplateDrawerOpen(true)}
      onCompare={() => setIsDrawerOpen(true)}
      onAction={runSurveyAction}
      onClearSelection={() => setCheckedIds(new Set())}
      onBulkDuplicate={() => {
        [...checkedIds].forEach((id) => onDuplicate?.(id));
        toast.success(`${checkedIds.size} encuestas duplicadas`);
        setCheckedIds(new Set());
      }}
      onBulkExport={() => toast.success(`Exportando ${checkedIds.size} encuestas`)}
      onBulkDelete={() => setPendingDeleteIds([...checkedIds])}
    />
  </ShellRailSlot>

  {/* Comparison Wizard Drawer */}
  <DrawerShell
    open={isDrawerOpen}
    onOpenChange={(open) => {
      setIsDrawerOpen(open);
      if (!open) {
        setActiveStep(1);
        setSearchQuery("");
        setSelectedType(null);
        setSelectedBaseId(null);
        setSelectedComparativeIds([]);
      }
    }}
    title="Comparativo de encuestas"
    size="full"
    side="right"
    className="flex flex-col !w-[30vw] !max-w-[30vw] border-l shadow-drawer transition-all duration-500"
    disablePadding
  >
    <div className="flex flex-col h-full overflow-hidden bg-surface-subtle">
      <TooltipProvider delayDuration={400}>
        {/* Stepper Header */}
        <div className="px-6 py-6 bg-surface border-b border-border/60 shrink-0 relative z-20">
        <div className="flex items-center justify-between relative max-w-[320px] mx-auto">
          
          {/* Animated Progress Line (Green) */}
          <div className="absolute top-3.5 left-4 right-4 h-[1.5px] bg-status-positive/10 z-0" />
          <div 
            className="absolute top-3.5 left-4 right-4 h-[1.5px] bg-status-positive transition-all duration-700 ease-in-out z-0 origin-left" 
            style={{ 
              transform: `scaleX(${(activeStep - 1) / 2})`,
              boxShadow: '0 0 10px hsl(var(--color-positive-hsl) / 0.3)'
            }}
          />

          {[
            { id: 1, label: "Tipo" },
            { id: 2, label: "Comparar" },
            { id: 3, label: "Base" }
          ].map((item, idx) => {
            const stepNum = item.id;
            const isActive = stepNum === activeStep;
            const isCompleted = stepNum < activeStep;
            const isLocked = stepNum > activeStep;
            
            return (
              <div key={idx} className="flex flex-col items-center relative z-10">
                <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface">
                  <span
                    className={cn(
                      "absolute inset-0 flex items-center justify-center rounded-full text-[11px] font-bold tabular-nums transition-colors duration-500",
                      isActive && "bg-primary text-primary-foreground",
                      isCompleted && "bg-status-positive/15 text-status-positive",
                      isLocked && "bg-border/40 text-muted-foreground/60"
                    )}
                  >
                    <div className="relative z-10 flex items-center justify-center">
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                      ) : (
                        <span>{stepNum}</span>
                      )}
                    </div>
                  </span>
                </div>

                {/* Label Below */}
                <div className="absolute top-8 flex flex-col items-center w-24">
                  <span className={cn(
                    "text-[10px] font-bold tracking-tight text-center transition-colors duration-500",
                    isActive ? "text-primary" : isCompleted ? "text-status-positive" : "text-text-muted"
                  )}>
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
        {/* Step 1: Type */}
        {activeStep === 1 && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="p-5 pb-3 text-center space-y-1">
              <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">Tipo de encuesta</h3>
              <p className="text-[11px] text-text-muted font-medium px-10 leading-relaxed">
                Selecciona el tipo de encuestas que deseas comparar.
              </p>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 pb-6">
                {surveyTypes.map((type) => (
                  <TypeCard
                    key={type.title}
                    title={type.title}
                    description={type.description}
                    icon={type.icon}
                    selected={selectedType === type.title}
                    onSelect={handleTypeSelect}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Footer for Step 1 */}
            <div className="px-5 py-4 bg-surface border-t border-border/60 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20">
              <Button 
                onClick={() => setActiveStep(2)}
                disabled={!selectedType}
                className="w-full gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale group/btn h-10 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Comparative Selection */}
        {activeStep === 2 && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">
            <div className="p-5 pb-3 space-y-3 shrink-0">
              <div className="flex items-center justify-between mb-0">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setActiveStep(1);
                    setSelectedComparativeIds([]);
                  }}
                  className="gap-2 text-primary font-bold tracking-tight text-[10px] h-8 px-3 rounded-full bg-primary/5 hover:bg-primary/10 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Volver</span>
                </Button>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold px-3 py-1 rounded-full pointer-events-none transition-all duration-300">
                  {selectedComparativeIds.length} Seleccionadas
                </Badge>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">Encuestas para comparar</h3>
                <p className="text-[11px] text-text-muted font-medium px-10 leading-relaxed">
                  Elige hasta 5 encuestas para comparar resultados y analizar tendencias.
                </p>
              </div>


              
              <div className="flex gap-2">
                <div className="relative group flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted group-focus-within:text-primary transition-all duration-300 z-10" />
                  <Input
                    type="text"
                    placeholder="Filtrar encuestas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 text-[11px] font-bold bg-surface border-border/60"
                  />
                </div>
                
                <div className="flex items-center p-1 bg-surface-subtle rounded-xl border border-border/60">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-3 gap-2 text-[10px] font-bold tracking-tight rounded-lg transition-all bg-surface border-border/60 text-text-secondary hover:bg-surface-muted shrink-0"
                      >
                        <ArrowUpDown className="h-3 w-3" />
                        <span>{sortOrder === 'recent' ? 'Recientes' : sortOrder === 'oldest' ? 'Antiguas' : 'Nombre'}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-surface border border-border/60 shadow-drawer rounded-lg p-1.5">
                      <DropdownMenuLabel className="text-[10px] font-bold tracking-tight text-text-muted px-2 py-1.5">Ordenar por</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border/10" />
                        <DropdownMenuRadioGroup value={sortOrder} onValueChange={(val) => setSortOrder(val as any)}>
                          <DropdownMenuRadioItem value="recent" className="text-[11px] font-bold tracking-tight p-2.5 rounded-md focus:bg-primary/5 focus:text-primary cursor-pointer">
                            Más recientes
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="oldest" className="text-[11px] font-bold tracking-tight p-2.5 rounded-md focus:bg-primary/5 focus:text-primary cursor-pointer">
                            Más antiguas
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="name" className="text-[11px] font-bold tracking-tight p-2.5 rounded-md focus:bg-primary/5 focus:text-primary cursor-pointer">
                            Nombre (A-Z)
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="name-desc" className="text-[11px] font-bold tracking-tight p-2.5 rounded-md focus:bg-primary/5 focus:text-primary cursor-pointer">
                            Nombre (Z-A)
                          </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 pb-6 space-y-2">
                {comparativeOptions.length > 0 ? (
                  comparativeOptions.map((survey) => (
                    <SurveySelectionItem
                      key={survey.id}
                      survey={survey}
                      selected={selectedComparativeIds.includes(survey.id)}
                      onSelect={toggleComparative}
                      isComparative
                    />
                  ))
                ) : (
                  <EmptyState 
                    title="No hay más encuestas"
                    description={`No se encontraron otras encuestas de tipo ${selectedType} para comparar.`}
                    icon={Search}
                    className="border-none bg-transparent py-10"
                  />
                )}
              </div>
            </ScrollArea>

            {/* Footer for Step 2 */}
            <div className="px-5 py-4 bg-surface border-t border-border/60 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20">
              <Button 
                onClick={() => {
                  const selectedOnes = surveys.filter(s => selectedComparativeIds.includes(s.id));
                  
                  // Use robust sorting to find the latest among selected ones
                  const getScore = (item: any) => {
                    const yearMatch = item.name.match(/202\d/);
                    const year = yearMatch ? parseInt(yearMatch[0]) : 0;
                    
                    const quarterMatch = item.name.match(/Q(\d)/);
                    const quarter = quarterMatch ? parseInt(quarterMatch[1]) : 0;
                    
                    const monthMap: Record<string, number> = { 'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6, 'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12 };
                    const monthStr = item.startDate?.split(' ')[1]?.toLowerCase();
                    const month = monthMap[monthStr] || 0;

                    return year * 1000 + quarter * 100 + month;
                  };

                  const latestSelected = [...selectedOnes].sort((a, b) => getScore(b) - getScore(a))[0];
                  
                  // Always pre-select the latest one from the current selection if none is selected or if it's not in the selection
                  const currentBaseStillInSelection = selectedBaseId && selectedComparativeIds.includes(selectedBaseId);
                  if (!currentBaseStillInSelection) {
                    setSelectedBaseId(latestSelected?.id || null);
                  }

                  setActiveStep(3);
                }}
                disabled={selectedComparativeIds.length === 0}
                className="w-full gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale group/btn h-10 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
            </div>
        </div>
      )}

        {/* Step 3: Base Survey Selection */}
        {activeStep === 3 && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-in fade-in slide-in-from-right-10 duration-700">
            <div className="p-5 pb-3 space-y-3 shrink-0">
              <div className="flex items-center justify-between mb-0">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveStep(2)}
                  className="gap-2 text-primary font-bold tracking-tight text-[10px] h-8 px-3 rounded-full bg-primary/5 hover:bg-primary/10 transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Volver</span>
                </Button>

              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-text-primary tracking-tight leading-tight">Encuesta base</h3>
                <p className="text-[11px] text-text-muted font-medium px-10 leading-relaxed">
                  De tu selección anterior, elige cuál será la encuesta base para comparar contra las demás.
                </p>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 pb-6 space-y-2">
                {surveys
                  .filter(s => selectedComparativeIds.includes(s.id))
                  .map((survey) => (
                    <SurveySelectionItem
                      key={survey.id}
                      survey={survey}
                      selected={selectedBaseId === survey.id}
                      onSelect={(id) => setSelectedBaseId(id)}
                    />
                  ))
                }
              </div>
            </ScrollArea>

            {/* Footer for Step 3 */}
            <div className="px-5 py-4 bg-surface border-t border-border/60 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20">
              <Button 
                onClick={handleCreate}
                disabled={!selectedBaseId}
                className="w-full gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale group/btn h-10 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl"
              >
                <BarChart3 className="h-4.5 w-4.5 transition-transform group-hover/btn:scale-110" />
                <span>Generar comparativo</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  </div>
</DrawerShell>

<TemplatesDrawer
  open={isTemplateDrawerOpen}
  onOpenChange={setIsTemplateDrawerOpen}
  onSelectTemplate={(template) => {
    setIsTemplateDrawerOpen(false);
    onCreateFromTemplate?.(template);
  }}
/>

{/* Preview of a published survey. Mounted only while one is selected so the
    drawer starts from its first page on every open. */}
{previewDraft && (
  <SurveyPreviewDrawer
    draft={previewDraft}
    open={previewSurveyId !== null}
    onOpenChange={(open) => !open && setPreviewSurveyId(null)}
  />
)}

{/* Closing a survey stops collection for good — the responses that would
    have arrived after it simply never do — so it is asked before it is
    done, in a modal rather than in the row: unlike a date, there's nothing
    left to look at in the table once this is confirmed. */}
<ConfirmDialog
  open={pendingFinishId !== null}
  onOpenChange={(open) => !open && setPendingFinishId(null)}
  title="¿Finalizar esta encuesta?"
  description={
    pendingFinishId
      ? `${nameOf(pendingFinishId)} dejará de admitir respuestas de inmediato. Podrás consultar sus resultados, pero quienes aún no hayan respondido ya no podrán hacerlo.`
      : undefined
  }
  confirmLabel="Finalizar encuesta"
  cancelLabel="Cancelar"
  variant="warning"
  onConfirm={() => {
    if (!pendingFinishId) return;
    const name = nameOf(pendingFinishId);
    onFinish?.(pendingFinishId);
    setPendingFinishId(null);
    toast.success(`${name} finalizada`);
  }}
/>

<ConfirmDialog
  open={pendingDeleteIds !== null}
  onOpenChange={(open) => !open && setPendingDeleteIds(null)}
  title={
    pendingDeleteIds && pendingDeleteIds.length > 1
      ? `¿Eliminar ${pendingDeleteIds.length} encuestas?`
      : "¿Eliminar esta encuesta?"
  }
  description={
    pendingDeleteIds && pendingDeleteIds.length === 1
      ? `${nameOf(pendingDeleteIds[0])} y sus respuestas se eliminarán definitivamente. Esta acción no se puede deshacer.`
      : "Las encuestas seleccionadas y sus respuestas se eliminarán definitivamente. Esta acción no se puede deshacer."
  }
  confirmLabel="Eliminar"
  cancelLabel="Cancelar"
  variant="destructive"
  confirmationText={
    pendingDeleteIds && pendingDeleteIds.length === 1 ? nameOf(pendingDeleteIds[0]) : undefined
  }
  onConfirm={() => {
    if (!pendingDeleteIds) return;
    const count = pendingDeleteIds.length;
    const label = count === 1 ? nameOf(pendingDeleteIds[0]) : `${count} encuestas`;
    onDelete?.(pendingDeleteIds);
    setPendingDeleteIds(null);
    setCheckedIds(new Set());
    toast.success(`${label} ${count === 1 ? "eliminada" : "eliminadas"}`);
  }}
/>
</div>
);
};
