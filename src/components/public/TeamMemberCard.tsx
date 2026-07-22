import { Badge, Card } from "@/components/ui";

export type TeamMember = {
  name: string;
  role: string;
  /** Optional subteam label (rendered as a badge). */
  subteam?: string;
  /** Optional photo URL; falls back to an initials avatar. */
  photoUrl?: string;
};

/** Derive up to two uppercase initials from a full name. */
function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Presentational card for a team/roster member. */
export function TeamMemberCard({
  name,
  role,
  subteam,
  photoUrl,
}: TeamMember) {
  return (
    <Card className="flex flex-col items-center text-center transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-md dark:hover:border-brand-500/40">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={`${name} portresi`}
          loading="lazy"
          className="h-20 w-20 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 text-xl font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
        >
          {initialsOf(name)}
        </div>
      )}
      <h3 className="mt-4 text-base font-semibold text-foreground">{name}</h3>
      <p className="mt-1 text-sm text-muted">{role}</p>
      {subteam ? (
        <Badge variant="neutral" className="mt-3">
          {subteam}
        </Badge>
      ) : null}
    </Card>
  );
}
