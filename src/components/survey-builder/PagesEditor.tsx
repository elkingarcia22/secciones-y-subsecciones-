import * as React from "react";
import { Flag, Home, type LucideIcon } from "lucide-react";
import { AiAnalyzingState } from "@/components/ai-interaction";
import { toneChip } from "@/lib/tone";
import { AiCreateChip } from "./AiCreateChip";
import { refinePageMessage, type PageMessageKind } from "./aiPageWording";
import { isHtmlEmpty, RichTextEditor } from "./RichTextEditor";

interface PagesEditorProps {
  welcomeContent: string;
  closingContent: string;
  onWelcomeChange: (content: string) => void;
  onClosingChange: (content: string) => void;
}

/**
 * Bienvenida y cierre used to hide behind a tab, one message at a time. They
 * are short enough to both stay on screen, so this stacks them as two titled
 * blocks instead — no click needed to compare tone between the opening line
 * and the goodbye.
 */
export function PagesEditor({
  welcomeContent,
  closingContent,
  onWelcomeChange,
  onClosingChange,
}: PagesEditorProps) {
  // Which page's message the AI is currently rewriting — at most one at a
  // time, so the other block's "Generar/Mejorar con IA" chip disables while
  // it runs instead of firing a second request.
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
    <section className="mb-20 flex min-w-0 flex-1 flex-col self-stretch rounded-2xl border border-border/60 bg-surface shadow-card">
      {/* `mb-20` clears the floating side rail: with both messages always on
          screen (no more tab hiding one), this card is tall enough to scroll
          its own bottom edge behind the rail without it. */}
      <div className="flex flex-col gap-6 p-5">
        <PageMessageBlock
          icon={Home}
          title="Mensaje de bienvenida"
          description="Primera pantalla del participante: propósito, duración y confidencialidad. En blanco, no se muestra."
          content={welcomeContent}
          onChange={onWelcomeChange}
          onImprove={() => void handleImprove("welcome")}
          isImproving={improving === "welcome"}
          improvingLabel="Mejorando el mensaje de bienvenida…"
          disabled={improving !== null}
          placeholder="Añade un mensaje de bienvenida aquí"
          ariaLabel="Mensaje de bienvenida"
        />

        <div className="border-t border-border/60" />

        <PageMessageBlock
          icon={Flag}
          title="Mensaje de cierre"
          description="Última pantalla al enviar: agradecimiento y próximos pasos. En blanco, no se muestra."
          content={closingContent}
          onChange={onClosingChange}
          onImprove={() => void handleImprove("closing")}
          isImproving={improving === "closing"}
          improvingLabel="Mejorando el mensaje de cierre…"
          disabled={improving !== null}
          placeholder="Añade un mensaje de cierre aquí"
          ariaLabel="Mensaje de cierre"
        />
      </div>
    </section>
  );
}

function PageMessageBlock({
  icon: Icon,
  title,
  description,
  content,
  onChange,
  onImprove,
  isImproving,
  improvingLabel,
  disabled,
  placeholder,
  ariaLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  content: string;
  onChange: (content: string) => void;
  onImprove: () => void;
  isImproving: boolean;
  improvingLabel: string;
  disabled: boolean;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4 cascade-enter">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]"
            style={toneChip("brand")}
          >
            <Icon className="h-[17px] w-[17px]" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-text-primary">{title}</h3>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-text-secondary">
              {description}
            </p>
          </div>
        </div>
        <AiCreateChip
          label={isHtmlEmpty(content) ? "Generar con IA" : "Mejorar con IA"}
          onClick={onImprove}
          disabled={disabled}
          className="h-8 shrink-0 px-2.5 text-[12px]"
        />
      </div>
      {isImproving && <AiAnalyzingState variant="inline" title={improvingLabel} />}
      <div className="relative">
        <RichTextEditor
          value={content}
          onChange={onChange}
          placeholder={placeholder}
          ariaLabel={ariaLabel}
        />
      </div>
    </div>
  );
}
