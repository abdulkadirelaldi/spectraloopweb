"use client";

import { useCallback, useState } from "react";
import { Badge, Button, Select } from "@/components/ui";
import { PanelCard } from "./PanelCard";
import {
  CATEGORY_OPTIONS,
  DocumentForm,
  type DocumentSubmitResult,
  type DocumentFormValues,
} from "./DocumentForm";
import type { Document, DocumentCategory, Role } from "@/types";

const API = "/api/panel/documents";

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  cad: "CAD",
  report: "Rapor",
  presentation: "Sunum",
  media: "Medya",
  other: "Diğer",
};

type LoadStatus = "loading" | "ready" | "error";
type Editing = "new" | Document | null;
type Filters = { subteam: string; category: string };

export function DocumentsManager({
  role,
  userSubteam,
  subteamOptions,
  allowedContentTypes,
  maxBytes,
  initialItems,
  initialError,
}: {
  role: Role;
  userSubteam?: string;
  subteamOptions: readonly string[];
  allowedContentTypes: readonly string[];
  maxBytes: number;
  initialItems: Document[];
  initialError: boolean;
}) {
  const canCreate = role === "admin" || role === "lead";

  const [items, setItems] = useState<Document[]>(initialItems);
  const [status, setStatus] = useState<LoadStatus>(
    initialError ? "error" : "ready",
  );
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    subteam: "",
    category: "",
  });

  // admin manages all; lead only own-subteam docs; member none.
  function canManage(doc: Document): boolean {
    if (role === "admin") return true;
    if (role === "lead") return !!userSubteam && doc.subteam === userSubteam;
    return false;
  }

  const load = useCallback(async (next: Filters) => {
    const params = new URLSearchParams();
    if (next.subteam) params.set("subteam", next.subteam);
    if (next.category) params.set("category", next.category);
    const qs = params.toString();
    try {
      const res = await fetch(`${API}${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        documents?: Document[];
      } | null;
      if (res.ok && data?.ok && Array.isArray(data.documents)) {
        setItems(data.documents);
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

  function buildPayload(values: DocumentFormValues) {
    const payload: Record<string, unknown> = {
      title: values.title,
      fileUrl: values.fileUrl,
      category: values.category,
    };
    // Only admins send subteam; leads are server-pinned to their own.
    if (role === "admin" && values.subteam) payload.subteam = values.subteam;
    return payload;
  }

  async function submitDocument(
    url: string,
    method: "POST" | "PATCH",
    values: DocumentFormValues,
  ): Promise<DocumentSubmitResult> {
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

  async function deleteDocument(id: string) {
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
      setActionError(data?.error ?? "Doküman silinemedi.");
    } catch {
      setActionError("Bağlantı hatası. Doküman silinemedi.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {canCreate && editing === "new" ? (
        <PanelCard title="Yeni doküman">
          <DocumentForm
            role={role}
            userSubteam={userSubteam}
            subteamOptions={subteamOptions}
            allowedContentTypes={allowedContentTypes}
            maxBytes={maxBytes}
            submitLabel="Ekle"
            onSubmit={(v) => submitDocument(API, "POST", v)}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      {editing && editing !== "new" ? (
        <PanelCard title="Dokümanı düzenle">
          <DocumentForm
            role={role}
            userSubteam={userSubteam}
            subteamOptions={subteamOptions}
            allowedContentTypes={allowedContentTypes}
            maxBytes={maxBytes}
            initial={{
              title: editing.title,
              fileUrl: editing.fileUrl,
              category: editing.category,
              subteam: editing.subteam ?? "",
            }}
            submitLabel="Güncelle"
            onSubmit={(v) => submitDocument(`${API}/${editing.id}`, "PATCH", v)}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      <div className="flex flex-col gap-4">
        {canCreate && editing === null ? (
          <div>
            <Button onClick={() => setEditing("new")}>Yeni Doküman</Button>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
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
            Kategori
            <Select
              value={filters.category}
              onChange={(e) => applyFilters({ category: e.target.value })}
            >
              <option value="">Tümü</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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

      {status === "loading" ? (
        <p className="text-muted text-sm">Yükleniyor…</p>
      ) : status === "error" ? (
        <PanelCard>
          <p className="text-muted text-sm">Dokümanlar yüklenemedi.</p>
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
          <p className="text-muted text-sm">Henüz doküman yok.</p>
        </PanelCard>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((doc) => (
            <li key={doc.id}>
              <PanelCard>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-foreground text-sm font-semibold">
                        {doc.title}
                      </h3>
                      <Badge variant="neutral">
                        {CATEGORY_LABEL[doc.category]}
                      </Badge>
                      {doc.subteam ? (
                        <Badge variant="neutral">{doc.subteam}</Badge>
                      ) : null}
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:text-brand-700 dark:text-brand-300 mt-2 inline-block text-sm font-medium"
                    >
                      Dosyayı aç →
                    </a>
                  </div>

                  {canManage(doc) ? (
                    <div className="flex shrink-0 items-center gap-2">
                      {confirmingId === doc.id ? (
                        <>
                          <span className="text-muted text-xs">
                            Emin misiniz?
                          </span>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => void deleteDocument(doc.id)}
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
                              setEditing(doc);
                              setConfirmingId(null);
                            }}
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmingId(doc.id)}
                          >
                            Sil
                          </Button>
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              </PanelCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
