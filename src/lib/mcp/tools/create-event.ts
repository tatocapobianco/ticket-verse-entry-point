import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../_supabase";

function randomEventNumber() {
  return "EVT" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function randomAccessKey() {
  return Math.random().toString(36).slice(2, 10);
}

export default defineTool({
  name: "create_event",
  title: "Create event",
  description: "Create a new Cupo event owned by the signed-in user. Returns the created event including the auto-generated event number and access key that scanners will use.",
  inputSchema: {
    name: z.string().describe("Event name shown to buyers."),
    description: z.string().optional().describe("Long description of the event."),
    event_date: z.string().optional().describe("Event date in YYYY-MM-DD format."),
    event_time: z.string().optional().describe("Event time in HH:MM 24h format."),
    location: z.string().optional().describe("Venue name or full address."),
    is_public: z.boolean().optional().describe("Whether the event should be listed publicly. Defaults to true."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const payload = {
      organizer_id: ctx.getUserId(),
      name: input.name,
      description: input.description ?? null,
      event_date: input.event_date ?? null,
      event_time: input.event_time ?? null,
      location: input.location ?? null,
      event_number: randomEventNumber(),
      access_key: randomAccessKey(),
      is_public: input.is_public ?? true,
      status: "active",
    };

    const { data, error } = await supabaseForUser(ctx)
      .from("events")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { event: data },
    };
  },
});
