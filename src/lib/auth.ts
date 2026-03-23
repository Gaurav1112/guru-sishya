import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

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
  providers,
  callbacks: {
    session({ session, token }) {
      if (session.user) session.user.id = token.sub!;
      return session;
    },
  },
});
