# TASKS.md — Canlı İlerleme

> Kaynak-ı hakikat plan: PROGRAM.md (değişmez). Bu dosya = canlı ilerleme (ŞEF günceller).
> Durum değerleri: `todo` · `in-progress` · `blocked` · `review` · `done`
> Kural: aynı anda tek worker meşgul. Bir görev `done` olup commit'lenince şef sıradakini açar.

## Aktif Faz: Faz D — Vercel Deploy (Faz 0–3 ✅)

> Kullanıcı kararı (2026-07-11): Vercel deploy. İki kol: (a) KULLANICI manuel
> provisioning (hesaplar+secret'lar — agent yapamaz), (b) agent kodu son-hazır yapar.
> Auth.js `trustHost: true` zaten ayarlı; vercel.json gerekmez (Next.js otomatik).

| id | görev | agent | durum | bağımlılık |
|----|-------|-------|-------|------------|
| D1 | Deploy hazırlık: `docs/DEPLOY.md` (env + adım checklist) + .env.example tamlık denetimi + prod Auth/CSP/headers doğrulama + prod build kontrolü | Güvenlik & QA | done | 3.Q1 |
| D0 | **KULLANICI (manuel):** MongoDB Atlas URI · Resend API key + doğrulanmış gönderen · Cloudflare R2 (bucket+creds+public URL) · AUTH_SECRET üret · Vercel proje + GitHub bağla · tüm env'leri Vercel'e gir · admin seed çalıştır | Yusuf | in-progress | D1 |
| D2 | Deploy sonrası smoke doğrulama (public sayfalar + giriş + panel + form + upload) + varsa prod hata düzeltme | Güvenlik & QA | todo | D0 |



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

## Faz 2 — Auth + Panel Çekirdek (TAMAMLANDI ✅)

> PROGRAM §10 sırası: Auth.js + RBAC + testleri (Güvenlik & QA lider) → panel
> API'leri (Backend) → panel UI (Frontend). Kural: auth kur → auth testini yaz → panel.
> Teknik ön koşul: authorize() User modeline muhtaç → 2.B1 (Backend model) önce gelir.
> Deploy şimdilik ertelendi (Faz 1 sonrası karar: Faz 2'ye geçildi).

| id | görev | agent | durum | bağımlılık |
|----|-------|-------|-------|------------|
| 2.B1 | User + Subteam Mongoose modelleri (passwordHash, role, active, subteam) + admin seed script (bcrypt hash) | Backend | done | 0.4 |
| 2.S1 | Auth.js kurulumu: Credentials provider + authorize (User+bcrypt) + JWT/session'da rol + AUTH_SECRET + api/auth/[...nextauth] | Güvenlik & QA | done | 2.B1 |
| 2.S2 | RBAC helper'ları (rol kontrol) + panel route koruma (proxy.ts /panel/**) + auth & RBAC testleri (giriş, yetkisiz erişim reddi) | Güvenlik & QA | done | 2.S1 |
| 2.F0 | Giriş sayfası UI (`/giris`) — Auth.js signIn ile Credentials formu | Frontend | done | 2.S1 |
| 2.F1 | Panel shell: `(panel)/panel` layout + nav + dashboard + oturum durumu/çıkış | Frontend | done | 2.S2 |
| 2.B2 | Panel API: announcements write (CRUD) + RBAC (lead+ yayınlar) — `/api/panel/*` deseni | Backend | done | 2.S2 |
| 2.B3 | Panel API: tasks CRUD (birim bazlı) + RBAC | Backend | done | 2.S2 |
| 2.B4 | Panel API: members (üye dizini oku + admin CRUD) + RBAC | Backend | done | 2.S2 |
| 2.B5 | Panel API: documents (metadata; R2 upload ayrı değerlendirilecek) + events + RBAC | Backend | done | 2.S2 |
| 2.F2 | Panel: Duyurular (liste + oluştur/yayınla) | Frontend | done | 2.F1, 2.B2 |
| 2.F3 | Panel: Görevler (birim bazlı Kanban/liste) | Frontend | done | 2.F1, 2.B3 |
| 2.F4 | Panel: Üye dizini | Frontend | done | 2.F1, 2.B4 |
| 2.F5 | Panel: Dokümanlar + Etkinlik/Takvim | Frontend | done | 2.F1, 2.B5 |
| 2.Q0 | Panel input zod şemaları (`@/lib/validation`): announcement/task/member/document/event — Backend'in TODO(2.Q) kancaları için | Güvenlik & QA | done | 2.B2–2.B5 |
| 2.B6 | Panel zod şemalarını route'lara bağla (TODO(2.Q) → @/lib/validation) | Backend | done | 2.Q0 |
| 2.Q1 | Panel RBAC E2E: rol bazlı erişim, yetkisiz reddi (admin/lead/member) | Güvenlik & QA | done | 2.F2–2.F5 |

> Not: Faz 2 planı canlı — görevler ilerledikçe (özellikle panel API/UI) bölünüp
> rafine edilebilir. R2 dosya yükleme karmaşıksa Faz 3'e kaydırılabilir.

## Faz 3 — Gelişmiş Panel + CMS Bağı (TAMAMLANDI ✅)

> Kapsam (PROGRAM §10): başvuru yönetimi, envanter, bütçe, R2 dosya yükleme,
> CMS bağı (panelden public yayın). Backend-sözleşme-önce sırası korunur.
> Yeni domain tipleri (Inventory, Budget/Expense) şef-onaylı: ilgili Backend
> görevi src/types'a ekler (şef=ben onaylıyorum). Deploy Faz 3 sonrasına ertelendi.

| id | görev | agent | durum | bağımlılık |
|----|-------|-------|-------|------------|
| 3.B1 | Panel API: applications (başvuru) list/view/status güncelle + RBAC (admin/lead) — mevcut Application modeli | Backend | done | 2.S2 |
| 3.F1 | Panel: Başvurular sayfası (liste + durum güncelle) | Frontend | done | 3.B1, 2.F1 |
| 3.B2 | Inventory modeli + tip (src/types) + /api/panel/inventory CRUD + RBAC | Backend | done | 2.S2 |
| 3.F2 | Panel: Envanter sayfası | Frontend | done | 3.B2 |
| 3.B3 | Budget/Expense modeli + tip + /api/panel/budget CRUD + RBAC | Backend | done | 2.S2 |
| 3.F3 | Panel: Bütçe/harcama sayfası | Frontend | done | 3.B3 |
| 3.B4 | R2 dosya yükleme: presigned URL API + entegrasyon (Cloudflare R2) | Backend | done | 2.S2 |
| 3.S1 | Güvenli dosya yükleme: tip/boyut authoritative validasyon (`@/lib/validation`) + key/isim sanitize + güvenlik denetimi + upload testleri | Güvenlik & QA | done | 3.B4 |
| 3.F4 | Panel: doküman yükleme UI (R2) — "yakında" yerine gerçek upload | Frontend | done | 3.B4, 3.S1 |
| 3.B5 | Panel API: sponsors CRUD (CMS — panelden yönet/yayınla) + RBAC | Backend | done | 2.S2 |
| 3.F5 | Panel: Sponsor yönetimi (CMS bağı — panelden public'e yansır) | Frontend | done | 3.B5 |
| 3.Q0 | Faz 3 panel zod şemaları (inventory/expense/application-status/sponsor) → `@/lib/validation` | Güvenlik & QA | done | 3.B1–3.B5 |
| 3.B6 | Faz 3 zod şemalarını + upload validasyonunu route'lara bağla (TODO(3.Q)/TODO(3.S1)) | Backend | done | 3.Q0, 3.S1 |
| 3.Q1 | Faz 3 RBAC + upload entegrasyon/E2E testleri | Güvenlik & QA | done | 3.F1–3.F5, 3.B6 |

> Not: Faz 3 planı canlı; görevler ilerledikçe rafine edilebilir. Panel zod deseni
> Faz 2'deki gibi (Backend ara-doğrulama + TODO(3.Q) → QA 3.Q1'de şema + bağlama).

---
### Scaffold gerçekleri (0.1 çıktısı — tüm agent'lar okusun)
- Next.js **16.2.10**, App Router, `src/` dizini, import alias `@/*`.
- Config **TypeScript**: `next.config.ts` (PROGRAM.md'deki `next.config.js` yerine `.ts`).
  Güvenlik & QA header'ları buraya (`.ts`) yazılacak.
- **Tailwind v4** (CSS-first): `tailwind.config.ts` YOK. Config `src/app/globals.css`
  içinde `@import "tailwindcss"` + `postcss.config.mjs` (`@tailwindcss/postcss`) ile.
- ESLint flat config: `eslint.config.mjs`. Prettier: `.prettierrc` + `.prettierignore`.

### Bekleyen koordinasyon (şef takip ediyor)
- **Panel zod export'ları (Backend 2.B6'ya — 2.Q0'dan):** `@/lib/validation`'dan
  `panel{Announcement,Task,Member,Document,Event}{Create,Update}Schema` (10 şema) +
  `firstErrorMessage`. 5 route'taki `TODO(2.Q)` ara-kontrolleri bunlarla değişecek.
- **Faz 3 zod + upload export'ları (Backend 3.B6'ya — 3.Q0/3.S1'den):**
  `@/lib/validation`'dan `panelInventory{Create,Update}Schema`, `panelExpense{Create,
  Update}Schema`, `panelApplicationStatusSchema`, `panelSponsor{Create,Update}Schema`
  + upload: `uploadRequestSchema`, `sanitizeUploadFileName`, `buildUploadKey`,
  `maxBytesForContentType`. TODO(3.Q)/TODO(3.S1) kancaları bunlarla değişecek.
- ✅ ÇÖZÜLDÜ (1.Q1): `MAIL_FROM` + `TEAM_NOTIFY_EMAIL` .env.example'a eklendi.
- **API guard (Backend 2.B2–2.B5'e — 2.S2'den):** `@/lib/auth/guard`'dan
  `requireApiSession()`, `requireApiRole(allowed: Role|Role[])`, `requireApiMinRole(min: Role)`.
  Dönüş `{ok:true, session} | {ok:false, response: NextResponse}` (401 oturumsuz,
  403 yetersiz rol). Kullanım: `const gate = await requireApiRole([...]); if(!gate.ok) return gate.response;`
  sonra `gate.session.user.{id,role,subteam}`. Panel route koruması: proxy.ts /panel
  optimistic redirect + API'de zorunlu guard (katmanlı — PROGRAM §11).
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

### Panel bileşenleri (2.F1 çıktısı — panel sayfa görevleri okusun)
- Kabuk: `(panel)/panel/layout.tsx` auth() ile korumalı (girişsiz → /giris?callbackUrl).
  `PanelChrome` (sidebar+topbar), nav config `src/components/panel/nav.ts` (rol-farkında;
  yeni panel sayfası eklenince buraya link eklenir).
- Yeniden kullanılabilir: `PanelPageHeader`, `PanelCard` (@/components/panel, index barrel).
  Panel sayfaları (2.F2–2.F5) bunları kullanır. Çıkış: `LogoutButton` @/components/auth.
- Nav rol-görünürlük deseni (3.F1 çıktısı): `nav.ts`'te her öğe opsiyonel `minRole`
  alır; `visibleNavFor(role)` role göre süzer (RANK: member<lead<admin). Admin/lead-only
  sayfalar (başvurular minRole:lead — PII) böyle gizlenir. Yeni gizli sayfalar bunu kullanır.
- Panel CRUD sayfa deseni (2.F2 çıktısı): server component `getBaseUrl()` ile
  `/api/panel/*` fetch → `role` + data'yı client `*Manager` bileşenine geçir →
  Manager POST/PATCH/DELETE + `router.refresh()`; yazma aksiyonları `canWrite`
  (role) ile gizli. Örnek: AnnouncementsManager + AnnouncementForm.
- Panel API deseni: `/api/panel/*`, response `{ok, ...}`, guard'lı (okuma session,
  yazma rol). RBAC UI'da gizleme sadece UX — API zaten guard'lı (PROGRAM §11).

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
- 2026-07-04 — Şef: 2.S2 done (RBAC + guard.ts [requireApiRole/MinRole/Session] +
  proxy /panel koruma + 69 unit test + panel-protection E2E). **Auth+RBAC temeli bitti.**
  Backend-önce sırayla 2.B2 açıldı (panel announcements API). Push edildi.
- 2026-07-04 — Şef: 2.B2 done (panel announcements CRUD, /api/panel/* deseni, guard'lar,
  public GET bozulmadı). Panel zod'ları batch'lendi: 2.Q0 (QA yazar) + 2.B6 (Backend bağlar)
  plana eklendi. 2.B3 açıldı (panel tasks CRUD). Push edildi.
- 2026-07-04 — Şef: 2.B3 done (Task modeli + panel tasks CRUD, birim-bazlı RBAC/IDOR,
  okuma tüm birimlerde/yazma kendi biriminde). 2.B4 açıldı (panel members). Push edildi.
- 2026-07-04 — Şef: 2.B4 done (panel members, güvenli projeksiyon [passwordHash asla],
  admin-only oluştur/sil/rol, hashPassword). 2.B5 açıldı (panel documents+events, son API). Push edildi.
- 2026-07-04 — Şef: 2.B5 done (Document/Event modelleri + panel documents/events API,
  documents IDOR, fileUrl metadata/R2 Faz3'e ertelendi). **TÜM PANEL API'LERİ TAMAM.**
  2.Q0 açıldı (QA — 5 panel input zod şeması). Push edildi.
- 2026-07-04 — Şef: 2.Q0 done (10 panel şeması panel*{Create,Update}Schema
  @/lib/validation, testler yeşil). 2.B6 açıldı (Backend — şemaları route'lara bağla). Push edildi.
- 2026-07-04 — Şef: 2.B6 done (10 panel route zod'a bağlandı, TODO(2.Q) temiz, RBAC/response
  korundu). **Backend+güvenlik panel için hazır.** Worker Frontend'e geçti; 2.F0 açıldı
  (giriş sayfası /giris). Push edildi.
- 2026-07-04 — Şef: 2.F0 done (/giris server action signIn, open-redirect korumalı
  callbackUrl, yeniden kullanılabilir LogoutButton @/components/auth). 2.F1 açıldı
  (panel shell). Push edildi.
- 2026-07-04 — Şef: 2.F1 done (panel shell: layout auth() koruma, PanelChrome,
  rol-farkında nav.ts, PanelPageHeader/PanelCard). 2.F2 açıldı (panel Duyurular). Push edildi.
- 2026-07-04 — Şef: 2.F2 done (panel Duyurular: server fetch + rol geçidi +
  AnnouncementsManager/Form, CRUD deseni kuruldu). 2.F3 açıldı (panel Görevler). Push edildi.
- 2026-07-04 — Şef: 2.F3 done (panel Görevler Kanban, TasksManager/Form, rol-farkında
  aksiyonlar). 2.F4 açıldı (panel Üye dizini). Push edildi.
- 2026-07-04 — Şef: 2.F4 done (panel Üye dizini, MembersManager güvenli shape,
  rol-farkında yönetim). 2.F5 açıldı (panel Dokümanlar+Takvim, son panel sayfası). Push edildi.
- 2026-07-04 — Şef: 2.F5 done (panel Dokümanlar + Takvim, Documents/Events Manager/Form).
  **TÜM PANEL UI'I TAMAM.** Son Faz 2 görevi 2.Q1 açıldı (panel RBAC E2E). Push edildi.
- 2026-07-11 — Şef: 2.Q1 done (panel RBAC entegrasyon testleri + panel-api-auth E2E;
  130 unit/entegrasyon + 34 E2E yeşil). **🎉 FAZ 2 (AUTH + PANEL) TAMAMEN TAMAMLANDI.**
  Karar bekliyor: (A) Vercel deploy mi, (B) Faz 3 (envanter/bütçe/başvuru + R2 + CMS) mi. Push edildi.
- 2026-07-11 — Kullanıcı kararı: **Faz 3 (Gelişmiş Panel)**. Deploy ertelendi.
  Şef: Faz 3 planı eklendi (12 görev). 3.B1 açıldı (Backend — panel başvuru yönetimi). Push edildi.
- 2026-07-11 — Şef: 3.B1 done (panel applications API, admin+lead, status PATCH,
  içerik salt-okuma). ApplicationStatus: new→reviewing→accepted/rejected. 3.F1 açıldı
  (panel Başvurular). Push edildi.
- 2026-07-11 — Şef: 3.F1 done (panel Başvurular, ApplicationsManager, nav minRole/
  visibleNavFor rol-görünürlük deseni). 3.B2 açıldı (Inventory model+tip+API). Push edildi.
- 2026-07-11 — Şef: 3.B2 done (Inventory tip+model+API, birim-bazlı IDOR). Inventory:
  {name,category,quantity,unit,location?,subteam?,status,notes?}; InventoryStatus:
  available|in-use|maintenance|depleted. 3.F2 açıldı (panel Envanter). Push edildi.
- 2026-07-11 — Şef: 3.F2 done (panel Envanter, InventoryManager/Form). 3.B3 açıldı
  (Budget/Expense model+tip+API). Push edildi.
- 2026-07-11 — Şef: 3.B3 done (Expense tip+model+/api/panel/budget, onay ayrımı:
  status=admin, lead kendi pending'i, member 403). ExpenseStatus: pending|approved|
  reimbursed|rejected. 3.F3 açıldı (panel Bütçe). Push edildi.
- 2026-07-11 — Şef: 3.F3 done (panel Bütçe, BudgetManager/ExpenseForm, finansal erişim
  geçidi, onay admin-only UI). R2 kolu başladı; 3.B4 açıldı (R2 presigned URL API). Push edildi.
- 2026-07-11 — Şef: 3.B4 done (R2 presigned upload API, paylaşılan sabitler @/lib/utils/r2:
  UPLOAD_MAX_BYTES + UPLOAD_ALLOWED_CONTENT_TYPES, TODO(3.S1) kancaları, aws-sdk).
  Faz 3 zod batch'i eklendi (3.Q0 şema + 3.B6 bağlama). 3.S1 açıldı (upload güvenlik sertleştirme). Push edildi.
- 2026-07-11 — Şef: 3.S1 done (upload validasyonu @/lib/validation: uploadRequestSchema +
  sanitizeUploadFileName + buildUploadKey + maxBytesForContentType; 164 test yeşil).
  Backend 3.B6 bunları bağlayacak. 3.F4 açıldı (panel upload UI). Push edildi.
- 2026-07-11 — Şef: 3.F4 done (FileUpload presigned→PUT akışı, "yakında" kalktı,
  build+test OK). **R2 kolu tamam.** 3.B5 açıldı (CMS — panel sponsors CRUD). Push edildi.
- 2026-07-11 — Şef: 3.B5 done (panel sponsors CRUD, admin-only, active yayın toggle,
  on-demand revalidatePath ile public anında yansıma). 3.F5 açıldı (panel Sponsor yönetimi). Push edildi.
- 2026-07-11 — Şef: 3.F5 done (panel Sponsor yönetimi, FileUpload logo, nav admin-only,
  CMS active toggle). **TÜM FAZ 3 ÖZELLİK SAYFALARI TAMAM.** Kapanış: 3.Q0 açıldı
  (panel zod: inventory/expense/application-status/sponsor). Push edildi.
- 2026-07-11 — Şef: 3.Q0 done (7 Faz 3 panel şeması @/lib/validation, 184 test yeşil).
  3.B6 açıldı (Backend — Faz 3 zod + upload validasyonu route'lara bağla). Push edildi.
- 2026-07-11 — Şef: 3.B6 done (Faz 3 panel route'ları + uploads route zod/validasyona
  bağlandı, TODO temiz, RBAC/response korundu). Son Faz 3 görevi 3.Q1 açıldı
  (Faz 3 RBAC + upload testleri). Push edildi.
- 2026-07-11 — Şef: 3.Q1 done (Faz 3 RBAC entegrasyon testleri: applications/inventory/
  budget/sponsors/uploads + public-sponsors-leak). Temiz CI koşusu: 224 unit/entegrasyon
  + 34 E2E yeşil, build temiz. (Not: ara doğrulamada eşzamanlı e2e port çakışmasından
  gelen sahte "33 failed" temiz izole koşuyla çürütüldü — regresyon yok.)
  **🎉 FAZ 3 (GELİŞMİŞ PANEL + CMS) TAMAMLANDI.** Karar bekliyor: (A) Vercel deploy
  mi, (B) Faz 4 (sertleştirme) mi. Push edildi.
- 2026-07-11 — Kullanıcı kararı: **Vercel deploy.** Şef: Faz D eklendi. Kod büyük
  ölçüde hazır (trustHost:true, R2_PUBLIC_BASE_URL var, vercel.json gereksiz).
  D1 açıldı (Güvenlik & QA — deploy hazırlık + DEPLOY.md). Push edildi.
- 2026-07-12 — Şef: D1 done (docs/DEPLOY.md 135 satır, .env.example [ZORUNLU]/[ops]
  işaretli + NEXT_PUBLIC_SITE_URL eklendi, CSP R2/harici görsele hizalandı, prod build
  temiz). Sıra KULLANICIDA: D0 (provisioning + Vercel deploy) — DEPLOY.md'yi takip et.
  Deploy sonrası D2 (smoke) açılacak. Push edildi.
