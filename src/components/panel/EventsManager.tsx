"use client";

import { useCallback, useState } from "react";
import { Badge, Button, Select } from "@/components/ui";
import { PanelCard } from "./PanelCard";
import {
  EVENT_TYPE_OPTIONS,
  EventForm,
  type EventFormValues,
  type EventSubmitResult,
} from "./EventForm";
import type { Event, EventType, Role } from "@/types";

const API = "/api/panel/events";

const TYPE_LABEL: Record<EventType, string> = {
  meeting: "Toplantı",
  deadline: "Son teslim",
  competition: "Yarışma",
  workshop: "Atölye",
  other: "Diğer",
};

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
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

function toDateInput(iso?: string): string {
  return iso ? iso.slice(0, 10) : "";
}

type LoadStatus = "loading" | "ready" | "error";
type Editing = "new" | Event | null;

export function EventsManager({
  role,
  initialItems,
  initialError,
}: {
  role: Role;
  initialItems: Event[];
  initialError: boolean;
}) {
  const canManage = role === "admin" || role === "lead";

  const [items, setItems] = useState<Event[]>(initialItems);
  const [status, setStatus] = useState<LoadStatus>(
    initialError ? "error" : "ready",
  );
  const [editing, setEditing] = useState<Editing>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (type: string) => {
    const qs = type ? `?type=${encodeURIComponent(type)}` : "";
    try {
      const res = await fetch(`${API}${qs}`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        events?: Event[];
      } | null;
      if (res.ok && data?.ok && Array.isArray(data.events)) {
        setItems(data.events);
        setStatus("ready");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  function onTypeChange(next: string) {
    setTypeFilter(next);
    setStatus("loading");
    void load(next);
  }

  async function submitEvent(
    url: string,
    method: "POST" | "PATCH",
    values: EventFormValues,
  ): Promise<EventSubmitResult> {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          date: values.date,
          type: values.type,
          ...(values.description ? { description: values.description } : {}),
        }),
      });
      if (res.ok) {
        setEditing(null);
        await load(typeFilter);
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

  async function deleteEvent(id: string) {
    setActionError(null);
    try {
      const res = await fetch(`${API}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setConfirmingId(null);
        await load(typeFilter);
        return;
      }
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setActionError(data?.error ?? "Etkinlik silinemedi.");
    } catch {
      setActionError("Bağlantı hatası. Etkinlik silinemedi.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {canManage && editing === "new" ? (
        <PanelCard title="Yeni etkinlik">
          <EventForm
            submitLabel="Ekle"
            onSubmit={(v) => submitEvent(API, "POST", v)}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      {editing && editing !== "new" ? (
        <PanelCard title="Etkinliği düzenle">
          <EventForm
            initial={{
              title: editing.title,
              date: toDateInput(editing.date),
              type: editing.type,
              description: editing.description ?? "",
            }}
            submitLabel="Güncelle"
            onSubmit={(v) => submitEvent(`${API}/${editing.id}`, "PATCH", v)}
            onCancel={() => setEditing(null)}
          />
        </PanelCard>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {canManage && editing === null ? (
          <div>
            <Button onClick={() => setEditing("new")}>Yeni Etkinlik</Button>
          </div>
        ) : (
          <span />
        )}
        <label className="text-muted flex flex-col gap-1 text-xs font-medium sm:w-56">
          Tür
          <Select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
          >
            <option value="">Tümü</option>
            {EVENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
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
          <p className="text-muted text-sm">Etkinlikler yüklenemedi.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setStatus("loading");
              void load(typeFilter);
            }}
          >
            Tekrar dene
          </Button>
        </PanelCard>
      ) : items.length === 0 ? (
        <PanelCard>
          <p className="text-muted text-sm">Yaklaşan etkinlik yok.</p>
        </PanelCard>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((event) => (
            <li key={event.id}>
              <PanelCard>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="brand">{TYPE_LABEL[event.type]}</Badge>
                      <time
                        dateTime={event.date}
                        className="text-muted text-xs font-medium"
                      >
                        {formatDate(event.date)}
                      </time>
                    </div>
                    <h3 className="text-foreground mt-2 text-sm font-semibold">
                      {event.title}
                    </h3>
                    {event.description ? (
                      <p className="text-muted mt-1 line-clamp-3 text-sm">
                        {event.description}
                      </p>
                    ) : null}
                  </div>

                  {canManage ? (
                    <div className="flex shrink-0 items-center gap-2">
                      {confirmingId === event.id ? (
                        <>
                          <span className="text-muted text-xs">
                            Emin misiniz?
                          </span>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => void deleteEvent(event.id)}
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
                              setEditing(event);
                              setConfirmingId(null);
                            }}
                          >
                            Düzenle
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmingId(event.id)}
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
        </ol>
      )}
    </div>
  );
}
