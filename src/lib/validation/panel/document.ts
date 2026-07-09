import { z } from "zod";

import {
  DOCUMENT_CATEGORIES,
  UPDATE_EMPTY_MESSAGE,
  clearableText,
  hasAtLeastOneField,
  optionalText,
  requiredText,
} from "./common";

/**
 * Panel document input schemas — mirror `api/panel/documents/shared.ts`.
 * title 1–200, fileUrl valid http(s) URL ≤2048, category enum (default "other"),
 * subteam ≤120. `uploadedBy` server-assigned.
 *
 * NOTE: `fileUrl` is metadata only (a pre-uploaded / external URL). Real file
 * upload (R2 presigned URL + MIME/size validation) is deferred to Faz 3. Lead
 * subteam pinning is enforced in the route, not here.
 */
const fileUrl = z
  .url({
    protocol: /^https?$/,
    message: "fileUrl must be a valid http(s) URL.",
  })
  .max(2048, "fileUrl is too long.");

export const panelDocumentCreateSchema = z.object({
  title: requiredText(200, "Title"),
  fileUrl,
  category: z.enum(DOCUMENT_CATEGORIES).optional().default("other"),
  subteam: optionalText(120, "subteam"),
});

export const panelDocumentUpdateSchema = z
  .object({
    title: optionalText(200, "title"),
    fileUrl: fileUrl.optional(),
    category: z.enum(DOCUMENT_CATEGORIES).optional(),
    subteam: clearableText(120, "subteam"),
  })
  .refine(hasAtLeastOneField, { message: UPDATE_EMPTY_MESSAGE });

export type PanelDocumentCreate = z.infer<typeof panelDocumentCreateSchema>;
export type PanelDocumentUpdate = z.infer<typeof panelDocumentUpdateSchema>;
