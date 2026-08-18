import { BarChart3, CalendarDays, MousePointerClick, Sparkles, TrendingUp, Users } from "lucide-react";
import { VisitorStatsReset } from "./visitor-stats-reset";

type Point = { label: string; visitors: number };

export function VisitorAnalytics({ today, month, total, pageViewsToday, daily, monthly }: { today: number; month: number; total: number; pageViewsToday: number; daily: Point[]; monthly: Point[] }) {
  return <section className="mb-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">Audience du site</p><h2 className="mt-2 text-2xl font-black">Visiteurs</h2><p className="mt-1 text-sm text-slate-500">Visiteurs uniques anonymes enregistrés dans SQLite, hors robots et administration.</p></div><VisitorStatsReset/></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric icon={<Users/>} label="Aujourd’hui" value={today} detail="visiteurs uniques" color="emerald"/>
      <Metric icon={<CalendarDays/>} label="Ce mois" value={month} detail="visiteurs uniques" color="blue"/>
      <Metric icon={<TrendingUp/>} label="Depuis le lancement" value={total} detail="navigateurs uniques" color="violet"/>
      <Metric icon={<MousePointerClick/>} label="Pages aujourd’hui" value={pageViewsToday} detail="chargements enregistrés" color="orange"/>
    </div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <Chart title="7 derniers jours" points={daily}/>
      <Chart title="6 derniers mois" points={monthly}/>
    </div>
  </section>;
}

function Metric({icon,label,value,detail,color}:{icon:React.ReactNode;label:string;value:number;detail:string;color:"emerald"|"blue"|"violet"|"orange"}) {
  const colors={emerald:"bg-emerald-50 text-emerald-700",blue:"bg-blue-50 text-blue-700",violet:"bg-violet-50 text-violet-700",orange:"bg-orange-50 text-orange-700"};
  return <div className="flex items-center gap-4 rounded-2xl border p-4"><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${colors[color]}`}>{icon}</span><div><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-1 text-3xl font-black text-slate-900">{value.toLocaleString("fr-FR")}</p><p className="text-[11px] text-slate-400">{detail}</p></div></div>;
}

function Chart({title,points}:{title:string;points:Point[]}) {
  const maximum=Math.max(0,...points.map(point=>point.visitors)),sum=points.reduce((total,point)=>total+point.visitors,0);
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><BarChart3 size={19}/></span><div><h3 className="font-black text-slate-800">{title}</h3><p className="text-[11px] text-slate-400">Évolution des visiteurs uniques</p></div></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">{sum.toLocaleString("fr-FR")} visite{sum>1?"s":""}</span></div>
    {maximum===0?<div className="grid min-h-48 place-items-center px-6 py-8 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Sparkles size={24}/></span><p className="mt-4 font-black text-slate-700">Les prochaines visites apparaîtront ici</p><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">Le graphique se remplira automatiquement dès qu’un nouveau visiteur ouvrira le site.</p></div></div>:<div className="relative px-5 pb-4 pt-6"><div className="pointer-events-none absolute inset-x-5 bottom-11 top-6 flex flex-col justify-between">{[0,1,2,3].map(line=><span key={line} className="border-t border-dashed border-slate-200"/>)}</div><div className="relative flex h-44 items-end gap-2">{points.map(point=><div key={point.label} className="group flex h-full min-w-0 flex-1 flex-col justify-end"><span className={`mb-2 text-center text-xs font-black transition ${point.visitors?"text-slate-700":"text-slate-300"}`}>{point.visitors}</span><div className={`mx-auto w-full max-w-11 rounded-t-xl transition duration-300 ${point.visitors?"bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_8px_20px_rgba(5,150,105,.18)] group-hover:from-emerald-700 group-hover:to-emerald-500":"bg-slate-200"}`} style={{height:`${point.visitors?Math.max(12,(point.visitors/maximum)*100):3}%`}}/><span className="mt-3 truncate text-center text-[10px] font-bold capitalize text-slate-400">{point.label}</span></div>)}</div></div>}
  </div>;
}
