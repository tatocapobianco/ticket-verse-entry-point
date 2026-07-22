import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../_supabase";

export default defineTool({
  name: "get_my_profile",
  title: "Get my profile",
  description: "Get the signed-in Cupo user's profile (name, email, DNI, organization).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("profiles")
      .select("id, email, full_name, dni, organization_name")
      .eq("id", ctx.getUserId())
      .maybeSingle();

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? {}, null, 2) }],
      structuredContent: { profile: data ?? null },
    };
  },
});
