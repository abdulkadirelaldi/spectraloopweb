import { Card } from "@/components/ui";
import type { Announcement } from "@/types";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso: string): string {
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return "";
  }
}

/** Presentational card for a single public announcement / news item. */
export function AnnouncementCard({
  announcement,
}: {
  announcement: Announcement;
}) {
  const date = formatDate(announcement.createdAt);

  return (
    <Card interactive className="flex h-full flex-col">
      {date ? (
        <time
          dateTime={announcement.createdAt}
          className="text-xs font-medium text-muted"
        >
          {date}
        </time>
      ) : null}
      <h3 className="mt-2 text-lg font-semibold text-foreground">
        {announcement.title}
      </h3>
      <p className="mt-2 line-clamp-4 text-sm text-muted">
        {announcement.body}
      </p>
    </Card>
  );
}
