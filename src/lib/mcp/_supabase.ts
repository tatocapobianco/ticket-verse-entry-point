// Shared Supabase helper for MCP tools. The bundle runs in Deno, but this file
// is also type-checked by the app's tsconfig which does not enable node types
// on the app side. Declare the process reference locally to keep it import-safe.
declare const process: { env: Record<string, string | undefined> };

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

export function supabaseForUser(ctx: ToolContext): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
