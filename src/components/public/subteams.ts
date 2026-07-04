/**
 * Subteam options for the public "Bize Katıl" application form.
 *
 * Static list for now (mirrors PROGRAM.md §8 subteam examples + the Ekipler
 * page). If a `/api/subteams` endpoint is added later (Backend), this can be
 * replaced by fetched `Subteam` names without changing the form's shape —
 * `subteamPref` is free text on the API side.
 */
export const SUBTEAM_OPTIONS: readonly string[] = [
  "Mekanik",
  "Elektronik-Elektrik",
  "Yazılım",
  "Organizasyon & Sponsorluk",
  "Kararsızım / Fark etmez",
];
