"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Switch } from "@/components/ui";
import { FileUpload } from "./FileUpload";
import type { SponsorTier } from "@/types";

export type SponsorFormValues = {
  name: string;
  logoUrl: string;
  tier: SponsorTier;
  website: string;
  active: boolean;
};

export type SponsorSubmitResult = { ok: true } | { ok: false; error: string };

export type SponsorFormProps = {
  /** Image-only upload allow-list (from @/lib/utils/r2, via the server page). */
  allowedImageTypes: readonly string[];
  maxBytes: number;
  initial?: Partial<SponsorFormValues>;
  submitLabel?: string;
  onSubmit: (values: SponsorFormValues) => Promise<SponsorSubmitResult>;
  onCancel: () => void;
};

const TIER_OPTIONS: { value: SponsorTier; label: string }[] = [
  { value: "gold", label: "Altın" },
  { value: "silver", label: "Gümüş" },
  { value: "bronze", label: "Bronz" },
];

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function SponsorForm({
  allowedImageTypes,
  maxBytes,
  initial,
  submitLabel = "Kaydet",
  onSubmit,
  onCancel,
}: SponsorFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? "");
  const [tier, setTier] = useState<SponsorTier>(initial?.tier ?? "gold");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [errors, setErrors] = useState<{
    name?: string;
    logoUrl?: string;
    website?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  const maxMb = Math.round(maxBytes / (1024 * 1024));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Ad zorunludur.";
    if (!logoUrl.trim())
      nextErrors.logoUrl = "Logo yükleyin veya bağlantı girin.";
    else if (!isHttpUrl(logoUrl.trim()))
      nextErrors.logoUrl = "Geçerli bir http(s) bağlantısı gerekli.";
    if (website.trim() && !isHttpUrl(website.trim()))
      nextErrors.website = "Geçerli bir http(s) bağlantısı girin.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await onSubmit({
      name: name.trim(),
      logoUrl: logoUrl.trim(),
      tier,
      website: website.trim(),
      active,
    });
    setSubmitting(false);

    if (!result.ok) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Field label="Ad" error={errors.name} required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />
      </Field>

      {/* Logo upload (reuses the R2 FileUpload) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-foreground text-sm font-medium">
          Logo
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        </span>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo önizleme"
            className="border-border h-16 w-auto max-w-[12rem] rounded-lg border bg-white object-contain p-2"
          />
        ) : null}
        <FileUpload
          allowedContentTypes={allowedImageTypes}
          maxBytes={maxBytes}
          currentUrl={logoUrl}
          disabled={submitting}
          hint={`PNG, JPEG veya WebP · en fazla ${maxMb} MB.`}
          onBusyChange={setUploadBusy}
          onUploaded={(url) => {
            setLogoUrl(url);
            setErrors((prev) => ({ ...prev, logoUrl: undefined }));
          }}
        />
        {errors.logoUrl ? (
          <p role="alert" className="text-xs font-medium text-red-600">
            {errors.logoUrl}
          </p>
        ) : null}

        <details className="mt-1">
          <summary className="text-brand-600 dark:text-brand-300 cursor-pointer text-xs font-medium">
            Bağlantı ile ekle (gelişmiş)
          </summary>
          <div className="mt-2">
            <Input
              type="url"
              placeholder="https://…"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              disabled={submitting}
              aria-label="Harici logo bağlantısı"
            />
          </div>
        </details>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Kademe">
          <Select
            value={tier}
            onChange={(e) => setTier(e.target.value as SponsorTier)}
            disabled={submitting}
          >
            {TIER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Web sitesi" error={errors.website}>
          <Input
            type="url"
            placeholder="https://…"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            disabled={submitting}
          />
        </Field>
      </div>

      <Switch
        label="Yayında"
        description="Açık olduğunda sponsor public sitedeki sponsor şeridinde görünür."
        checked={active}
        onChange={setActive}
        disabled={submitting}
      />

      {serverError ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {serverError}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting || uploadBusy}>
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
