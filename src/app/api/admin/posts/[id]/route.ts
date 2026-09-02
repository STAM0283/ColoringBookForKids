import sharp from "sharp";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, media, posts } from "@/db/schema";
import { storageService } from "@/lib/storage/local-storage";
import { articleContentToHtml, richTextToPlainText } from "@/lib/rich-text";

const richContent=z.string().max(100000).refine(value=>richTextToPlainText(articleContentToHtml(value)).length>=20,{message:"Le contenu doit contenir au moins 20 caractères."});
const schema=z.object({language:z.enum(["FR","EN"]),title:z.string().trim().min(3).max(180),excerpt:z.string().trim().min(10).max(400),content:richContent,authorName:z.string().trim().min(2).max(100),categoryId:z.string().uuid().nullable(),published:z.boolean(),featured:z.boolean()});
async function admin(){return(await auth())?.user.role==="ADMIN"}
async function validCategory(categoryId:string|null,language:"FR"|"EN"){if(!categoryId)return true;const category=await db.query.categories.findFirst({where:eq(categories.id,categoryId)});return category?.language===language}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!await admin())return Response.json({message:"Non autorisé."},{status:401});
  const isMultipart=request.headers.get("content-type")?.includes("multipart/form-data"),form=isMultipart?await request.formData():null;
  const body=form?{language:form.get("language")==="EN"?"EN":"FR",title:form.get("title"),excerpt:form.get("excerpt"),content:form.get("content"),authorName:form.get("authorName"),categoryId:String(form.get("categoryId")||"")||null,published:form.get("published")==="true",featured:form.get("featured")==="true"}:await request.json();
  const parsed=schema.safeParse(body);if(!parsed.success)return Response.json({message:parsed.error.issues[0]?.message},{status:400});
  if(!await validCategory(parsed.data.categoryId,parsed.data.language))return Response.json({message:"La catégorie doit utiliser la même langue que l’article."},{status:400});
  const {id}=await params,current=await db.query.posts.findFirst({where:eq(posts.id,id)});if(!current)return Response.json({message:"Article introuvable."},{status:404});
  let newCover:{id:string;path:string}|null=null;
  try{
    const cover=form?.get("cover");
    if(cover instanceof File&&cover.size){await storageService.validateFile(cover,"IMAGE");const meta=await sharp(Buffer.from(await cover.arrayBuffer())).metadata(),stored=await storageService.uploadFile(cover,"IMAGE");newCover={id:crypto.randomUUID(),path:stored.path};await db.insert(media).values({...newCover,type:"IMAGE",filename:stored.filename,originalName:cover.name,mimeType:stored.mimeType,size:stored.size,width:meta.width,height:meta.height,alt:`Couverture de ${parsed.data.title}`})}
    const removeCover=form?.get("removeCover")==="true"&&!newCover,nextCoverId=removeCover?null:(newCover?.id??current.coverMediaId);
    await db.update(posts).set({...parsed.data,coverMediaId:nextCoverId,publishedAt:parsed.data.published?(current.publishedAt??new Date()):null,updatedAt:new Date()}).where(eq(posts.id,id));
    if((removeCover||newCover)&&current.coverMediaId){const old=await db.query.media.findFirst({where:eq(media.id,current.coverMediaId)});if(old){await db.delete(media).where(eq(media.id,old.id));await storageService.deleteFile(old.path).catch(()=>undefined)}}
  }catch(error){if(newCover){await db.delete(media).where(eq(media.id,newCover.id)).catch(()=>undefined);await storageService.deleteFile(newCover.path).catch(()=>undefined)}return Response.json({message:error instanceof Error?error.message:"Modification impossible."},{status:400})}
  return Response.json({message:"Article modifié avec succès."});
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
  if(!await admin())return Response.json({message:"Non autorisé."},{status:401});
  const {id}=await params,item=await db.query.posts.findFirst({where:eq(posts.id,id)});if(!item)return Response.json({message:"Article introuvable."},{status:404});
  const cover=item.coverMediaId?await db.query.media.findFirst({where:eq(media.id,item.coverMediaId)}):null;
  await db.delete(posts).where(eq(posts.id,id));
  if(cover){await db.delete(media).where(eq(media.id,cover.id));await storageService.deleteFile(cover.path).catch(()=>undefined)}
  return Response.json({message:"Article supprimé avec succès."});
}
