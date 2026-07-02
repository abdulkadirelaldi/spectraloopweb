import type { BaseEntity, SponsorTier } from "./common";

/**
 * Sponsor. Source: PROGRAM.md §8
 * `Sponsor { name, logoUrl, tier, website, active }`.
 */
export interface Sponsor extends BaseEntity {
  name: string;
  logoUrl: string;
  tier: SponsorTier;
  website?: string;
  active: boolean;
}
