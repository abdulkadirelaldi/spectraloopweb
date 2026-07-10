"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge, Button, Select } from "@/components/ui";
import { PanelCard } from "./PanelCard";
import {
  STATUS_OPTIONS,
  TaskForm,
  type MemberOption,
  type TaskFormValues,
  type TaskSubmitResult,
} from "./TaskForm";
import type { Role, Task, TaskStatus } from "@/types";

const API = "/api/panel/tasks";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return "";
  }
}

function toDateInput(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

type LoadStatus = "loading" | "ready" | "error";
type Editing = "new" | Task | null;
type Filters = { subteam: string; status: string; assignee: string };

export function TasksManager({
  role,
  userId,
  userSubteam,
  members,
  subteamOptions,
  initialTasks,
  initialError,
}: {
  role: Role;
  userId: string;
  userSubteam?: string;
  members: readonly MemberOption[];
  subteamOptions: readonly string[];
  initialTasks: Task[];
  initialError: boolean;
}) {
  const canCreate = role === "admin" || role === "lead";

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [status, setStatus] = useState<LoadStatus>(
    initialError ? "error" : "ready",
  );
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    subteam: "",
    status: "",
    assignee: "",
  });

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of members) map.set(m.id, m.name);
    return map;
  }, [members]);

  const load = useCallback(async (next: Filters) => {
    const params = new URLSearchParams();
    if (next.subteam) params.set("subteam", next.subteam);
    if (next.status) params.set("status", next.status);
    if (next.assignee) params.set("assignee", next.assignee);
    const qs = params.toString();
    try {
      const res = await fetch(`${API}${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        tasks?: Task[];
      } | null;
      if (res.ok && data?.ok && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  function onFilterChange(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    setStatus("loading");
    void load(next);
  }

  // admin: manage all; lead: own subteam; member: none.
  function canManage(task: Task): boolean {
    if (role === "admin") return true;
    if (role === "lead") return !!userSubteam && task.subteam === userSubteam;
    return false;
  }
  // Broader than manage: a member may change status of their OWN task.
  function canChangeStatus(task: Task): boolean {
    return canManage(task) || (role === "member" && task.assigneeId === userId);
  }

  function buildPayload(values: TaskFormValues) {
    const payload: Record<string, unknown> = {
      title: values.title,
      status: values.status,
    };
    if (values.description) payload.description = values.description;
    if (values.assigneeId) payload.assigneeId = values.assigneeId;
    if (values.dueDate) payload.dueDate = values.dueDate;
    // Only admins send subteam; leads are server-pinned to their own.
    if (role === "admin" && values.subteam) payload.subteam = values.subteam;
    return payload;
  }

  async function submitTask(
    url: string,
    method: "POST" | "PATCH",
    values: TaskFormValues,
  ): Promise<TaskSubmitResult> {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(values)),
      });
      if (res.ok) {
        setEditing(null);
        await load(filters);
        return { ok: true };
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      return {
        ok: false,
        error: data?.error ?? "İşlem başarısız oldu. Lütfen tekrar deneyin.",
      };
    } catch {
      return { ok: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." };
    }
  }

  async function changeStatus(id: string, nextStatus: TaskStatus) {
    setActionError(null);
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await load(filters);
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setActionError(data?.error ?? "Durum güncellenemedi.");
    } catch {
      setActionError("Bağlantı hatası. Durum güncellenemedi.");
    }
  }

  async function deleteTask(id: string) {
    setActionError(null);
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmingId(null);
        await load(filters);
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setActionError(data?.error ?? "Görev silinemedi.");
    } catch {
      setActionError("Bağlantı hatası. Görev silinemedi.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Create / edit form */}
      {canCreate && editing === "new" ? (
        <PanelCard title="Yeni görev">
          <TaskForm
            role={role}
            userSubteam={userSubteam}
            memberOptions={members}
            subteamOptions={subteamOptions}
            submitLabel="Oluştur"
            onSubmit={(values) => submitTask(API, "POST", values)}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      {editing && editing !== "new" ? (
        <PanelCard title="Görevi düzenle">
          <TaskForm
            role={role}
            userSubteam={userSubteam}
            memberOptions={members}
            subteamOptions={subteamOptions}
            initial={{
              title: editing.title,
              description: editing.description ?? "",
              subteam: editing.subteam ?? "",
              assigneeId: editing.assigneeId ?? "",
              status: editing.status,
              dueDate: toDateInput(editing.dueDate),
            }}
            submitLabel="Güncelle"
            onSubmit={(values) =>
              submitTask(`${API}/${editing.id}`, "PATCH", values)
            }
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      {/* Toolbar + filters */}
      <div className="flex flex-col gap-4">
        {canCreate && editing === null ? (
          <div>
            <Button onClick={() => setEditing("new")}>Yeni Görev</Button>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-muted flex flex-col gap-1 text-xs font-medium">
            Alt ekip
            <Select
              value={filters.subteam}
              onChange={(e) => onFilterChange({ subteam: e.target.value })}
            >
              <option value="">Tümü</option>
              {subteamOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-muted flex flex-col gap-1 text-xs font-medium">
            Durum
            <Select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
            >
              <option value="">Tümü</option>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-muted flex flex-col gap-1 text-xs font-medium">
            Atanan
            <Select
              value={filters.assignee}
              onChange={(e) => onFilterChange({ assignee: e.target.value })}
            >
              <option value="">Tümü</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </div>

      {actionError ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {actionError}
        </p>
      ) : null}

      {/* Board */}
      {status === "loading" ? (
        <p className="text-muted text-sm">Yükleniyor…</p>
      ) : status === "error" ? (
        <PanelCard>
          <p className="text-muted text-sm">Görevler yüklenemedi.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setStatus("loading");
              void load(filters);
            }}
          >
            Tekrar dene
          </Button>
        </PanelCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-4">
          {STATUS_OPTIONS.map((column) => {
            const columnTasks = tasks.filter((t) => t.status === column.value);
            return (
              <div key={column.value} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-foreground text-sm font-semibold">
                    {column.label}
                  </h2>
                  <Badge variant="neutral">{columnTasks.length}</Badge>
                </div>

                {columnTasks.length === 0 ? (
                  <p className="border-border text-muted rounded-lg border border-dashed p-4 text-center text-xs">
                    Görev yok
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <PanelCard key={task.id}>
                      <h3 className="text-foreground text-sm font-semibold">
                        {task.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {task.subteam ? (
                          <Badge variant="neutral">{task.subteam}</Badge>
                        ) : null}
                        {task.assigneeId ? (
                          <Badge variant="brand">
                            {memberNameById.get(task.assigneeId) ?? "Atanan"}
                          </Badge>
                        ) : null}
                      </div>
                      {task.dueDate ? (
                        <p className="text-muted mt-2 text-xs">
                          Son tarih: {formatDate(task.dueDate)}
                        </p>
                      ) : null}
                      {task.description ? (
                        <p className="text-muted mt-2 line-clamp-3 text-xs">
                          {task.description}
                        </p>
                      ) : null}

                      {/* Status quick-change (manager, or member on own task) */}
                      {canChangeStatus(task) ? (
                        <label className="text-muted mt-3 block text-xs font-medium">
                          Durum
                          <Select
                            className="mt-1"
                            value={task.status}
                            aria-label={`${task.title} durumunu değiştir`}
                            onChange={(e) =>
                              void changeStatus(
                                task.id,
                                e.target.value as TaskStatus,
                              )
                            }
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </label>
                      ) : null}

                      {/* Manage actions */}
                      {canManage(task) ? (
                        <div className="mt-3 flex items-center gap-2">
                          {confirmingId === task.id ? (
                            <>
                              <span className="text-muted text-xs">
                                Emin misiniz?
                              </span>
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => void deleteTask(task.id)}
                              >
                                Sil
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmingId(null)}
                              >
                                Vazgeç
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditing(task);
                                  setConfirmingId(null);
                                }}
                              >
                                Düzenle
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmingId(task.id)}
                              >
                                Sil
                              </Button>
                            </>
                          )}
                        </div>
                      ) : null}
                    </PanelCard>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
