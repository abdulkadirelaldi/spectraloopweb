"use client";

import { useCallback, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { PanelCard } from "./PanelCard";
import {
  AnnouncementForm,
  type AnnouncementFormValues,
  type AnnouncementSubmitResult,
} from "./AnnouncementForm";
import type { Announcement, AnnouncementAudience, Role } from "@/types";

const API = "/api/panel/announcements";

const AUDIENCE_LABEL: Record<AnnouncementAudience, string> = {
  all: "Herkes",
  leads: "Birim liderleri",
  admins: "Yöneticiler",
};

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
type Editing = "new" | Announcement | null;

export function AnnouncementsManager({
  role,
  initialItems,
  initialError,
}: {
  role: Role;
  initialItems: Announcement[];
  initialError: boolean;
}) {
  const canWrite = role === "admin" || role === "lead";

  const [items, setItems] = useState<Announcement[]>(initialItems);
  const [status, setStatus] = useState<LoadStatus>(
    initialError ? "error" : "ready",
  );
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Re-fetch the list (called from event handlers only, after mutations/retry).
  const load = useCallback(async () => {
    try {
      const res = await fetch(API, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        announcements?: Announcement[];
      } | null;
      if (res.ok && data?.ok && Array.isArray(data.announcements)) {
        setItems(data.announcements);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  async function submitAnnouncement(
    url: string,
    method: "POST" | "PATCH",
    values: AnnouncementFormValues,
  ): Promise<AnnouncementSubmitResult> {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        setEditing(null);
        await load();
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

  async function deleteAnnouncement(id: string) {
    setActionError(null);
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmingId(null);
        await load();
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setActionError(data?.error ?? "Duyuru silinemedi.");
    } catch {
      setActionError("Bağlantı hatası. Duyuru silinemedi.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Create form */}
      {canWrite && editing === "new" ? (
        <PanelCard title="Yeni duyuru">
          <AnnouncementForm
            submitLabel="Oluştur"
            onSubmit={(values) => submitAnnouncement(API, "POST", values)}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      {/* Edit form */}
      {canWrite && editing && editing !== "new" ? (
        <PanelCard title="Duyuruyu düzenle">
          <AnnouncementForm
            initial={{
              title: editing.title,
              body: editing.body,
              audience: editing.audience,
              publishedToPublic: editing.publishedToPublic,
            }}
            submitLabel="Güncelle"
            onSubmit={(values) =>
              submitAnnouncement(`${API}/${editing.id}`, "PATCH", values)
            }
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      {/* Toolbar */}
      {canWrite && editing === null ? (
        <div>
          <Button onClick={() => setEditing("new")}>Yeni Duyuru</Button>
        </div>
      ) : null}

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
          <p className="text-muted text-sm">Duyurular yüklenemedi.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setStatus("loading");
              void load();
            }}
          >
            Tekrar dene
          </Button>
        </PanelCard>
      ) : items.length === 0 ? (
        <PanelCard>
          <p className="text-muted text-sm">Henüz duyuru yok.</p>
        </PanelCard>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <PanelCard>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-foreground text-base font-semibold">
                        {item.title}
                      </h3>
                      <Badge
                        variant={item.publishedToPublic ? "brand" : "neutral"}
                      >
                        {item.publishedToPublic ? "Yayında" : "Taslak"}
                      </Badge>
                      <Badge variant="neutral">
                        {AUDIENCE_LABEL[item.audience]}
                      </Badge>
                    </div>
                    <p className="text-muted mt-1 text-xs">
                      {formatDate(item.createdAt)}
                    </p>
                    <p className="text-muted mt-2 line-clamp-3 text-sm">
                      {item.body}
                    </p>
                  </div>

                  {canWrite ? (
                    <div className="flex shrink-0 items-center gap-2">
                      {confirmingId === item.id ? (
                        <>
                          <span className="text-muted text-xs">
                            Emin misiniz?
                          </span>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => void deleteAnnouncement(item.id)}
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
                </div>
              </PanelCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
