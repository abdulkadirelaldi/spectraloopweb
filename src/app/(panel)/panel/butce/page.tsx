import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { PanelCard, PanelPageHeader } from "@/components/panel";
import {
  BudgetManager,
  type BudgetSummary,
} from "@/components/panel/BudgetManager";
import type { Expense, Role } from "@/types";

export const metadata: Metadata = {
  title: "Bütçe — Panel",
};

type MemberView = { subteam?: string };

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

async function panelGet<T>(
  path: string,
  cookieHeader: string,
): Promise<{ ok: boolean; data: T | null }> {
  try {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: null };
  }
}

export default async function PanelBudgetPage() {
  const session = await auth().catch(() => null);
  const role: Role = session?.user?.role ?? "member";
  const userSubteam = session?.user?.subteam;

  // Financial data → admin + lead only (API also enforces 403).
  if (role !== "admin" && role !== "lead") {
    return (
      <div className="flex flex-col gap-8">
        <PanelPageHeader title="Bütçe" />
        <PanelCard>
          <p className="text-muted text-sm">
            Bu sayfayı görüntüleme yetkiniz yok. Bütçe ve harcama bilgileri
            yalnızca yöneticiler ve birim liderleri içindir.
          </p>
        </PanelCard>
      </div>
    );
  }

  const cookieHeader = (await cookies()).toString();
  const [budgetRes, membersRes] = await Promise.all([
    panelGet<{
      ok?: boolean;
      expenses?: Expense[];
      summary?: BudgetSummary;
    }>("/api/panel/budget", cookieHeader),
    panelGet<{ ok?: boolean; members?: MemberView[] }>(
      "/api/panel/members",
      cookieHeader,
    ),
  ]);

  const expenses =
    budgetRes.ok && budgetRes.data?.ok && Array.isArray(budgetRes.data.expenses)
      ? budgetRes.data.expenses
      : [];
  const budgetError = !(budgetRes.ok && budgetRes.data?.ok);
  const summary = budgetRes.data?.summary ?? null;

  const memberViews =
    membersRes.ok &&
    membersRes.data?.ok &&
    Array.isArray(membersRes.data.members)
      ? membersRes.data.members
      : [];
  const subteamOptions = Array.from(
    new Set(memberViews.map((m) => m.subteam).filter((s): s is string => !!s)),
  ).sort();

  return (
    <div className="flex flex-col gap-8">
      <PanelPageHeader
        title="Bütçe"
        description="Harcama taleplerini takip edin, oluşturun ve onaylayın."
      />
      <BudgetManager
        role={role}
        userSubteam={userSubteam}
        subteamOptions={subteamOptions}
        initialItems={expenses}
        initialSummary={summary}
        initialError={budgetError}
      />
    </div>
  );
}
