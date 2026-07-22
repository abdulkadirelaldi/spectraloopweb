import type { Metadata } from "next";
import { Button, Container, Reveal, Section } from "@/components/ui";
import { PageHero } from "@/components/public/PageHero";
import { SubteamCard, type SubteamInfo } from "@/components/public/SubteamCard";

export const metadata: Metadata = {
  title: "Alt Ekipler — Spectraloop",
  description:
    "Spectraloop'un mekanik, elektronik-elektrik, yazılım ve organizasyon birimleri; her ekibin sorumluluk alanları.",
};

// Representative subteams (PROGRAM.md §8 examples) — refine copy as needed.
const SUBTEAMS: readonly SubteamInfo[] = [
  {
    name: "Mekanik",
    monogram: "M",
    description:
      "Aracın şasi, gövde ve hareket sistemlerini tasarlayıp üretir; yapısal dayanım ve aerodinamikten sorumludur.",
    responsibilities: [
      "CAD tasarımı ve mekanik analiz",
      "Şasi ve gövde üretimi",
      "Süspansiyon ve fren sistemleri",
    ],
  },
  {
    name: "Elektronik-Elektrik",
    monogram: "E",
    description:
      "Güç dağıtımı, sensörler ve gömülü elektronik sistemlerin tasarımından ve entegrasyonundan sorumludur.",
    responsibilities: [
      "Güç ve batarya yönetimi",
      "Sensör ve devre tasarımı",
      "Gömülü sistem entegrasyonu",
    ],
  },
  {
    name: "Yazılım",
    monogram: "Y",
    description:
      "Kontrol yazılımı, telemetri ve veri analizini geliştirir; aracın güvenli ve otonom çalışmasını sağlar.",
    responsibilities: [
      "Kontrol ve otomasyon yazılımı",
      "Telemetri ve veri işleme",
      "Arayüz ve test altyapısı",
    ],
  },
  {
    name: "Organizasyon & Sponsorluk",
    monogram: "O",
    description:
      "Takımın tanıtımını, sponsor ilişkilerini ve etkinlik organizasyonunu yürütür; kaynakların sürdürülebilirliğini sağlar.",
    responsibilities: [
      "Sponsor ilişkileri ve bütçe",
      "Tanıtım ve sosyal medya",
      "Etkinlik ve organizasyon",
    ],
  },
];

export default function TeamsPage() {
  return (
    <>
      <PageHero
        eyebrow="Alt Ekipler"
        title="Farklı disiplinler, tek bir hedef"
        subtitle="Spectraloop; birbirini tamamlayan birimlerden oluşur. Her ekip kendi uzmanlık alanında araca ve takıma değer katar."
      />

      <Section>
        <Container>
          <ul className="grid gap-6 md:grid-cols-2">
            {SUBTEAMS.map((subteam, i) => (
              <Reveal as="li" key={subteam.name} delay={(i % 2) * 100}>
                <SubteamCard {...subteam} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      <Section muted>
        <Container>
          <Reveal
            as="div"
            className="border-border bg-surface rounded-3xl border px-6 py-12 text-center sm:px-12"
          >
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Bir ekipte yer almak ister misin?
            </h2>
            <p className="text-muted mx-auto mt-3 max-w-xl">
              Hangi bölümden olursan ol, sana uygun bir birim mutlaka var.
              Başvurunu bekliyoruz.
            </p>
            <div className="mt-8 flex justify-center">
              <Button href="/katil" size="lg">
                Bize Katıl
              </Button>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
