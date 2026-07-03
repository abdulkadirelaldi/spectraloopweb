# TASKS.md — Canlı İlerleme

> Kaynak-ı hakikat plan: PROGRAM.md (değişmez). Bu dosya = canlı ilerleme (ŞEF günceller).
> Durum değerleri: `todo` · `in-progress` · `blocked` · `review` · `done`
> Kural: aynı anda tek worker meşgul. Bir görev `done` olup commit'lenince şef sıradakini açar.

## Aktif Faz: Faz 1 — Public Site  (Faz 0 ✅ tamamlandı)

### Faz 0 — Kurulum (TAMAMLANDI ✅)

Sıralama notu: **0.1 (scaffold) tüm kök dosyaları üretir ve git'i başlatır.** 0.1 commit'lenmeden
0.2 / 0.3 / 0.4 BAŞLAYAMAZ (hepsi scaffold'a bağımlı). 0.1 sonrası diğerleri ayrı dizinlerde
oldukları için sırayla ilerler.

| id | görev | agent | durum | bağımlılık |
|----|-------|-------|-------|------------|
| 0.1 | Repo scaffold: create-next-app (TS+Tailwind+ESLint+App+src-dir), klasör iskeleti, Prettier, `.gitignore`, `git init` + ilk commit | Frontend | done | - |
| 0.2 | MongoDB/Mongoose bağlantı yardımcısı (`src/lib/db`) + models klasör iskeleti + bağlantı dokümantasyonu | Backend | done | 0.1 |
| 0.3 | Güvenlik temeli: `next.config.ts` security header'ları + `.env.example` (placeholder'lar) + test altyapısı (Vitest + Playwright config) + 1 smoke test | Güvenlik & QA | done | 0.1 |
| 0.4 | Ortak tipler iskeleti `src/types` (PROGRAM.md §8 veri modelleri) — şef koordineli, Backend uygular | Backend | done | 0.2 |

## Faz 1 — Public Site (AKTİF)

> Frontend ağırlıklı. Backend public API sözleşmelerini önce tanımlar ki Frontend tüketsin.
> Güvenlik & QA form koruma + header + smoke/E2E ile kapatır. Tek-worker sırası için
> Backend sözleşmeleri (1.B*) ilgili Frontend sayfasından ÖNCE gelir.

| id | görev | agent | durum | bağımlılık |
|----|-------|-------|-------|------------|
| 1.B1 | Application (Bize Katıl) API sözleşmesi + endpoint + Resend bildirimi + kısa doküman | Backend | done | 0.4 |
| 1.B2 | Contact (İletişim) API sözleşmesi + endpoint + Resend + doküman | Backend | done | 0.4 |
| 1.B3 | Sponsors read API + seed veri + sözleşme dokümanı | Backend | done | 0.4 |
| 1.B4 | Announcements/News read API + sözleşme dokümanı | Backend | in-progress | 0.4 |
| 1.1 | Public shell: Header/Nav + Footer + temel UI primitifleri (Button, Card, Container, Section) | Frontend | todo | 0.3 |
| 1.2 | Ana Sayfa (hero + istatistikler + sponsor şeridi + CTA) | Frontend | todo | 1.1, 1.B3 |
| 1.3 | Hakkımızda/Takım + Alt Ekipler sayfaları | Frontend | todo | 1.1 |
| 1.4 | Araç/Teknoloji + Başarılar (2022→2026 zaman çizelgesi) sayfaları | Frontend | todo | 1.1 |
| 1.5 | Sponsorluk sayfası (kademeler + indirilebilir PDF + form) | Frontend | todo | 1.1, 1.B1 |
| 1.6 | Haberler/Medya + İletişim sayfaları (form → 1.B2) | Frontend | todo | 1.1, 1.B2, 1.B4 |
| 1.7 | Bize Katıl (başvuru formu → 1.B1) sayfası | Frontend | todo | 1.1, 1.B1 |
| 1.Q1 | Form güvenliği: zod validasyon şemaları (application/contact) + rate limit + güvenli input | Güvenlik & QA | todo | 1.B1, 1.B2 |
| 1.Q2 | Public smoke/E2E testleri (sayfalar yükleniyor + form submit akışı) | Güvenlik & QA | todo | 1.2–1.7 |

