import type { ReactNode } from "react";
import { Header } from "@/components/public/Header";
import { Footer } from "@/components/public/Footer";

/**
 * Public site shell — wraps every public page with the shared header and
 * footer. Individual pages are added in tasks 1.2+.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="bg-brand-500 sr-only rounded-md px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100]"
      >
        İçeriğe geç
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
