import sharp from "sharp";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/db";
import { categories, media, posts } from "@/db/schema";
import { articleContentToHtml, richTextToPlainText } from "@/lib/rich-text";
import { storageService } from "@/lib/storage/local-storage";
import { slugify } from "@/lib/utils";

const richContent=z.string().max(100000).refine(value=>richTextToPlainText(articleContentToHtml(value)).length>=20,{message:"Le contenu doit contenir au moins 20 caractères."});
const schema=z.object({title:z.string().min(2).max(150),excerpt:z.string().min(10).max(300),content:richContent,authorName:z.string().min(2).max(100),categoryId:z.string().uuid().nullable(),published:z.boolean(),featured:z.boolean()});

async function validBlogCategory(categoryId:string|null){if(!categoryId)return true;const category=await db.query.categories.findFirst({where:eq(categories.id,categoryId)});return category?.scope==="BLOG"}

export async function GET(){
  if((await auth())?.user.role!=="ADMIN")return Response.json({message:"Non autorisé."},{status:401});
  const items=await db.select({post:posts,cover:media}).from(posts).leftJoin(media,eq(posts.coverMediaId,media.id)).orderBy(desc(posts.updatedAt));
  return Response.json({items});
}

export async function POST(request:Request){
  if((await auth())?.user.role!=="ADMIN")return Response.json({message:"Non autorisé."},{status:401});
  const form=await request.formData();
  const parsed=schema.safeParse({title:form.get("title"),excerpt:form.get("excerpt"),content:form.get("content"),authorName:form.get("authorName"),categoryId:String(form.get("categoryId")||"")||null,published:form.get("published")==="on",featured:form.get("featured")==="on"});
  if(!parsed.success)return Response.json({message:parsed.error.issues[0]?.message},{status:400});
  if(!await validBlogCategory(parsed.data.categoryId))return Response.json({message:"Catégorie du blog invalide."},{status:400});
  try{
    const cover=form.get("cover");let coverMediaId:string|null=null;
    if(cover instanceof File&&cover.size){await storageService.validateFile(cover,"IMAGE");const meta=await sharp(Buffer.from(await cover.arrayBuffer())).metadata(),stored=await storageService.uploadFile(cover,"IMAGE");coverMediaId=crypto.randomUUID();await db.insert(media).values({id:coverMediaId,type:"IMAGE",filename:stored.filename,originalName:cover.name,mimeType:stored.mimeType,size:stored.size,width:meta.width,height:meta.height,path:stored.path,alt:`Couverture de ${parsed.data.title}`})}
    const id=crypto.randomUUID();
    await db.insert(posts).values({id,slug:`${slugify(parsed.data.title)}-${id.slice(0,6)}`,...parsed.data,coverMediaId,publishedAt:parsed.data.published?new Date():null});
    return Response.json({message:"Article créé avec succès."},{status:201});
  }catch(error){return Response.json({message:error instanceof Error?error.message:"Création impossible."},{status:400})}
}
