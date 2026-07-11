"use client";

import { useCallback, useState } from "react";
import { Badge, Button, Select } from "@/components/ui";
import { PanelCard } from "./PanelCard";
import {
  SponsorForm,
  type SponsorFormValues,
  type SponsorSubmitResult,
} from "./SponsorForm";
import type { Role, Sponsor, SponsorTier } from "@/types";

const API = "/api/panel/sponsors";

const TIER_LABEL: Record<SponsorTier, string> = {
  gold: "Altın",
  silver: "Gümüş",
  bronze: "Bronz",
};

type LoadStatus = "loading" | "ready" | "error";
type Editing = "new" | Sponsor | null;
type Filters = { tier: string; active: string };

export function SponsorsManager({
  role,
  allowedImageTypes,
  maxBytes,
  initialItems,
  initialError,
}: {
  role: Role;
  allowedImageTypes: readonly string[];
  maxBytes: number;
  initialItems: Sponsor[];
  initialError: boolean;
}) {
  const isAdmin = role === "admin";

  const [items, setItems] = useState<Sponsor[]>(initialItems);
  const [status, setStatus] = useState<LoadStatus>(
    initialError ? "error" : "ready",
  );
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ tier: "", active: "" });

  const load = useCallback(async (next: Filters) => {
    const params = new URLSearchParams();
    if (next.tier) params.set("tier", next.tier);
    if (next.active) params.set("active", next.active);
    const qs = params.toString();
    try {
      const res = await fetch(`${API}${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        sponsors?: Sponsor[];
      } | null;
      if (res.ok && data?.ok && Array.isArray(data.sponsors)) {
        setItems(data.sponsors);
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

  function buildPayload(values: SponsorFormValues) {
    const payload: Record<string, unknown> = {
      name: values.name,
      logoUrl: values.logoUrl,
      tier: values.tier,
      active: values.active,
    };
    if (values.website) payload.website = values.website;
    return payload;
  }

  async function submitSponsor(
    url: string,
    method: "POST" | "PATCH",
    values: SponsorFormValues,
  ): Promise<SponsorSubmitResult> {
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

  // Publish / unpublish — reflects on the public strip via server revalidate.
  async function togglePublish(sponsor: Sponsor) {
    setActionError(null);
    try {
      const res = await fetch(`${API}/${sponsor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !sponsor.active }),
      });
      if (res.ok) {
        await load(filters);
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setActionError(data?.error ?? "Yayın durumu güncellenemedi.");
    } catch {
      setActionError("Bağlantı hatası. Yayın durumu güncellenemedi.");
    }
  }

  async function deleteSponsor(id: string) {
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
      setActionError(data?.error ?? "Sponsor silinemedi.");
    } catch {
      setActionError("Bağlantı hatası. Sponsor silinemedi.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {isAdmin && editing === "new" ? (
        <PanelCard title="Yeni sponsor">
          <SponsorForm
            allowedImageTypes={allowedImageTypes}
            maxBytes={maxBytes}
            submitLabel="Ekle"
            onSubmit={(v) => submitSponsor(API, "POST", v)}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      {isAdmin && editing && editing !== "new" ? (
        <PanelCard title="Sponsoru düzenle">
          <SponsorForm
            allowedImageTypes={allowedImageTypes}
            maxBytes={maxBytes}
            initial={{
              name: editing.name,
              logoUrl: editing.logoUrl,
              tier: editing.tier,
              website: editing.website ?? "",
              active: editing.active,
            }}
            submitLabel="Güncelle"
            onSubmit={(v) => submitSponsor(`${API}/${editing.id}`, "PATCH", v)}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      <div className="flex flex-col gap-4">
        {isAdmin && editing === null ? (
          <div>
            <Button onClick={() => setEditing("new")}>Yeni Sponsor</Button>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-muted flex flex-col gap-1 text-xs font-medium">
            Kademe
            <Select
              value={filters.tier}
              onChange={(e) => applyFilters({ tier: e.target.value })}
            >
              <option value="">Tümü</option>
              {(["gold", "silver", "bronze"] as SponsorTier[]).map((t) => (
                <option key={t} value={t}>
                  {TIER_LABEL[t]}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-muted flex flex-col gap-1 text-xs font-medium">
            Yayın durumu
            <Select
              value={filters.active}
              onChange={(e) => applyFilters({ active: e.target.value })}
            >
              <option value="">Tümü</option>
              <option value="true">Yayında</option>
              <option value="false">Gizli</option>
            </Select>
          </label>
        </div>
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
          <p className="text-muted text-sm">Sponsorlar yüklenemedi.</p>
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
          <p className="text-muted text-sm">Henüz sponsor yok.</p>
        </PanelCard>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((sponsor) => (
            <li key={sponsor.id}>
              <PanelCard>
                <div className="flex items-start gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sponsor.logoUrl}
                    alt={`${sponsor.name} logosu`}
                    className="border-border h-14 w-20 shrink-0 rounded-lg border bg-white object-contain p-1"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-foreground text-sm font-semibold">
                        {sponsor.name}
                      </h3>
                      <Badge variant={sponsor.tier}>
                        {TIER_LABEL[sponsor.tier]}
                      </Badge>
                      {sponsor.active ? (
                        <Badge
                          variant="neutral"
                          className="bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300"
                        >
                          Yayında
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Gizli</Badge>
                      )}
                    </div>
                    {sponsor.website ? (
                      <a
                        href={sponsor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-300 mt-1 inline-block truncate text-xs"
                      >
                        {sponsor.website}
                      </a>
                    ) : null}

                    {isAdmin ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          variant={sponsor.active ? "ghost" : "primary"}
                          onClick={() => void togglePublish(sponsor)}
                        >
                          {sponsor.active ? "Gizle" : "Yayınla"}
                        </Button>
                        {confirmingId === sponsor.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditing(sponsor);
                                setConfirmingId(null);
                              }}
                            >
                              Düzenle
                            </Button>
                            <span className="text-muted text-xs">
                              Silinsin mi?
                            </span>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => void deleteSponsor(sponsor.id)}
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
                                setEditing(sponsor);
                                setConfirmingId(null);
                              }}
                            >
                              Düzenle
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmingId(sponsor.id)}
                            >
                              Sil
                            </Button>
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
