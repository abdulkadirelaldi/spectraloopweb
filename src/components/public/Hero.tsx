import { Badge, Button, Container } from "@/components/ui";

/**
 * Landing hero — team name, tagline, short intro and the two primary CTAs.
 * Full-bleed brand gradient band; content constrained by Container.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 text-white">
      {/* Decorative accent glow (non-interactive). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl"
      />
      <Container size="default" className="relative py-24 sm:py-32">
        <div className="max-w-2xl">
          <Badge
            variant="neutral"
            className="bg-white/15 text-white backdrop-blur"
          >
            Öğrenci Hyperloop Takımı
          </Badge>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Geleceğin ulaşımını birlikte tasarlıyoruz
          </h1>
          <p className="mt-6 text-lg text-white/80 sm:text-xl">
            Spectraloop; mekanik, elektronik ve yazılım birimleriyle yüksek
            hızlı ulaşım teknolojileri geliştiren bir öğrenci takımıdır.
            Vizyonumuza ortak olmak ister misiniz?
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button
              href="/sponsorluk"
              size="lg"
              className="bg-white text-brand-700 hover:bg-white/90"
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
