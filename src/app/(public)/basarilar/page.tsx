import type { Metadata } from "next";
import { Card, Container, Section } from "@/components/ui";
import { PageHero } from "@/components/public/PageHero";
import { Timeline, type TimelineItem } from "@/components/public/Timeline";

export const metadata: Metadata = {
  title: "Başarılar — Spectraloop",
  description:
    "Spectraloop'un 2022'den bugüne yolculuğu: yarışmalar, dereceler ve ödüllerle dolu zaman çizelgesi.",
};

// Representative milestones (2022 → 2026) — replace with real results.
const MILESTONES: readonly TimelineItem[] = [
  {
    year: "2022",
    title: "Takımın kuruluşu",
    description:
      "Spectraloop, farklı bölümlerden öğrencilerin bir araya gelmesiyle kuruldu ve ilk çekirdek kadro oluştu.",
  },
  {
    year: "2023",
    title: "İlk prototip tasarımı",
    description:
      "Aracın ilk konsept tasarımı tamamlandı; mekanik, elektronik ve yazılım birimleri çalışmalarına başladı.",
  },
  {
    year: "2024",
    title: "İlk yarışma katılımı",
    description:
      "Takım, ulusal bir hyperloop yarışmasında ilk kez sahne aldı ve değerli saha deneyimi kazandı.",
  },
  {
    year: "2025",
    title: "Derece ve ödüller",
    description:
      "Geliştirilen araçla yarışmalarda üst sıralarda yer alındı; tasarım ve inovasyon alanlarında ödüller kazanıldı.",
  },
  {
    year: "2026",
    title: "Yeni nesil araç",
    description:
      "Genişleyen ekip ve yeni nesil araç tasarımıyla daha iddialı hedeflere doğru yola devam ediliyor.",
  },
];

const HIGHLIGHTS: readonly { value: string; label: string }[] = [
  { value: "4+", label: "Yarışma katılımı" },
  { value: "5", label: "Ödül & derece" },
  { value: "2022", label: "Bu yana faaliyette" },
];

export default function AchievementsPage() {
  return (
    <>
      <PageHero
        eyebrow="Başarılar"
        title="2022'den bugüne yolculuğumuz"
        subtitle="Kuruluşumuzdan bu yana kat ettiğimiz yol; yarışmalar, dereceler ve öğrendiğimiz her şey."
      />

      {/* Highlights */}
      <Section>
        <Container>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
            {HIGHLIGHTS.map((item) => (
              <Card key={item.label} className="text-center">
                <dt className="sr-only">{item.label}</dt>
                <dd>
                  <span className="text-brand-600 dark:text-brand-300 block text-4xl font-bold tracking-tight">
                    {item.value}
                  </span>
                  <span className="text-muted mt-2 block text-sm font-medium">
                    {item.label}
                  </span>
                </dd>
              </Card>
            ))}
          </dl>
        </Container>
      </Section>

      {/* Timeline */}
      <Section muted>
        <Container size="narrow">
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Zaman çizelgesi
          </h2>
          <div className="mt-8">
            <Timeline items={MILESTONES} />
          </div>
        </Container>
      </Section>
    </>
  );
}
