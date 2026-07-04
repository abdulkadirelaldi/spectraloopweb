import type { Metadata } from "next";
import { PageHero } from "@/components/public/PageHero";
import { NewsList } from "@/components/public/NewsList";

export const metadata: Metadata = {
  title: "Haberler — Spectraloop",
  description:
    "Spectraloop'tan en güncel haberler, duyurular ve medya. Takımımızın yolculuğunu yakından takip edin.",
};

// ISR: keep news fresh (and self-heal a build-time fetch failure once the
// server is up), matching the announcements API revalidate window.
export const revalidate = 300;

export default function NewsPage() {
  return (
    <>
      <PageHero
        eyebrow="Haberler & Medya"
        title="Takımımızdan son gelişmeler"
        subtitle="Yarışmalar, duyurular ve basında biz — Spectraloop'un yolculuğundaki en güncel haberler."
      />
      <NewsList />
    </>
  );
}
