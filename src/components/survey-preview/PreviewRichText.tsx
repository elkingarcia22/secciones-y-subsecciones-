import * as React from "react";
import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

interface PreviewRichTextProps {
  html: string;
  className?: string;
}

/**
 * Renders what the author wrote on the welcome or closing page.
 *
 * The typography lives here rather than in the editor's own styles: the same
 * markup has to read as a form field while it is being written and as a page of
 * copy while it is being read.
 */
export function PreviewRichText({ html, className }: PreviewRichTextProps) {
  const safe = React.useMemo(() => sanitizeHtml(html), [html]);

  return (
    <div
      className={cn(
        "text-[14.5px] leading-[1.7] text-text-secondary",
        "[&_p]:mb-3 [&_p:last-child]:mb-0",
        "[&_strong]:font-semibold [&_strong]:text-text-primary [&_b]:font-semibold [&_b]:text-text-primary",
        "[&_h1]:mb-2 [&_h1]:text-[19px] [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-text-primary",
        "[&_h2]:mb-2 [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:text-text-primary",
        "[&_h3]:mb-2 [&_h3]:text-[15px] [&_h3]:font-bold [&_h3]:text-text-primary",
        "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1",
        "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic",
        "[&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px]",
        "[&_hr]:my-4 [&_hr]:border-border/60",
        className
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
