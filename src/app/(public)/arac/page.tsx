import type { Metadata } from "next";
import { Card, Container, Reveal, Section } from "@/components/ui";
import { PageHero } from "@/components/public/PageHero";

export const metadata: Metadata = {
  title: "Araç & Teknoloji — Spectraloop",
  description:
    "Spectraloop hyperloop aracının teknik özellikleri, alt sistemleri ve tasarım yaklaşımı. Yüksek hızlı ulaşım için geliştirilen mühendislik çözümleri.",
};

// Representative placeholder specs — replace with the real vehicle figures.
const SPECS: readonly { label: string; value: string; unit?: string }[] = [
  { label: "Tasarım hızı", value: "120", unit: "km/s" },
  { label: "Araç ağırlığı", value: "85", unit: "kg" },
  { label: "Uzunluk", value: "2.4", unit: "m" },
  { label: "İtki sistemi", value: "Lineer" },
];

const SUBSYSTEMS: readonly { title: string; description: string }[] = [
  {
    title: "İtki Sistemi",
    description:
      "Aracı yüksek hıza ulaştıran lineer motor tabanlı itki çözümü; verimlilik ve kontrol edilebilirlik önceliklidir.",
  },
  {
    title: "Süspansiyon & Kızak",
    description:
      "Sürtünmeyi azaltan ve stabiliteyi artıran süspansiyon tasarımı ile güvenli ray takibi.",
  },
  {
    title: "Fren & Güvenlik",
    description:
      "Kademeli frenleme ve acil durdurma mekanizmalarıyla her koşulda güvenli duruş.",
  },
  {
    title: "Kontrol & Telemetri",
    description:
      "Sensör verilerini gerçek zamanlı işleyen kontrol yazılımı ve telemetri altyapısı.",
  },
];

const GALLERY: readonly string[] = [
  "Araç render — yandan görünüm",
  "Araç render — perspektif",
  "Alt sistem — itki modülü",
];

export default function VehiclePage() {
  return (
    <>
      <PageHero
        eyebrow="Araç & Teknoloji"
        title="Yüksek hız için tasarlanmış mühendislik"
        subtitle="Aracımız; itki, süspansiyon, frenleme ve kontrol sistemlerinin birlikte çalıştığı bütünleşik bir hyperloop platformudur."
      />

      {/* Technical specs */}
      <Section>
        <Container>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Teknik özellikler
          </h2>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {SPECS.map((spec, i) => (
              <Reveal as="div" key={spec.label} delay={(i % 4) * 80}>
                <Card className="hover:border-brand-200 dark:hover:border-brand-500/40 h-full transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-md">
                  <dt className="text-muted text-sm font-medium">
                    {spec.label}
                  </dt>
                  <dd className="text-brand-600 dark:text-brand-300 mt-2 text-3xl font-bold tracking-tight">
                    {spec.value}
                    {spec.unit ? (
                      <span className="text-muted ml-1 text-base font-medium">
                        {spec.unit}
                      </span>
                    ) : null}
                  </dd>
                </Card>
              </Reveal>
            ))}
          </dl>
        </Container>
      </Section>

      {/* Subsystems */}
      <Section muted>
        <Container>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Alt sistemler
          </h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {SUBSYSTEMS.map((subsystem, i) => (
              <Reveal as="li" key={subsystem.title} delay={(i % 2) * 100}>
                <Card className="hover:border-brand-200 dark:hover:border-brand-500/40 h-full transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-md">
                  <h3 className="text-foreground text-lg font-semibold">
                    {subsystem.title}
                  </h3>
                  <p className="text-muted mt-2 text-sm">
                    {subsystem.description}
                  </p>
                </Card>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>

      {/* Render gallery (placeholder tiles until real renders arrive) */}
      <Section>
        <Container>
          <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            Görsel galeri
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GALLERY.map((caption, i) => (
              <Reveal as="li" key={caption} delay={(i % 3) * 90}>
                <figure>
                  <div
                    role="img"
                    aria-label={`${caption} (görsel yakında eklenecek)`}
                    className="border-border from-brand-100 to-brand-50 text-brand-700 dark:from-brand-500/20 dark:to-brand-500/5 dark:text-brand-200 flex aspect-video items-center justify-center rounded-2xl border bg-gradient-to-br text-sm font-medium"
                  >
                    Görsel yakında
                  </div>
                  <figcaption className="text-muted mt-2 text-sm">
                    {caption}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
