import { currentUser } from "@clerk/nextjs/server";

// Compatibility wrapper — all API routes call auth() unchanged.
// Returns the same shape as the previous NextAuth session object.
export async function auth() {
  const user = await currentUser();
  if (!user) return null;
  return {
    user: {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress ?? "",
      name: user.fullName ?? "",
      image: user.imageUrl ?? "",
    },
  };
}
