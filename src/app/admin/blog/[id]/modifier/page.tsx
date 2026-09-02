import { BlogEditPage } from "@/components/admin/blog-edit-page";
export default async function EditBlogPostPage({params}:{params:Promise<{id:string}>}){const{id}=await params;return <BlogEditPage postId={id}/>}
