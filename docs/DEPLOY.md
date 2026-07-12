# DEPLOY.md — Spectraloop Vercel Deploy Rehberi

Bu rehber, Spectraloop web uygulamasını **Vercel**'e production olarak almanın
adım adım yoludur. Sıra: **ön koşullar → env → deploy → admin seed → smoke →
sorun giderme.**

> Stack: Next.js 16 (App Router) · MongoDB Atlas (Mongoose) · Auth.js v5
> (Credentials) · Cloudflare R2 (dosya) · Resend (mail) · Vercel. `vercel.json`
> **gerekmez** — Next.js otomatik algılanır.

---

## 1. Ön koşullar

| Servis              | Ne gerekir                                                           | Not                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **MongoDB Atlas**   | Bir cluster + database user + connection string                      | Network Access → IP Allowlist'e **`0.0.0.0/0`** ekle (Vercel'in IP'si sabit değil).                                                   |
| **Cloudflare R2**   | Bir bucket + API token (Access Key/Secret) + **public base URL**     | Bucket'ı public yap (R2 → Settings → Public access / `r2.dev` veya özel domain). Public base olmadan yüklenen dosya linkleri açılmaz. |
| **Resend** _(ops.)_ | API key + doğrulanmış gönderen domaini                               | Mail opsiyonel — key yoksa form yine 201 döner, mail atlanır.                                                                         |
| **Vercel**          | Hesap + bu repo'ya erişim (GitHub/GitLab)                            | Ücretsiz Hobby planı yeterli başlangıç için.                                                                                          |
| **Yerel**           | `AUTH_SECRET` üret: `openssl rand -base64 32` veya `npx auth secret` | Seed için de yerelde bir `.env.local` gerekir (bkz. §4).                                                                              |

---

## 2. Ortam değişkenleri (env)

Tüm anahtarlar `.env.example`'da placeholder olarak var. Aşağıda Vercel
production için **zorunluluk** ve **nereden alınır** özeti:

| Anahtar                                    | Zorunlu?    | Nereden / Örnek                                                                                                                         |
| ------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                              | **ZORUNLU** | Atlas → Connect → Drivers. `mongodb+srv://user:pass@cluster.xxxx.mongodb.net/spectraloop?retryWrites=true&w=majority`                   |
| `AUTH_SECRET`                              | **ZORUNLU** | `openssl rand -base64 32`. Prod'da yoksa Auth.js hata verir (MissingSecret).                                                            |
| `NEXTAUTH_URL` _(veya `AUTH_URL`)_         | önerilir    | Kanonik site URL'i, ör. `https://spectraloop.vercel.app`. Vercel'de `trustHost:true` + `VERCEL_URL` ile otomatik; özel domainde ayarla. |
| `R2_ACCOUNT_ID`                            | upload için | Cloudflare → R2 → hesap ID (dashboard sağ üst / R2 API).                                                                                |
| `R2_ACCESS_KEY_ID`                         | upload için | R2 → Manage API Tokens → Access Key ID.                                                                                                 |
| `R2_SECRET_ACCESS_KEY`                     | upload için | Aynı token'ın Secret'ı (bir kez gösterilir).                                                                                            |
| `R2_BUCKET`                                | upload için | Bucket adı, ör. `spectraloop-docs`.                                                                                                     |
| `R2_PUBLIC_BASE_URL`                       | upload için | Public base, ör. `https://pub-xxxx.r2.dev` veya `https://cdn.spectraloop.com`. **Sonda `/` olmadan.**                                   |
| `RESEND_API_KEY`                           | ops.        | Resend → API Keys → `re_...`.                                                                                                           |
| `MAIL_FROM`                                | ops.        | Doğrulanmış gönderen, ör. `Spectraloop <bildirim@spectraloop.com>`.                                                                     |
| `TEAM_NOTIFY_EMAIL`                        | ops.        | Başvuru/iletişim bildirimlerinin gideceği kutu.                                                                                         |
| `NEXT_PUBLIC_SITE_URL`                     | ops.        | Kanonik public URL (özel domainde öner.). Boşsa `VERCEL_URL`.                                                                           |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | seed anında | Sadece ilk admini oluştururken (bkz. §4). Kalıcı prod env'ine koymak **şart değil**.                                                    |

> **Notlar:** R2 anahtarları yoksa site çalışır ama **dosya/logo yükleme** (panel
> doküman & sponsor logo upload) `500` döner. Mail anahtarları yoksa formlar yine
> başarılı olur, sadece bildirim maili gitmez.

---

## 3. Vercel'e deploy

1. **Repo'yu bağla:** Vercel → _Add New Project_ → repo'yu seç. Framework
   otomatik **Next.js** algılanır. Build command `next build`, output otomatik —
   dokunma.
2. **Env gir:** _Settings → Environment Variables_ → §2'deki anahtarları
   **Production** (ve istersen Preview) için ekle. `AUTH_SECRET` ve `MONGODB_URI`
   olmadan deploy çalışmaz.
3. **Atlas IP:** Atlas → Network Access → `0.0.0.0/0` ekli olduğundan emin ol
   (yoksa DB bağlantısı zaman aşımına uğrar).
