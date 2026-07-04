import type { Metadata } from "next";
import { Card, Container, Section } from "@/components/ui";
import { ApplicationForm } from "@/components/public/ApplicationForm";
import { PageHero } from "@/components/public/PageHero";
import { SUBTEAM_OPTIONS } from "@/components/public/subteams";

export const metadata: Metadata = {
  title: "Bize Katıl — Spectraloop",
  description:
    "Spectraloop'a katıl! Mekanik, elektronik-elektrik, yazılım veya organizasyon birimlerinde geleceğin ulaşım teknolojilerini birlikte geliştirelim.",
};

const REASONS: readonly { title: string; description: string }[] = [
  {
    title: "Gerçek mühendislik deneyimi",
    description:
      "Ders dışında, gerçek bir araç üzerinde uçtan uca tasarım ve üretim deneyimi kazan.",
  },
  {
    title: "Disiplinler arası takım",
    description:
      "Farklı bölümlerden arkadaşlarla birlikte çalış, birlikte üret, birlikte öğren.",
  },
  {
    title: "Yarışma ve görünürlük",
    description:
      "Ulusal yarışmalarda takımı temsil et; projelerini ve kendini geliştirme fırsatı yakala.",
  },
];

export default function JoinPage() {
  return (
    <>
      <PageHero
        eyebrow="Bize Katıl"
        title="Geleceğin ulaşımını birlikte inşa edelim"
        subtitle="Hangi bölümden olursan ol, sana uygun bir birim mutlaka var. Başvurunu bırak; seninle tanışmak için sabırsızlanıyoruz."
      />

      {/* Why join */}
      <Section>
        <Container>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Neden Spectraloop?
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {REASONS.map((reason) => (
              <li key={reason.title}>
                <Card className="h-full">
                  <h3 className="text-foreground text-lg font-semibold">
                    {reason.title}
                  </h3>
                  <p className="text-muted mt-2 text-sm">
                    {reason.description}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
          <p className="text-muted mt-6 text-sm">
            Alt ekiplerimiz: {SUBTEAM_OPTIONS.slice(0, 4).join(" · ")}.
          </p>
        </Container>
      </Section>

      {/* Application form */}
      <Section muted>
        <Container size="narrow">
          <div className="max-w-2xl">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Başvuru formu
            </h2>
            <p className="text-muted mt-3">
              Formu doldur; başvurun ekibimize ulaşsın. Tüm alanlar zorunludur.
            </p>
          </div>
          <div className="mt-8">
            <ApplicationForm />
          </div>
        </Container>
      </Section>
    </>
  );
}
