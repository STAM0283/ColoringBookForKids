import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { media, posts } from "@/db/schema";
import { storageService } from "@/lib/storage/local-storage";
import { articleContentToHtml, richTextToPlainText } from "@/lib/rich-text";
const richContent=z.string().max(100000).refine(value=>richTextToPlainText(articleContentToHtml(value)).length>=20,{message:"Le contenu doit contenir au moins 20 caractères."});
const schema=z.object({title:z.string().trim().min(3).max(180),excerpt:z.string().trim().min(10).max(400),content:richContent,authorName:z.string().trim().min(2).max(100),published:z.boolean(),featured:z.boolean()});
async function admin(){return(await auth())?.user.role==="ADMIN"}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){if(!await admin())return Response.json({message:"Non autorisé."},{status:401});const parsed=schema.safeParse(await request.json());if(!parsed.success)return Response.json({message:parsed.error.issues[0]?.message},{status:400});const {id}=await params,current=await db.query.posts.findFirst({where:eq(posts.id,id)});if(!current)return Response.json({message:"Article introuvable."},{status:404});await db.update(posts).set({...parsed.data,publishedAt:parsed.data.published?(current.publishedAt??new Date()):null,updatedAt:new Date()}).where(eq(posts.id,id));return Response.json({message:"Article modifié avec succès."})}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){if(!await admin())return Response.json({message:"Non autorisé."},{status:401});const {id}=await params,item=await db.query.posts.findFirst({where:eq(posts.id,id)});if(!item)return Response.json({message:"Article introuvable."},{status:404});const cover=item.coverMediaId?await db.query.media.findFirst({where:eq(media.id,item.coverMediaId)}):null;await db.delete(posts).where(eq(posts.id,id));if(cover){await db.delete(media).where(eq(media.id,cover.id));await storageService.deleteFile(cover.path).catch(()=>undefined)}return Response.json({message:"Article supprimé avec succès."})}
