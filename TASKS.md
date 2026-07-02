# TASKS.md — Canlı İlerleme

> Kaynak-ı hakikat plan: PROGRAM.md (değişmez). Bu dosya = canlı ilerleme (ŞEF günceller).
> Durum değerleri: `todo` · `in-progress` · `blocked` · `review` · `done`
> Kural: aynı anda tek worker meşgul. Bir görev `done` olup commit'lenince şef sıradakini açar.

## Aktif Faz: Faz 0 — Kurulum

Sıralama notu: **0.1 (scaffold) tüm kök dosyaları üretir ve git'i başlatır.** 0.1 commit'lenmeden
0.2 / 0.3 / 0.4 BAŞLAYAMAZ (hepsi scaffold'a bağımlı). 0.1 sonrası diğerleri ayrı dizinlerde
oldukları için sırayla ilerler.

| id | görev | agent | durum | bağımlılık |
|----|-------|-------|-------|------------|
| 0.1 | Repo scaffold: create-next-app (TS+Tailwind+ESLint+App+src-dir), klasör iskeleti, Prettier, `.gitignore`, `git init` + ilk commit | Frontend | todo | - |
| 0.2 | MongoDB/Mongoose bağlantı yardımcısı (`src/lib/db`) + models klasör iskeleti + bağlantı dokümantasyonu | Backend | todo | 0.1 |
| 0.3 | Güvenlik temeli: `next.config.js` security header'ları + `.env.example` (placeholder'lar) + test altyapısı (Vitest + Playwright config) + 1 smoke test | Güvenlik & QA | todo | 0.1 |
| 0.4 | Ortak tipler iskeleti `src/types` (PROGRAM.md §8 veri modelleri) — şef koordineli, Backend uygular | Backend | todo | 0.2 |

## Faz 1 — Public Site (planlandı, henüz açılmadı)

> Frontend ağırlıklı. Backend public API sözleşmelerini önce tanımlar ki Frontend tüketsin.
> Güvenlik & QA form koruma + header + smoke/E2E ile kapatır. Tek-worker sırası için
> Backend sözleşmeleri (1.B*) ilgili Frontend sayfasından ÖNCE gelir.

| id | görev | agent | durum | bağımlılık |
|----|-------|-------|-------|------------|
| 1.B1 | Application (Bize Katıl) API sözleşmesi + endpoint + Resend bildirimi + kısa doküman | Backend | todo | 0.4 |
| 1.B2 | Contact (İletişim) API sözleşmesi + endpoint + Resend + doküman | Backend | todo | 0.4 |
| 1.B3 | Sponsors read API + seed veri + sözleşme dokümanı | Backend | todo | 0.4 |
| 1.B4 | Announcements/News read API + sözleşme dokümanı | Backend | todo | 0.4 |
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
### Değişiklik günlüğü
- 2026-07-02 — Şef: TASKS.md oluşturuldu. Faz 0 + Faz 1 planlandı. 0.1 açıldı (todo).
