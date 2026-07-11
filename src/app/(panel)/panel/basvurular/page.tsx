import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { PanelCard, PanelPageHeader } from "@/components/panel";
import { ApplicationsManager } from "@/components/panel/ApplicationsManager";
import type { Application, Role } from "@/types";

export const metadata: Metadata = {
  title: "Başvurular — Panel",
};

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

async function fetchApplications(): Promise<{
  applications: Application[];
  error: boolean;
}> {
  try {
    const cookieHeader = (await cookies()).toString();
    const res = await fetch(`${getBaseUrl()}/api/panel/applications`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean;
      applications?: Application[];
    } | null;
    if (res.ok && data?.ok && Array.isArray(data.applications)) {
      return { applications: data.applications, error: false };
    }
    return { applications: [], error: true };
  } catch {
    return { applications: [], error: true };
  }
}

export default async function PanelApplicationsPage() {
  const session = await auth().catch(() => null);
  const role: Role = session?.user?.role ?? "member";

  // Applications hold applicant PII → admin + lead only (API also enforces 403).
  if (role !== "admin" && role !== "lead") {
    return (
      <div className="flex flex-col gap-8">
        <PanelPageHeader title="Başvurular" />
        <PanelCard>
          <p className="text-muted text-sm">
            Bu sayfayı görüntüleme yetkiniz yok. Başvuru yönetimi yalnızca
            yöneticiler ve birim liderleri içindir.
          </p>
        </PanelCard>
      </div>
    );
  }

  const { applications, error } = await fetchApplications();

  return (
    <div className="flex flex-col gap-8">
      <PanelPageHeader
        title="Başvurular"
        description="'Bize Katıl' başvurularını inceleyin ve durumlarını güncelleyin."
      />
      <ApplicationsManager
        role={role}
        initialItems={applications}
        initialError={error}
      />
    </div>
  );
}
