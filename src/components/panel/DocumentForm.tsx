"use client";

import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import type { DocumentCategory, Role } from "@/types";

export type DocumentFormValues = {
  title: string;
  fileUrl: string;
  category: DocumentCategory;
  subteam: string;
};

export type DocumentSubmitResult = { ok: true } | { ok: false; error: string };

export type DocumentFormProps = {
  role: Role;
  userSubteam?: string;
  subteamOptions: readonly string[];
  initial?: Partial<DocumentFormValues>;
  submitLabel?: string;
  onSubmit: (values: DocumentFormValues) => Promise<DocumentSubmitResult>;
  onCancel: () => void;
};

export const CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "cad", label: "CAD" },
  { value: "report", label: "Rapor" },
  { value: "presentation", label: "Sunum" },
  { value: "media", label: "Medya" },
  { value: "other", label: "Diğer" },
];

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function DocumentForm({
  role,
  userSubteam,
  subteamOptions,
  initial,
  submitLabel = "Kaydet",
  onSubmit,
  onCancel,
}: DocumentFormProps) {
  const showSubteam = role === "admin";

  const [title, setTitle] = useState(initial?.title ?? "");
  const [fileUrl, setFileUrl] = useState(initial?.fileUrl ?? "");
  const [category, setCategory] = useState<DocumentCategory>(
    initial?.category ?? "other",
  );
  const [subteam, setSubteam] = useState(initial?.subteam ?? "");
  const [errors, setErrors] = useState<{
    title?: string;
    fileUrl?: string;
    subteam?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const nextErrors: { title?: string; fileUrl?: string; subteam?: string } =
      {};
    if (!title.trim()) nextErrors.title = "Başlık zorunludur.";
    else if (title.length > 200) nextErrors.title = "Başlık çok uzun.";
    if (!fileUrl.trim()) nextErrors.fileUrl = "Dosya bağlantısı zorunludur.";
    else if (!isHttpUrl(fileUrl.trim()))
      nextErrors.fileUrl = "Geçerli bir http(s) bağlantısı girin.";
    if (showSubteam && !subteam.trim()) nextErrors.subteam = "Alt ekip seçin.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await onSubmit({
      title: title.trim(),
      fileUrl: fileUrl.trim(),
      category,
      subteam: showSubteam ? subteam.trim() : (userSubteam ?? ""),
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

      <Field
        label="Dosya bağlantısı (URL)"
        error={errors.fileUrl}
        hint="Şimdilik önceden yüklenmiş bir dosyanın bağlantısını girin. Panel içi dosya yükleme yakında eklenecek."
        required
      >
        <Input
          type="url"
          placeholder="https://…"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          disabled={submitting}
        />
      </Field>

      <Field label="Kategori">
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          disabled={submitting}
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      {showSubteam ? (
        <Field label="Alt ekip" error={errors.subteam} required>
          <Select
            value={subteam}
            onChange={(e) => setSubteam(e.target.value)}
            disabled={submitting}
          >
            <option value="" disabled>
              Seçiniz…
            </option>
            {subteamOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

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
