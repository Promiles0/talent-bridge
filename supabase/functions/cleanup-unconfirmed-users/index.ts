import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get all users from auth
    const { data: authData, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listError) throw listError;

    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    let deletedCount = 0;

    for (const user of authData.users) {
      // Skip confirmed users
      if (user.email_confirmed_at) continue;
      // Skip users created less than 10 days ago
      if (user.created_at > tenDaysAgo) continue;

      // Delete unconfirmed user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (!deleteError) {
        deletedCount++;
        console.log(`Deleted unconfirmed user: ${user.email} (created: ${user.created_at})`);
      } else {
        console.error(`Failed to delete user ${user.email}:`, deleteError.message);
      }
    }

    return new Response(
      JSON.stringify({ success: true, deleted: deletedCount }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("Cleanup error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
