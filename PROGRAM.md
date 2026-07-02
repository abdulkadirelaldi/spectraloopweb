# PROGRAM.md — Spectraloop Web Sitesi & Yönetim Paneli
### Multi-Agent Claude Code Çalışma Sözleşmesi (v2)

> Yapı kararı: **4 sekme** — Orkestra Şefi + Frontend + Backend + Güvenlik & QA (birleşik).

---

## 0. Bu Dosya Nedir? (Önce Bunu Oku)

Bu dosya, projede çalışan **tüm Claude Code sekmelerinin ortak sözleşmesidir.**

Kritik gerçekler:
- Claude Code sekmeleri **birbirinin hafızasını GÖRMEZ.** Her sekme ayrı bir context.
- Sekmelerin tek ortak hafızası **bu repo'dur** (dosya sistemi + git).
- Bu yüzden **her agent, her oturumun başında `PROGRAM.md` ve `TASKS.md` dosyalarını okur.**
- **Kaynak-ı hakikat:** `PROGRAM.md` = değişmez sözleşme (roller, kurallar, mimari). `TASKS.md` = canlı ilerleme tablosu (şef günceller).
- **Şef doğrudan komut veremez.** Şef "şu sekmeye şunu yapıştır" diye kopyalanabilir prompt üretir; kullanıcı (Yusuf) bu promptu ilgili sekmeye taşır, sonucu şefe geri getirir. **Kullanıcı = mesaj taşıyıcısı.**

---

## 1. Proje Özeti

**Ne yapıyoruz:** Spectraloop hyperloop takımı için iki katmanlı bir web uygulaması.
- **(a) Halka açık site:** sponsor çekmek, yeni üye almak, krediblite (ödüller, araç, basın).
- **(b) Rol tabanlı yönetim paneli:** takım operasyonunu (görev, doküman, duyuru, takvim, üye) tek yerde yönetmek. Panel aynı zamanda public sitenin CMS'i gibi çalışır (panelden "yayınla" → public'te görünür).

**Öncelik:** Önce public site yayına alınır (hızlı ROI: sponsor + başvuru). Panel ikinci fazda gelir.

---

## 2. Teknoloji Stack

> `[KARAR]` etiketli satırlar kullanıcı onayı bekliyor; onaylanınca "KİLİTLİ" olur.

- **Framework:** Next.js (App Router) — public tarafta SSG/SSR (SEO için şart), panel tarafında korumalı client render.
- **Dil:** TypeScript
- **Stil:** Tailwind CSS
- **Auth:** Auth.js (NextAuth) — Credentials provider + rol tabanlı erişim `[KARAR: Clerk/Supabase Auth alternatif]`
- **Veritabanı:** MongoDB Atlas + Mongoose `[KARAR: Postgres/Supabase alternatif]`
- **Dosya depolama:** Cloudflare R2 (veya AWS S3) — CAD, doküman, görsel
- **E-posta:** Resend (iletişim + başvuru bildirimleri)
- **Test:** Vitest (unit/integration) + Playwright (E2E)
- **Deploy:** Vercel
- **Lint/Format:** ESLint + Prettier

---

## 3. Repo / Klasör Yapısı

