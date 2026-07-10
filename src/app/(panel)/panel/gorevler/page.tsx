import type { Metadata } from "next";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { PanelPageHeader } from "@/components/panel";
import { TasksManager } from "@/components/panel/TasksManager";
import type { MemberOption } from "@/components/panel/TaskForm";
import type { Role, Task } from "@/types";

export const metadata: Metadata = {
  title: "Görevler — Panel",
};

type MemberView = { id: string; name: string; subteam?: string };

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

/** GET an internal panel API, forwarding the session cookie. Never throws. */
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

export default async function PanelTasksPage() {
  const session = await auth().catch(() => null);
  const role: Role = session?.user?.role ?? "member";
  const userId = session?.user?.id ?? "";
  const userSubteam = session?.user?.subteam;
  const canCreate = role === "admin" || role === "lead";

  const cookieHeader = (await cookies()).toString();

  const [tasksRes, membersRes] = await Promise.all([
    panelGet<{ ok?: boolean; tasks?: Task[] }>(
      "/api/panel/tasks",
      cookieHeader,
    ),
    panelGet<{ ok?: boolean; members?: MemberView[] }>(
      "/api/panel/members",
      cookieHeader,
    ),
  ]);

  const tasks =
    tasksRes.ok && tasksRes.data?.ok && Array.isArray(tasksRes.data.tasks)
      ? tasksRes.data.tasks
      : [];
  const tasksError = !(tasksRes.ok && tasksRes.data?.ok);

  const memberViews =
    membersRes.ok &&
    membersRes.data?.ok &&
    Array.isArray(membersRes.data.members)
      ? membersRes.data.members
      : [];

  const members: MemberOption[] = memberViews.map((m) => ({
    id: m.id,
    name: m.name,
  }));

  // Distinct subteams present in the directory (used for admin create + filters).
  const subteamOptions = Array.from(
    new Set(memberViews.map((m) => m.subteam).filter((s): s is string => !!s)),
  ).sort();

  return (
    <div className="flex flex-col gap-8">
      <PanelPageHeader
        title="Görevler"
        description={
          canCreate
            ? "Görevleri birim bazında yönetin; oluşturun, atayın ve durumlarını güncelleyin."
            : "Size atanan görevleri görüntüleyin ve durumlarını güncelleyin."
        }
      />
      <TasksManager
        role={role}
        userId={userId}
        userSubteam={userSubteam}
        members={members}
        subteamOptions={subteamOptions}
        initialTasks={tasks}
        initialError={tasksError}
      />
    </div>
  );
}
