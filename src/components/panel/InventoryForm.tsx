"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { InventoryStatus, Role } from "@/types";

export type InventoryFormValues = {
  name: string;
  category: string;
  quantity: string; // kept as string in the input; parsed on submit
  unit: string;
  location: string;
  subteam: string;
  status: InventoryStatus;
  notes: string;
};

export type InventorySubmitResult = { ok: true } | { ok: false; error: string };

export type InventoryFormProps = {
  role: Role;
  userSubteam?: string;
  subteamOptions: readonly string[];
  initial?: Partial<InventoryFormValues>;
  submitLabel?: string;
  onSubmit: (values: InventoryFormValues) => Promise<InventorySubmitResult>;
  onCancel: () => void;
};

export const INVENTORY_STATUS_OPTIONS: {
  value: InventoryStatus;
  label: string;
}[] = [
  { value: "available", label: "Mevcut" },
  { value: "in-use", label: "Kullanımda" },
  { value: "maintenance", label: "Bakımda" },
  { value: "depleted", label: "Tükendi" },
];

export function InventoryForm({
  role,
  userSubteam,
  subteamOptions,
  initial,
  submitLabel = "Kaydet",
  onSubmit,
  onCancel,
}: InventoryFormProps) {
  const showSubteam = role === "admin";

  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [quantity, setQuantity] = useState(initial?.quantity ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [subteam, setSubteam] = useState(initial?.subteam ?? "");
  const [statusValue, setStatusValue] = useState<InventoryStatus>(
    initial?.status ?? "available",
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
    quantity?: string;
    unit?: string;
    subteam?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Ad zorunludur.";
    else if (name.length > 200) nextErrors.name = "Ad çok uzun.";
    if (!category.trim()) nextErrors.category = "Kategori zorunludur.";
    const qty = Number(quantity);
    if (quantity.trim() === "" || Number.isNaN(qty) || qty < 0)
      nextErrors.quantity = "Geçerli bir miktar girin (0 veya üzeri).";
    if (!unit.trim()) nextErrors.unit = "Birim zorunludur.";
    if (showSubteam && !subteam.trim()) nextErrors.subteam = "Alt ekip seçin.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await onSubmit({
      name: name.trim(),
      category: category.trim(),
      quantity: String(qty),
      unit: unit.trim(),
      location: location.trim(),
      subteam: showSubteam ? subteam.trim() : (userSubteam ?? ""),
      status: statusValue,
      notes: notes.trim(),
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

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Kategori" error={errors.category} required>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={submitting}
          />
        </Field>
        <Field label="Durum">
          <Select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value as InventoryStatus)}
            disabled={submitting}
          >
            {INVENTORY_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Miktar" error={errors.quantity} required>
          <Input
            type="number"
            min={0}
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={submitting}
          />
        </Field>
        <Field label="Birim" error={errors.unit} required>
          <Input
            placeholder="adet, m, kg…"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            disabled={submitting}
          />
        </Field>
      </div>

      <Field label="Konum">
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={submitting}
        />
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
