import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminHelpLink } from "@/components/admin/admin-help-link";

export const metadata: Metadata = { title: "Administration", robots: { index: false, follow: false, noarchive: true, nosnippet: true } };

export default async function AdminLayout({children}:{children:React.ReactNode}){
  const session=await auth();
  if(session?.user.role!=="ADMIN")redirect("/connexion?callbackUrl=/admin");
  return <div className="admin-shell min-h-screen bg-[#f6f7f9] text-slate-900 transition-colors dark:bg-background dark:text-foreground md:flex"><AdminSidebar/><main className="min-w-0 flex-1 p-5 md:p-10">{children}</main><AdminHelpLink/></div>;
}
