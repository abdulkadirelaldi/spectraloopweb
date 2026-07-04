import type { Metadata } from "next";
import { Badge, Button, Card, Container, Section, cn } from "@/components/ui";
import type { SponsorTier } from "@/types";
import { ContactForm } from "@/components/public/ContactForm";
import { PageHero } from "@/components/public/PageHero";

export const metadata: Metadata = {
  title: "Sponsorluk — Spectraloop",
  description:
    "Spectraloop sponsorluk kademeleri, sağlanan haklar ve sponsor olmak için başvuru. Altın, gümüş ve bronz paketlerle geleceğin ulaşımına destek olun.",
};

type Tier = {
  tier: SponsorTier;
  title: string;
  summary: string;
  benefits: readonly string[];
  featured?: boolean;
};

// Representative tier benefits — refine with the real sponsorship package.
const TIERS: readonly Tier[] = [
  {
    tier: "gold",
    title: "Altın Sponsor",
    summary: "En yüksek görünürlük ve öncelikli iş birliği.",
    featured: true,
    benefits: [
      "Araç ve üniformada büyük logo",
      "Tüm dijital mecralarda öncelikli tanıtım",
      "Etkinliklerde özel teşekkür ve stant",
      "Basın bültenlerinde isim",
    ],
  },
  {
    tier: "silver",
    title: "Gümüş Sponsor",
    summary: "Güçlü görünürlük ve düzenli tanıtım.",
    benefits: [
      "Araç ve üniformada orta boy logo",
      "Sosyal medyada düzenli tanıtım",
      "Web sitesinde logo",
    ],
  },
  {
    tier: "bronze",
    title: "Bronz Sponsor",
    summary: "Destekçilerimiz arasında yer alın.",
    benefits: ["Web sitesinde logo", "Sosyal medyada teşekkür paylaşımı"],
  },
];

export default function SponsorshipPage() {
  return (
    <>
      <PageHero
        eyebrow="Sponsorluk"
        title="Geleceğin ulaşımına birlikte yön verelim"
        subtitle="Spectraloop'a sağlayacağınız destekle hem geleceğin mühendislerine hem de yüksek hızlı ulaşım teknolojilerine yatırım yaparsınız."
      />

      {/* Tiers */}
      <Section>
        <Container>
          <div className="max-w-2xl">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Sponsorluk kademeleri
            </h2>
            <p className="text-muted mt-3">
              İhtiyacınıza uygun paketi seçin. Tüm kademelerde markanız
              takımımızla birlikte görünür olur.
            </p>
          </div>

          <ul className="mt-10 grid gap-6 lg:grid-cols-3">
            {TIERS.map((tier) => (
              <li key={tier.tier}>
                <Card
                  className={cn(
                    "flex h-full flex-col",
                    tier.featured && "ring-brand-500 ring-2",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-foreground text-lg font-semibold">
                      {tier.title}
                    </h3>
                    <Badge variant={tier.tier}>{tier.tier}</Badge>
                  </div>
                  <p className="text-muted mt-2 text-sm">{tier.summary}</p>
                  <ul className="mt-4 flex flex-col gap-2">
                    {tier.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="text-foreground flex items-start gap-2 text-sm"
                      >
                        <span
                          aria-hidden="true"
                          className="bg-brand-500 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </Card>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* PDF download */}
      <Section muted>
        <Container>
          <div className="border-border bg-surface flex flex-col items-start gap-4 rounded-3xl border p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-foreground text-xl font-semibold">
                Sponsorluk dosyası
              </h2>
              <p className="text-muted mt-2 text-sm">
                Kademeler, haklar ve iletişim detaylarının yer aldığı dosyamızı
                indirin.
              </p>
            </div>
            <Button
              href="/sponsorluk-dosyasi.pdf"
              download
              size="lg"
              className="shrink-0"
            >
              Dosyayı indir (PDF)
            </Button>
          </div>
        </Container>
      </Section>

      {/* Sponsorship request form */}
      <Section>
        <Container size="narrow">
          <div className="max-w-2xl">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Sponsor olun
            </h2>
            <p className="text-muted mt-3">
              Formu doldurun; sponsorluk fırsatlarını konuşmak için sizinle
              iletişime geçelim. Mesaj alanına şirketinizi ve önerdiğiniz iş
              birliğini yazabilirsiniz.
            </p>
          </div>
          <div className="mt-8">
            <ContactForm
              fixedSubject="Sponsorluk Talebi"
              submitLabel="Talebi gönder"
              messageLabel="Şirket & teklif detayları"
              messagePlaceholder="Şirketiniz, iletişim kişisi ve önerdiğiniz sponsorluk hakkında kısaca bilgi verin…"
              successMessage="Sponsorluk talebiniz alındı. Ekibimiz en kısa sürede sizinle iletişime geçecek."
            />
          </div>
        </Container>
      </Section>
    </>
  );
}
