import type { Metadata } from "next";
import { CtaBand } from "@/components/public/CtaBand";
import { Hero } from "@/components/public/Hero";
import { SponsorStrip } from "@/components/public/SponsorStrip";
import { Stats } from "@/components/public/Stats";

export const metadata: Metadata = {
  title: "Spectraloop — Öğrenci Hyperloop Takımı",
  description:
    "Spectraloop; mekanik, elektronik ve yazılım birimleriyle yüksek hızlı ulaşım teknolojileri geliştiren bir öğrenci hyperloop takımıdır.",
};

// ISR: regenerate at most every 5 min so sponsor data stays fresh (and a
// build-time fetch failure self-heals once the server is up).
export const revalidate = 300;

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <SponsorStrip />
      <CtaBand />
    </>
  );
}
