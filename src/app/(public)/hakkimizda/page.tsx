import type { Metadata } from "next";
import Link from "next/link";
import { Card, Container, Reveal, Section } from "@/components/ui";
import { PageHero } from "@/components/public/PageHero";
import {
  TeamMemberCard,
  type TeamMember,
} from "@/components/public/TeamMemberCard";

export const metadata: Metadata = {
  title: "Hakkımızda — Spectraloop",
  description:
    "Spectraloop'un hikayesi, misyonu ve vizyonu ile takımı yürüten kadro. Geleceğin yüksek hızlı ulaşımını tasarlayan öğrenci hyperloop takımı.",
};

// Representative placeholder roster — replace with the real team + photos.
const LEADERSHIP: readonly TeamMember[] = [
  { name: "Takım Kaptanı", role: "Kaptan / Kurucu", subteam: "Yönetim" },
  { name: "Mekanik Lideri", role: "Birim Lideri", subteam: "Mekanik" },
  {
    name: "Elektronik Lideri",
    role: "Birim Lideri",
    subteam: "Elektronik-Elektrik",
  },
  { name: "Yazılım Lideri", role: "Birim Lideri", subteam: "Yazılım" },
];

const MILESTONES: readonly { year: string; text: string }[] = [
  { year: "2022", text: "Spectraloop kuruldu; ilk çekirdek kadro oluştu." },
  { year: "2023", text: "İlk prototip aracın tasarımı tamamlandı." },
  { year: "2024", text: "Ulusal yarışmalarda ilk kez sahne aldık." },
  { year: "2026", text: "Yeni nesil araç ve genişleyen ekiple yola devam." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Hakkımızda"
        title="Geleceğin ulaşımını tasarlayan öğrenci takımı"
        subtitle="Spectraloop; farklı disiplinlerden öğrencileri bir araya getiren, yüksek hızlı ulaşım teknolojileri üzerine çalışan bir hyperloop takımıdır."
      />

      {/* Mission & Vision */}
      <Section>
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal as="div">
              <Card className="hover:border-brand-200 dark:hover:border-brand-500/40 h-full transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-md">
                <h2 className="text-foreground text-xl font-semibold">
                  Misyonumuz
                </h2>
                <p className="text-muted mt-3">
                  Sürdürülebilir ve yüksek hızlı ulaşım teknolojilerini
                  geliştirirken; öğrencilere gerçek mühendislik problemleri
                  üzerinde çalışma, takım hâlinde üretme ve kendini geliştirme
                  fırsatı sunmak.
                </p>
              </Card>
            </Reveal>
            <Reveal as="div" delay={100}>
              <Card className="hover:border-brand-200 dark:hover:border-brand-500/40 h-full transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:shadow-md">
                <h2 className="text-foreground text-xl font-semibold">
                  Vizyonumuz
                </h2>
                <p className="text-muted mt-3">
                  Türkiye&apos;de hyperloop teknolojisinin öncü öğrenci
                  takımlarından biri olmak ve geleceğin ulaşım mühendislerini
                  yetiştiren bir topluluğa dönüşmek.
                </p>
              </Card>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Story + mini timeline */}
      <Section muted>
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                Hikayemiz
              </h2>
              <p className="text-muted mt-4">
                Farklı bölümlerden bir grup öğrencinin ortak hayaliyle yola
                çıktık: yüksek hızlı ulaşımı kendi ellerimizle tasarlamak. Kısa
                sürede mekanik, elektronik ve yazılım birimlerinden oluşan
                disiplinler arası bir takıma dönüştük.
              </p>
              <p className="text-muted mt-4">
                Her yıl aracımızı ve süreçlerimizi geliştirerek yarışmalara
                hazırlanıyor, edindiğimiz deneyimi yeni üyelere aktarıyoruz.
              </p>
              <p className="text-muted mt-4 text-sm">
                Detaylı zaman çizelgesi için{" "}
                <Link
                  href="/basarilar"
                  className="text-brand-600 hover:text-brand-700 dark:text-brand-300 font-semibold"
                >
                  Başarılar
                </Link>{" "}
                sayfasına göz atın.
              </p>
            </div>

            <ol className="border-border relative flex flex-col gap-6 border-l pl-6">
              {MILESTONES.map((milestone, i) => (
                <Reveal
                  as="li"
                  key={milestone.year}
                  delay={i * 90}
                  className="relative"
                >
                  <span
                    aria-hidden="true"
                    className="border-surface bg-brand-500 absolute top-1 -left-[1.90rem] h-3 w-3 rounded-full border-2"
                  />
                  <span className="text-brand-600 dark:text-brand-300 text-sm font-bold">
                    {milestone.year}
                  </span>
                  <p className="text-foreground mt-1 text-sm">
                    {milestone.text}
                  </p>
                </Reveal>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      {/* Team roster */}
      <Section>
        <Container>
          <div className="max-w-2xl">
            <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
              Takımımız
            </h2>
            <p className="text-muted mt-3">
              Takımı yürüten çekirdek kadro. Her birim, kendi alanında araca
              değer katan üyelerden oluşur.
            </p>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {LEADERSHIP.map((member, i) => (
              <Reveal as="li" key={member.name} delay={(i % 4) * 80}>
                <TeamMemberCard {...member} />
              </Reveal>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
