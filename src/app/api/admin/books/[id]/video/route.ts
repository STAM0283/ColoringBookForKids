import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { books, media } from "@/db/schema";
import { VIDEO_UPLOAD_ERROR } from "@/lib/media-limits";
import { storageService } from "@/lib/storage/local-storage";

export const runtime="nodejs";
async function admin(){return (await auth())?.user.role==="ADMIN"}
async function getBook(id:string){return db.query.books.findFirst({where:eq(books.id,id)})}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){if(!await admin())return Response.json({message:"Non autorisé."},{status:401});const{id}=await params,book=await getBook(id);if(!book)return Response.json({message:"Livre introuvable."},{status:404});const video=book.videoMediaId?await db.query.media.findFirst({where:eq(media.id,book.videoMediaId)}):null;return Response.json({video})}

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){if(!await admin())return Response.json({message:"Non autorisé."},{status:401});const{id}=await params,book=await getBook(id);if(!book)return Response.json({message:"Livre introuvable."},{status:404});let form:FormData;try{form=await request.formData()}catch(error){console.error("Impossible de lire la vidéo du livre",error);return Response.json({message:`Import incomplet. ${VIDEO_UPLOAD_ERROR}`},{status:413})}const file=form.get("video");if(!(file instanceof File)||!file.size)return Response.json({message:"Sélectionnez une vidéo MP4."},{status:400});try{const stored=await storageService.uploadFile(file,"VIDEO"),videoId=crypto.randomUUID();await db.insert(media).values({id:videoId,type:"VIDEO",filename:stored.filename,originalName:file.name,mimeType:stored.mimeType,size:stored.size,path:stored.path});await db.update(books).set({videoMediaId:videoId,updatedAt:new Date()}).where(eq(books.id,id));if(book.videoMediaId){const previous=await db.query.media.findFirst({where:eq(media.id,book.videoMediaId)});if(previous){await db.delete(media).where(eq(media.id,previous.id));await storageService.deleteFile(previous.path).catch(()=>undefined)}}return Response.json({message:book.videoMediaId?"Vidéo remplacée avec succès.":"Vidéo ajoutée avec succès.",video:{id:videoId,path:stored.path,originalName:file.name,mimeType:stored.mimeType}},{status:201})}catch(error){return Response.json({message:error instanceof Error?error.message:"Import impossible."},{status:400})}}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){if(!await admin())return Response.json({message:"Non autorisé."},{status:401});const{id}=await params,book=await getBook(id);if(!book)return Response.json({message:"Livre introuvable."},{status:404});if(!book.videoMediaId)return Response.json({message:"Aucune vidéo liée à ce livre."},{status:404});const video=await db.query.media.findFirst({where:eq(media.id,book.videoMediaId)});await db.update(books).set({videoMediaId:null,updatedAt:new Date()}).where(eq(books.id,id));if(video){await db.delete(media).where(eq(media.id,video.id));await storageService.deleteFile(video.path).catch(()=>undefined)}return Response.json({message:"Vidéo retirée avec succès."})}
