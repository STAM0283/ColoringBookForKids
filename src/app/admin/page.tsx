import { readdir, stat, statfs } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { ArrowUpRight, BookOpen, FilePlus2 } from "lucide-react";
import { eq, gte, like, sql } from "drizzle-orm";
import { BackupSettings } from "@/components/admin/backup-settings";
import { VisitorAnalytics } from "@/components/admin/visitor-analytics";
import { db, databasePath, sqlite } from "@/db";
import { books, media, siteVisits } from "@/db/schema";

export default async function Dashboard(){
 const mediaRoot=path.resolve(/* turbopackIgnore: true */ process.env.MEDIA_ROOT??"./data/media");
 const [databaseSize,imagesSize,pdfSize,videosSize,disk]=await Promise.all([safeSize(databasePath),folderSize(path.join(mediaRoot,"images")),folderSize(path.join(mediaRoot,"pdf")),folderSize(path.join(mediaRoot,"videos")),getDiskUsage(mediaRoot)]);
 const sizes={database:databaseSize,images:imagesSize,pdf:pdfSize,videos:videosSize};
 const [[bookCount],[imageCount],[videoCount],[pdfCount]]=await Promise.all([
  db.select({count:sql<number>`count(*)`}).from(books),
  db.select({count:sql<number>`count(*)`}).from(media).where(eq(media.type,"IMAGE")),
  db.select({count:sql<number>`count(*)`}).from(media).where(eq(media.type,"VIDEO")),
  db.select({count:sql<number>`count(*)`}).from(media).where(eq(media.type,"PDF")),
 ]);
 const counts={books:Number(bookCount.count),images:Number(imageCount.count),videos:Number(videoCount.count),pdf:Number(pdfCount.count)};
 const storageCapacity=Number(process.env.OVH_STORAGE_CAPACITY_BYTES)||40*1024**3;
 const databaseIntegrity=sqlite.pragma("integrity_check",{simple:true})==="ok";
 const now=new Date(),today=parisDate(now),currentMonth=today.slice(0,7),firstDaily=parisDate(new Date(now.getTime()-6*86400000));
 const [[todayVisitors],[monthVisitors],[totalVisitors],[todayPages],dailyRows,monthlyRows]=await Promise.all([
  db.select({count:sql<number>`count(*)`}).from(siteVisits).where(eq(siteVisits.visitedOn,today)),
  db.select({count:sql<number>`count(distinct ${siteVisits.visitorHash})`}).from(siteVisits).where(like(siteVisits.visitedOn,`${currentMonth}-%`)),
  db.select({count:sql<number>`count(distinct ${siteVisits.visitorHash})`}).from(siteVisits),
  db.select({count:sql<number>`coalesce(sum(${siteVisits.pageViews}),0)`}).from(siteVisits).where(eq(siteVisits.visitedOn,today)),
  db.select({day:siteVisits.visitedOn,visitors:sql<number>`count(*)`}).from(siteVisits).where(gte(siteVisits.visitedOn,firstDaily)).groupBy(siteVisits.visitedOn),
  db.select({month:sql<string>`substr(${siteVisits.visitedOn},1,7)`,visitors:sql<number>`count(distinct ${siteVisits.visitorHash})`}).from(siteVisits).groupBy(sql`substr(${siteVisits.visitedOn},1,7)`).orderBy(sql`substr(${siteVisits.visitedOn},1,7) desc`).limit(6),
 ]);
 const daily=lastDays(7).map(day=>({label:new Intl.DateTimeFormat("fr-FR",{weekday:"short"}).format(new Date(`${day}T12:00:00`)),visitors:Number(dailyRows.find(row=>row.day===day)?.visitors??0)}));
 const monthly=lastMonths(6).map(month=>({label:new Intl.DateTimeFormat("fr-FR",{month:"short"}).format(new Date(`${month}-01T12:00:00`)),visitors:Number(monthlyRows.find(row=>row.month===month)?.visitors??0)}));
 return <div className="mx-auto max-w-7xl">
  <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.2em] text-emerald-700">Centre de pilotage</p><h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Dashboard</h1><p className="mt-2 text-slate-500">Contenus, état du système et sauvegardes réunis sur une seule page.</p></div><Link href="/" target="_blank" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border bg-white px-5 text-sm font-bold text-slate-700 shadow-sm">Voir le site <ArrowUpRight size={17}/></Link></header>
  <section className="mb-6 grid gap-4 sm:grid-cols-2"><Link href="/admin/livres" className="group flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><BookOpen/></span><span><strong className="block">Gérer les livres</strong><small className="text-slate-500">Ajouter un livre ou modifier le catalogue</small></span><ArrowUpRight className="ml-auto text-slate-300 transition group-hover:text-emerald-600"/></Link><Link href="/admin/activites" className="group flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="grid size-12 place-items-center rounded-2xl bg-blue-50 text-blue-700"><FilePlus2/></span><span><strong className="block">Ajouter une activité</strong><small className="text-slate-500">Convertir les images et publier le PDF</small></span><ArrowUpRight className="ml-auto text-slate-300 transition group-hover:text-blue-600"/></Link></section>
  <VisitorAnalytics today={Number(todayVisitors.count)} month={Number(monthVisitors.count)} total={Number(totalVisitors.count)} pageViewsToday={Number(todayPages.count)} daily={daily} monthly={monthly}/>
  <BackupSettings sizes={sizes} counts={counts} storageCapacity={storageCapacity} databaseIntegrity={databaseIntegrity} disk={{...disk,isProduction:process.env.NODE_ENV==="production"}}/>
 </div>
}

async function safeSize(file:string){try{return (await stat(file)).size}catch{return 0}}
async function folderSize(folder:string):Promise<number>{try{const entries=await readdir(folder,{withFileTypes:true});const sizes=await Promise.all(entries.map(entry=>entry.isDirectory()?folderSize(path.join(folder,entry.name)):safeSize(path.join(folder,entry.name))));return sizes.reduce((sum,size)=>sum+size,0)}catch{return 0}}
async function getDiskUsage(target:string){try{const stats=await statfs(target),total=stats.bsize*stats.blocks,available=stats.bsize*stats.bavail;return{total,available,used:Math.max(0,total-available)}}catch{return{total:0,available:0,used:0}}}
function parisDate(date:Date){return new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Paris",year:"numeric",month:"2-digit",day:"2-digit"}).format(date)}
function lastDays(count:number){return Array.from({length:count},(_,index)=>parisDate(new Date(Date.now()-(count-1-index)*86400000)))}
function lastMonths(count:number){const now=new Date();return Array.from({length:count},(_,index)=>{const date=new Date(now.getFullYear(),now.getMonth()-(count-1-index),1);return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`})}
