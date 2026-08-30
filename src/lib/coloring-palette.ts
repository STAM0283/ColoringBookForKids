export const COLORING_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#FACC15", "#A3E635", "#22C55E",
  "#10B981", "#14B8A6", "#06B6D4", "#38BDF8", "#2563EB", "#4F46E5",
  "#8B5CF6", "#A855F7", "#D946EF", "#EC4899", "#F43F5E", "#92400E",
  "#D97706", "#F4A261", "#FBC4AB", "#FDE68A", "#86EFAC", "#99F6E4",
  "#BAE6FD", "#C7D2FE", "#DDD6FE", "#FBCFE8", "#64748B", "#111827",
  "#FFFFFF",
] as const;

export function coloringCheckClass(color:string) {
  return ["#92400E", "#2563EB", "#4F46E5", "#8B5CF6", "#64748B", "#111827"].includes(color) ? "text-white" : "text-slate-950";
}
