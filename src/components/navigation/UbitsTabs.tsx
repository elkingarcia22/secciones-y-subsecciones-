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
  variant?: "default" | "results";
  /**
   * Sizes the strip to its labels instead of stretching it across the row.
   * With six tabs, splitting the full width reads as a nav bar; with two it
   * reads as two oversized buttons, so a short set sits compact on the left.
   */
  fitContent?: boolean;
}

/**
 * UBITS TABS
 * Reusing the core generic Tabs UI components to maintain consistency with the blank survey creation.
 */
export const UbitsTabs: React.FC<UbitsTabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  className,
  variant = "default",
  fitContent = false,
}) => {
  return (
    <Tabs value={activeTabId} onValueChange={onTabChange} className={cn("w-full mb-8", className)}>
      <TabsList
        className={cn(
          fitContent ? "inline-flex w-auto" : "grid w-full",
          variant === "results" && "rounded-full bg-[#eef2ff]"
        )}
        style={
          fitContent
            ? undefined
            : { gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }
        }
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className={cn(
              "gap-2 text-[13px] font-bold",
              fitContent && "px-5",
              variant === "results" && "rounded-full data-[state=active]:bg-brand data-[state=active]:text-white"
            )}
          >
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};
