import { richTextToPlainText } from "./rich-text";

const WORDS_PER_MINUTE = 220;

export function readingTimeMinutes(content: string) {
  const plainText = richTextToPlainText(content).replace(/!\[[^\]]*]\([^)]*\)/g, " ").replace(/\[([^\]]+)]\([^)]*\)/g, "$1").replace(/[#>*_`~|=-]/g, " ");
  const words = plainText.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export function readingTimeLabel(content: string, locale: "fr" | "en" = "fr") {
  const minutes = readingTimeMinutes(content);
  return locale === "en" ? `${minutes} min read` : `${minutes} min de lecture`;
}
