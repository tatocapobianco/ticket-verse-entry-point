import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_supabase";

export default defineTool({
  name: "list_my_events",
  title: "List my events",
  description: "List all events organized by the signed-in Cupo user (their own events, public or private).",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Maximum number of events to return. Defaults to 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("events")
      .select("id, name, description, event_date, event_time, location, event_number, is_public, status, created_at")
      .eq("organizer_id", ctx.getUserId())
      .order("event_date", { ascending: true, nullsFirst: false })
      .limit(limit ?? 50);

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { events: data ?? [] },
    };
  },
});
