"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { Role, TaskStatus } from "@/types";

export type TaskFormValues = {
  title: string;
  description: string;
  subteam: string;
  assigneeId: string;
  status: TaskStatus;
  dueDate: string; // "YYYY-MM-DD" or ""
};

export type TaskSubmitResult = { ok: true } | { ok: false; error: string };

export type MemberOption = { id: string; name: string };

export type TaskFormProps = {
  role: Role;
  /** Lead's own subteam (subteam is server-forced for leads). */
  userSubteam?: string;
  memberOptions: readonly MemberOption[];
  subteamOptions: readonly string[];
  initial?: Partial<TaskFormValues>;
  submitLabel?: string;
  onSubmit: (values: TaskFormValues) => Promise<TaskSubmitResult>;
  onCancel: () => void;
};

export const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Yapılacak" },
  { value: "in-progress", label: "Devam ediyor" },
  { value: "review", label: "İncelemede" },
  { value: "done", label: "Tamamlandı" },
];

const TITLE_MAX = 200;

export function TaskForm({
  role,
  userSubteam,
  memberOptions,
  subteamOptions,
  initial,
  submitLabel = "Kaydet",
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [subteam, setSubteam] = useState(initial?.subteam ?? "");
  const [assigneeId, setAssigneeId] = useState(initial?.assigneeId ?? "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? "todo");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [errors, setErrors] = useState<{ title?: string; subteam?: string }>(
    {},
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Only admins pick a subteam; a lead is pinned to their own by the server.
  const showSubteam = role === "admin";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const nextErrors: { title?: string; subteam?: string } = {};
    if (!title.trim()) nextErrors.title = "Başlık zorunludur.";
    else if (title.length > TITLE_MAX) nextErrors.title = "Başlık çok uzun.";
    if (showSubteam && !subteam.trim()) nextErrors.subteam = "Alt ekip seçin.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await onSubmit({
      title: title.trim(),
      description: description.trim(),
      subteam: showSubteam ? subteam.trim() : (userSubteam ?? ""),
      assigneeId: assigneeId.trim(),
      status,
      dueDate,
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

      <Field label="Açıklama">
        <Textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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

      <Field label="Atanan kişi">
        <Select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          disabled={submitting}
        >
          <option value="">Atanmamış</option>
          {memberOptions.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Durum">
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus)}
          disabled={submitting}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Son tarih">
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
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
