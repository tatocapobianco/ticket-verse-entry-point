import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_supabase";

export default defineTool({
  name: "list_my_tickets",
  title: "List my tickets",
  description: "List all tickets owned by the signed-in Cupo user, including event and ticket-type info. QR codes are only viewable inside the app.",
  inputSchema: {
    limit: z.number().int().min(1).max(200).optional().describe("Maximum number of tickets to return. Defaults to 100."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("tickets")
      .select("id, qr_code, status, source, used_at, created_at, event:events(id, name, event_date, event_time, location), ticket_type:ticket_types(id, name, price)")
      .eq("owner_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 100);

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { tickets: data ?? [] },
    };
  },
});
