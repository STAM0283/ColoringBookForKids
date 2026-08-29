import { eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { activities, activityTypes } from "@/db/schema";
import { slugify } from "@/lib/utils";

const colorPattern=/^#[0-9A-F]{6}$/i;
async function admin(){return(await auth())?.user.role==="ADMIN"}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){if(!await admin())return Response.json({message:"Non autorisé."},{status:401});const{id}=await params,body=await request.json().catch(()=>null)as{name?:string;description?:string;color?:string;badge?:string;language?:string}|null,name=body?.name?.trim(),language=body?.language==="EN"?"EN":"FR",color=body?.color?.toUpperCase(),badge=body?.badge?.trim();if(!name||!color||!colorPattern.test(color)||!badge)return Response.json({message:"Données invalides."},{status:400});try{await db.update(activityTypes).set({name,language,slug:slugify(name),description:body?.description?.trim()||null,color,badge,updatedAt:new Date()}).where(eq(activityTypes.id,id));return Response.json({message:"Type d’activité modifié."})}catch{return Response.json({message:"Ce type existe déjà dans cette langue."},{status:409})}}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){if(!await admin())return Response.json({message:"Non autorisé."},{status:401});const{id}=await params,[{count}]=await db.select({count:sql<number>`count(*)`}).from(activities).where(eq(activities.activityTypeId,id));if(Number(count)>0)return Response.json({message:"Ce type est utilisé. Réaffectez d’abord les activités concernées."},{status:409});await db.delete(activityTypes).where(eq(activityTypes.id,id));return Response.json({message:"Type d’activité supprimé."})}