4. **Deploy:** _Deploy_'a bas. İlk build ~1–3 dk. `main` branch'ine her push
   otomatik yeniden deploy eder.
5. **Domain (ops.):** Özel domain bağlarsan `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL`
   değerlerini o domaine güncelle ve yeniden deploy et.

---

## 4. İlk admin kullanıcısını oluştur (seed)

Panel'e girebilmek için bir admin gerekir. Seed script **yerelden**,
**production DB'ye** karşı çalıştırılır (Vercel'de cron gerekmez):

```bash
# Yerelde .env.local içine (SADECE seed süresince):
#   MONGODB_URI=<prod Atlas stringi>
#   SEED_ADMIN_EMAIL=admin@spectraloop.com
#   SEED_ADMIN_PASSWORD=<güçlü-geçici-parola>

npm run seed:admin
```

- Script admini bcrypt hash'iyle oluşturur; parola **asla düz metin saklanmaz**.
- Seed sonrası **parolayı panelden değiştir** ve `.env.local`'daki
  `SEED_ADMIN_PASSWORD`'ü sil.
- (Ops.) Örnek sponsor/duyuru verisi: `npm run seed:sponsors`,
  `npm run seed:announcements`.

---

## 5. Deploy sonrası smoke checklist

Canlı URL üzerinde hızlıca doğrula:

- [ ] Ana sayfa `/` açılıyor (hero + sponsor şeridi).
- [ ] Public sayfalar 200: `/hakkimizda /arac /basarilar /ekipler /sponsorluk
/haberler /iletisim /katil`.
- [ ] İletişim (`/iletisim`) ve Bize Katıl (`/katil`) formu gönderiliyor
      (başarı ekranı görünüyor; mail ayarlıysa kutuya düşüyor).
- [ ] Güvenlik header'ları var: `curl -sI https://<site> | grep -i
"content-security-policy\|strict-transport\|x-frame"`.
- [ ] `/panel` girişsiz → `/giris`'e yönleniyor. Girişsiz `/api/panel/*` → `401`.
- [ ] `/giris`'ten seed admin ile giriş → panel açılıyor; rol'e göre menü.
- [ ] Panel'de doküman/sponsor **logo yükleme** çalışıyor (R2 ayarlıysa) ve
      yüklenen görsel public'te görünüyor (CSP `img-src`/`connect-src` doğrulaması).
- [ ] Sponsoru panelden **yayına al/kaldır** (`active`) → public `/` anında
      yansıyor; yayınlanmamış sponsor public'te **görünmüyor**.

---

## 6. Yaygın hatalar & çözümleri

| Belirti                                             | Sebep                                    | Çözüm                                                                                                                                                            |
| --------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel/DB isteği 500, "MongooseServerSelectionError" | Atlas IP allowlist                       | Atlas → Network Access → `0.0.0.0/0` ekle.                                                                                                                       |
| Giriş 500 / "MissingSecret"                         | `AUTH_SECRET` yok                        | Vercel env'e ekle, redeploy.                                                                                                                                     |
| Giriş sonrası callback yanlış domaine gidiyor       | Host/URL belirsizliği                    | `NEXTAUTH_URL` (veya `AUTH_URL`) kanonik URL'e ayarla.                                                                                                           |
| Yüklenen dosya/logo linki açılmıyor                 | `R2_PUBLIC_BASE_URL` yok/yanlış          | Doğru public base'i ayarla (sonda `/` yok); bucket public mi kontrol et.                                                                                         |
| Logo yüklerken tarayıcıda "blocked by CSP"          | Upload/CSP                               | Upload doğrudan `*.r2.cloudflarestorage.com`'a gider — CSP `connect-src` buna izin verir; farklı bir S3 endpoint kullanıyorsan `next.config.ts` CSP'yi güncelle. |
| Public'te sponsor logosu görünmüyor (görsel bloklu) | CSP `img-src`                            | `img-src` `https:`'e izin verir; logo `http://` ise https'e taşı.                                                                                                |
| Mail gitmiyor ama form 201                          | Mail best-effort                         | `RESEND_API_KEY` + `MAIL_FROM` + `TEAM_NOTIFY_EMAIL` ayarla; Resend'de domaini doğrula.                                                                          |
| Build "Failed to fetch fonts" (yerelde, ağsız)      | `next/font/google` build'de font indirir | Ağ gerektirir; Vercel'de sorun olmaz. Yerelde ağ varken `npm run build`.                                                                                         |

---

## Güvenlik hatırlatmaları

- Repo'da **gerçek secret yok**; `.env.local` gitignored, `.env.example` sadece
  placeholder. Secret'ları yalnız Vercel env'ine gir.
- Auth.js cookie'leri prod'da otomatik **secure + httpOnly + sameSite=lax**
  (`__Secure-` prefix). `trustHost:true` Vercel proxy'si için doğru.
- Güvenlik header'ları (CSP, HSTS, X-Frame-Options DENY, nosniff, Permissions-
  Policy) `next.config.ts`'te tüm route'lara uygulanır.
- Upload sertleştirme geriye kalanları (hard size cap için presigned POST,
  bucket public-exposure kararı) `3.S1` raporunda — deploy sonrası değerlendir.
