import { Flag, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  return (
    <section className="flex min-w-0 flex-1 flex-col self-stretch rounded-2xl border border-border/50 bg-surface shadow-card">
      <div className="flex flex-col gap-4 p-5">
        <Tabs defaultValue="welcome" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="welcome" className="gap-2 text-[13px]">
              <Home className="h-4 w-4" />
              Mensaje de bienvenida
            </TabsTrigger>
            <TabsTrigger value="closing" className="gap-2 text-[13px]">
              <Flag className="h-4 w-4" />
              Mensaje de cierre
            </TabsTrigger>
          </TabsList>

          <TabsContent value="welcome" className="mt-6 flex flex-col gap-4 outline-none">
            <p className="max-w-2xl text-[12.5px] leading-relaxed text-text-secondary">
              Primera pantalla que ve el participante. Explica el propósito de la encuesta, el tiempo estimado y el tratamiento de la información. Si lo dejas en blanco, no se mostrará.
            </p>
            <div className="relative">
              <RichTextEditor
                value={welcomeContent}
                onChange={onWelcomeChange}
                placeholder="Añade un mensaje de bienvenida aquí"
                ariaLabel="Mensaje de bienvenida"
              />
            </div>
          </TabsContent>

          <TabsContent value="closing" className="mt-6 flex flex-col gap-4 outline-none">
            <p className="max-w-2xl text-[12.5px] leading-relaxed text-text-secondary">
              Mensaje final que se muestra al enviar las respuestas. Úsalo para agradecer la participación y contar los siguientes pasos. Si lo dejas en blanco, no se mostrará.
            </p>
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
