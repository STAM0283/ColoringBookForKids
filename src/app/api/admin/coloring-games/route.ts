import {desc,eq,inArray} from "drizzle-orm";
import sharp from "sharp";
import {z} from "zod";
import {revalidatePath} from "next/cache";
import {auth} from "@/auth";
import {db} from "@/db";
import {categories,characters,coloringGameCharacters,coloringGames,media} from "@/db/schema";
import {sanitizeColoringSvg} from "@/lib/coloring-svg";
import {slugify} from "@/lib/utils";
import {storageService} from "@/lib/storage/local-storage";

export const runtime="nodejs";
const fields=z.object({language:z.enum(["FR","EN"]),title:z.string().trim().min(3).max(100),description:z.string().trim().min(10).max(400),categoryId:z.string().uuid().nullable(),difficulty:z.enum(["EASY","MEDIUM","HARD"]),ageMin:z.number().int().min(2).max(18).nullable(),ageMax:z.number().int().min(2).max(18).nullable(),published:z.boolean(),sortOrder:z.number().int().min(0).max(9999),characterIds:z.array(z.string().uuid()).max(12)}).refine(value=>value.ageMin===null||value.ageMax===null||value.ageMax>=value.ageMin,{message:"La tranche d’âge est invalide."});
async function isAdmin(){return(await auth())?.user.role==="ADMIN"}
export async function GET(){if(!await isAdmin())return Response.json({message:"Non autorisé."},{status:401});const rows=await db.select({game:coloringGames,imagePath:media.path}).from(coloringGames).leftJoin(media,eq(coloringGames.sourceMediaId,media.id)).orderBy(desc(coloringGames.updatedAt),desc(coloringGames.createdAt)),items=rows.map(row=>row.game);const links=items.length?await db.select().from(coloringGameCharacters).where(inArray(coloringGameCharacters.coloringGameId,items.map(item=>item.id))):[];return Response.json({items:rows.map(row=>({...row.game,imagePath:row.imagePath,characterIds:links.filter(link=>link.coloringGameId===row.game.id).map(link=>link.characterId)}))})}
export async function POST(request:Request){
 if(!await isAdmin())return Response.json({message:"Non autorisé."},{status:401});
 try{
  const form=await request.formData(),file=form.get("svg"),parsed=fields.safeParse({language:form.get("language"),title:form.get("title"),description:form.get("description"),categoryId:form.get("categoryId")||null,difficulty:form.get("difficulty"),ageMin:form.get("ageMin")?Number(form.get("ageMin")):null,ageMax:form.get("ageMax")?Number(form.get("ageMax")):null,published:form.get("published")==="true",sortOrder:Number(form.get("sortOrder")||0),characterIds:String(form.get("characterIds")||"").split(",").filter(Boolean)});
  if(!parsed.success)return Response.json({message:parsed.error.issues[0]?.message||"Vérifiez le formulaire."},{status:400});
  if(!(file instanceof File)||!file.size)return Response.json({message:"Sélectionnez un dessin."},{status:400});
  const isSvg=file.type==="image/svg+xml"||file.name.toLowerCase().endsWith(".svg"),id=crypto.randomUUID(),{characterIds,...game}=parsed.data;
  if(characterIds.length){const valid=await db.select({id:characters.id}).from(characters).where(inArray(characters.id,characterIds));if(valid.length!==characterIds.length)return Response.json({message:"Un personnage sélectionné est invalide."},{status:400})}
  if(game.categoryId){const[validCategory]=await db.select({id:categories.id}).from(categories).where(eq(categories.id,game.categoryId));if(!validCategory)return Response.json({message:"La catégorie sélectionnée est invalide."},{status:400})}
  let svgContent="",zoneCount=0,sourceMediaId:string|null=null,storedMedia:null|{filename:string;path:string;size:number;mimeType:string;width:number|undefined;height:number|undefined}=null;
  if(isSvg){const sanitized=sanitizeColoringSvg(await file.text());svgContent=sanitized.svg;zoneCount=sanitized.zoneCount}else{await storageService.validateFile(file,"IMAGE");const metadata=await sharp(Buffer.from(await file.arrayBuffer())).metadata(),stored=await storageService.uploadFile(file,"IMAGE");sourceMediaId=crypto.randomUUID();storedMedia={...stored,width:metadata.width,height:metadata.height}}
  try{await db.transaction(async tx=>{if(storedMedia&&sourceMediaId)await tx.insert(media).values({id:sourceMediaId,type:"IMAGE",filename:storedMedia.filename,originalName:file.name,mimeType:storedMedia.mimeType,size:storedMedia.size,width:storedMedia.width,height:storedMedia.height,path:storedMedia.path,alt:`Dessin à colorier : ${game.title}`,language:game.language,galleryEnabled:false,published:false,accessLevel:"PUBLIC"});await tx.insert(coloringGames).values({id,...game,slug:`${slugify(game.title)}-${id.slice(0,6)}`,engine:isSvg?"SVG":"RASTER",svgContent,sourceMediaId,zoneCount});if(characterIds.length)await tx.insert(coloringGameCharacters).values(characterIds.map(characterId=>({coloringGameId:id,characterId}))) })}catch(error){if(storedMedia)await storageService.deleteFile(storedMedia.path).catch(()=>undefined);throw error}
  revalidateColoringPages();
  return Response.json({message:"Coloriage interactif créé.",id},{status:201});
 }catch(error){return Response.json({message:error instanceof Error?error.message:"Création impossible."},{status:400})}
}
function revalidateColoringPages(){revalidatePath("/coloriages");revalidatePath("/en/coloring")}
