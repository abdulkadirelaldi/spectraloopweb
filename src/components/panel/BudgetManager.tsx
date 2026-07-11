"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge, Button, Input, Select } from "@/components/ui";
import { PanelCard, StatCard } from "./PanelCard";
import {
  ExpenseForm,
  type ExpenseFormValues,
  type ExpenseSubmitResult,
} from "./ExpenseForm";
import type { Expense, ExpenseStatus, Role } from "@/types";

const API = "/api/panel/budget";

const STATUS_META: Record<ExpenseStatus, { label: string; className: string }> =
  {
    pending: {
      label: "Beklemede",
      className:
        "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
    },
    approved: {
      label: "Onaylandı",
      className:
        "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
    },
    reimbursed: {
      label: "Ödendi",
      className:
        "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    },
    rejected: {
      label: "Reddedildi",
      className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    },
  };

const STATUS_ORDER: ExpenseStatus[] = [
  "pending",
  "approved",
  "reimbursed",
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

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export type BudgetSummary = {
  count: number;
  byStatus: Record<ExpenseStatus, number>;
  totalsByCurrency: Record<string, number>;
};

function computeSummary(expenses: Expense[]): BudgetSummary {
  const byStatus: Record<ExpenseStatus, number> = {
    pending: 0,
    approved: 0,
    reimbursed: 0,
    rejected: 0,
  };
  const totalsByCurrency: Record<string, number> = {};
  for (const e of expenses) {
    byStatus[e.status] += 1;
    totalsByCurrency[e.currency] =
      (totalsByCurrency[e.currency] ?? 0) + e.amount;
  }
  return { count: expenses.length, byStatus, totalsByCurrency };
}

type LoadStatus = "loading" | "ready" | "error";
type Editing = "new" | Expense | null;
type Filters = {
  status: string;
  category: string;
  subteam: string;
  from: string;
  to: string;
};

export function BudgetManager({
  role,
  userSubteam,
  subteamOptions,
  initialItems,
  initialSummary,
  initialError,
}: {
  role: Role;
  userSubteam?: string;
  subteamOptions: readonly string[];
  initialItems: Expense[];
  initialSummary: BudgetSummary | null;
  initialError: boolean;
}) {
  const isAdmin = role === "admin";

  const [items, setItems] = useState<Expense[]>(initialItems);
  const [summary, setSummary] = useState<BudgetSummary>(
    initialSummary ?? computeSummary(initialItems),
  );
  const [status, setStatus] = useState<LoadStatus>(
    initialError ? "error" : "ready",
  );
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: "",
    category: "",
    subteam: "",
    from: "",
    to: "",
  });

  const categoryOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items],
  );

  // admin: manage any; lead: own-subteam PENDING only.
  function canEdit(expense: Expense): boolean {
    if (isAdmin) return true;
    return (
      role === "lead" &&
      !!userSubteam &&
      expense.subteam === userSubteam &&
      expense.status === "pending"
    );
  }

  const load = useCallback(async (next: Filters) => {
    const params = new URLSearchParams();
    if (next.status) params.set("status", next.status);
    if (next.category) params.set("category", next.category);
    if (next.subteam) params.set("subteam", next.subteam);
    if (next.from) params.set("from", next.from);
    if (next.to) params.set("to", next.to);
    const qs = params.toString();
    try {
      const res = await fetch(`${API}${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        expenses?: Expense[];
        summary?: BudgetSummary;
      } | null;
      if (res.ok && data?.ok && Array.isArray(data.expenses)) {
        setItems(data.expenses);
        setSummary(data.summary ?? computeSummary(data.expenses));
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

  function buildPayload(values: ExpenseFormValues) {
    const payload: Record<string, unknown> = {
      title: values.title,
      amount: Number(values.amount),
      currency: values.currency,
      category: values.category,
      date: values.date,
    };
    if (values.notes) payload.notes = values.notes;
    // Only admins send subteam; leads are server-pinned. Never send status here.
    if (isAdmin && values.subteam) payload.subteam = values.subteam;
    return payload;
  }

  async function submitExpense(
    url: string,
    method: "POST" | "PATCH",
    values: ExpenseFormValues,
  ): Promise<ExpenseSubmitResult> {
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

  // Admin-only status transition (approve / reimburse / reject).
  async function changeStatus(id: string, nextStatus: ExpenseStatus) {
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

  async function deleteExpense(id: string) {
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
      setActionError(data?.error ?? "Harcama silinemedi.");
    } catch {
      setActionError("Bağlantı hatası. Harcama silinemedi.");
    }
  }

  const currencyEntries = Object.entries(summary.totalsByCurrency);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Toplam kayıt" value={summary.count} />
        {currencyEntries.length > 0 ? (
          currencyEntries.map(([cur, total]) => (
            <StatCard
              key={cur}
              label={`Toplam (${cur})`}
              value={formatMoney(total, cur)}
            />
          ))
        ) : (
          <StatCard label="Toplam" value={formatMoney(0, "TRY")} />
        )}
        <StatCard
          label="Beklemede"
          value={summary.byStatus.pending}
          hint={`Onaylandı: ${summary.byStatus.approved} · Ödendi: ${summary.byStatus.reimbursed} · Reddedildi: ${summary.byStatus.rejected}`}
        />
      </div>

      {/* Create / edit form */}
      {editing === "new" ? (
        <PanelCard title="Yeni harcama talebi">
          <ExpenseForm
            role={role}
            userSubteam={userSubteam}
            subteamOptions={subteamOptions}
            submitLabel="Gönder"
            onSubmit={(v) => submitExpense(API, "POST", v)}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      {editing && editing !== "new" ? (
        <PanelCard title="Harcamayı düzenle">
          <ExpenseForm
            role={role}
            userSubteam={userSubteam}
            subteamOptions={subteamOptions}
            initial={{
              title: editing.title,
              amount: String(editing.amount),
              currency: editing.currency,
              category: editing.category,
              subteam: editing.subteam ?? "",
              date: editing.date.slice(0, 10),
              notes: editing.notes ?? "",
            }}
            submitLabel="Güncelle"
            onSubmit={(v) => submitExpense(`${API}/${editing.id}`, "PATCH", v)}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      {/* Toolbar + filters */}
      <div className="flex flex-col gap-4">
        {editing === null ? (
          <div>
            <Button onClick={() => setEditing("new")}>Yeni Harcama</Button>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
          {isAdmin ? (
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
          ) : null}
          <label className="text-muted flex flex-col gap-1 text-xs font-medium">
            Başlangıç
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => applyFilters({ from: e.target.value })}
            />
          </label>
          <label className="text-muted flex flex-col gap-1 text-xs font-medium">
            Bitiş
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => applyFilters({ to: e.target.value })}
            />
          </label>
        </div>
      </div>

      {actionError ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {actionError}
        </p>
      ) : null}

      {/* List */}
      {status === "loading" ? (
        <p className="text-muted text-sm">Yükleniyor…</p>
      ) : status === "error" ? (
        <PanelCard>
          <p className="text-muted text-sm">Harcamalar yüklenemedi.</p>
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
          <p className="text-muted text-sm">Harcama kaydı yok.</p>
        </PanelCard>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((expense) => {
            const meta = STATUS_META[expense.status];
            return (
              <li key={expense.id}>
                <PanelCard>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-foreground text-sm font-semibold">
                          {expense.title}
                        </h3>
                        <Badge variant="neutral" className={meta.className}>
                          {meta.label}
                        </Badge>
                        <Badge variant="neutral">{expense.category}</Badge>
                        {expense.subteam ? (
                          <Badge variant="neutral">{expense.subteam}</Badge>
                        ) : null}
                      </div>
                      <p className="text-foreground mt-2 text-base font-semibold">
                        {formatMoney(expense.amount, expense.currency)}
                      </p>
                      <p className="text-muted mt-1 text-xs">
                        {formatDate(expense.date)}
                      </p>
                      {expense.notes ? (
                        <p className="text-muted mt-1 line-clamp-2 text-xs">
                          {expense.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                      {/* Approval flow — ADMIN ONLY */}
                      {isAdmin ? (
                        <label className="text-muted flex flex-col gap-1 text-xs font-medium sm:w-44">
                          Durum
                          <Select
                            value={expense.status}
                            aria-label={`${expense.title} durumunu değiştir`}
                            onChange={(e) =>
                              void changeStatus(
                                expense.id,
                                e.target.value as ExpenseStatus,
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
                      ) : null}

                      {canEdit(expense) ? (
                        confirmingId === expense.id ? (
                          <div className="flex items-center gap-2">
                            <span className="text-muted text-xs">
                              Emin misiniz?
                            </span>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => void deleteExpense(expense.id)}
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
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditing(expense);
                                setConfirmingId(null);
                              }}
                            >
                              Düzenle
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmingId(expense.id)}
                            >
                              Sil
                            </Button>
                          </div>
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
