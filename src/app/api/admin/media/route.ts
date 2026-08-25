import sharp from "sharp";
import { and, desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { media, mediaCategories, mediaCharacters } from "@/db/schema";
import { storageService } from "@/lib/storage/local-storage";

export const runtime = "nodejs";
export async function GET() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const items=await db.select().from(media).where(and(eq(media.type,"IMAGE"),eq(media.galleryEnabled,true))).orderBy(desc(media.createdAt)).limit(100);
  let links: Array<{mediaId:string;categoryId:string}>=[];
  try{links=items.length?await db.select().from(mediaCategories).where(inArray(mediaCategories.mediaId,items.map(item=>item.id))):[]}catch(error){console.warn("Catégories des images indisponibles, chargement sans filtre de catégorie.",error)}
  const characterLinks=items.length?await db.select().from(mediaCharacters).where(inArray(mediaCharacters.mediaId,items.map(item=>item.id))):[];
  return Response.json({ items: items.map(item=>({...item,categoryId:links.find(link=>link.mediaId===item.id)?.categoryId??null,characterIds:characterLinks.filter(link=>link.mediaId===item.id).map(link=>link.characterId)})) });
}
export async function POST(request: Request) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return Response.json({ message: "Non autorisé." }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const requestedType = String(form.get("type") || "");
  if (!(file instanceof File) || requestedType !== "IMAGE") return Response.json({ message: "Une image valide est obligatoire." }, { status: 400 });
  try {
    const type = "IMAGE" as const;
    await storageService.validateFile(file, "IMAGE");
    const metadata = await sharp(Buffer.from(await file.arrayBuffer())).metadata();
    const width = metadata.width;
    const height = metadata.height;
    const stored = await storageService.uploadFile(file, type), id=crypto.randomUUID();
    const published=String(form.get("published")||"")==="true",language=form.get("language")==="EN"?"EN" as const:"FR" as const;
    const accessLevel=String(form.get("accessLevel")||"")==="CLUB"?"CLUB" as const:"PUBLIC" as const;
    const creativeIdea=String(form.get("creativeIdea")||"").trim();
    if(creativeIdea.length>500)return Response.json({message:"L’idée créative ne peut pas dépasser 500 caractères."},{status:400});
    await db.insert(media).values({id,type,filename:stored.filename,originalName:file.name,mimeType:stored.mimeType,size:stored.size,width,height,path:stored.path,alt:String(form.get("alt")||"").trim()||null,creativeIdea:creativeIdea||null,language,galleryEnabled:true,published,accessLevel});
    const categoryId=String(form.get("categoryId")||"").trim();
    if(categoryId)await db.insert(mediaCategories).values({mediaId:id,categoryId});
    const characterIds=String(form.get("characterIds")||"").split(",").filter(Boolean);
    if(characterIds.length)await db.insert(mediaCharacters).values(characterIds.map(characterId=>({mediaId:id,characterId})));
    return Response.json({ id, ...stored, type, width, height }, { status: 201 });
  } catch(error){return Response.json({message:error instanceof Error?error.message:"Import impossible."},{status:400})}
}
