"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { EventType } from "@/types";

export type EventFormValues = {
  title: string;
  date: string; // "YYYY-MM-DD"
  type: EventType;
  description: string;
};

export type EventSubmitResult = { ok: true } | { ok: false; error: string };

export type EventFormProps = {
  initial?: Partial<EventFormValues>;
  submitLabel?: string;
  onSubmit: (values: EventFormValues) => Promise<EventSubmitResult>;
  onCancel: () => void;
};

export const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "meeting", label: "Toplantı" },
  { value: "deadline", label: "Son teslim" },
  { value: "competition", label: "Yarışma" },
  { value: "workshop", label: "Atölye" },
  { value: "other", label: "Diğer" },
];

export function EventForm({
  initial,
  submitLabel = "Kaydet",
  onSubmit,
  onCancel,
}: EventFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [type, setType] = useState<EventType>(initial?.type ?? "other");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errors, setErrors] = useState<{ title?: string; date?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const nextErrors: { title?: string; date?: string } = {};
    if (!title.trim()) nextErrors.title = "Başlık zorunludur.";
    else if (title.length > 200) nextErrors.title = "Başlık çok uzun.";
    if (!date) nextErrors.date = "Tarih zorunludur.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await onSubmit({
      title: title.trim(),
      date,
      type,
      description: description.trim(),
    });
    setSubmitting(false);

    if (!result.ok) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Field label="Başlık" error={errors.title} required>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
        />
      </Field>

      <Field label="Tarih" error={errors.date} required>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={submitting}
        />
      </Field>

      <Field label="Tür">
        <Select
          value={type}
          onChange={(e) => setType(e.target.value as EventType)}
          disabled={submitting}
        >
          {EVENT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Açıklama">
        <Textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting}
        />
      </Field>

      {serverError ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {serverError}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Kaydediliyor…" : submitLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Vazgeç
        </Button>
      </div>
    </form>
  );
}
