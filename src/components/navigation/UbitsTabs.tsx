import * as React from "react";
import { cn } from "@/lib/utils";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface UbitsTabsProps {
  tabs: TabItem[];
  activeTabId: string;
  onTabChange: (id: string) => void;
  className?: string;
  /**
   * Which of the two tiers this strip belongs to.
   *
   * `page` switches what the whole screen is showing — the home's two
   * dashboards, a measurement's five readings. It gets the filled pill, the
   * one treatment in the app loud enough to survive sitting alone above a
   * full page of content.
   *
   * `view` switches a panel inside the page and is the default. It inherits
   * the sidebar's own segmented control: recessed track, raised surface on
   * the active segment, label in the accent. Same shape the "Workspace /
   * Agente IA" switch uses two columns to the left.
   */
  variant?: "view" | "page";
  /**
   * Sizes the strip to its labels instead of stretching it across the row.
   * With six tabs, splitting the full width reads as a nav bar; with two it
   * reads as two oversized buttons, so a short set sits compact on the left.
   */
  fitContent?: boolean;
}

/**
 * UBITS TABS
 *
 * The two tiers above are the only two tab treatments in the app. Everything
 * that switches a view builds on `ui/tabs`, so a strip declared here and a
 * strip declared inline in a results panel come out identical.
 */
export const UbitsTabs: React.FC<UbitsTabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  className,
  variant = "view",
  fitContent = false,
}) => {
  return (
    <Tabs value={activeTabId} onValueChange={onTabChange} className={cn("mb-8 w-full", className)}>
      <TabsList
        variant={variant}
        className={cn(fitContent ? "inline-flex w-auto" : "grid w-full")}
        style={
          fitContent
            ? undefined
            : { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }
        }
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className={cn(fitContent && "px-5")}>
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
