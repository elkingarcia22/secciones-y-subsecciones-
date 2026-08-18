import * as React from "react";
import { cn } from "@/lib/utils";
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
import { EmptyState } from "@/components/feedback/EmptyState";
import { DrawerShell } from "@/components/overlays/DrawerShell";
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
 <div 
 onClick={() => onSelect(title)}
 className={cn(
 "flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all duration-400 cursor-pointer mb-2 relative overflow-hidden",
 selected 
 ? "border-primary bg-surface shadow-primary/5" 
 : "border-border/40 bg-surface"
 )}
 >
 {selected && (
 <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
 )}

 <div className={cn(
 "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-500 shrink-0 relative z-10",
 selected ? "bg-primary text-text-inverse shadow-md shadow-primary/20" : "bg-surface-muted text-text-secondary/40"
 )}>
 <Icon className="h-4 w-4" strokeWidth={2.5} />
 </div>
 
 <div className="flex-1 min-w-0 relative z-10">
 <h4 className={cn(
 "text-[13px] font-bold transition-colors mb-0.5 tracking-tight",
 selected ? "text-primary" : "text-text-primary"
 )}>{title}</h4>
 <p className="text-[10px] text-text-secondary/60 font-medium leading-tight line-clamp-2">
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
);

const SurveySelectionItem: React.FC<{
 survey: any;
 selected: boolean;
 onSelect: (id: string) => void;
 isComparative?: boolean;
}> = ({ survey, selected, onSelect, isComparative }) => (
 <div 
 onClick={() => onSelect(survey.id)}
 className={cn(
 "flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all duration-400 cursor-pointer bg-surface mb-2 relative overflow-hidden",
 selected 
 ? "border-primary shadow-primary/5" 
 : "border-border/40"
 )}
 >
 {selected && (
 <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
 )}

 <div className={cn(
 "h-9 w-9 rounded-lg flex items-center justify-center transition-all duration-500 shrink-0 relative z-10",
 selected ? "bg-primary text-text-inverse shadow-md shadow-primary/20" : "bg-surface-muted text-text-secondary/40"
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
        <span className="text-[9px] opacity-60 font-medium">Nombre de la encuesta</span>
        <span>{survey.name}</span>
      </div>
    </TooltipContent>
  </Tooltip>
 {survey.status === 'Finalizado' && (
 <Badge className="bg-status-positive-bg text-status-positive border-none text-[8px] font-bold px-2 py-0 rounded-full shrink-0 pointer-events-none">
 Finalizado
 </Badge>
 )}
 </div>
 <div className="flex items-center gap-3 text-[10px] text-text-secondary/50 font-medium tracking-tight">
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
 <div className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
 )}
 </div>
 )}
 </div>
 </div>
);



interface EncuestasDashboardProps {
 onGenerateComparative?: (baseId: string, comparativeIds: string[], type: string) => void;
 /** Opens the survey builder from "Crear encuesta > Crear en blanco". */
 onCreateBlank?: () => void;
 initialIsDrawerOpen?: boolean;
 initialBaseId?: string | null;
 initialComparativeIds?: string[];
 initialType?: string | null;
 initialStep?: number;
 surveys?: any[];
 onEdit?: (id: string) => void;
}

