import * as React from "react";
import { Flag, Home } from "lucide-react";
import { AiAnalyzingState } from "@/components/ai-interaction";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiCreateChip } from "./AiCreateChip";
import { refinePageMessage, type PageMessageKind } from "./aiPageWording";
import { RichTextEditor } from "./RichTextEditor";

interface PagesEditorProps {
  welcomeContent: string;
  closingContent: string;
  onWelcomeChange: (content: string) => void;
  onClosingChange: (content: string) => void;
}

export function PagesEditor({
  welcomeContent,
  closingContent,
  onWelcomeChange,
  onClosingChange,
}: PagesEditorProps) {
  // Which page's message the AI is currently rewriting — at most one at a
  // time, since the two tabs are never both in view.
  const [improving, setImproving] = React.useState<PageMessageKind | null>(null);

  const handleImprove = async (kind: PageMessageKind) => {
    setImproving(kind);
    const content = kind === "welcome" ? welcomeContent : closingContent;
    const improved = await refinePageMessage(content, kind);
    if (kind === "welcome") onWelcomeChange(improved);
    else onClosingChange(improved);
    setImproving(null);
  };

  return (
    <section className="flex min-w-0 flex-1 flex-col self-stretch rounded-2xl border border-border/60 bg-surface shadow-card">
      <div className="flex flex-col gap-4 p-5">
        <Tabs defaultValue="welcome" className="w-full">
          <TabsList variant="page" className="grid w-full grid-cols-2">
            <TabsTrigger value="welcome">
              <Home className="h-4 w-4" />
              Mensaje de bienvenida
            </TabsTrigger>
            <TabsTrigger value="closing">
              <Flag className="h-4 w-4" />
              Mensaje de cierre
            </TabsTrigger>
          </TabsList>

          <TabsContent value="welcome" className="mt-6 flex flex-col gap-4 outline-none cascade-enter">
            <div className="flex items-start justify-between gap-3">
              <p className="max-w-2xl text-[13px] leading-relaxed text-text-secondary">
                Primera pantalla del participante: propósito, duración y confidencialidad. En blanco, no se muestra.
              </p>
              <AiCreateChip
                label="Mejorar con IA"
                onClick={() => void handleImprove("welcome")}
                disabled={improving !== null}
                className="h-8 shrink-0 px-2.5 text-[12px]"
              />
            </div>
            {improving === "welcome" && (
              <AiAnalyzingState variant="inline" title="Mejorando el mensaje de bienvenida…" />
            )}
            <div className="relative">
              <RichTextEditor
                value={welcomeContent}
                onChange={onWelcomeChange}
                placeholder="Añade un mensaje de bienvenida aquí"
                ariaLabel="Mensaje de bienvenida"
              />
            </div>
          </TabsContent>

          <TabsContent value="closing" className="mt-6 flex flex-col gap-4 outline-none cascade-enter">
            <div className="flex items-start justify-between gap-3">
              <p className="max-w-2xl text-[13px] leading-relaxed text-text-secondary">
                Última pantalla al enviar: agradecimiento y próximos pasos. En blanco, no se muestra.
              </p>
              <AiCreateChip
                label="Mejorar con IA"
                onClick={() => void handleImprove("closing")}
                disabled={improving !== null}
                className="h-8 shrink-0 px-2.5 text-[12px]"
              />
            </div>
            {improving === "closing" && (
              <AiAnalyzingState variant="inline" title="Mejorando el mensaje de cierre…" />
            )}
            <div className="relative">
              <RichTextEditor
                value={closingContent}
                onChange={onClosingChange}
                placeholder="Añade un mensaje de cierre aquí"
                ariaLabel="Mensaje de cierre"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
