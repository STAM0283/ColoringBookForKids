export default function PublicLoading() {
  return <div className="container animate-pulse py-16" aria-label="Chargement du contenu" role="status">
    <div className="h-4 w-32 rounded-full bg-primary/15"/>
    <div className="mt-5 h-12 max-w-2xl rounded-2xl bg-foreground/10"/>
    <div className="mt-4 h-5 max-w-xl rounded-full bg-foreground/5"/>
    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({length:6},(_,index)=><div key={index} className="overflow-hidden rounded-[1.5rem] border bg-card"><div className="aspect-[4/3] bg-foreground/5"/><div className="space-y-3 p-5"><div className="h-4 w-24 rounded-full bg-primary/10"/><div className="h-7 w-4/5 rounded-lg bg-foreground/10"/><div className="h-4 w-full rounded-full bg-foreground/5"/></div></div>)}
    </div>
    <span className="sr-only">Chargement…</span>
  </div>;
}
