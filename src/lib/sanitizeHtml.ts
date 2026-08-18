/**
 * Allowlist sanitizer for the HTML the rich-text editor produces.
 *
 * The editor is a `contentEditable`, so anything a pasted clipboard carries —
 * scripts, `onerror` handlers, `javascript:` links — arrives with it. Rendering
 * that back with `dangerouslySetInnerHTML` would run it, so nothing reaches the
 * DOM unless it is on these lists.
 */

/** Formatting the editor's toolbar can produce, and nothing else. */
const ALLOWED_TAGS = new Set([
  "P", "BR", "DIV", "SPAN",
  "B", "STRONG", "I", "EM", "U", "S", "STRIKE",
  "UL", "OL", "LI",
  "H1", "H2", "H3", "H4",
  "BLOCKQUOTE", "PRE", "CODE", "HR", "A",
]);

/** Attributes kept per tag. Everything else — style, class, on* — is dropped. */
const ALLOWED_ATTRS: Readonly<Record<string, readonly string[]>> = {
  A: ["href", "title"],
};

const SAFE_LINK = /^(https?:|mailto:|tel:|#|\/)/i;

function clean(node: Element): void {
  for (const child of Array.from(node.children)) {
    if (!ALLOWED_TAGS.has(child.tagName)) {
      // Keep the text, drop the wrapper: a disallowed <font> or <script> should
      // never take its contents down with it silently.
      child.replaceWith(...Array.from(child.childNodes));
      continue;
    }

    const allowed = ALLOWED_ATTRS[child.tagName] ?? [];
    for (const attr of Array.from(child.attributes)) {
      if (!allowed.includes(attr.name.toLowerCase())) child.removeAttribute(attr.name);
    }

    if (child.tagName === "A") {
      const href = child.getAttribute("href") ?? "";
      if (!SAFE_LINK.test(href)) child.removeAttribute("href");
      child.setAttribute("rel", "noopener noreferrer");
      child.setAttribute("target", "_blank");
    }

    clean(child);
  }
}

export function sanitizeHtml(html: string): string {
  if (!html.trim()) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");
  // `<script>` inside a parsed document is inert, but it still has to go — the
  // string is about to be re-inserted into the live DOM.
  doc.body.querySelectorAll("script, style, iframe, object, embed").forEach((el) => el.remove());
  clean(doc.body);

  return doc.body.innerHTML;
}

/** Whether the content is empty once markup is discounted. */
export const isHtmlBlank = (html: string): boolean =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";
