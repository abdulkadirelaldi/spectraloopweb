"use client";

import { useCallback, useState } from "react";
import { Badge, Button, Input, Select } from "@/components/ui";
import { PanelCard } from "./PanelCard";
import type { Application, ApplicationStatus, Role } from "@/types";

const API = "/api/panel/applications";

// Status color scheme (brand-token friendly): new=neutral, reviewing=amber,
// accepted=green, rejected=red.
const STATUS_META: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  new: {
    label: "Yeni",
    className: "bg-black/5 text-foreground dark:bg-white/10",
  },
  reviewing: {
    label: "İnceleniyor",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  },
  accepted: {
    label: "Kabul edildi",
    className:
      "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  },
  rejected: {
    label: "Reddedildi",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
};

const STATUS_ORDER: ApplicationStatus[] = [
  "new",
  "reviewing",
  "accepted",
  "rejected",
];

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

type LoadStatus = "loading" | "ready" | "error";
type Filters = { status: string; q: string };

export function ApplicationsManager({
  role,
  initialItems,
  initialError,
}: {
  role: Role;
  initialItems: Application[];
  initialError: boolean;
}) {
  const canDelete = role === "admin";

  const [items, setItems] = useState<Application[]>(initialItems);
  const [status, setStatus] = useState<LoadStatus>(
    initialError ? "error" : "ready",
  );
  const [filters, setFilters] = useState<Filters>({ status: "", q: "" });
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (next: Filters) => {
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.q) params.set("q", next.q);
    const qs = params.toString();
    try {
      const res = await fetch(`${API}${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        applications?: Application[];
      } | null;
      if (res.ok && data?.ok && Array.isArray(data.applications)) {
        setItems(data.applications);
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

  async function updateStatus(id: string, nextStatus: ApplicationStatus) {
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

  async function deleteApplication(id: string) {
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
      setActionError(data?.error ?? "Başvuru silinemedi.");
    } catch {
      setActionError("Bağlantı hatası. Başvuru silinemedi.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-muted flex flex-col gap-1 text-xs font-medium">
          Durum
          <Select
            value={filters.status}
            onChange={(e) => applyFilters({ status: e.target.value })}
          >
            <option value="">Tümü</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </label>
        <form
          className="text-muted flex flex-col gap-1 text-xs font-medium"
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters({});
          }}
        >
          <label htmlFor="application-search">Ara</label>
          <Input
            id="application-search"
            type="search"
            placeholder="İsim, e-posta veya birim…"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
        </form>
      </div>

      {actionError ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {actionError}
        </p>
      ) : null}

      {status === "loading" ? (
        <p className="text-muted text-sm">Yükleniyor…</p>
      ) : status === "error" ? (
        <PanelCard>
          <p className="text-muted text-sm">Başvurular yüklenemedi.</p>
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
      ) : items.length === 0 ? (
        <PanelCard>
          <p className="text-muted text-sm">Başvuru bulunamadı.</p>
        </PanelCard>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((app) => {
            const meta = STATUS_META[app.status];
            return (
              <li key={app.id}>
                <PanelCard>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-foreground text-sm font-semibold">
                          {app.name}
                        </h3>
                        <Badge variant="neutral" className={meta.className}>
                          {meta.label}
                        </Badge>
                        <Badge variant="neutral">{app.subteamPref}</Badge>
                      </div>
                      <p className="text-muted mt-1 text-xs">
                        <a
                          href={`mailto:${app.email}`}
                          className="hover:text-foreground"
                        >
                          {app.email}
                        </a>{" "}
                        · {formatDate(app.createdAt)}
                      </p>

                      {/* Read-only applicant content (never editable) */}
                      <details className="mt-2">
                        <summary className="text-brand-600 dark:text-brand-300 cursor-pointer text-xs font-medium">
                          Başvuru mesajını gör
                        </summary>
                        <p className="border-border bg-background text-foreground mt-2 rounded-lg border p-3 text-sm whitespace-pre-wrap">
                          {app.message}
                        </p>
                      </details>
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      <label className="text-muted flex flex-col gap-1 text-xs font-medium sm:w-44">
                        Durum
                        <Select
                          value={app.status}
                          aria-label={`${app.name} başvuru durumu`}
                          onChange={(e) =>
                            void updateStatus(
                              app.id,
                              e.target.value as ApplicationStatus,
                            )
                          }
                        >
                          {STATUS_ORDER.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_META[s].label}
                            </option>
                          ))}
                        </Select>
                      </label>

                      {canDelete ? (
                        confirmingId === app.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-muted text-xs">
                              Silinsin mi?
                            </span>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => void deleteApplication(app.id)}
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
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmingId(app.id)}
                          >
                            Sil
                          </Button>
                        )
                      ) : null}
                    </div>
                  </div>
                </PanelCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
