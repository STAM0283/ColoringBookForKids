import {NextResponse} from "next/server";
import {auth} from "@/auth";
export const proxy=auth(request=>{if(!request.auth?.user||request.auth.user.invalid){const login=new URL("/connexion",request.url);login.searchParams.set("callbackUrl",request.nextUrl.pathname);return NextResponse.redirect(login)}return NextResponse.next()});
export const config={matcher:["/admin/:path*","/api/admin/:path*"]};
