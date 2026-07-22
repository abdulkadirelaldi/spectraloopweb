import { Badge, Button, Container } from "@/components/ui";

/**
 * Landing hero — team name, tagline, short intro and the two primary CTAs.
 * Full-bleed animated brand gradient with drifting accent orbs; content is
 * constrained by Container. The heading + CTAs animate in on load via CSS only
 * (never gated behind JS), and every animation is disabled under
 * `prefers-reduced-motion`, leaving the text fully visible and legible.
 */
export function Hero() {
  return (
    <section className="hero-animated-gradient relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 text-white">
      {/* Decorative drifting accent orbs (non-interactive). */}
      <div
        aria-hidden="true"
        className="animate-float pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-brand-300/20 blur-3xl"
      />
      {/* Subtle grid texture to add depth without hurting legibility. */}
      <div
        aria-hidden="true"
        className="hero-grid pointer-events-none absolute inset-0"
      />

      <Container size="default" className="relative py-24 sm:py-32">
        <div className="max-w-2xl">
          <Badge
            variant="neutral"
            className="animate-fade-rise bg-white/15 text-white backdrop-blur"
          >
            Öğrenci Hyperloop Takımı
          </Badge>
          <h1 className="animate-fade-rise mt-6 text-4xl font-bold tracking-tight [animation-delay:80ms] sm:text-6xl">
            Geleceğin ulaşımını birlikte tasarlıyoruz
          </h1>
          <p className="animate-fade-rise mt-6 text-lg text-white/80 [animation-delay:160ms] sm:text-xl">
            Spectraloop; mekanik, elektronik ve yazılım birimleriyle yüksek
            hızlı ulaşım teknolojileri geliştiren bir öğrenci takımıdır.
            Vizyonumuza ortak olmak ister misiniz?
          </p>
          <div className="animate-fade-rise mt-10 flex flex-col gap-4 [animation-delay:240ms] sm:flex-row">
            <Button
              href="/sponsorluk"
              size="lg"
              className="bg-white text-brand-700 shadow-lg shadow-brand-900/20 hover:bg-white/90"
            >
              Sponsor Ol
            </Button>
            <Button
              href="/katil"
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
            >
              Bize Katıl
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
