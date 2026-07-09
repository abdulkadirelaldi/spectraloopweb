import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui";
import { Logo } from "@/components/public/Logo";
import { auth } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Giriş — Spectraloop",
  description: "Spectraloop yönetim paneline giriş yapın.",
  robots: { index: false, follow: false },
};

// This page depends on the session cookie / query params → render per request.
export const dynamic = "force-dynamic";

function sanitizePath(value: string | string[] | undefined): string {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//")
  ) {
    return value;
  }
  return "/panel";
}

function errorMessage(
  value: string | string[] | undefined,
): string | undefined {
  if (!value) return undefined;
  // Auth.js surfaces credential failures as `?error=CredentialsSignin`.
  const code = Array.isArray(value) ? value[0] : value;
  if (code === "CredentialsSignin") return "E-posta veya parola hatalı.";
  return "Giriş yapılırken bir sorun oluştu. Lütfen tekrar deneyin.";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const callbackUrl = sanitizePath(params.callbackUrl);

  // Already signed in → skip the form. Guard against auth infra errors so the
  // page still renders if the session cannot be read.
  try {
    const session = await auth();
    if (session?.user) redirect(callbackUrl);
  } catch {
    // Ignore: treat as not-signed-in and show the form.
  }

  return (
    <main className="flex flex-1 items-center justify-center py-16">
      <Container size="narrow" className="max-w-md">
        <div className="border-border bg-surface rounded-2xl border p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <Logo />
            <h1 className="text-foreground mt-6 text-2xl font-bold tracking-tight">
              Panele giriş
            </h1>
            <p className="text-muted mt-2 text-sm">
              Devam etmek için hesap bilgilerinizle giriş yapın.
            </p>
          </div>

          <div className="mt-8">
            <LoginForm
              callbackUrl={callbackUrl}
              initialError={errorMessage(params.error)}
            />
          </div>
        </div>

        <p className="text-muted mt-6 text-center text-sm">
          <Link
            href="/"
            className="text-brand-600 hover:text-brand-700 dark:text-brand-300 font-medium"
          >
            ← Ana sayfaya dön
          </Link>
        </p>
      </Container>
    </main>
  );
}
