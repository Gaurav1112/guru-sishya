import type { APIRoute } from "astro";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST: APIRoute = async ({ request, locals }) => {
  // SECURITY: Rate limit trial start to prevent abuse
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkRateLimit(`trial-start:${ip}`, 5, 3600000))) {
    return Response.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  const session = await auth(locals);
  if (!session?.user?.email) {
    return Response.json({ error: "Sign in required to start trial" }, { status: 401 });
  }

  const email = session.user.email;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const { getSupabaseAdmin } = await import("@/lib/supabase");
      const supabase = getSupabaseAdmin();

      // Check if trial already used
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("email", email)
        .eq("payment_id", "free_trial")
        .single();

      if (existing) {
        return Response.json({ error: "Trial already used" }, { status: 409 });
      }

      // Create trial record
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 7);

      await supabase.from("subscriptions").insert({
        email,
        payment_id: "free_trial",
        plan_type: "free_trial",
        premium_until: trialEnd.toISOString(),
        created_at: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch {
    return Response.json({ error: "Failed to start trial" }, { status: 500 });
  }
};
