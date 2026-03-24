import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

console.log("[auth] GOOGLE_CLIENT_ID present:", !!googleClientId);
console.log("[auth] GOOGLE_CLIENT_SECRET present:", !!googleClientSecret);
console.log("[auth] AUTH_SECRET present:", !!process.env.AUTH_SECRET);
console.log("[auth] NEXTAUTH_SECRET present:", !!process.env.NEXTAUTH_SECRET);

const providers = [];
if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    })
  );
}

console.log("[auth] Providers count:", providers.length);

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    session({ session, token }) {
      if (session.user) session.user.id = token.sub!;
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
});