```
spectraloop/
├── PROGRAM.md              # bu dosya (sözleşme)
├── TASKS.md                # canlı görev tablosu (ŞEF günceller)
├── README.md
├── .env.example            # GÜVENLİK & QA sahibi
├── .env.local              # gitignored, kişisel
├── next.config.js          # ortak (şef üzerinden)
├── tailwind.config.ts
├── tsconfig.json
├── package.json            # ortak (aşağıdaki kurala bak)
├── middleware.ts           # GÜVENLİK & QA (route koruma)
├── public/                 # FRONTEND (görseller, logolar, render'lar)
├── src/
│   ├── app/
│   │   ├── (public)/        # FRONTEND — halka açık sayfalar
│   │   │   ├── page.tsx             # Ana Sayfa
│   │   │   ├── hakkimizda/
│   │   │   ├── arac/
│   │   │   ├── basarilar/
│   │   │   ├── ekipler/
│   │   │   ├── sponsorluk/
│   │   │   ├── haberler/
│   │   │   ├── iletisim/
│   │   │   └── katil/
│   │   ├── (panel)/         # FRONTEND — panel UI (korumalı)
│   │   │   └── panel/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx         # dashboard
│   │   │       ├── gorevler/
│   │   │       ├── dokumanlar/
│   │   │       ├── uyeler/
│   │   │       ├── duyurular/
│   │   │       └── takvim/
│   │   ├── api/             # BACKEND — route handlers
│   │   │   ├── auth/[...nextauth]/  # GÜVENLİK & QA
│   │   │   ├── tasks/
│   │   │   ├── documents/
│   │   │   ├── members/
│   │   │   ├── announcements/
│   │   │   ├── sponsors/
│   │   │   └── applications/
│   │   ├── layout.tsx       # root layout (ortak, şef üzerinden)
│   │   └── globals.css      # FRONTEND
│   ├── components/          # FRONTEND
│   │   ├── ui/
│   │   ├── public/
│   │   └── panel/
│   ├── lib/
│   │   ├── db/              # BACKEND (Mongoose bağlantısı)
│   │   ├── auth/            # GÜVENLİK & QA (Auth.js, RBAC helper)
│   │   ├── validation/     # GÜVENLİK & QA (zod şemaları)
│   │   └── utils/           # BACKEND (paylaşılan, koordine)
│   ├── models/             # BACKEND (Mongoose modelleri)
│   └── types/              # ortak (koordine)
└── tests/                  # GÜVENLİK & QA
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## 4. Agent Rolleri ve Sınırları

### Agent 1 — Orkestra Şefi (Sekme 1)
- **Kod YAZMAZ.** Görevi: planlamak, `TASKS.md`'yi güncel tutmak, her iş için ilgili worker'a **kopyalanabilir görev promptu** üretmek.
- İşleri fazlara/görevlere böler, bağımlılık sırasını belirler.
- Worker'lardan gelen sonuçları/soruları değerlendirir, çakışmaları çözer.
- Çıktısı = plan + prompt. Uygulama kodu yazmaz (gerekirse en fazla küçük iskelet önerir).

### Agent 2 — Frontend (Sekme 2)
- **Sahibi:** `src/app/(public)/**`, `src/app/(panel)/**` (sadece UI), `src/components/**`, `src/app/globals.css`, `public/**`.
- Next.js sayfaları, React bileşenleri, Tailwind, responsive tasarım, erişilebilirlik.
- Backend'in tanımladığı API sözleşmelerini tüketir.
- **DOKUNMAZ:** API route'ları, DB modelleri, auth mantığı.

### Agent 3 — Backend (Sekme 3)
- **Sahibi:** `src/app/api/**` (auth hariç), `src/lib/db/**`, `src/models/**`, `src/lib/utils/**`.
- API sözleşmelerini (endpoint, request/response şekli) **tanımlar ve dokümante eder** ki frontend tüketebilsin.
- İş mantığı, entegrasyonlar (Resend, R2/S3).
- **DOKUNMAZ:** bileşenler, stil, sayfa dosyaları.

### Agent 4 — Güvenlik & QA (Sekme 4)
- **Sahibi:** `middleware.ts`, `src/lib/auth/**`, `src/lib/validation/**`, `src/app/api/auth/**`, `.env.example`, `next.config.js` içindeki security header'lar, **VE** `tests/**` + test/CI config.
- **İki işi var:**
  - **(1) Güvenlik:** Auth.js kurulumu, RBAC (3 rol), route koruma, input validasyonu (zod), rate limit, güvenli dosya yükleme, secret/env yönetimi.
  - **(2) QA:** Vitest (unit/integration) + Playwright (E2E). Öncelik: **auth akışları ve RBAC testleri** (yetkisiz erişim reddediliyor mu?).
- **Çalışma kuralı (sıra önemli):** Önce ilgili güvenlik parçasını kur/sertleştir → **hemen ardından** o akışın testini yaz. Böylece güvenlik ve test tek elde, tutarlı ilerler.
- **Çapraz kesen rol:** Her yeri OKUR; backend/frontend kodunu güvenlik açığı için gözden geçirir (auth bypass, injection, XSS, CSRF, panelde IDOR). Başka bir agent'ın dosyasında değişiklik gerekiyorsa kendi ezmez, **şef üzerinden koordine eder.**

> **Not (ileride):** Paralelliği artırmak istersen QA'yı ayrı bir 5. sekmeye bölebilirsin; o durumda `tests/**` + test config sahipliğini ona devredersin, bu agent saf "Güvenlik" olur.

---

## 5. Dosya Sahipliği Matrisi (Çakışma Önleme)

| Dizin / Dosya | Yazan | Okuyan |
|---|---|---|
| `src/app/(public)/**`, `src/app/(panel)/**`, `src/components/**`, `public/**`, `globals.css` | Frontend | Herkes |
| `src/app/api/**` (auth hariç), `src/lib/db/**`, `src/models/**`, `src/lib/utils/**` | Backend | Herkes |
| `middleware.ts`, `src/lib/auth/**`, `src/lib/validation/**`, `api/auth/**`, `.env.example`, `tests/**`, test/CI config | Güvenlik & QA | Herkes |
| `src/types/**`, `package.json`, `next.config.js`, `tsconfig.json`, root `layout.tsx` | **Ortak — şef üzerinden** | Herkes |

**Altın kural:** Aynı dosyayı iki agent AYNI ANDA yazmaz. Ortak dosyada (özellikle `package.json`, `src/types`) değişiklik gerekiyorsa şefe bildir; şef sırayı yönetir. `package.json`'a bağımlılık ekleyen agent **hemen commit eder ve şefe haber verir.**

---

## 6. Koordinasyon Protokolü

**Akış:** Şef görevi planlar → görev promptunu üretir → **Yusuf** promptu ilgili sekmeye yapıştırır → worker işi yapar + commit atar + rapor verir → **Yusuf** raporu şefe taşır → şef `TASKS.md`'yi günceller, sıradaki görevi verir.

**Şef → Worker görev promptu şablonu:**
```
### GÖREV [id] — [başlık]
Agent: [Frontend / Backend / Güvenlik & QA]
Bağlam: PROGRAM.md ve TASKS.md'yi oku.
Amaç: [tek cümle]
Yapılacaklar:
- ...
Dokunabileceğin dosyalar: [dizinler]
DOKUNMA: [dizinler]
Bağımlılıklar: [önce bitmesi gereken görev id'leri / "yok"]
Kabul kriterleri:
- ...
Bitince: `[commit tipi]` ile commit at, sonra 3 maddelik rapor ver
(ne yaptın / nerede / şefin bilmesi gereken bir şey var mı).
```

**Worker → Şef rapor şablonu:**
```
GÖREV [id] TAMAM
- Ne yaptım: ...
- Değişen/yeni dosyalar: ...
- Not/uyarı/bağımlılık: ... (yoksa "yok")
```

**Git stratejisi:** Dizin sahipliği ayrı olduğu için agent'lar `main` (veya `dev`) üzerinde çalışıp **her görev sonunda commit** atabilir; çakışma nadir olur. İşler karmaşıklaşırsa görev başına feature branch'e geçilir. `main` her zaman deploy edilebilir kalır.

**Commit mesajları (Conventional Commits):** `feat(frontend): ...`, `feat(backend): ...`, `chore(security): ...`, `test: ...`, `fix: ...`
(Güvenlik & QA agent'ı: güvenlik işi için `chore(security):`, test işi için `test:` kullanır.)

**`TASKS.md` başlangıç şablonu (şef oluşturur):**
```
# TASKS.md — Canlı İlerleme
## Aktif Faz: Faz 0
| id | görev | agent | durum | bağımlılık |
|----|-------|-------|-------|------------|
| 0.1 | repo scaffold | - | todo | - |
```

---

## 7. Ortak Kurallar / Konvansiyonlar

- **Dil:** Kod, değişken, yorum = İngilizce. Kullanıcıya dönük UI metni = Türkçe.
- **Env:** Tüm secret'lar `.env.local`'da (gitignored). Yeni env değişkeni eklendiğinde `.env.example`'a **placeholder** eklenir (gerçek değer ASLA commit edilmez).
- **API sözleşmesi:** Backend her endpoint'i kısa bir yorum/README ile dokümante eder (method, path, body, response). Frontend buna göre tüketir.
- **Tip paylaşımı:** Ortak tipler `src/types`'ta. Değişiklik şef üzerinden.
- Her agent, işe başlamadan `PROGRAM.md` + `TASKS.md` okuduğunu 1 satırla teyit eder.

---

## 8. Veri Modelleri (İlk Taslak)

```
User          { name, email, passwordHash|oauth, role, subteam, photoUrl, active, createdAt }
Subteam       { name, description, leadUserId }        // Mekanik / Elektronik-Elektrik / Yazılım ...
Task          { title, description, subteam, assigneeId, status, dueDate, createdBy, createdAt }
Document      { title, fileUrl, category, subteam, uploadedBy, createdAt }
Announcement  { title, body, audience, authorId, publishedToPublic, createdAt }
Event         { title, date, type, description }
Sponsor       { name, logoUrl, tier, website, active }  // tier: gold|silver|bronze
Application   { name, email, subteamPref, message, status, createdAt }  // "Bize Katıl" formu
```

**RBAC matrisi (3 rol):**
| Rol | Yetki |
|-----|-------|
| **admin** (kaptan/kurucu) | Her şeye tam CRUD; üye ekle/çıkar, rol ata |
| **lead** (birim lideri) | Kendi biriminin görev/doküman/üyelerine CRUD; herkesi okur; duyuru yayınlar |
| **member** | Duyuru/etkinlik/doküman okur; kendi görevini günceller; üye dizinini görür |

---

## 9. Sayfa & Özellik Kapsamı

**Public sayfalar:** Ana Sayfa (hero + istatistikler + sponsor şeridi + CTA) · Hakkımızda/Takım · Araç/Teknoloji · Başarılar (2022→2026 zaman çizelgesi) · Alt Ekipler · Sponsorluk (kademeler + indirilebilir PDF + form) · Haberler/Medya · İletişim · Bize Katıl (başvuru formu → panele düşer).

**Panel (MVP):** Duyurular · Görev yönetimi (birim bazlı Kanban/liste) · Doküman arşivi · Etkinlik/deadline takvimi · Üye dizini.
**Panel (sonra):** Envanter/malzeme takibi · Bütçe/harcama takibi · Başvuru yönetimi · CMS bağı (panel → public yayın).

---

## 10. Faz Planı

- **Faz 0 — Kurulum:** Next.js scaffold, klasör yapısı, Tailwind, ESLint/Prettier, DB bağlantısı, git init, `.env.example`. (Backend: DB; Frontend: layout/scaffold; Güvenlik & QA: env/headers + test altyapısı.)
- **Faz 1 — Public Site:** Tüm public sayfalar. (Frontend ağırlıklı; Backend: sponsor/duyuru/başvuru API'leri; Güvenlik & QA: form koruma + header + smoke testler.)
- **Faz 2 — Auth + Panel Çekirdek:** Auth.js + RBAC + testleri (Güvenlik & QA lider) → panel API'leri (Backend) → panel UI (Frontend). Not: auth ve testi aynı agent'ta olduğu için sıra: auth kur → auth testini yaz → sonra panel.
- **Faz 3 — Gelişmiş Panel + CMS bağı:** Envanter, bütçe, başvuru yönetimi; panelden public yayın.
- **Faz 4 — Sertleştirme:** Tam test kapsamı, güvenlik denetimi, performans, deploy.

---

## 11. Definition of Done / Kalite Kapıları

Bir görev, ilgili maddeler sağlanmadan "tamam" sayılmaz:
- **Güvenlik:** Panel route'ları korumalı mı? Rol kontrolü hem UI'da hem API'de var mı (sadece UI'da gizlemek yetmez)? Girdi validasyonu (zod) var mı? Secret sızıntısı yok mu? Dosya yükleme tip/boyut kontrolü var mı?
- **Test:** Auth ve RBAC için test var mı? Kritik akışlar (giriş, yetkisiz erişim reddi) geçiyor mu?
- **Genel:** Lint temiz mi? Build alıyor mu? API sözleşmesi dokümante mi?

---

## 12. Başlangıç Promptları (Kopyala-Yapıştır)

> 4 sekme. Her sekmeye ilgili promptu bir kere yapıştır. Sonrasında şef görev promptları üretir.

**Sekme 1 — Orkestra Şefi:**
```
Sen bu projenin orkestra şefisin. Önce repo kökündeki PROGRAM.md'yi eksiksiz oku.
Kural: sen KOD YAZMAZSIN. Görevin (1) işi fazlara/görevlere bölmek, (2) TASKS.md'yi
oluşturup güncel tutmak, (3) her iş için ilgili worker agent'a yapıştırılacak,
PROGRAM.md'deki şablona uygun bir görev promptu üretmek.
Worker'lar: Frontend (Sekme 2), Backend (Sekme 3), Güvenlik & QA (Sekme 4).
Sekmeler birbirini görmüyor; ben (kullanıcı) senin ürettiğin promptları ilgili
sekmelere taşıyacağım ve worker raporlarını sana geri getireceğim.
İlk iş: PROGRAM.md'ye göre Faz 0 + Faz 1 için görev listesi ve bağımlılık sırası çıkar,
TASKS.md'yi oluştur, sonra ilk görevin (0.1) promptunu bana ver.
```

**Sekme 2 — Frontend:**
```
Sen bu projenin FRONTEND agent'ısın. Önce PROGRAM.md ve TASKS.md'yi oku.
Sadece şu dizinlere yaz: src/app/(public), src/app/(panel) [sadece UI], src/components,
public, globals.css. Şunlara DOKUNMA: API route'ları, DB modelleri, auth.
Şef sana görev verecek. Her görev sonunda commit at (feat(frontend): ...) ve 3 maddelik
rapor ver. Başlamadan önce anladığını 1 satırla teyit et ve ilk görevini bekle.
```

**Sekme 3 — Backend:**
```
Sen bu projenin BACKEND agent'ısın. Önce PROGRAM.md ve TASKS.md'yi oku.
Sadece şu dizinlere yaz: src/app/api (auth hariç), src/lib/db, src/models, src/lib/utils.
API sözleşmelerini tanımla ve kısa dokümante et ki frontend tüketebilsin.
Bileşen/stil/sayfa dosyalarına DOKUNMA. package.json'a dep eklersen hemen commit at
ve şefe haber ver. Her görev sonunda commit (feat(backend): ...) + 3 maddelik rapor.
Başlamadan anladığını 1 satırla teyit et ve ilk görevini bekle.
```

**Sekme 4 — Güvenlik & QA:**
```
Sen bu projenin GÜVENLİK & QA agent'ısın. Önce PROGRAM.md ve TASKS.md'yi oku.
Sahiplik: middleware.ts, src/lib/auth, src/lib/validation, api/auth, .env.example,
next.config.js güvenlik header'ları VE tests/ + test/CI config.
İki işin var: (1) GÜVENLİK — Auth.js + RBAC (admin/lead/member), route koruma, zod
validasyonu, güvenli dosya yükleme, secret/env yönetimi. (2) QA — Vitest (unit/integration)
+ Playwright (E2E), öncelik auth akışları ve RBAC testleri (yetkisiz erişim reddediliyor mu?).
Kural: önce ilgili güvenlik parçasını kur/sertleştir, HEMEN ardından o akışın testini yaz.
Başka agent'ın dosyasında değişiklik gerekiyorsa kendin ezme — şefe bildir. Her yeri
okuyabilirsin; kod incelemesinde bulduğun açıkları rapor et.
Commit: güvenlik işi chore(security): ..., test işi test: ... Her görev sonunda 3 maddelik rapor.
Başlamadan anladığını 1 satırla teyit et ve ilk görevini bekle.
```

---

## 13. Karar Noktaları

1. ✅ **Sekme sayısı:** 4 sekme — Şef + Frontend + Backend + Güvenlik & QA. **(KARARLAŞTI)**
2. **Auth:** Auth.js (önerilen — PROGRAM.md'de varsayılan) mı, Clerk mı, Supabase Auth mı?
3. **DB:** MongoDB (bildiğin — varsayılan) mı, Postgres/Supabase mı?
4. **Kapsam sırası:** "Önce public site, sonra panel" onayı — yoksa panel de Faz 1'e mi girsin?
5. **Eklemek istediğin rol/özellik** (mesajın "bi de" diye yarım kalmıştı) var mı?

> 2–5 arası netleşince (ya da "varsayılanlar tamam" dersen) şefi başlatırız.
