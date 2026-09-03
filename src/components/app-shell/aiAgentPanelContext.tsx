import * as React from "react";
import type { AiAgentContext } from "@/components/ai/AiAgentPanel";

interface AiAgentPanelApi {
  open: boolean;
  context: AiAgentContext;
  openPanel: (context: AiAgentContext) => void;
  closePanel: () => void;
}

const AiAgentPanelReactContext = React.createContext<AiAgentPanelApi | null>(null);

export const AiAgentPanelProvider = AiAgentPanelReactContext.Provider;

/**
 * Lets a screen's action rail open the shared AI panel without owning where
 * it renders. The panel itself lives in `AdminShell`, as a flex sibling of
 * the page content — opening it narrows the content column instead of
 * covering it, which only works if every trigger shares one open/close state
 * instead of each rail mounting its own drawer.
 */
export function useAiAgentPanel(): AiAgentPanelApi {
  const ctx = React.useContext(AiAgentPanelReactContext);
  if (!ctx) {
    throw new Error("useAiAgentPanel must be used within AdminShell");
  }
  return ctx;
}
