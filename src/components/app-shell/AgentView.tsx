import * as React from "react";
import { ArrowUp, Plus } from "lucide-react";
import { AGENT_SUGGESTIONS, AI_GRADIENT, CURRENT_USER } from "./appShellData";

/**
 * Visual-only representation of the Agente IA surface. It mirrors the
 * reference layout (greeting, input card, suggestions) without any chat
 * behavior — the suggestions simply fill the input.
 */
export const AgentView: React.FC = () => {
  const [prompt, setPrompt] = React.useState("");
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const firstName = CURRENT_USER.name;

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-6">
      <div className="mx-auto flex w-full max-w-[820px] flex-col py-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h1 className="mb-8 text-center text-3xl font-semibold tracking-tight text-text-primary lg:text-[40px] lg:leading-tight">
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: AI_GRADIENT }}
          >
            ¡Buenos días,
          </span>{" "}
          {firstName}!
        </h1>

        <div className="rounded-3xl border border-border/70 bg-surface p-4 shadow-[var(--shadow-card)]">
          <textarea
            ref={inputRef}
            rows={2}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="¿Cuéntame como te puedo ayudar?"
            className="min-h-12 w-full resize-none bg-transparent text-base leading-normal text-text-primary outline-none placeholder:text-text-muted"
          />
          <div className="mt-2 flex items-center justify-between">
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface text-text-secondary transition-colors hover:bg-background"
              title="Agregar"
              aria-label="Agregar"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-all hover:-translate-y-0.5 hover:brightness-110"
              style={{ background: AI_GRADIENT }}
              title="Enviar"
              aria-label="Enviar"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-text-muted">
          El Agente IA puede cometer errores, verifica las respuestas.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AGENT_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setPrompt(suggestion);
                inputRef.current?.focus();
              }}
              className="rounded-2xl border border-border/70 bg-surface p-4 text-left text-[13px] font-medium leading-snug text-text-secondary transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:text-text-primary hover:shadow-[var(--shadow-card)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
