import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { bookGallery, media } from "@/db/schema";
import { storageService } from "@/lib/storage/local-storage";

export async function DELETE(_:Request,{params}:{params:Promise<{id:string;mediaId:string}>}){if((await auth())?.user.role!=="ADMIN")return Response.json({message:"Non autorisé."},{status:401});const {id,mediaId}=await params;const link=await db.query.bookGallery.findFirst({where:and(eq(bookGallery.bookId,id),eq(bookGallery.mediaId,mediaId))});if(!link)return Response.json({message:"Image introuvable dans cette galerie."},{status:404});const image=await db.query.media.findFirst({where:eq(media.id,mediaId)});await db.delete(bookGallery).where(eq(bookGallery.id,link.id));await db.delete(media).where(eq(media.id,mediaId));if(image)await storageService.deleteFile(image.path).catch(()=>undefined);return Response.json({message:"Image retirée de la galerie."})}
