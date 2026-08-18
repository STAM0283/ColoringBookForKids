"use client";

import { useRef, useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, Download, FileText, Film, HardDrive, ImageIcon, LoaderCircle, RotateCcw, Upload, X } from "lucide-react";

type Counts = { books:number; images:number; videos:number; pdf:number };
type Sizes = { database:number; images:number; videos:number; pdf:number };
type Disk = { total:number; used:number; available:number; isProduction:boolean };

export function BackupSettings({ sizes, counts, storageCapacity, databaseIntegrity, hostingProvider, disk }: { sizes:Sizes; counts:Counts; storageCapacity:number; databaseIntegrity:boolean; hostingProvider:string; disk:Disk }) {
  const input = useRef<HTMLInputElement>(null);
  const [restoreFile,setRestoreFile]=useState<File|null>(null),[loading,setLoading]=useState(false),[success,setSuccess]=useState<string|null>(null),[error,setError]=useState("");
  const totalMedia=sizes.images+sizes.videos+sizes.pdf;
  const totalUsed=sizes.database+totalMedia;
  const siteUsage=Math.min(100,totalUsed/storageCapacity*100);

  async function restore(){if(!restoreFile)return;setLoading(true);setError("");const form=new FormData();form.set("file",restoreFile);const response=await fetch("/api/admin/backups",{method:"POST",body:form}),data=await response.json().catch(()=>null) as {message?:string}|null;setLoading(false);setRestoreFile(null);if(input.current)input.current.value="";if(response.ok)setSuccess(data?.message||"Base restaurée avec succès.");else setError(data?.message||"Restauration impossible.")}

  return <div className="space-y-6">
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">Vue d’ensemble</p><h2 className="mt-2 text-2xl font-black">Contenu du site</h2><p className="mt-1 text-sm text-slate-500">Comptages SQLite et tailles réelles des fichiers rapportés au stockage configuré.</p></div><p className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">Médias : {formatBytes(totalMedia)}</p></div>
      <div className="mt-8 grid items-stretch gap-5 lg:grid-cols-[minmax(320px,.65fr)_minmax(0,1.35fr)]">
        <DatabaseHealth sitePercent={siteUsage} siteUsed={totalUsed} planCapacity={storageCapacity} databaseSize={sizes.database} integrity={databaseIntegrity} hostingProvider={hostingProvider} disk={disk}/>
        <div className="grid grid-cols-2 gap-4">
          <CircleStat label="Livres" value={counts.books} color="#0f766e" soft="#ccfbf1" icon={<BookOpen size={19}/>}/>
          <CircleStat label="Images" value={counts.images} color="#2563eb" soft="#dbeafe" icon={<ImageIcon size={19}/>}/>
          <CircleStat label="Vidéos" value={counts.videos} color="#7c3aed" soft="#ede9fe" icon={<Film size={19}/>}/>
          <CircleStat label="PDF" value={counts.pdf} color="#d97706" soft="#fef3c7" icon={<FileText size={19}/>}/>
        </div>
      </div>
    </section>

    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm">
        <span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><Download/></span>
        <h2 className="mt-5 text-xl font-black">Sauvegarder sur mon ordinateur</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">Téléchargez une copie complète de SQLite contenant vos livres, contenus, réglages et métadonnées.</p>
        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Format</span><strong>SQLite .db</strong></div><div className="mt-2 flex justify-between"><span className="text-slate-500">Taille actuelle</span><strong>{formatBytes(sizes.database)}</strong></div></div>
        <a href="/api/admin/backups/export" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 font-bold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700"><Download size={18}/> Télécharger la base</a>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm">
        <span className="grid size-12 place-items-center rounded-2xl bg-violet-50 text-violet-700"><RotateCcw/></span>
        <h2 className="mt-5 text-xl font-black">Récupérer une sauvegarde</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">Réimportez une base précédemment téléchargée. Le fichier est contrôlé avant toute restauration.</p>
        <button onClick={()=>input.current?.click()} className="mt-6 flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 text-violet-800 transition hover:border-violet-400 hover:bg-violet-50"><Upload size={24}/><strong className="mt-2 text-sm">Choisir une base SQLite</strong><small className="mt-1 text-violet-600/70">.db, .sqlite ou .sqlite3</small></button>
        <input ref={input} hidden type="file" accept=".db,.sqlite,.sqlite3,application/vnd.sqlite3" onChange={event=>setRestoreFile(event.target.files?.[0]||null)}/>
      </div>
    </section>

    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><HardDrive className="shrink-0 text-amber-700"/><div><p className="font-bold text-amber-950">Conseil simple</p><p className="mt-1 text-sm leading-relaxed text-amber-900/75">Téléchargez une copie après une modification importante ou une fois par semaine. Conservez-la dans un dossier sûr sur votre ordinateur.</p></div></div></div>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
    {restoreFile&&<ConfirmRestore filename={restoreFile.name} loading={loading} cancel={()=>setRestoreFile(null)} confirm={()=>void restore()}/>} {success&&<Success message={success} close={()=>setSuccess(null)}/>} 
  </div>;
}

