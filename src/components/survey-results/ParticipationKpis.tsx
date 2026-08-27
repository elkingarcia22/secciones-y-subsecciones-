import * as React from "react";
import { BarChart3, Users, Gauge, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { overallDistribution, type SurveyResults } from "@/mocks/surveyResults";
import { formatPercent } from "./favorabilityScale";
import { FormulaBlock } from "./FormulaBlock";
import { ResponseStackedBar } from "@/components/survey-analytics/ResponseStackedBar";

interface ParticipationKpisProps {
  results: SurveyResults;
}

function useAnimatedValue(target: number, duration = 1200) {
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    let startTimestamp: number | null = null;
    let animationFrame: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setValue(target * easeOutQuart);
      
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };
    
    // start from 0 if it's the first time, otherwise if target changes it will restart from 0
    // for a smoother transition you might want to start from current value, 
    // but the requirement is "from 0 to actual value"
    setValue(0);
    animationFrame = window.requestAnimationFrame(step);
    
    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [target, duration]);

  return value;
}

function AnimatedNumber({ value, format }: { value: number, format: (v: number) => React.ReactNode }) {
  const animatedValue = useAnimatedValue(value);
  return <>{format(animatedValue)}</>;
}

export function ParticipationKpis({ results }: ParticipationKpisProps) {
  const { distribution, n } = overallDistribution(results);
  
  // The user requested exactly 3 segments: Desfavorable, Neutral, Favorable.
  // Distribution is [Muy en desacuerdo, En desacuerdo, Neutral, De acuerdo, Muy de acuerdo]
  const unfavorableCount = distribution[0] + distribution[1];
  const neutralCount = distribution[2];
  const favorableCount = distribution[3] + distribution[4];

  const favSegments = [
    {
      id: "kpi-unfavorable",
      label: "Desfavorable",
      value: unfavorableCount,
      tone: "negative" as const,
    },
    {
      id: "kpi-neutral",
      label: "Neutral",
      value: neutralCount,
      tone: "neutral" as const,
    },
    {
      id: "kpi-favorable",
      label: "Favorable",
      value: favorableCount,
      tone: "positive" as const,
    }
  ];

  const npsSegments = results.nps ? [
    {
      id: "nps-detractors",
      label: "Detractores",
      value: results.nps.detractors,
      tone: "negative" as const,
    },
    {
      id: "nps-neutrals",
      label: "Neutrales",
      value: results.nps.passives,
      tone: "neutral" as const,
    },
    {
      id: "nps-promoters",
      label: "Promotores",
      value: results.nps.promoters,
      tone: "positive" as const,
    }
  ] : [];

  const npsValue = results.nps ? results.nps.score : 0;

  const partSegments = [
    {
      id: "part-missing",
      label: "Faltan",
      value: Math.max(0, results.participation.invited - results.participation.completed - results.participation.inProgress),
      tone: "negative" as const,
    },
    {
      id: "part-progress",
      label: "En progreso",
      value: results.participation.inProgress,
      tone: "warning" as const,
    },
    {
      id: "part-completed",
      label: "Completadas",
      value: results.participation.completed,
      tone: "positive" as const,
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* Favorabilidad */}
      <div className="flex flex-col gap-3 bg-surface p-5 rounded-2xl border border-border/60">
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
          <BarChart3 className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">Favorabilidad</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-text-primary transition-colors bg-muted/30 p-1 rounded-md ml-auto">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[400px] p-4 bg-surface-nav text-white shadow-drawer border-none">
                <div className="flex flex-col gap-3 items-start leading-relaxed">
                  <p className="text-[12px]"><strong>Favorabilidad:</strong><br/>La favorabilidad es el porcentaje de respuestas favorables en una escala de 1 a 5, donde se consideran "favorables" las respuestas de 4 y 5.</p>
                  <FormulaBlock
                    numerator="Respuestas favorables"
                    denominator="Total de respuestas"
                    result="% de favorabilidad"
                  />
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-[24px] font-extrabold tabular-nums leading-none text-text-primary">
          <AnimatedNumber value={results.favorability} format={formatPercent} />
        </span>
        <div className="mt-auto pt-1">
          <ResponseStackedBar 
            segments={favSegments}
            showLegend={false}
            size="sm"
          />
        </div>
        <div className="h-2" /> {/* visual balance vs Progress */}
      </div>

      {/* Participación */}
      <div className="flex flex-col gap-3 bg-surface p-5 rounded-2xl border border-border/60">
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
          <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">Participación</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-text-primary transition-colors bg-muted/30 p-1 rounded-md ml-auto">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[400px] p-4 bg-surface-nav text-white shadow-drawer border-none">
                <div className="flex flex-col gap-3 items-start leading-relaxed">
                  <p className="text-[12px]"><strong>Participación:</strong><br/>La participación representa el porcentaje de personas que respondieron en relación con el total de participantes invitados.</p>
                  <FormulaBlock
                    numerator="Personas que respondieron"
                    denominator="Personas invitadas"
                    result="% de participación"
                  />
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-[24px] font-extrabold tabular-nums leading-none text-text-primary">
            <AnimatedNumber value={results.participation.rate} format={formatPercent} />
          </span>
          <span className="text-[13px] font-semibold text-muted-foreground tabular-nums">
            <AnimatedNumber value={results.participation.completed} format={(v) => Math.round(v)} /> / {results.participation.invited}
          </span>
        </div>
        <div className="mt-auto pt-1">
          <ResponseStackedBar 
            segments={partSegments}
            showLegend={false}
            size="sm"
          />
        </div>
        <div className="h-2" />
      </div>

      {/* NPS */}
      <div className="flex flex-col gap-3 bg-surface p-5 rounded-2xl border border-border/60">
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
          <Gauge className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          <span className="truncate">NPS</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-text-primary transition-colors bg-muted/30 p-1 rounded-md ml-auto">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[400px] p-4 bg-surface-nav text-white shadow-drawer border-none">
                <div className="flex flex-col gap-3 items-start leading-relaxed">
                  <p className="text-[12px]"><strong>NPS (Net Promote Score):</strong><br/>Este puntaje mide la lealtad del cliente, evaluando la probabilidad de recomendación en una escala de 0 a 10. Así podrás identificar el nivel de satisfacción y la disposición de los participantes.</p>
                  <p className="text-[12px]"><strong>Fórmula:</strong><br/>((Número de promotores) - (Número de detractores) / (Número de respuestas)) * 100 = Puntaje NPS</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <span className="text-[24px] font-extrabold tabular-nums leading-none text-text-primary">
          <AnimatedNumber value={npsValue} format={(v) => Math.round(v)} />
        </span>
        <div className="mt-auto pt-1">
          {results.nps ? (
            <ResponseStackedBar 
              segments={npsSegments}
              showLegend={false}
              size="sm"
            />
          ) : (
            <Progress value={0} className="h-2" />
          )}
        </div>
        <div className="h-2" />
      </div>

    </div>
  );
}
