import {eq} from "drizzle-orm";
import {z} from "zod";
import {auth} from "@/auth";
import {db} from "@/db";
import sharp from "sharp";
import {storageService} from "@/lib/storage/local-storage";
import {characters,media} from "@/db/schema";
import {slugify} from "@/lib/utils";
const schema=z.object({language:z.enum(["FR","EN"]),name:z.string().trim().min(2).max(80),shortDescription:z.string().trim().min(10).max(240),biography:z.string().trim().max(3000),ageLabel:z.string().trim().max(50),species:z.string().trim().max(80),personality:z.string().trim().max(500),hobbies:z.string().trim().max(500),motto:z.string().trim().max(180),color:z.string().regex(/^#[0-9A-F]{6}$/i),published:z.boolean(),sortOrder:z.number().int().min(0).max(9999)});
async function admin(){return(await auth())?.user.role==="ADMIN"}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  if(!await admin())return Response.json({message:"Non autorisé."},{status:401});
  const {id}=await params;
  const [existing]=await db.select({id:characters.id}).from(characters).where(eq(characters.id,id)).limit(1);
  if(!existing)return Response.json({message:"Personnage introuvable."},{status:404});
  let uploadedPath:string|undefined;
  try {
    const form=request.headers.get("content-type")?.includes("multipart/form-data")?await request.formData():null;
    const payload=form?Object.fromEntries(form):await request.json();
    if(form){payload.published=form.get("published")==="true";payload.sortOrder=Number(form.get("sortOrder")||0);}
    const parsed=schema.safeParse(payload);
    if(!parsed.success)return Response.json({message:"Vérifiez les informations du personnage."},{status:400});
    const portrait=form?.get("portrait");
    let portraitMediaId:string|undefined;
    let newMedia:typeof media.$inferInsert|undefined;
    if(portrait instanceof File&&portrait.size){
      await storageService.validateFile(portrait,"IMAGE");
      const meta=await sharp(Buffer.from(await portrait.arrayBuffer())).metadata();
      const stored=await storageService.uploadFile(portrait,"IMAGE");uploadedPath=stored.path;
      portraitMediaId=crypto.randomUUID();
      newMedia={id:portraitMediaId,type:"IMAGE",filename:stored.filename,originalName:portrait.name,mimeType:stored.mimeType,size:stored.size,width:meta.width,height:meta.height,path:stored.path,alt:`Portrait de ${parsed.data.name}`,language:parsed.data.language,galleryEnabled:false,published:false,accessLevel:"PUBLIC"};
    }
    await db.transaction(async tx=>{
      if(newMedia)await tx.insert(media).values(newMedia);
      await tx.update(characters).set({...parsed.data,...(portraitMediaId?{portraitMediaId}:{}),slug:`${slugify(parsed.data.name)}-${id.slice(0,6)}`,biography:parsed.data.biography||null,ageLabel:parsed.data.ageLabel||null,species:parsed.data.species||null,personality:parsed.data.personality||null,hobbies:parsed.data.hobbies||null,motto:parsed.data.motto||null,updatedAt:new Date()}).where(eq(characters.id,id));
    });
    return Response.json({message:"Personnage modifié avec succès."});
  }catch{
    if(uploadedPath)await storageService.deleteFile(uploadedPath).catch(()=>undefined);
    return Response.json({message:"Modification impossible. Vérifiez le portrait (JPG, PNG, WebP ou AVIF, 15 Mo maximum)."}, {status:400});
  }
}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){if(!await admin())return Response.json({message:"Non autorisé."},{status:401});const{id}=await params;await db.delete(characters).where(eq(characters.id,id));return Response.json({message:"Personnage supprimé."})}
