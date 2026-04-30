import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function DELETE(req: NextRequest) {
  // SECURITY: Rate limit account deletion to prevent abuse
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!(await checkRateLimit(`delete-account:${ip}`, 3, 3600000))) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  try {
    // Delete from Supabase if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const { getSupabaseAdmin } = await import("@/lib/supabase");
      const supabase = getSupabaseAdmin();

      // Run deletions in parallel for efficiency
      await Promise.all([
        supabase.from("subscriptions").delete().eq("email", email),
        supabase.from("user_progress").delete().eq("email", email),
        supabase.from("usage_tracking").delete().eq("user_email", email),
      ]);
    }

    return NextResponse.json({
      success: true,
      message: "Account data deleted. Local browser data must be cleared manually via Settings > Export/Clear Data.",
    });
  } catch {
    return NextResponse.json({ error: "Failed to delete account." }, { status: 500 });
  }
}