export const EncuestasDashboard: React.FC<EncuestasDashboardProps> = ({
 onGenerateComparative,
 onCreateBlank,
 initialIsDrawerOpen = false,
 initialBaseId = null,
 initialComparativeIds = [],
 initialType = null,
 initialStep,
 surveys = [],
 onEdit
}) => {
 const [isDrawerOpen, setIsDrawerOpen] = React.useState(initialIsDrawerOpen);
 
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
    let result = filteredSurveys.filter(s => s.status === "Finalizado");

    
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
 <div className="flex flex-col h-full bg-surface rounded-xl border border-border/60 overflow-hidden shadow-sm">
 {/* Dashboard Header */}
 <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-surface">
 <div className="flex flex-col">
 <h2 className="text-xl font-bold text-text-primary tracking-tight">Lista de encuestas</h2>
 <span className="text-[11px] font-medium text-text-secondary/40 tracking-tight">{surveys.length} encuestas encontradas</span>
 </div>
 
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2 border-r border-border/40 pr-6">
 <Button variant="ghost" size="icon" className="h-10 w-10 text-text-secondary hover:bg-muted/50 rounded-full transition-all hover:scale-110"><Search className="h-5 w-5" /></Button>
 <Button variant="ghost" size="icon" className="h-10 w-10 text-text-secondary hover:bg-muted/50 rounded-full transition-all hover:scale-110"><RotateCw className="h-5 w-5" /></Button>
 <Button variant="ghost" size="icon" className="h-10 w-10 text-text-secondary hover:bg-muted/50 rounded-full transition-all hover:scale-110"><Filter className="h-5 w-5" /></Button>
 <Button variant="ghost" size="icon" className="h-10 w-10 text-text-secondary hover:bg-muted/50 rounded-full transition-all hover:scale-110"><LayoutGrid className="h-5 w-5" /></Button>
 </div>
 
 <Button 
 variant="outline" 
 className="h-10 px-5 gap-2.5 text-xs font-semibold rounded-xl hover:bg-primary/5 hover:border-primary/50 transition-all shadow-sm active:scale-95"
 onClick={() => setIsDrawerOpen(true)}
 >
 <BarChart3 className="h-4.5 w-4.5 text-primary" />
 <span>Comparar encuestas</span>
 </Button>
 
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className="h-10 px-5 gap-2.5 text-xs font-semibold rounded-xl shadow-lg active:scale-95 group">
        <span>Crear encuesta</span>
        <ChevronDown className="h-4 w-4 opacity-50 group-data-[state=open]:rotate-180 transition-transform duration-200" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent 
      align="end" 
      sideOffset={8}
      className="w-72 p-2 rounded-2xl border border-border/40 shadow-2xl bg-white animate-in fade-in-0 zoom-in-95 z-[100]"
    >
      <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold text-text-secondary/40 uppercase tracking-widest">Opciones de creación</DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-border/40 mx-1 my-1" />
      <DropdownMenuItem onSelect={onCreateBlank} className="flex items-center gap-4 p-3 rounded-xl cursor-pointer focus:bg-brand/5 focus:text-brand transition-all group outline-none border border-transparent focus:border-brand/10">
        <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center group-focus:bg-white group-focus:shadow-sm transition-all border border-transparent group-focus:border-brand/10">
          <Plus className="h-5 w-5 text-text-secondary group-focus:text-brand" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-bold tracking-tight">Crear en blanco</span>
          <span className="text-[11px] text-text-secondary/50 font-medium">Empieza desde cero</span>
        </div>
      </DropdownMenuItem>
      <DropdownMenuItem className="flex items-center gap-4 p-3 rounded-xl cursor-pointer focus:bg-brand/5 focus:text-brand transition-all group outline-none border border-transparent focus:border-brand/10">
        <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center group-focus:bg-white group-focus:shadow-sm transition-all border border-transparent group-focus:border-brand/10">
          <Layout className="h-5 w-5 text-text-secondary group-focus:text-brand" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-bold tracking-tight">Crear con plantilla</span>
          <span className="text-[11px] text-text-secondary/50 font-medium">Usa un diseño predefinido</span>
        </div>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
 </div>
  </div>

  {/* Table Content */}
  <div className="flex-1 overflow-auto">
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent border-b border-border/40 bg-muted/20">
          <TableHead className="w-[40px] px-8"><Checkbox className="border-border/60" /></TableHead>
          <TableHead className="w-[30px] p-0"></TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Nombre</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Tipo</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Estado</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Inicio</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Cierre</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4 text-center">Part.</TableHead>
          <TableHead className="text-[11px] font-bold text-text-secondary tracking-tight py-4">Avance</TableHead>
          <TableHead className="w-[40px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {surveys.map((survey) => (
          <TableRow key={survey.id} className="border-b border-border/40 transition-all group">
            <TableCell className="px-8 py-4"><Checkbox className="border-border/60" /></TableCell>
            <TableCell className="p-0"><GripVertical className="h-4 w-4 text-text-secondary opacity-20 group-hover:opacity-50 transition-opacity cursor-grab" /></TableCell>
            <TableCell className="py-4 text-[12px] font-bold text-text-primary">{survey.name}</TableCell>
            <TableCell className="text-[11px] font-bold text-text-secondary/70">{survey.type}</TableCell>
            <TableCell>
              <Badge variant="outline" className={cn(
                "text-[10px] font-bold border-none px-2 py-0.5 rounded-full pointer-events-none",
                survey.statusVariant === "info" && "bg-info/10 text-info",
                survey.statusVariant === "positive" && "bg-status-positive-bg text-status-positive",
                survey.statusVariant === "warning" && "bg-status-warning-light/20 text-status-warning",
                survey.statusVariant === "default" && "bg-muted text-text-secondary"
              )}>
                {survey.status}
              </Badge>
            </TableCell>
            <TableCell className="text-[11px] font-bold text-text-secondary/60">{survey.startDate}</TableCell>
            <TableCell className="text-[11px] font-bold text-text-secondary/60">{survey.endDate}</TableCell>
            <TableCell className="text-[11px] font-extrabold text-text-primary text-center">{survey.participants}</TableCell>
            <TableCell className="min-w-[140px]">
              <div className="flex items-center gap-3">
                <Progress value={survey.progress} className="h-1.5 flex-1 bg-muted" />
                <span className="text-[11px] font-bold text-text-primary min-w-[30px]">{survey.progress}%</span>
              </div>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={`Acciones de ${survey.name}`} className="h-8 w-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity rounded-full hover:bg-muted"><MoreVertical className="h-4 w-4 text-text-secondary" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
                  <DropdownMenuItem
                    onSelect={() => onEdit?.(survey.id)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold cursor-pointer"
                  >
                    <Pencil className="h-4 w-4 text-text-secondary" strokeWidth={2.2} />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setPreviewSurveyId(survey.id)}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] font-semibold cursor-pointer"
                  >
                    <Eye className="h-4 w-4 text-text-secondary" strokeWidth={2.2} />
                    Vista previa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

 {/* Pagination Footer */}
 <div className="px-8 py-4 flex items-center justify-between border-t border-border/60 bg-surface">
 <div className="text-[11px] font-bold text-text-secondary/60">Mostrando 1-8 de {surveys.length}</div>
 <div className="flex items-center gap-2">
 <Button variant="outline" size="icon" className="h-9 w-9 opacity-50 border-2 rounded-lg" disabled><ChevronLeft className="h-4 w-4" /></Button>
 <div className="flex items-center gap-1.5 px-2">
 <Button variant="outline" className="h-9 w-9 p-0 bg-primary/5 border-2 border-primary text-primary font-extrabold text-xs rounded-lg">1</Button>
 <Button variant="ghost" className="h-9 w-9 p-0 text-text-secondary/60 font-bold text-xs rounded-lg hover:bg-muted">2</Button>
 <Button variant="ghost" className="h-9 w-9 p-0 text-text-secondary/60 font-bold text-xs rounded-lg hover:bg-muted">3</Button>
 </div>
 <Button variant="outline" size="icon" className="h-9 w-9 border-2 rounded-lg"><ChevronRight className="h-4 w-4 text-text-primary" /></Button>
 </div>
 <div className="w-[120px]"></div>
  </div>

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
        <div className="px-6 py-6 bg-surface border-b border-border/40 shrink-0 relative z-20">
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
                {/* Circle Indicator */}
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center transition-all duration-500 border-[1.5px] font-bold text-[11px] relative z-10",
                  isCompleted 
                    ? "bg-surface border-status-positive text-status-positive shadow-sm" 
                    : isActive 
                      ? "bg-primary border-primary text-text-inverse shadow-sm" 
                      : "bg-surface-muted border-border-strong/30 text-text-secondary"
                )}>
                  {/* Tint overlay for completed */}
                  {isCompleted && (
                    <div className="absolute inset-0 bg-status-positive/5 rounded-full" />
                  )}
                  
                  {/* Pulse effect for active */}
                  {isActive && (
                    <div className="absolute inset-[-3px] rounded-full border border-primary/20 animate-pulse" />
                  )}
                  
                  <div className="relative z-10 flex items-center justify-center">
                    {isCompleted ? (
                      <Check className="h-3 w-3" strokeWidth={4} />
                    ) : isLocked ? (
                      <Lock className="h-3 w-3 opacity-30" />
                    ) : (
                      <span>{stepNum}</span>
                    )}
                  </div>
                </div>

                {/* Label Below */}
                <div className="absolute top-8 flex flex-col items-center w-24">
                  <span className={cn(
                    "text-[10px] font-bold tracking-tight text-center transition-colors duration-500",
                    isActive ? "text-primary" : isCompleted ? "text-status-positive" : "text-text-secondary/40"
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
              <p className="text-[11px] text-text-secondary/60 font-medium px-10 leading-relaxed">
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
            <div className="px-5 py-4 bg-surface border-t border-border/40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20">
              <Button 
                onClick={() => setActiveStep(2)}
                disabled={!selectedType}
                className="w-full gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale group/btn h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl"
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
                <p className="text-[11px] text-text-secondary/60 font-medium px-10 leading-relaxed">
                  Elige hasta 5 encuestas para comparar resultados y analizar tendencias.
                </p>
              </div>


              
              <div className="flex gap-2">
                <div className="relative group flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary/30 group-focus-within:text-primary transition-all duration-300 z-10" />
                  <Input
                    type="text"
                    placeholder="Filtrar encuestas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 text-[11px] font-bold bg-surface border-border/40"
                  />
                </div>
                
                <div className="flex items-center p-1 bg-surface-subtle rounded-xl border border-border/20">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 px-3 gap-2 text-[10px] font-bold tracking-tight rounded-lg transition-all bg-surface border-border/10 text-text-secondary hover:bg-surface-muted shrink-0"
                      >
                        <ArrowUpDown className="h-3 w-3" />
                        <span>{sortOrder === 'recent' ? 'Recientes' : sortOrder === 'oldest' ? 'Antiguas' : 'Nombre'}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-surface border border-border/40 shadow-drawer rounded-lg p-1.5">
                      <DropdownMenuLabel className="text-[10px] font-bold tracking-tight text-text-secondary/40 px-2 py-1.5">Ordenar por</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border/10" />
                        <DropdownMenuRadioGroup value={sortOrder} onValueChange={(val) => setSortOrder(val as any)}>
                          <DropdownMenuRadioItem value="recent" className="text-[11px] font-bold tracking-tight p-2.5 rounded-md focus:bg-brand/5 focus:text-brand cursor-pointer">
                            Más recientes
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="oldest" className="text-[11px] font-bold tracking-tight p-2.5 rounded-md focus:bg-brand/5 focus:text-brand cursor-pointer">
                            Más antiguas
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="name" className="text-[11px] font-bold tracking-tight p-2.5 rounded-md focus:bg-brand/5 focus:text-brand cursor-pointer">
                            Nombre (A-Z)
                          </DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="name-desc" className="text-[11px] font-bold tracking-tight p-2.5 rounded-md focus:bg-brand/5 focus:text-brand cursor-pointer">
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
            <div className="px-5 py-4 bg-surface border-t border-border/40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20">
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
                className="w-full gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale group/btn h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl"
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
                <p className="text-[11px] text-text-secondary/60 font-medium px-10 leading-relaxed">
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
            <div className="px-5 py-4 bg-surface border-t border-border/40 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] shrink-0 z-20">
              <Button 
                onClick={handleCreate}
                disabled={!selectedBaseId}
                className="w-full gap-3 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-30 disabled:grayscale group/btn h-11 text-xs font-bold tracking-tight shadow-lg shadow-primary/20 rounded-xl"
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

{/* Preview of a published survey. Mounted only while one is selected so the
    drawer starts from its first page on every open. */}
{previewDraft && (
  <SurveyPreviewDrawer
    draft={previewDraft}
    open={previewSurveyId !== null}
    onOpenChange={(open) => !open && setPreviewSurveyId(null)}
  />
)}
</div>
);
};
