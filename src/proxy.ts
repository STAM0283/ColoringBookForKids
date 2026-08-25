import {NextResponse} from "next/server";
import {auth} from "@/auth";
export const proxy=auth(request=>{
  const pathname=request.nextUrl.pathname;
  const protectedRoute=pathname.startsWith("/admin")||pathname.startsWith("/api/admin");
  if(protectedRoute&&(!request.auth?.user||request.auth.user.invalid)){
    const login=new URL("/connexion",request.url);
    login.searchParams.set("callbackUrl",pathname);
    return NextResponse.redirect(login);
  }
  const headers=new Headers(request.headers);
  headers.set("x-site-locale",pathname==="/en"||pathname.startsWith("/en/")?"en":"fr");
  return NextResponse.next({request:{headers}});
});
export const config={matcher:["/api/admin/:path*","/((?!api|_next/static|_next/image|favicon.ico|media).*)"]};
