"use client";

import { useState } from "react";
import { Button, Field, Input, Textarea } from "@/components/ui";

export type ContactFormProps = {
  /** When set, this subject is sent as-is and the subject field is hidden. */
  fixedSubject?: string;
  /** Show an editable subject field (ignored when `fixedSubject` is set). */
  withSubject?: boolean;
  submitLabel?: string;
  messageLabel?: string;
  messagePlaceholder?: string;
  successTitle?: string;
  successMessage?: string;
};

type Status = "idle" | "submitting" | "success" | "error";

type FieldErrors = Partial<
  Record<"name" | "email" | "subject" | "message", string>
>;

// Mirror the server contract (see api/contact/README.md).
const LIMITS = { name: 120, email: 254, subject: 200, message: 5000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(
  values: { name: string; email: string; subject: string; message: string },
  withSubject: boolean,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = "Ad soyad zorunludur.";
  else if (values.name.length > LIMITS.name)
    errors.name = "Ad soyad çok uzun.";

  if (!values.email.trim()) errors.email = "E-posta zorunludur.";
  else if (!EMAIL_RE.test(values.email.trim()))
    errors.email = "Geçerli bir e-posta adresi girin.";
  else if (values.email.length > LIMITS.email)
    errors.email = "E-posta çok uzun.";

  if (withSubject && values.subject.length > LIMITS.subject)
    errors.subject = "Konu çok uzun.";

  if (!values.message.trim()) errors.message = "Mesaj zorunludur.";
  else if (values.message.length > LIMITS.message)
    errors.message = "Mesaj çok uzun.";

  return errors;
}

/**
 * Reusable contact form. Posts to POST /api/contact and handles client
 * validation plus submitting / success / error states. Server-side validation
 * remains the source of truth.
 */
export function ContactForm({
  fixedSubject,
  withSubject = false,
  submitLabel = "Gönder",
  messageLabel = "Mesaj",
  messagePlaceholder = "Mesajınızı yazın…",
  successTitle = "Teşekkürler!",
  successMessage = "Mesajınız alındı. En kısa sürede size dönüş yapacağız.",
}: ContactFormProps) {
  const subjectEditable = withSubject && !fixedSubject;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const values = { name, email, subject, message };
    const nextErrors = validate(values, subjectEditable);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    try {
      const finalSubject = fixedSubject ?? (subject.trim() || undefined);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          ...(finalSubject ? { subject: finalSubject } : {}),
        }),
      });

      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
        setErrors({});
        return;
      }

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setServerError(
        data?.error ?? "Mesaj gönderilemedi. Lütfen tekrar deneyin.",
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
          {successTitle}
        </h3>
        <p className="mt-2 text-sm text-muted">{successMessage}</p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setStatus("idle")}
        >
          Yeni mesaj gönder
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

      {subjectEditable ? (
        <Field label="Konu" error={errors.subject}>
          <Input
            name="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={submitting}
          />
        </Field>
      ) : null}

      <Field label={messageLabel} error={errors.message} required>
        <Textarea
          name="message"
          rows={6}
          placeholder={messagePlaceholder}
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
          {submitting ? "Gönderiliyor…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
