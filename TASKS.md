# TASKS.md — Canlı İlerleme

> Kaynak-ı hakikat plan: PROGRAM.md (değişmez). Bu dosya = canlı ilerleme (ŞEF günceller).
> Durum değerleri: `todo` · `in-progress` · `blocked` · `review` · `done`
> Kural: aynı anda tek worker meşgul. Bir görev `done` olup commit'lenince şef sıradakini açar.

## Aktif Faz: — (Faz 0 ✅ · Faz 1 ✅ tamamlandı — sıradaki: deploy? / Faz 2 Auth+Panel)

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

## Faz 1 — Public Site (TAMAMLANDI ✅)

> Frontend ağırlıklı. Backend public API sözleşmelerini önce tanımlar ki Frontend tüketsin.
> Güvenlik & QA form koruma + header + smoke/E2E ile kapatır. Tek-worker sırası için
> Backend sözleşmeleri (1.B*) ilgili Frontend sayfasından ÖNCE gelir.

| id | görev | agent | durum | bağımlılık |
|----|-------|-------|-------|------------|
| 1.B1 | Application (Bize Katıl) API sözleşmesi + endpoint + Resend bildirimi + kısa doküman | Backend | done | 0.4 |
| 1.B2 | Contact (İletişim) API sözleşmesi + endpoint + Resend + doküman | Backend | done | 0.4 |
| 1.B3 | Sponsors read API + seed veri + sözleşme dokümanı | Backend | done | 0.4 |
| 1.B4 | Announcements/News read API + sözleşme dokümanı | Backend | done | 0.4 |
| 1.1 | Public shell: Header/Nav + Footer + temel UI primitifleri (Button, Card, Container, Section) | Frontend | done | 0.3 |
| 1.2 | Ana Sayfa (hero + istatistikler + sponsor şeridi + CTA) | Frontend | done | 1.1, 1.B3 |
| 1.3 | Hakkımızda/Takım + Alt Ekipler sayfaları | Frontend | done | 1.1 |
| 1.4 | Araç/Teknoloji + Başarılar (2022→2026 zaman çizelgesi) sayfaları | Frontend | done | 1.1 |
| 1.5 | Sponsorluk sayfası (kademeler + indirilebilir PDF + form → 1.B2 contact) | Frontend | done | 1.1, 1.B2 |
| 1.6 | Haberler/Medya + İletişim sayfaları (form → 1.B2) | Frontend | done | 1.1, 1.B2, 1.B4 |
| 1.7 | Bize Katıl (başvuru formu → 1.B1) sayfası | Frontend | done | 1.1, 1.B1 |
| 1.Q1 | Form güvenliği: zod şemaları (`src/lib/validation`: application/contact) + rate limit (proxy.ts) + `.env.example`'a MAIL_FROM/TEAM_NOTIFY_EMAIL + şema unit testleri | Güvenlik & QA | done | 1.B1, 1.B2 |
| 1.B5 | zod şemalarını route'lara bağla: `/api/applications` + `/api/contact` içindeki el-yazımı `validate()` yerine `@/lib/validation` şemaları (TODO(1.Q1) kancaları) | Backend | done | 1.Q1 |
| 1.Q2 | Public smoke/E2E testleri (sayfalar yükleniyor + form submit akışı) | Güvenlik & QA | done | 1.2–1.7, 1.B5 |

## Faz 2 — Auth + Panel Çekirdek (AKTİF)

