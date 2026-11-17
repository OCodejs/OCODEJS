import {NextResponse} from "next/server";
import {authorizationUrl,createOAuthState,isOAuthProvider,stateCookieName,stateCookieOptions} from "@/lib/oauth-providers";
export const runtime="nodejs";
export async function GET(request:Request,{params}:{params:Promise<{provider:string}>}){const {provider}=await params;if(!isOAuthProvider(provider))return NextResponse.redirect(new URL("/authorize?error=provider",request.url));try{const state=createOAuthState(),response=NextResponse.redirect(authorizationUrl(provider,state));response.cookies.set(stateCookieName(provider),state,stateCookieOptions(provider));return response;}catch{return NextResponse.redirect(new URL("/authorize?error=setup",request.url));}}
