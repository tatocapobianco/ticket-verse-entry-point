import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_supabase";

export default defineTool({
  name: "list_my_purchases",
  title: "List my purchases",
  description: "List purchase orders made by the signed-in Cupo user, with the event and line items included.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Maximum number of purchases to return. Defaults to 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("purchases")
      .select("id, subtotal, service_fee, total, status, created_at, event:events(id, name, event_date, location), items:purchase_items(id, quantity, unit_price, ticket_type:ticket_types(id, name))")
      .eq("buyer_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { purchases: data ?? [] },
    };
  },
});
