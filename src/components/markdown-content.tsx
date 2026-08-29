import { articleContentToHtml } from "@/lib/rich-text";

export function MarkdownContent({ value, className="" }: { value: string; className?: string }) {
  return <div className={`rich-article ${className}`} dangerouslySetInnerHTML={{ __html:articleContentToHtml(value) }}/>;
}
