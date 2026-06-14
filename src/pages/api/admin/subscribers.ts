import type { APIRoute } from "astro";
import { getSupabaseAdmin } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";

// ── GET /api/admin/subscribers ─────────────────────────────────────────────────
// Admin-only route that returns all subscriber records from Supabase.
// Protected by server-side session check (not spoofable headers).

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // SECURITY: Authenticate via server-side session, not client-supplied headers
    const session = await auth(locals);
    const sessionEmail = session?.user?.email;
    if (!isAdminEmail(sessionEmail)) {
      return Response.json({ error: "Forbidden." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("subscriptions")
      .select("email, plan_type, premium_until, payment_id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/subscribers]", error);
      return Response.json(
        { error: "Failed to fetch subscribers." },
        { status: 500 }
      );
    }

    return Response.json({ subscribers: data ?? [] });
  } catch (err) {
    console.error("[admin/subscribers]", err);
    const message = err instanceof Error ? err.message : "Fetch failed.";
    return Response.json({ error: message }, { status: 500 });
  }
};
