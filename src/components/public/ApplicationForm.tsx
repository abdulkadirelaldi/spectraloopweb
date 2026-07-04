"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import { SUBTEAM_OPTIONS } from "./subteams";

type Status = "idle" | "submitting" | "success" | "error";

type FieldErrors = Partial<
  Record<"name" | "email" | "subteamPref" | "message", string>
>;

// Mirror the server contract (see api/applications/README.md).
const LIMITS = { name: 120, email: 254, subteamPref: 120, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: {
  name: string;
  email: string;
  subteamPref: string;
  message: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) errors.name = "Ad soyad zorunludur.";
  else if (values.name.length > LIMITS.name)
    errors.name = "Ad soyad çok uzun.";

  if (!values.email.trim()) errors.email = "E-posta zorunludur.";
  else if (!EMAIL_RE.test(values.email.trim()))
    errors.email = "Geçerli bir e-posta adresi girin.";
  else if (values.email.length > LIMITS.email)
    errors.email = "E-posta çok uzun.";

  if (!values.subteamPref.trim())
    errors.subteamPref = "Lütfen bir alt ekip seçin.";
  else if (values.subteamPref.length > LIMITS.subteamPref)
    errors.subteamPref = "Alt ekip tercihi çok uzun.";

  if (!values.message.trim()) errors.message = "Mesaj zorunludur.";
  else if (values.message.length > LIMITS.message)
    errors.message = "Mesaj çok uzun.";

  return errors;
}

/**
 * Public "Bize Katıl" application form. Posts to POST /api/applications
 * (persisted server-side; surfaces in the panel). Handles client validation
 * plus submitting / success / error states. Server validation is authoritative.
 */
export function ApplicationForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subteamPref, setSubteamPref] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const values = { name, email, subteamPref, message };
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          subteamPref: subteamPref.trim(),
          message: message.trim(),
        }),
      });

      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setSubteamPref("");
        setMessage("");
        setErrors({});
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setServerError(
        data?.error ?? "Başvuru gönderilemedi. Lütfen tekrar deneyin.",
      );
      setStatus("error");
    } catch {
      setServerError(
        "Bağlantı hatası. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.",
      );
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-border bg-surface p-6 text-center"
      >
        <h3 className="text-lg font-semibold text-foreground">
          Başvurun alındı!
        </h3>
        <p className="mt-2 text-sm text-muted">
          İlgin için teşekkürler. Başvurunu değerlendirip en kısa sürede
          seninle iletişime geçeceğiz.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setStatus("idle")}
        >
          Yeni başvuru gönder
        </Button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Field label="Ad soyad" error={errors.name} required>
        <Input
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />
      </Field>

      <Field label="E-posta" error={errors.email} required>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
        />
      </Field>

      <Field label="Tercih ettiğin alt ekip" error={errors.subteamPref} required>
        <Select
          name="subteamPref"
          value={subteamPref}
          onChange={(e) => setSubteamPref(e.target.value)}
          disabled={submitting}
        >
          <option value="" disabled>
            Seçiniz…
          </option>
          {SUBTEAM_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Neden katılmak istiyorsun?"
        error={errors.message}
        required
      >
        <Textarea
          name="message"
          rows={6}
          placeholder="Kendinden, ilgi alanlarından ve takıma katkı sağlayabileceğin konulardan bahset…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
        />
      </Field>

      {serverError ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {serverError}
        </p>
      ) : null}

      <div>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Gönderiliyor…" : "Başvuruyu gönder"}
        </Button>
      </div>
    </form>
  );
}
