import { Card, Container, CountUp, Reveal, Section } from "@/components/ui";

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

/** Team-at-a-glance stat cards with count-up numbers and a staggered reveal. */
export function Stats() {
  return (
    <Section>
      <Container>
        <dl className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal as="div" key={stat.label} delay={i * 90}>
              <Card className="text-center transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-md">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <CountUp
                    value={stat.value}
                    className="block text-4xl font-bold tracking-tight text-brand-600 sm:text-5xl dark:text-brand-300"
                  />
                  <span className="mt-2 block text-sm font-medium text-muted">
                    {stat.label}
                  </span>
                </dd>
              </Card>
            </Reveal>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
