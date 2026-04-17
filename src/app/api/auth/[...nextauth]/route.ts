/* eslint-disable @typescript-eslint/no-explicit-any */
import { Auth } from "@auth/core";
import Google from "@auth/core/providers/google";
import type { NextRequest } from "next/server";
import { trackUserLogin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function handler(req: NextRequest) {
  const reqInit: RequestInit = {
    headers: req.headers,
    method: req.method,
  };
  if (req.method === "POST") {
    reqInit.body = req.body;
    (reqInit as any).duplex = "half";
  }

  const response = (await (Auth as any)(new Request(req.url, reqInit), {
    basePath: "/api/auth",
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    trustHost: true,
    providers: [
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    callbacks: {
      async signIn({ user }: any) {
        // Track every Google login in Supabase (fire-and-forget).
        try {
          await trackUserLogin({
            email: user?.email,
            name: user?.name,
            image: user?.image,
          });
        } catch {
          // Non-critical — don't block authentication
        }
        return true;
      },
      session({ session, token }: any) {
        if (session?.user) {
          session.user.id = token?.sub;
          if (token?.email) {
            session.user.email = token.email;
          }
        }
        return session;
      },
    },
  })) as Response;

  return response;
}

export { handler as GET, handler as POST };
