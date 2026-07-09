"use client";

import { useState } from "react";
import {
  Button,
  Field,
  Input,
  Select,
  Switch,
  Textarea,
} from "@/components/ui";
import type { AnnouncementAudience } from "@/types";

export type AnnouncementFormValues = {
  title: string;
  body: string;
  audience: AnnouncementAudience;
  publishedToPublic: boolean;
};

export type AnnouncementSubmitResult =
  { ok: true } | { ok: false; error: string };

export type AnnouncementFormProps = {
  /** Pre-fill for edit mode; omit for create. */
  initial?: Partial<AnnouncementFormValues>;
  submitLabel?: string;
  onSubmit: (
    values: AnnouncementFormValues,
  ) => Promise<AnnouncementSubmitResult>;
  onCancel: () => void;
};

const AUDIENCE_OPTIONS: { value: AnnouncementAudience; label: string }[] = [
  { value: "all", label: "Herkes" },
  { value: "leads", label: "Birim liderleri" },
  { value: "admins", label: "Yöneticiler" },
];

// Mirror the server contract (api/panel/announcements/README.md).
const LIMITS = { title: 200, body: 10000 };

export function AnnouncementForm({
  initial,
  submitLabel = "Kaydet",
  onSubmit,
  onCancel,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [audience, setAudience] = useState<AnnouncementAudience>(
    initial?.audience ?? "all",
  );
  const [publishedToPublic, setPublishedToPublic] = useState(
    initial?.publishedToPublic ?? false,
  );
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const nextErrors: { title?: string; body?: string } = {};
    if (!title.trim()) nextErrors.title = "Başlık zorunludur.";
    else if (title.length > LIMITS.title) nextErrors.title = "Başlık çok uzun.";
    if (!body.trim()) nextErrors.body = "İçerik zorunludur.";
    else if (body.length > LIMITS.body) nextErrors.body = "İçerik çok uzun.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await onSubmit({
      title: title.trim(),
      body: body.trim(),
      audience,
      publishedToPublic,
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

      <Field label="İçerik" error={errors.body} required>
        <Textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={submitting}
        />
      </Field>

      <Field label="Hedef kitle">
        <Select
          value={audience}
          onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
          disabled={submitting}
        >
          {AUDIENCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <Switch
        label="Herkese açık yayınla"
        description="Açık olduğunda duyuru public sitede de görünür."
        checked={publishedToPublic}
        onChange={setPublishedToPublic}
        disabled={submitting}
      />

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
