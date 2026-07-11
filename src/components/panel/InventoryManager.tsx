"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge, Button, Input, Select } from "@/components/ui";
import { PanelCard } from "./PanelCard";
import {
  INVENTORY_STATUS_OPTIONS,
  InventoryForm,
  type InventoryFormValues,
  type InventorySubmitResult,
} from "./InventoryForm";
import type { Inventory, InventoryStatus, Role } from "@/types";

const API = "/api/panel/inventory";

// Status color scheme: available=green, in-use=blue, maintenance=amber,
// depleted=red.
const STATUS_META: Record<
  InventoryStatus,
  { label: string; className: string }
> = {
  available: {
    label: "Mevcut",
    className:
      "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  },
  "in-use": {
    label: "Kullanımda",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  },
  maintenance: {
    label: "Bakımda",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  },
  depleted: {
    label: "Tükendi",
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
};

type LoadStatus = "loading" | "ready" | "error";
type Editing = "new" | Inventory | null;
type Filters = { category: string; status: string; subteam: string; q: string };

export function InventoryManager({
  role,
  userSubteam,
  subteamOptions,
  initialItems,
  initialError,
}: {
  role: Role;
  userSubteam?: string;
  subteamOptions: readonly string[];
  initialItems: Inventory[];
  initialError: boolean;
}) {
  const canCreate = role === "admin" || role === "lead";

  const [items, setItems] = useState<Inventory[]>(initialItems);
  const [status, setStatus] = useState<LoadStatus>(
    initialError ? "error" : "ready",
  );
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    category: "",
    status: "",
    subteam: "",
    q: "",
  });

  // Distinct categories from the loaded set, for the filter dropdown.
  const categoryOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items],
  );

  function canManage(item: Inventory): boolean {
    if (role === "admin") return true;
    if (role === "lead") return !!userSubteam && item.subteam === userSubteam;
    return false;
  }

  const load = useCallback(async (next: Filters) => {
    const params = new URLSearchParams();
    if (next.category) params.set("category", next.category);
    if (next.status) params.set("status", next.status);
    if (next.subteam) params.set("subteam", next.subteam);
    if (next.q) params.set("q", next.q);
    const qs = params.toString();
    try {
      const res = await fetch(`${API}${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        items?: Inventory[];
      } | null;
      if (res.ok && data?.ok && Array.isArray(data.items)) {
        setItems(data.items);
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

  function buildPayload(values: InventoryFormValues) {
    const payload: Record<string, unknown> = {
      name: values.name,
      category: values.category,
      quantity: Number(values.quantity),
      unit: values.unit,
      status: values.status,
    };
    if (values.location) payload.location = values.location;
    if (values.notes) payload.notes = values.notes;
    if (role === "admin" && values.subteam) payload.subteam = values.subteam;
    return payload;
  }

  async function submitItem(
    url: string,
    method: "POST" | "PATCH",
    values: InventoryFormValues,
  ): Promise<InventorySubmitResult> {
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

  // Quick inline update (status change / quantity step).
  async function patchQuick(id: string, patch: Record<string, unknown>) {
    setActionError(null);
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        await load(filters);
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setActionError(data?.error ?? "Güncellenemedi.");
    } catch {
      setActionError("Bağlantı hatası. Güncellenemedi.");
    }
  }

  async function deleteItem(id: string) {
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
      setActionError(data?.error ?? "Malzeme silinemedi.");
    } catch {
      setActionError("Bağlantı hatası. Malzeme silinemedi.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {canCreate && editing === "new" ? (
        <PanelCard title="Yeni malzeme">
          <InventoryForm
            role={role}
            userSubteam={userSubteam}
            subteamOptions={subteamOptions}
            submitLabel="Ekle"
            onSubmit={(v) => submitItem(API, "POST", v)}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      {editing && editing !== "new" ? (
        <PanelCard title="Malzemeyi düzenle">
          <InventoryForm
            role={role}
            userSubteam={userSubteam}
            subteamOptions={subteamOptions}
            initial={{
              name: editing.name,
              category: editing.category,
              quantity: String(editing.quantity),
              unit: editing.unit,
              location: editing.location ?? "",
              subteam: editing.subteam ?? "",
              status: editing.status,
              notes: editing.notes ?? "",
            }}
            submitLabel="Güncelle"
            onSubmit={(v) => submitItem(`${API}/${editing.id}`, "PATCH", v)}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      <div className="flex flex-col gap-4">
        {canCreate && editing === null ? (
          <div>
            <Button onClick={() => setEditing("new")}>Yeni Malzeme</Button>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-muted flex flex-col gap-1 text-xs font-medium">
            Kategori
            <Select
              value={filters.category}
              onChange={(e) => applyFilters({ category: e.target.value })}
            >
              <option value="">Tümü</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
          <label className="text-muted flex flex-col gap-1 text-xs font-medium">
            Durum
            <Select
              value={filters.status}
              onChange={(e) => applyFilters({ status: e.target.value })}
            >
              <option value="">Tümü</option>
              {INVENTORY_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </label>
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
          <form
            className="text-muted flex flex-col gap-1 text-xs font-medium"
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters({});
            }}
          >
            <label htmlFor="inventory-search">Ara</label>
            <Input
              id="inventory-search"
              type="search"
              placeholder="Ad veya kategori…"
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

      {status === "loading" ? (
        <p className="text-muted text-sm">Yükleniyor…</p>
      ) : status === "error" ? (
        <PanelCard>
          <p className="text-muted text-sm">Envanter yüklenemedi.</p>
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
          <p className="text-muted text-sm">Malzeme bulunamadı.</p>
        </PanelCard>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {items.map((item) => {
            const meta = STATUS_META[item.status];
            const manage = canManage(item);
            return (
              <li key={item.id}>
                <PanelCard>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-foreground text-sm font-semibold">
                          {item.name}
                        </h3>
                        <Badge variant="neutral" className={meta.className}>
                          {meta.label}
                        </Badge>
                        <Badge variant="neutral">{item.category}</Badge>
                        {item.subteam ? (
                          <Badge variant="neutral">{item.subteam}</Badge>
                        ) : null}
                      </div>
                      <p className="text-foreground mt-2 text-sm">
                        <span className="font-semibold">{item.quantity}</span>{" "}
                        {item.unit}
                        {item.location ? (
                          <span className="text-muted"> · {item.location}</span>
                        ) : null}
                      </p>
                      {item.notes ? (
                        <p className="text-muted mt-1 line-clamp-2 text-xs">
                          {item.notes}
                        </p>
                      ) : null}
                    </div>

                    {manage ? (
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {/* Quick quantity stepper */}
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`${item.name} miktarını azalt`}
                            onClick={() =>
                              void patchQuick(item.id, {
                                quantity: Math.max(0, item.quantity - 1),
                              })
                            }
                          >
                            −
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={`${item.name} miktarını artır`}
                            onClick={() =>
                              void patchQuick(item.id, {
                                quantity: item.quantity + 1,
                              })
                            }
                          >
                            +
                          </Button>
                        </div>
                        {/* Quick status change */}
                        <Select
                          aria-label={`${item.name} durumunu değiştir`}
                          value={item.status}
                          onChange={(e) =>
                            void patchQuick(item.id, {
                              status: e.target.value as InventoryStatus,
                            })
                          }
                          className="w-36"
                        >
                          {INVENTORY_STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ) : null}
                  </div>

                  {manage ? (
                    <div className="border-border mt-3 flex items-center gap-2 border-t pt-3">
                      {confirmingId === item.id ? (
                        <>
                          <span className="text-muted text-xs">
                            Emin misiniz?
                          </span>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => void deleteItem(item.id)}
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
                              setEditing(item);
                              setConfirmingId(null);
                            }}
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmingId(item.id)}
                          >
                            Sil
                          </Button>
                        </>
                      )}
                    </div>
                  ) : null}
                </PanelCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