> PROGRAM §10 sırası: Auth.js + RBAC + testleri (Güvenlik & QA lider) → panel
> API'leri (Backend) → panel UI (Frontend). Kural: auth kur → auth testini yaz → panel.
> Teknik ön koşul: authorize() User modeline muhtaç → 2.B1 (Backend model) önce gelir.
> Deploy şimdilik ertelendi (Faz 1 sonrası karar: Faz 2'ye geçildi).

| id | görev | agent | durum | bağımlılık |
|----|-------|-------|-------|------------|
| 2.B1 | User + Subteam Mongoose modelleri (passwordHash, role, active, subteam) + admin seed script (bcrypt hash) | Backend | done | 0.4 |
| 2.S1 | Auth.js kurulumu: Credentials provider + authorize (User+bcrypt) + JWT/session'da rol + AUTH_SECRET + api/auth/[...nextauth] | Güvenlik & QA | done | 2.B1 |
| 2.S2 | RBAC helper'ları (rol kontrol) + panel route koruma (proxy.ts /panel/**) + auth & RBAC testleri (giriş, yetkisiz erişim reddi) | Güvenlik & QA | in-progress | 2.S1 |
| 2.F0 | Giriş sayfası UI (`/giris`) — Auth.js signIn ile Credentials formu | Frontend | todo | 2.S1 |
| 2.F1 | Panel shell: `(panel)/panel` layout + nav + dashboard + oturum durumu/çıkış | Frontend | todo | 2.S2 |
| 2.B2 | Panel API: announcements write (CRUD) + RBAC (lead+ yayınlar) | Backend | todo | 2.S2 |
| 2.B3 | Panel API: tasks CRUD (birim bazlı) + RBAC | Backend | todo | 2.S2 |
| 2.B4 | Panel API: members (üye dizini oku + admin CRUD) + RBAC | Backend | todo | 2.S2 |
| 2.B5 | Panel API: documents (metadata; R2 upload ayrı değerlendirilecek) + events + RBAC | Backend | todo | 2.S2 |
| 2.F2 | Panel: Duyurular (liste + oluştur/yayınla) | Frontend | todo | 2.F1, 2.B2 |
| 2.F3 | Panel: Görevler (birim bazlı Kanban/liste) | Frontend | todo | 2.F1, 2.B3 |
| 2.F4 | Panel: Üye dizini | Frontend | todo | 2.F1, 2.B4 |
| 2.F5 | Panel: Dokümanlar + Etkinlik/Takvim | Frontend | todo | 2.F1, 2.B5 |
| 2.Q1 | Panel RBAC E2E: rol bazlı erişim, yetkisiz reddi (admin/lead/member) | Güvenlik & QA | todo | 2.F2–2.F5 |

> Not: Faz 2 planı canlı — görevler ilerledikçe (özellikle panel API/UI) bölünüp
> rafine edilebilir. R2 dosya yükleme karmaşıksa Faz 3'e kaydırılabilir.

---
### Scaffold gerçekleri (0.1 çıktısı — tüm agent'lar okusun)
- Next.js **16.2.10**, App Router, `src/` dizini, import alias `@/*`.
- Config **TypeScript**: `next.config.ts` (PROGRAM.md'deki `next.config.js` yerine `.ts`).
  Güvenlik & QA header'ları buraya (`.ts`) yazılacak.
- **Tailwind v4** (CSS-first): `tailwind.config.ts` YOK. Config `src/app/globals.css`
  içinde `@import "tailwindcss"` + `postcss.config.mjs` (`@tailwindcss/postcss`) ile.
- ESLint flat config: `eslint.config.mjs`. Prettier: `.prettierrc` + `.prettierignore`.

### Bekleyen koordinasyon (şef takip ediyor)
- ✅ ÇÖZÜLDÜ (1.Q1): `MAIL_FROM` + `TEAM_NOTIFY_EMAIL` .env.example'a eklendi.
- **Auth export'ları (2.S2 + Frontend'e — 2.S1'den):** `@/lib/auth`'dan
  `{ handlers, auth, signIn, signOut }` + `SIGN_IN_PATH = "/giris"` + `authConfig`.
  `session.user = { id, role, subteam?, name, email, image }` (tip augmentation
  src/lib/auth/types.ts). RBAC/proxy koruma `auth` ile; Frontend login `/giris`'te
  `signIn` ile; oturum okuma `auth()`.
- **Auth export'ları (QA 2.S1'e — Backend 2.B1'den):** `verifyPassword(plain, hash):
  Promise<boolean>` ve `hashPassword` → `@/lib/utils/password`. User modeli `@/models/User`
  (DİKKAT: `passwordHash` alanı `select:false` → authorize sorgusu `.select("+passwordHash")`
  ile açıkça istemeli). Yeni env: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` → .env.example'a
  eklenecek (QA). `AUTH_SECRET` + `NEXTAUTH_URL` zaten .env.example'da.
- **Validasyon şema export'ları (Backend 1.B5'e):** `@/lib/validation`'dan
  `applicationSchema`, `contactSchema` (zod) + `firstErrorMessage` helper +
  `ApplicationInput`/`ContactInput` (z.infer). Route'lardaki el-yazımı `validate()`
  bunlarla değişecek. Next 16 notu: middleware yerine `src/proxy.ts` kullanılıyor.
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
- **API sözleşmesi (Frontend'e — 1.6):** GET `/api/announcements` → `200 {ok:true,
  announcements: Announcement[]}`, `createdAt DESC`, SADECE `publishedToPublic:true`,
  `revalidate=300`; hata `500 {ok:false,error}`. Seed: `npm run seed:announcements`.
  Detay: api/announcements/README.md.

### UI primitifleri (1.1 çıktısı — Frontend sayfa görevleri okusun)
- Import: `@/components/ui` (barrel index.ts). `cn` helper: `@/components/ui/cn`.
- `Button` — polymorphic: `ButtonAsButton | ButtonAsLink` (href verilirse link/`<a>`,
  yoksa `<button>`); variant/size prop'ları component'te. `Card` (`interactive?`),
  `Section` (`muted?`), `Container`, `Badge` (`variant`). Hepsi HTMLAttributes yayar.
- Public shell: `(public)/layout.tsx` Header+Footer sarar. Nav linkleri:
  `src/components/public/nav-links.ts`. Marka renkleri: `--color-brand-50..900`
  (globals.css `@theme`). Ana sayfa placeholder: `(public)/page.tsx` (1.2 dolduracak).
- Form primitifleri (1.5): `Field` + `Input` @/components/ui. Yeniden kullanılabilir
  `ContactForm` (@/components/public) → POST /api/contact; prop `fixedSubject?`
  (verilirse konu alanı gizlenir ve sabit gönderilir), `withSubject?` (düzenlenebilir
  konu alanı). Client+sunucu doğrulama, yükleniyor/başarı/hata durumları içeriyor.
  İletişim (1.6) bunu düzenlenebilir konuyla, Sponsorluk (1.5) fixedSubject ile kullanır.

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
- 2026-07-03 — Şef: 1.B4 done (announcements GET, publishedToPublic filtresi, seed).
  **Tüm Faz 1 Backend sözleşmeleri hazır.** Worker sırası Frontend'e geçti;
  1.1 açıldı (Frontend — public shell). Push edildi.
- 2026-07-03 — Şef: 1.1 done (public shell + UI primitifleri, marka tokenları,
  build temiz, route çakışması yok). 1.2 açıldı (Frontend — Ana Sayfa). Push edildi.
- 2026-07-03 — Şef: 1.2 done (Ana Sayfa: Hero/Stats/SponsorStrip/CtaBand,
  SponsorStrip server component /api/sponsors tüketiyor, build temiz).
  1.3 açıldı (Frontend — Hakkımızda + Ekipler). Push edildi.
- 2026-07-03 — Şef: 1.3 done (/hakkimizda + /ekipler statik, yeni bileşenler
  PageHero/SubteamCard/TeamMemberCard, build temiz). 1.4 açıldı (Frontend —
  Araç + Başarılar timeline). Push edildi.
- 2026-07-03 — Şef: 1.4 done (/arac + /basarilar statik, Timeline bileşeni prop'tan
  besleniyor, build temiz). **Statik public sayfalar bitti.** Form sayfaları başlıyor;
  1.5 açıldı (Frontend — Sponsorluk + form → 1.B1 API). Push edildi.
- 2026-07-03 — Şef: 1.5 done (Sponsorluk: kademeler + PDF + ContactForm; şef kararı
  sponsorluk formu 1.B2 /api/contact'a bağlandı [1.B1 değil], fixedSubject ile).
  Yeni: Field/Input primitifleri + yeniden kullanılabilir ContactForm. 1.6 açıldı
  (Frontend — Haberler + İletişim). Push edildi.
- 2026-07-03 — Şef: 1.6 done (/haberler NewsList+AnnouncementCard /api/announcements
  tüketiyor, /iletisim ContactForm withSubject, build temiz). 1.7 açıldı (Frontend —
  Bize Katıl → 1.B1 applications API). Push edildi.
- 2026-07-03 — Şef: 1.7 done (/katil ApplicationForm → /api/applications, alt-ekip
  listesi merkezi src/components/public/subteams.ts, yeni Select primitifi, build temiz).
  **TÜM PUBLIC SAYFALAR TAMAM.** QA fazına geçildi: 1.Q1 açıldı (zod + rate limit + env);
  sahiplik çakışması için 1.B5 (Backend — şemaları route'a bağlama) eklendi. Push edildi.
- 2026-07-03 — Şef: 1.Q1 done (zod şemaları + rate limit src/proxy.ts [Next 16:
  middleware yerine proxy], env eklendi, 30 test yeşil). 1.B5 açıldı (Backend —
  şemaları route'lara bağla). Push edildi.
- 2026-07-03 — Şef: 1.B5 done (her iki route zod şemalarını kullanıyor, validate()
  temizlendi, build+test temiz). Son Faz 1 görevi 1.Q2 açıldı (public smoke/E2E). Push edildi.
- 2026-07-03 — Şef: 1.Q2 done (19 E2E testi yeşil: public smoke + navigasyon +
  form akışları mock'lu). **🎉 FAZ 1 (PUBLIC SİTE) TAMAMEN TAMAMLANDI.**
  Karar bekliyor: (A) Vercel deploy mi, (B) Faz 2 (Auth+Panel) mi. Push edildi.
- 2026-07-03 — Kullanıcı kararı: **Faz 2 (Auth + Panel)**. Deploy ertelendi.
  Şef: Faz 2 planı eklendi (13 görev). 2.B1 açıldı (Backend — User/Subteam modelleri +
  admin seed), ardından liderlik QA'ya (auth) geçecek. Push edildi.
- 2026-07-04 — Şef: 2.B1 done (User/Subteam modelleri, bcryptjs, password helper'ları,
  seed:admin). Yeni env: SEED_ADMIN_EMAIL/PASSWORD. verifyPassword @/lib/utils/password.
  Liderlik QA'ya geçti; 2.S1 açıldı (Auth.js kurulumu). Push edildi.
- 2026-07-04 — Şef: 2.S1 done (next-auth v5, Credentials authorize, JWT+rol,
  tip augmentation, /giris signIn yolu). 2.S2 açıldı (RBAC + panel koruma + testler);
  Frontend login sayfası için 2.F0 (/giris) plana eklendi. Push edildi.
