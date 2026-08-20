export default function PublicLoading() {
  return <div className="container grid min-h-[45vh] place-items-center py-16" aria-label="Chargement du contenu" role="status">
    <div className="flex items-center gap-3 rounded-full border bg-card/90 px-5 py-3 text-sm font-bold text-foreground/65 shadow-sm">
      <span className="size-4 animate-spin rounded-full border-2 border-primary/25 border-t-primary" aria-hidden="true"/>
      Chargement…
    </div>
  </div>;
}
