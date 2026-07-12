import { z } from "zod";

import { APPLICATION_STATUSES } from "./common";

/**
 * Panel application status update — mirrors `api/panel/applications/shared.ts`.
 * The panel may ONLY change an application's `status`; its content
 * (name/email/subteamPref/message) is read-only (public-submitted). Any other
 * field in the body is ignored (unknown keys stripped). `status` is required.
 * WHO may review is enforced in the route/guard.
 */
export const panelApplicationStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
});

export type PanelApplicationStatus = z.infer<
  typeof panelApplicationStatusSchema
>;
