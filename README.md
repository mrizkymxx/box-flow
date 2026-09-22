# 📦 Box-Flow

Sistem manajemen produksi karton untuk operasi pabrik — dari sales order hingga planning, material, dan production tracking.

## ✨ Fitur

- 🧾 **Sales Order** — input order pelanggan dengan prioritas & status (`new → waiting_material → planned → running → completed`, dsb)
- 📅 **Planning** — penjadwalan produksi per shift (3 shift) dengan status rencana
- 📥 **Material** — pelacakan kesiapan bahan (`ready / partial / shortage / waiting_supplier`)
- 🏭 **Production** — monitor progres produksi per sales order
- 📊 **Reports** — laporan ringkasan operasi
- 👥 **Multi-role akses** — `super_user`, `production_user`, `viewer`

## 🛠️ Tech Stack

- **Frontend:** React + TypeScript, TanStack Router, Tailwind CSS (shadcn/ui)
- **Backend/DB:** Supabase (PostgreSQL) dengan migrasi terstruktur & enum bertipe
- **Auth:** Supabase Auth + role-based access

## 🗂️ Struktur Route

```
sales-orders, material, planning, production, reports, master, users, settings
```