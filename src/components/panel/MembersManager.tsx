"use client";

import { useCallback, useState } from "react";
import { Badge, Button, Input, Select } from "@/components/ui";
import { PanelCard } from "./PanelCard";
import { ROLE_LABEL } from "./nav";
import {
  MemberForm,
  type MemberFormValues,
  type MemberSubmitResult,
} from "./MemberForm";
import type { Role } from "@/types";

const API = "/api/panel/members";

/** Safe client-facing member shape (server projection — never a passwordHash). */
export type MemberView = {
  id: string;
  name: string;
  email?: string;
  role: Role;
  subteam?: string;
  photoUrl?: string;
  active: boolean;
  createdAt: string;
};

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

type LoadStatus = "loading" | "ready" | "error";
type Editing = "new" | MemberView | null;
type Filters = { subteam: string; role: string; active: string; q: string };

export function MembersManager({
  role,
  userSubteam,
  subteamOptions,
  initialMembers,
  initialError,
}: {
  role: Role;
  userSubteam?: string;
  subteamOptions: readonly string[];
  initialMembers: MemberView[];
  initialError: boolean;
}) {
  const isAdmin = role === "admin";

  const [members, setMembers] = useState<MemberView[]>(initialMembers);
  const [status, setStatus] = useState<LoadStatus>(
    initialError ? "error" : "ready",
  );
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    subteam: "",
    role: "",
    active: "",
    q: "",
  });

  // Lead may edit only own-subteam members (name/photoUrl); admin edits anyone.
  function canEdit(member: MemberView): boolean {
    if (isAdmin) return true;
    return role === "lead" && !!userSubteam && member.subteam === userSubteam;
  }

  const load = useCallback(async (next: Filters) => {
    const params = new URLSearchParams();
    if (next.subteam) params.set("subteam", next.subteam);
    if (next.role) params.set("role", next.role);
    if (next.active) params.set("active", next.active);
    if (next.q) params.set("q", next.q);
    const qs = params.toString();
    try {
      const res = await fetch(`${API}${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        members?: MemberView[];
      } | null;
      if (res.ok && data?.ok && Array.isArray(data.members)) {
        setMembers(data.members);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  function applyFilters(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    setFilters(next);
    setStatus("loading");
    void load(next);
  }

  function buildPayload(
    values: MemberFormValues,
    mode: "create" | "edit",
  ): Record<string, unknown> {
    if (!isAdmin) {
      // Lead: strictly name + photoUrl (never role/active/email/subteam/password).
      const payload: Record<string, unknown> = { name: values.name };
      if (values.photoUrl) payload.photoUrl = values.photoUrl;
      return payload;
    }
    const payload: Record<string, unknown> = {
      name: values.name,
      email: values.email,
      role: values.role,
      active: values.active,
    };
    if (values.subteam) payload.subteam = values.subteam;
    if (values.photoUrl) payload.photoUrl = values.photoUrl;
    if (values.password) payload.password = values.password;
    // `mode` reserved for future create-only fields; both send the same set.
    void mode;
    return payload;
  }

  async function submitMember(
    url: string,
    method: "POST" | "PATCH",
    values: MemberFormValues,
    mode: "create" | "edit",
  ): Promise<MemberSubmitResult> {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(values, mode)),
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

  async function deactivateMember(id: string) {
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
      setActionError(data?.error ?? "Üye pasifleştirilemedi.");
    } catch {
      setActionError("Bağlantı hatası. Üye pasifleştirilemedi.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Create form (admin only) */}
      {isAdmin && editing === "new" ? (
        <PanelCard title="Yeni üye">
          <MemberForm
            variant="admin"
            mode="create"
            submitLabel="Oluştur"
            onSubmit={(v) => submitMember(API, "POST", v, "create")}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      {/* Edit form */}
      {editing && editing !== "new" ? (
        <PanelCard title="Üyeyi düzenle">
          <MemberForm
            variant={isAdmin ? "admin" : "leadLimited"}
            mode="edit"
            initial={{
              name: editing.name,
              email: editing.email ?? "",
              role: editing.role,
              subteam: editing.subteam ?? "",
              photoUrl: editing.photoUrl ?? "",
              active: editing.active,
            }}
            submitLabel="Güncelle"
            onSubmit={(v) =>
              submitMember(`${API}/${editing.id}`, "PATCH", v, "edit")
            }
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      {/* Toolbar + filters */}
      <div className="flex flex-col gap-4">
        {isAdmin && editing === null ? (
          <div>
            <Button onClick={() => setEditing("new")}>Yeni Üye</Button>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-muted flex flex-col gap-1 text-xs font-medium">
            Alt ekip
            <Select
              value={filters.subteam}
              onChange={(e) => applyFilters({ subteam: e.target.value })}
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
            Rol
            <Select
              value={filters.role}
              onChange={(e) => applyFilters({ role: e.target.value })}
            >
              <option value="">Tümü</option>
              {(["admin", "lead", "member"] as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-muted flex flex-col gap-1 text-xs font-medium">
            Durum
            <Select
              value={filters.active}
              onChange={(e) => applyFilters({ active: e.target.value })}
            >
              <option value="">Tümü</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </Select>
          </label>
          <form
            className="text-muted flex flex-col gap-1 text-xs font-medium"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters({});
            }}
          >
            <label htmlFor="member-search">Ara</label>
            <Input
              id="member-search"
              type="search"
              placeholder="İsim…"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </form>
        </div>
      </div>

      {actionError ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {actionError}
        </p>
      ) : null}

      {/* Directory */}
      {status === "loading" ? (
        <p className="text-muted text-sm">Yükleniyor…</p>
      ) : status === "error" ? (
        <PanelCard>
          <p className="text-muted text-sm">Üyeler yüklenemedi.</p>
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
      ) : members.length === 0 ? (
        <PanelCard>
          <p className="text-muted text-sm">Üye bulunamadı.</p>
        </PanelCard>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {members.map((member) => (
            <li key={member.id}>
              <PanelCard>
                <div className="flex items-start gap-4">
                  {member.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photoUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    >
                      {initialsOf(member.name)}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-foreground text-sm font-semibold">
                        {member.name}
                      </h3>
                      <Badge
                        variant={member.role === "admin" ? "brand" : "neutral"}
                      >
                        {ROLE_LABEL[member.role]}
                      </Badge>
                      {member.active ? (
                        <Badge variant="neutral">Aktif</Badge>
                      ) : (
                        <Badge
                          variant="neutral"
                          className="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                        >
                          Pasif
                        </Badge>
                      )}
                    </div>
                    {member.subteam ? (
                      <p className="text-muted mt-1 text-xs">
                        {member.subteam}
                      </p>
                    ) : null}
                    {member.email ? (
                      <p className="text-muted mt-1 truncate text-xs">
                        {member.email}
                      </p>
                    ) : null}

                    {canEdit(member) ? (
                      <div className="mt-3 flex items-center gap-2">
                        {confirmingId === member.id ? (
                          <>
                            <span className="text-muted text-xs">
                              Pasifleştirilsin mi?
                            </span>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => void deactivateMember(member.id)}
                            >
                              Evet
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
                                setEditing(member);
                                setConfirmingId(null);
                              }}
                            >
                              Düzenle
                            </Button>
                            {isAdmin && member.active ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmingId(member.id)}
                              >
                                Pasifleştir
                              </Button>
                            ) : null}
                          </>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </PanelCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
