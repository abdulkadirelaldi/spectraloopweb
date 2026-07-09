"use client";

import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({
  callbackUrl,
  initialError,
}: {
  callbackUrl: string;
  initialError?: string;
}) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    { error: initialError ?? null },
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <Field label="E-posta" required>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          disabled={isPending}
        />
      </Field>

      <Field label="Parola" required>
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          disabled={isPending}
        />
      </Field>

      {state?.error ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? (
          <>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 animate-spin"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="3"
                className="opacity-25"
              />
              <path
                d="M21 12a9 9 0 0 0-9-9"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            Giriş yapılıyor…
          </>
        ) : (
          "Giriş yap"
        )}
      </Button>
    </form>
  );
}
