import { asc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { activities, activityTypes } from "@/db/schema";
import { slugify } from "@/lib/utils";

const colorPattern=/^#[0-9A-F]{6}$/i;
export async function GET(){if((await auth())?.user.role!=="ADMIN")return Response.json({message:"Non autorisé."},{status:401});const items=await db.select({type:activityTypes,activityCount:sql<number>`count(${activities.id})`}).from(activityTypes).leftJoin(activities,eq(activities.activityTypeId,activityTypes.id)).groupBy(activityTypes.id).orderBy(asc(activityTypes.language),asc(activityTypes.sortOrder),asc(activityTypes.name));return Response.json({items:items.map(({type,activityCount})=>({...type,activityCount:Number(activityCount)}))})}
export async function POST(request:Request){if((await auth())?.user.role!=="ADMIN")return Response.json({message:"Non autorisé."},{status:401});const body=await request.json().catch(()=>null)as{name?:string;description?:string;color?:string;badge?:string;language?:string}|null,name=body?.name?.trim(),language=body?.language==="EN"?"EN":"FR",color=body?.color?.toUpperCase()||"#0F8A68",badge=body?.badge?.trim()||"🎨";if(!name||name.length<2||name.length>60)return Response.json({message:"Le nom doit contenir entre 2 et 60 caractères."},{status:400});if(!colorPattern.test(color)||badge.length>12)return Response.json({message:"Couleur ou badge invalide."},{status:400});try{const id=crypto.randomUUID();await db.insert(activityTypes).values({id,language,name,slug:slugify(name),description:body?.description?.trim()||null,color,badge});return Response.json({message:"Type d’activité créé.",id},{status:201})}catch{return Response.json({message:"Ce type existe déjà dans cette langue."},{status:409})}}
