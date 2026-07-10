"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Switch } from "@/components/ui";
import type { Role } from "@/types";
import { ROLE_LABEL } from "./nav";

export type MemberFormValues = {
  name: string;
  email: string;
  password: string;
  role: Role;
  subteam: string;
  photoUrl: string;
  active: boolean;
};

export type MemberSubmitResult = { ok: true } | { ok: false; error: string };

export type MemberFormProps = {
  /** "admin" shows all fields; "leadLimited" shows only name + photoUrl. */
  variant: "admin" | "leadLimited";
  mode: "create" | "edit";
  initial?: Partial<MemberFormValues>;
  submitLabel?: string;
  onSubmit: (values: MemberFormValues) => Promise<MemberSubmitResult>;
  onCancel: () => void;
};

const ROLE_OPTIONS: Role[] = ["member", "lead", "admin"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function MemberForm({
  variant,
  mode,
  initial,
  submitLabel = "Kaydet",
  onSubmit,
  onCancel,
}: MemberFormProps) {
  const isAdmin = variant === "admin";

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initial?.role ?? "member");
  const [subteam, setSubteam] = useState(initial?.subteam ?? "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const nextErrors: { name?: string; email?: string; password?: string } = {};
    if (!name.trim()) nextErrors.name = "Ad soyad zorunludur.";
    else if (name.length > 120) nextErrors.name = "Ad soyad çok uzun.";

    if (isAdmin) {
      if (!email.trim()) nextErrors.email = "E-posta zorunludur.";
      else if (!EMAIL_RE.test(email.trim()))
        nextErrors.email = "Geçerli bir e-posta girin.";
      if (password && password.length < 8)
        nextErrors.password = "Parola en az 8 karakter olmalı.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await onSubmit({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      subteam: subteam.trim(),
      photoUrl: photoUrl.trim(),
      active,
    });
    setSubmitting(false);

    if (!result.ok) setServerError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <Field label="Ad soyad" error={errors.name} required>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />
      </Field>

      {isAdmin ? (
        <>
          <Field label="E-posta" error={errors.email} required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field label="Rol">
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              disabled={submitting}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Alt ekip">
            <Input
              value={subteam}
              onChange={(e) => setSubteam(e.target.value)}
              disabled={submitting}
            />
          </Field>
        </>
      ) : null}

      <Field label="Fotoğraf URL">
        <Input
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          disabled={submitting}
        />
      </Field>

      {isAdmin ? (
        <>
          <Field
            label={mode === "create" ? "Parola (opsiyonel)" : "Yeni parola"}
            error={errors.password}
            hint="En az 8 karakter. Boş bırakılırsa değişmez."
          >
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Switch
            label="Aktif üye"
            description="Pasif üyeler panele giriş yapamaz."
            checked={active}
            onChange={setActive}
            disabled={submitting}
          />
        </>
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
