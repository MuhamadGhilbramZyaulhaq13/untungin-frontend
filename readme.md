# 🟢 Untungin — Frontend

> Platform aplikasi bisnis & kasir untuk UMKM Indonesia

[![Netlify Status](https://api.netlify.com/api/v1/badges/9f1ce6aa-5fb9-4e12-a7c7-6f5f056822d7/deploy-status)](https://untunginid.netlify.app)
[![Live](https://img.shields.io/badge/Live-untunginid.netlify.app-brightgreen)](https://untunginid.netlify.app)

---

## 🌐 Live URL

```
https://untunginid.netlify.app
```

---

## 📁 Struktur File

```
untungin-frontend/
├── index.html              # Redirect ke untungin.html (halaman utama)
├── untungin.html           # Halaman katalog produk & keranjang belanja
├── auth.html               # Halaman login & registrasi
├── dashboard.html          # Dashboard profil pengguna
├── admin.html              # Panel admin (kelola produk, user, transaksi)
├── orders.html             # Riwayat transaksi pengguna
└── payment-integration.js  # Helper integrasi Midtrans (opsional)
```

---

## 🏗️ Infrastruktur

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│                                                     │
│   GitHub Repo: untungin-frontend                    │
│         ↓  (auto-deploy on push)                    │
│   Netlify Hosting                                   │
│   URL: untunginid.netlify.app                       │
└─────────────────────────────────────────────────────┘
         ↕ fetch() API calls
┌─────────────────────────────────────────────────────┐
│                   BACKEND                           │
│                                                     │
│   GitHub Repo: untungin-backend                     │
│         ↓  (auto-deploy on push)                    │
│   Vercel Serverless Functions                       │
│   URL: untungin-backend.vercel.app                  │
└─────────────────────────────────────────────────────┘
         ↕ Mongoose ODM
┌─────────────────────────────────────────────────────┐
│                   DATABASE                          │
│                                                     │
│   MongoDB Atlas (Cloud)                             │
│   Region: Singapore (ap-southeast-1)                │
│   Collections: users, products, orders              │
└─────────────────────────────────────────────────────┘
```

---

## ⚙️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Hosting | Netlify (Free tier) |
| Language | HTML5, CSS3, Vanilla JavaScript |
| Auth | JWT Token (disimpan di localStorage) |
| Payment | Midtrans QRIS (Sandbox & Production) |
| Icons | Simple Icons CDN |

---

## 📄 Halaman & Fitur

| File | URL | Fitur |
|------|-----|-------|
| `untungin.html` | `/untungin.html` | Katalog produk, keranjang, checkout QRIS |
| `auth.html` | `/auth.html` | Login, registrasi 3 langkah, OTP |
| `dashboard.html` | `/dashboard.html` | Profil user, edit data, ganti password |
| `admin.html` | `/admin.html` | Kelola produk, user, transaksi, laporan |
| `orders.html` | `/orders.html` | Riwayat transaksi, license key, download |

---

## 🔗 Repo Terkait

- **Backend:** [github.com/MuhamadGhilbramZyaulhaq13/untungin-backend](https://github.com/MuhamadGhilbramZyaulhaq13/untungin-backend)

---

## 🚀 Cara Deploy

Repo ini sudah terhubung ke **Netlify** via GitHub.  
Setiap push ke branch `main` akan otomatis trigger deployment baru.

```bash
# Update & deploy
git add .
git commit -m "deskripsi perubahan"
git push
# Netlify otomatis redeploy dalam ~30 detik
```

---

## 🔑 Environment / Konfigurasi

Semua konfigurasi ada di dalam file HTML masing-masing:

```javascript
// Ganti dengan URL backend kamu
const API_BASE = 'https://untungin-backend.vercel.app';
```

---

*Dibuat dengan ❤️ untuk UMKM Indonesia*