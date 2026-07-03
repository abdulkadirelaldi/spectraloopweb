import { Badge, Button, Container, Section } from "@/components/ui";

/**
 * Placeholder home page — proves the public shell renders end-to-end.
 * Task 1.2 replaces this with the real landing page (hero + stats +
 * sponsor strip + CTA).
 */
export default function HomePage() {
  return (
    <Section>
      <Container size="default" className="text-center">
        <Badge variant="brand">Öğrenci Hyperloop Takımı</Badge>
        <h1 className="text-foreground mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Geleceğin ulaşımını <span className="text-brand-500">birlikte</span>{" "}
          tasarlıyoruz
        </h1>
        <p className="text-muted mx-auto mt-6 max-w-2xl text-lg">
          Spectraloop; mekanik, elektronik ve yazılım birimleriyle yüksek hızlı
          ulaşım teknolojileri geliştiren bir öğrenci takımıdır.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href="/katil" size="lg">
            Bize Katıl
          </Button>
          <Button href="/sponsorluk" variant="outline" size="lg">
            Sponsor Ol
          </Button>
        </div>
      </Container>
    </Section>
  );
}
