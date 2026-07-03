import { Button, Container, Section } from "@/components/ui";

/** Closing call-to-action band — repeats the sponsor + join invitation. */
export function CtaBand() {
  return (
    <Section>
      <Container>
        <div className="rounded-3xl border border-border bg-gradient-to-br from-brand-600 to-brand-800 px-6 py-14 text-center text-white sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Yolculuğa sen de katıl
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            İster takımımıza katılarak ister sponsor olarak, geleceğin ulaşımını
            birlikte inşa edelim.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              href="/katil"
              size="lg"
              className="bg-white text-brand-700 hover:bg-white/90"
            >
              Bize Katıl
            </Button>
            <Button
              href="/sponsorluk"
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
            >
              Sponsor Ol
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
