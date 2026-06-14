import type { APIContext } from "astro";

type Locals = APIContext["locals"];

/**
 * Server-side auth helper for Astro API routes.
 * Pass `locals` from the APIRoute context.
 *
 * Usage:
 *   export const GET: APIRoute = async ({ locals }) => {
 *     const session = await auth(locals);
 *   }
 */
export async function auth(locals?: Locals) {
  if (!locals) return null;
  const user = await locals.currentUser?.();
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
