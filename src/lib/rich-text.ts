const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "ul", "ol", "li", "a", "span", "font", "blockquote"]);

export function sanitizeRichText(value: string) {
  if (!/<\/?[a-z][^>]*>/i.test(value)) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\r?\n/g, "<br>").trim();
  }
  let html = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|svg|math)[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|svg|math)[^>]*\/?>/gi, "");

  html = html.replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, rawName: string, rawAttributes: string) => {
    const name = rawName.toLowerCase();
    if (!allowedTags.has(name)) return "";
    if (tag.startsWith("</")) return name === "font" ? "</span>" : `</${name}>`;
    if (name === "br") return "<br>";
    if (name === "a") {
      const match = rawAttributes.match(/href\s*=\s*["']([^"']+)["']/i);
      const href = match?.[1]?.trim() || "";
      const safeHref = /^(https?:\/\/|mailto:|#)/i.test(href) ? href.replace(/&/g, "&amp;").replace(/"/g, "&quot;") : "#";
      return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">`;
    }
    if (name === "span" || name === "font") {
      const color = name === "font"
        ? rawAttributes.match(/color\s*=\s*["']?(#[0-9a-f]{3,8}|[a-z]+|rgb\([\d\s,.%]+\))/i)?.[1]
        : rawAttributes.match(/color\s*:\s*(#[0-9a-f]{3,8}|[a-z]+|rgb\([\d\s,.%]+\))/i)?.[1];
      return color ? `<span style="color:${color}">` : "<span>";
    }
    return `<${name}>`;
  });
  return html.trim();
}

export function richTextToPlainText(value: string) {
  return value.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function inlineMarkdown(value: string) {
  return value
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\[([^\]]+)]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
}

export function markdownToSafeHtml(markdown: string) {
  const output: string[] = [];
  let list: "ul" | "ol" | null = null;
  const closeList = () => { if (list) output.push(`</${list}>`); list = null; };

  for (const rawLine of markdown.replace(/\r/g, "").split("\n")) {
    const line = rawLine.trim();
    if (!line) { closeList(); continue; }
    const unordered = line.match(/^[-*+]\s+(.+)$/);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/);
    if (unordered || ordered) {
      const nextList = unordered ? "ul" : "ol";
      if (list !== nextList) { closeList(); list = nextList; output.push(`<${list}>`); }
      output.push(`<li>${inlineMarkdown((unordered || ordered)![1])}</li>`);
      continue;
    }
    closeList();
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) { output.push(`<${heading[1].length === 3 ? "h3" : "h2"}>${inlineMarkdown(heading[2])}</${heading[1].length === 3 ? "h3" : "h2"}>`); continue; }
    if (line.startsWith("> ")) { output.push(`<blockquote>${inlineMarkdown(line.slice(2))}</blockquote>`); continue; }
    output.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  closeList();
  return sanitizeRichText(output.join(""));
}

export function articleContentToHtml(value: string) {
  return /<\/?[a-z][^>]*>/i.test(value) ? sanitizeRichText(value) : markdownToSafeHtml(value);
}

export function htmlToMarkdown(value: string) {
  if (!/<\/?[a-z][^>]*>/i.test(value)) return value;
  return value
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gis, "### $1\n\n")
    .replace(/<(strong|b)[^>]*>(.*?)<\/\1>/gis, "**$2**")
    .replace(/<(em|i)[^>]*>(.*?)<\/\1>/gis, "*$2*")
    .replace(/<u[^>]*>(.*?)<\/u>/gis, "$1")
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gis, "[$2]($1)")
    .replace(/<li[^>]*>(.*?)<\/li>/gis, "- $1\n")
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, "> $1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n").replace(/<p[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n").trim();
}
