import type { Metadata } from "next";
import { Card, Container, Section } from "@/components/ui";
import { ContactForm } from "@/components/public/ContactForm";
import { PageHero } from "@/components/public/PageHero";

export const metadata: Metadata = {
  title: "İletişim — Spectraloop",
  description:
    "Spectraloop ile iletişime geçin. Sorularınız, iş birliği önerileriniz ve tüm talepleriniz için bize ulaşın.",
};

// Representative contact details — replace with real values.
const CONTACT_INFO: readonly {
  label: string;
  value: string;
  href?: string;
}[] = [
  {
    label: "E-posta",
    value: "info@spectraloop.com",
    href: "mailto:info@spectraloop.com",
  },
  { label: "Adres", value: "Üniversite Kampüsü, Türkiye" },
  {
    label: "Instagram",
    value: "@spectraloop",
    href: "https://instagram.com",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="İletişim"
        title="Bize ulaşın"
        subtitle="Sorularınız, iş birliği önerileriniz veya merak ettikleriniz için formu doldurun; en kısa sürede size dönüş yapalım."
      />

      <Section>
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            {/* Contact info */}
            <div>
              <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                İletişim bilgileri
              </h2>
              <p className="text-muted mt-3">
                Aşağıdaki kanallardan doğrudan ulaşabilir ya da yandaki formu
                kullanabilirsiniz.
              </p>
              <ul className="mt-8 flex flex-col gap-4">
                {CONTACT_INFO.map((item) => (
                  <li key={item.label}>
                    <Card>
                      <p className="text-muted text-sm font-medium">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          target={
                            item.href.startsWith("http") ? "_blank" : undefined
                          }
                          rel={
                            item.href.startsWith("http")
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="text-brand-600 hover:text-brand-700 dark:text-brand-300 mt-1 inline-block font-semibold"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-foreground mt-1 font-semibold">
                          {item.value}
                        </p>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact form */}
            <div>
              <h2 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                Mesaj gönderin
              </h2>
              <div className="mt-8">
                <ContactForm
                  withSubject
                  submitLabel="Mesajı gönder"
                  messagePlaceholder="Bize iletmek istediğiniz mesajı yazın…"
                />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
