import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMyEvents from "./tools/list-my-events";
import listPublicEvents from "./tools/list-public-events";
import createEvent from "./tools/create-event";
import getMyProfile from "./tools/get-my-profile";

// Build the OAuth issuer from the project ref so mcp-js verifies tokens against
// the direct supabase.co issuer that the discovery document publishes. Never
// derive it from SUPABASE_URL (that may be the .lovable.cloud proxy).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "accoro-mcp",
  title: "Cupo",
  version: "0.1.0",
  instructions:
    "Tools for Cupo, an event ticketing app. Use `list_public_events` to browse events open for ticket sales, `list_my_events` and `create_event` to manage events you organize, and `get_my_profile` to read the signed-in user's profile.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listPublicEvents, listMyEvents, createEvent, getMyProfile],
});
