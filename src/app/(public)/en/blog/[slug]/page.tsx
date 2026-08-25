import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {ArrowLeft} from "lucide-react";
import {and,eq} from "drizzle-orm";
import {notFound} from "next/navigation";
import {db} from "@/db";
import {media,posts} from "@/db/schema";
import {articleContentToHtml} from "@/lib/rich-text";
import {mediaUrl} from "@/lib/seo";

async function getPost(slug:string){const[result]=await db.select({post:posts,cover:media}).from(posts).leftJoin(media,eq(posts.coverMediaId,media.id)).where(and(eq(posts.slug,slug),eq(posts.language,"EN"),eq(posts.published,true))).limit(1);return result}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const{slug}=await params,result=await getPost(slug);if(!result)return{};const title=result.post.seoTitle||result.post.title,description=result.post.seoDescription||result.post.excerpt,image=mediaUrl(result.cover?.path);return{title,description,alternates:{canonical:`/en/blog/${slug}`},openGraph:{type:"article",locale:"en_GB",url:`/en/blog/${slug}`,title,description,images:image?[image]:undefined}}}
export default async function EnglishBlogPost({params}:{params:Promise<{slug:string}>}){const{slug}=await params,result=await getPost(slug);if(!result)notFound();return <article className="container max-w-4xl py-16"><Link href="/en/blog" className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 font-bold"><ArrowLeft size={18}/>Back to the journal</Link><p className="mt-10 text-sm font-black uppercase tracking-[.2em] text-primary">The journal</p><h1 className="mt-4 font-display text-4xl font-black md:text-6xl">{result.post.title}</h1><p className="mt-5 text-lg leading-8 text-foreground/75">{result.post.excerpt}</p><p className="mt-5 text-sm font-semibold text-foreground/60">By {result.post.authorName}</p>{result.cover&&<div className="relative mt-10 aspect-video overflow-hidden rounded-[2rem]"><Image fill priority src={`/media/${result.cover.path}`} alt={result.cover.alt||result.post.title} className="object-contain"/></div>}<div className="rich-article mt-10 text-lg leading-8" dangerouslySetInnerHTML={{__html:articleContentToHtml(result.post.content)}}/></article>}
