import {eq} from "drizzle-orm";
import {z} from "zod";
import {auth} from "@/auth";
import {db} from "@/db";
import {characters} from "@/db/schema";
import {slugify} from "@/lib/utils";
const schema=z.object({language:z.enum(["FR","EN"]),name:z.string().trim().min(2).max(80),shortDescription:z.string().trim().min(10).max(240),biography:z.string().trim().max(3000),ageLabel:z.string().trim().max(50),species:z.string().trim().max(80),personality:z.string().trim().max(500),hobbies:z.string().trim().max(500),motto:z.string().trim().max(180),color:z.string().regex(/^#[0-9A-F]{6}$/i),published:z.boolean(),sortOrder:z.number().int().min(0).max(9999)});
async function admin(){return(await auth())?.user.role==="ADMIN"}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){if(!await admin())return Response.json({message:"Non autorisé."},{status:401});const{id}=await params,parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({message:"Vérifiez les informations du personnage."},{status:400});await db.update(characters).set({...parsed.data,slug:`${slugify(parsed.data.name)}-${id.slice(0,6)}`,biography:parsed.data.biography||null,ageLabel:parsed.data.ageLabel||null,species:parsed.data.species||null,personality:parsed.data.personality||null,hobbies:parsed.data.hobbies||null,motto:parsed.data.motto||null,updatedAt:new Date()}).where(eq(characters.id,id));return Response.json({message:"Personnage modifié avec succès."})}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){if(!await admin())return Response.json({message:"Non autorisé."},{status:401});const{id}=await params;await db.delete(characters).where(eq(characters.id,id));return Response.json({message:"Personnage supprimé."})}