---
### Scaffold gerçekleri (0.1 çıktısı — tüm agent'lar okusun)
- Next.js **16.2.10**, App Router, `src/` dizini, import alias `@/*`.
- Config **TypeScript**: `next.config.ts` (PROGRAM.md'deki `next.config.js` yerine `.ts`).
  Güvenlik & QA header'ları buraya (`.ts`) yazılacak.
- **Tailwind v4** (CSS-first): `tailwind.config.ts` YOK. Config `src/app/globals.css`
  içinde `@import "tailwindcss"` + `postcss.config.mjs` (`@tailwindcss/postcss`) ile.
- ESLint flat config: `eslint.config.mjs`. Prettier: `.prettierrc` + `.prettierignore`.

### Bekleyen koordinasyon (şef takip ediyor)
- **.env.example'a eklenecek** (Güvenlik & QA — 1.Q1 ile): `MAIL_FROM`,
  `TEAM_NOTIFY_EMAIL` (Backend 1.B1'de Resend için kullanıldı, ikisi de opsiyonel).
- **API sözleşmesi (Frontend'e — 1.5/1.7):** POST `/api/applications`,
  body `{name,email,subteamPref,message}` (hepsi zorunlu), başarı `201 {ok:true,id}`,
  hata `400/500 {ok:false,error}`. Mail best-effort. Detay: api/applications/README.md.
- **API sözleşmesi (Frontend'e — 1.6):** POST `/api/contact`, body
  `{name, email, subject?, message}` (subject opsiyonel), başarı `201 {ok:true}`
  (id yok — kalıcı kayıt yok), hata `400 {ok:false,error}`. Detay: api/contact/README.md.
  Paylaşılan mail helper: src/lib/utils/mail.ts.
- **API sözleşmesi (Frontend'e — 1.2):** GET `/api/sponsors` → `200 {ok:true, sponsors: Sponsor[]}`,
  tier sırasıyla (gold→silver→bronze), `revalidate=300`; hata `500 {ok:false,error}`.
  Seed: `npm run seed:sponsors` (örnek veri ekler). Detay: api/sponsors/README.md.

### Değişiklik günlüğü
- 2026-07-02 — Şef: TASKS.md oluşturuldu. Faz 0 + Faz 1 planlandı. 0.1 açıldı (todo).
- 2026-07-02 — Şef: 0.1 done (scaffold diskte doğrulandı, 2 commit). 0.2 açıldı (Backend).
- 2026-07-02 — Şef: 0.2 done (mongoose ^9.7.3, connect.ts + README). Backend'in
  ihtiyacı: env anahtarı `MONGODB_URI`. 0.3 açıldı (Güvenlik & QA).
- 2026-07-02 — Şef: 0.3 done. Header'lar + .env.example + test altyapısı hazır.
  Test scriptleri: `test` (vitest run), `test:watch`, `test:e2e` (playwright).
  Smoke testler: tests/unit/smoke.test.ts, tests/e2e/home.smoke.spec.ts.
  **FAZ 0 TAMAMLANDI.** 0.4 açıldı (Backend — ortak tipler), ardından Faz 1.
- 2026-07-02 — Şef: 0.4 done (11 tip dosyası, @/types index export, §8 ile tutarlı).
  **FAZ 1 (Public Site) açıldı.** İlk görev 1.B1 (Backend — Application API).
- 2026-07-02 — Şef: 1.B1 done (applications API + Resend, resend ^6.16.0). Yeni env:
  MAIL_FROM + TEAM_NOTIFY_EMAIL → 1.Q1'e taşındı. 1.B2 açıldı (Backend — Contact API).
- 2026-07-03 — Şef: 1.B2 done (contact API, mail-only, paylaşılan mail.ts helper,
  yeni env yok). 1.B3 açıldı (Backend — Sponsors read API). Push edildi.
- 2026-07-03 — Şef: 1.B3 done (sponsors GET + seed, tsx dev dep, revalidate 300).
  1.B4 açıldı (Backend — News/Announcements read API). Push edildi.
