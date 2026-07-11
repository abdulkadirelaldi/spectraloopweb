"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { Role } from "@/types";

export type ExpenseFormValues = {
  title: string;
  amount: string; // parsed to number on submit
  currency: string;
  category: string;
  subteam: string;
  date: string; // "YYYY-MM-DD"
  notes: string;
};

export type ExpenseSubmitResult = { ok: true } | { ok: false; error: string };

export type ExpenseFormProps = {
  role: Role;
  userSubteam?: string;
  subteamOptions: readonly string[];
  /** Hide the subteam field even for admin (e.g. lead edit). */
  initial?: Partial<ExpenseFormValues>;
  submitLabel?: string;
  onSubmit: (values: ExpenseFormValues) => Promise<ExpenseSubmitResult>;
  onCancel: () => void;
};

const CURRENCY_OPTIONS = ["TRY", "USD", "EUR"];

export function ExpenseForm({
  role,
  userSubteam,
  subteamOptions,
  initial,
  submitLabel = "Kaydet",
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  // Only admins choose the subteam; a lead is pinned to their own by the server.
  const showSubteam = role === "admin";

  const [title, setTitle] = useState(initial?.title ?? "");
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [currency, setCurrency] = useState(initial?.currency ?? "TRY");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [subteam, setSubteam] = useState(initial?.subteam ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<{
    title?: string;
    amount?: string;
    category?: string;
    date?: string;
    subteam?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const nextErrors: typeof errors = {};
    if (!title.trim()) nextErrors.title = "Başlık zorunludur.";
    const amt = Number(amount);
    if (amount.trim() === "" || Number.isNaN(amt) || amt <= 0)
      nextErrors.amount = "Geçerli bir tutar girin (0'dan büyük).";
    if (!category.trim()) nextErrors.category = "Kategori zorunludur.";
    if (!date) nextErrors.date = "Tarih zorunludur.";
    if (showSubteam && !subteam.trim()) nextErrors.subteam = "Alt ekip seçin.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await onSubmit({
      title: title.trim(),
      amount: String(amt),
      currency,
      category: category.trim(),
      subteam: showSubteam ? subteam.trim() : (userSubteam ?? ""),
      date,
      notes: notes.trim(),
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tutar" error={errors.amount} required>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={submitting}
          />
        </Field>
        <Field label="Para birimi">
          <Select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={submitting}
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Kategori" error={errors.category} required>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
      </div>

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

      <Field label="Notlar">
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
