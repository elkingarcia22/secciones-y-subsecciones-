import { Grid2X2, List } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ResultsSubTab = "questions" | "heatmap";

interface ResultsSubTabSwitchProps {
  value: ResultsSubTab;
  onChange: (value: ResultsSubTab) => void;
}

/**
 * The Preguntas/Heatmap switch, living in the sticky filter row next to
 * "Personalizar" instead of its own row above it — one less horizontal band before
 * the reader reaches the results, and the switch now sits beside the
 * controls that already shape what those two views show.
 */
export function ResultsSubTabSwitch({ value, onChange }: ResultsSubTabSwitchProps) {
  return (
    <Tabs value={value} onValueChange={(val) => onChange(val as ResultsSubTab)} className="w-auto shrink-0">
      <TabsList>
        <TabsTrigger
          value="questions"
        >
          <List className="h-3.5 w-3.5" />
          Secciones
        </TabsTrigger>
        <TabsTrigger
          value="heatmap"
        >
          <Grid2X2 className="h-3.5 w-3.5" />
          Heatmap
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
