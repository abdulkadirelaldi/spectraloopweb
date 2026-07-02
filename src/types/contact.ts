/**
 * Contact form. NOT a PROGRAM.md §8 entity — added here because the public
 * Contact endpoint (task 1.B2) needs a shared request-body shape. Kept minimal
 * (no persisted entity type yet); expand under chief coordination if Contact
 * messages are later stored.
 */
export interface ContactInput {
  name: string;
  email: string;
  subject?: string;
  message: string;
}