function CircleStat({label,value,color,soft,icon}:{label:string;value:number;color:string;soft:string;icon:React.ReactNode}){const progress=Math.min(100,value?Math.max(12,value*8):0);return <div className="rounded-2xl border border-slate-200 p-4 text-center"><div className="relative mx-auto size-24"><Ring percent={progress} color={color} track={soft}/><span className="absolute inset-0 grid place-items-center"><span style={{color}}>{icon}</span></span></div><p className="mt-3 text-2xl font-black text-slate-900">{value}</p><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p></div>}
function DatabaseHealth({sitePercent,siteUsed,planCapacity,databaseSize,integrity,hostingProvider,disk}:{sitePercent:number;siteUsed:number;planCapacity:number;databaseSize:number;integrity:boolean;hostingProvider:string;disk:Disk}){const diskPercent=disk.total?Math.min(100,disk.used/disk.total*100):0,color=diskPercent>=85?"#dc2626":diskPercent>=70?"#d97706":"#16a34a";return <div className="flex h-full min-h-72 flex-col items-center justify-center rounded-[1.5rem] border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-white p-6 text-center shadow-sm"><p className="text-xs font-black uppercase tracking-[.18em] text-emerald-700">{disk.isProduction?`Stockage ${hostingProvider}`:"Disque de développement local"}</p><div className="relative mt-5 size-44"><Ring percent={diskPercent} color={color} track="#dcfce7"/><span className="absolute inset-0 grid place-items-center"><span><HardDrive size={23} className="mx-auto mb-2 text-slate-400"/><strong className="block text-3xl font-black text-slate-900">{formatPercent(diskPercent)}</strong><small className="font-bold text-slate-400">du disque utilisé</small></span></span></div><p className="mt-4 text-xs font-semibold text-slate-500">{formatBytes(disk.used)} utilisés sur {formatBytes(disk.total)} · {formatBytes(disk.available)} libres</p><div className="mt-4 w-full rounded-xl border border-slate-100 bg-white/80 p-3 text-left text-xs"><div className="flex justify-between gap-3"><span className="text-slate-500">Contenus du site</span><strong>{formatBytes(siteUsed)}</strong></div><div className="mt-1.5 flex justify-between gap-3"><span className="text-slate-500">Part du stockage configuré ({formatBytes(planCapacity)})</span><strong>{formatPercent(sitePercent)}</strong></div></div><div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-black ${integrity?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700"}`}><CheckCircle2 size={14}/> SQLite {integrity?"intègre":"à vérifier"} · {formatBytes(databaseSize)}</div></div>}
function Ring({percent,color,track}:{percent:number;color:string;track:string}){const radius=40,circumference=2*Math.PI*radius;return <svg viewBox="0 0 100 100" className="size-full -rotate-90"><circle cx="50" cy="50" r={radius} fill="none" stroke={track} strokeWidth="9"/><circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference*(1-percent/100)} className="transition-all duration-700"/></svg>}
function Modal({children,close}:{children:React.ReactNode;close:()=>void}){return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" onMouseDown={close}><div onMouseDown={event=>event.stopPropagation()} className="w-full max-w-md rounded-[1.75rem] bg-white p-7 shadow-2xl">{children}</div></div>}
function ConfirmRestore({filename,loading,cancel,confirm}:{filename:string;loading:boolean;cancel:()=>void;confirm:()=>void}){return <Modal close={cancel}><span className="mx-auto grid size-16 place-items-center rounded-full bg-amber-100 text-amber-700"><AlertTriangle size={30}/></span><h2 className="mt-5 text-center text-2xl font-black text-slate-900">Restaurer cette base ?</h2><p className="mt-3 text-center text-sm leading-relaxed text-slate-500">Les données actuelles seront remplacées par <strong className="text-slate-800">{filename}</strong>. Une copie de sécurité sera créée avant l’opération.</p><div className="mt-7 grid grid-cols-2 gap-3"><button disabled={loading} onClick={cancel} className="rounded-xl border px-4 py-3 font-bold text-slate-600">Annuler</button><button disabled={loading} onClick={confirm} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-bold text-white">{loading?<LoaderCircle className="animate-spin" size={18}/>:<RotateCcw size={18}/>} Restaurer</button></div></Modal>}
function Success({message,close}:{message:string;close:()=>void}){return <Modal close={close}><button onClick={close} aria-label="Fermer" className="ml-auto grid size-9 place-items-center rounded-xl bg-slate-100"><X size={17}/></button><span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={32}/></span><h2 className="mt-5 text-center text-2xl font-black text-slate-900">Restauration réussie</h2><p className="mt-3 text-center text-slate-500">{message}</p><button onClick={close} className="mt-7 w-full rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">Terminer</button></Modal>}
function formatBytes(bytes:number){if(!bytes)return"0 o";const units=["o","Ko","Mo","Go"],index=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1);return`${(bytes/1024**index).toFixed(index?1:0)} ${units[index]}`}
function formatPercent(value:number){if(value>0&&value<0.01)return"< 0,01 %";return`${value.toLocaleString("fr-FR",{minimumFractionDigits:value<1?2:0,maximumFractionDigits:value<1?2:1})} %`}
