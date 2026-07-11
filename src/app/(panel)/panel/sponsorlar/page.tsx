import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { PanelCard, PanelPageHeader } from "@/components/panel";
import { SponsorsManager } from "@/components/panel/SponsorsManager";
// Server-side import: keeps the AWS SDK out of the client bundle.
import { UPLOAD_ALLOWED_CONTENT_TYPES, UPLOAD_MAX_BYTES } from "@/lib/utils/r2";
import type { Role, Sponsor } from "@/types";

export const metadata: Metadata = {
  title: "Sponsorlar — Panel",
};

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

async function fetchSponsors(): Promise<{
  sponsors: Sponsor[];
  error: boolean;
}> {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${getBaseUrl()}/api/panel/sponsors`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      sponsors?: Sponsor[];
    } | null;
    if (res.ok && data?.ok && Array.isArray(data.sponsors)) {
      return { sponsors: data.sponsors, error: false };
    }
    return { sponsors: [], error: true };
  } catch {
    return { sponsors: [], error: true };
  }
}

export default async function PanelSponsorsPage() {
  const session = await auth().catch(() => null);
  const role: Role = session?.user?.role ?? "member";

  // Sponsor CMS management is admin-only (org-level brand asset; API also 403s
  // non-admin writes).
  if (role !== "admin") {
    return (
      <div className="flex flex-col gap-8">
        <PanelPageHeader title="Sponsorlar" />
        <PanelCard>
          <p className="text-muted text-sm">
            Bu sayfayı görüntüleme yetkiniz yok. Sponsor yönetimi yalnızca
            yöneticiler içindir.
          </p>
        </PanelCard>
      </div>
    );
  }

  const { sponsors, error } = await fetchSponsors();
  const allowedImageTypes = UPLOAD_ALLOWED_CONTENT_TYPES.filter((t) =>
    t.startsWith("image/"),
  );

  return (
    <div className="flex flex-col gap-8">
      <PanelPageHeader
        title="Sponsorlar"
        description="Sponsorları yönetin; logo yükleyin, kademe atayın, yayınlayın veya gizleyin. Değişiklikler public sitedeki sponsor şeridine yansır."
      />
      <SponsorsManager
        role={role}
        allowedImageTypes={allowedImageTypes}
        maxBytes={UPLOAD_MAX_BYTES}
        initialItems={sponsors}
        initialError={error}
      />
    </div>
  );
}
