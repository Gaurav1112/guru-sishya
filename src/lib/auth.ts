import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { trackUserLogin } from "./supabase-admin";

const providers = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  basePath: "/api/auth",
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    async signIn({ user }) {
      // Track every Google login in Supabase (fire-and-forget).
      // Graceful fallback: if Supabase is unavailable the login still succeeds.
      try {
        await trackUserLogin({
          email: user.email,
          name: user.name,
          image: user.image,
        });
      } catch {
        // Non-critical — don't block authentication
      }
      return true;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        // Ensure email is always present in the session for admin route checks
        if (token.email) {
          session.user.email = token.email as string;
        }
      }
      return session;
    },
  },
});
