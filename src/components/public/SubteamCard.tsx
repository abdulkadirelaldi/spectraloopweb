import { Card } from "@/components/ui";

export type SubteamInfo = {
  name: string;
  description: string;
  /** Short monogram/emoji shown in the accent chip. */
  monogram?: string;
  /** Optional bullet list of responsibility areas. */
  responsibilities?: readonly string[];
};

/** Presentational card describing a subteam and its responsibilities. */
export function SubteamCard({
  name,
  description,
  monogram,
  responsibilities,
}: SubteamInfo) {
  return (
    <Card className="group flex h-full flex-col transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-md dark:hover:border-brand-500/40">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-lg font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300"
      >
        {monogram ?? name.charAt(0).toUpperCase()}
      </span>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{name}</h3>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {responsibilities && responsibilities.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {responsibilities.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-foreground"
            >
              <span
                aria-hidden="true"
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
              />
              {item}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
