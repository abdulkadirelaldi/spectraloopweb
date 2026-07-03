import { Card, Container, Section } from "@/components/ui";

type Stat = {
  value: string;
  label: string;
};

// Representative placeholder figures — replace with real numbers when available.
const STATS: readonly Stat[] = [
  { value: "2022", label: "Kuruluş yılı" },
  { value: "40+", label: "Aktif üye" },
  { value: "3", label: "Alt ekip" },
  { value: "5", label: "Ödül & derece" },
];

/** Team-at-a-glance stat cards. */
export function Stats() {
  return (
    <Section>
      <Container>
        <dl className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Card key={stat.label} className="text-center">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-4xl font-bold tracking-tight text-brand-600 sm:text-5xl dark:text-brand-300">
                  {stat.value}
                </span>
                <span className="mt-2 block text-sm font-medium text-muted">
                  {stat.label}
                </span>
              </dd>
            </Card>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
