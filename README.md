# Bot Telegram Dashboard

Web app dashboard quản lý thống kê **giá vàng**, **giá xăng** và **bot Telegram** (gửi command + cron).
Stack: **Next.js 14 (App Router, JS)** · **Tailwind CSS** · **Prisma + Vercel Postgres** · **NextAuth v5** · **Recharts**.

> Triển khai trên **Vercel** chỉ với 1 project duy nhất (gộp FE + BE + Bot + Cron).

---

## Yêu cầu môi trường

- Node.js **>= 18.18**
- npm hoặc pnpm
- Tài khoản **Vercel** (free Hobby OK cho development)
- Tài khoản **Vercel Postgres** (hoặc Neon — Vercel đã migrate sang Neon)
- Bot Telegram tạo qua [@BotFather](https://t.me/BotFather)

---

## Cài đặt local

```bash
# 1. Cài deps
npm install

# 2. Tạo file env
cp .env.example .env.local
# → Điền các biến trong .env.local (xem mục Biến môi trường bên dưới)

# 3. Tạo Prisma client
npx prisma generate

# 4. Push schema lên DB + seed admin
npx prisma migrate dev --name init
npm run db:seed

# 5. Chạy dev
npm run dev
# Mở http://localhost:3000
# Login bằng tài khoản trong .env.local (ADMIN_EMAIL / ADMIN_PASSWORD)
```

---

## Biến môi trường (`.env.local`)

| Biến | Mô tả |
|---|---|
| `POSTGRES_PRISMA_URL` | DB pooled connection (Vercel auto inject) |
| `POSTGRES_URL_NON_POOLING` | DB direct connection (cho migration) |
| `AUTH_SECRET` | Sinh bằng `openssl rand -base64 32` |
| `AUTH_URL` | URL app (local: `http://localhost:3000`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Tài khoản admin tạo lần đầu qua seed |
| `TELEGRAM_BOT_TOKEN` | Token bot từ BotFather |
| `TELEGRAM_DEFAULT_CHAT_ID` | Chat ID mặc định để bot gửi tin |
| `TELEGRAM_WEBHOOK_SECRET` | Secret verify request từ Telegram |
| `GOLD_API_URL`, `FUEL_API_URL` | Endpoint API ngoài lấy dữ liệu |
| `CRON_SECRET` | Token bảo vệ `/api/cron/*` (Vercel auto inject `Authorization: Bearer <CRON_SECRET>`) |

---

## Cấu trúc thư mục

```text
src/
├── app/
│   ├── (auth)/login/              # Trang đăng nhập
│   ├── (dashboard)/               # Layout có Sidebar + Header (yêu cầu auth)
│   │   ├── page.jsx               # / (tổng quan)
│   │   ├── gold/                  # Thống kê vàng (Phase 2)
│   │   ├── fuel/                  # Thống kê giá xăng (Phase 3)
│   │   ├── telegram/{bots,logs}/  # Quản lý bot + log (Phase 4)
│   │   └── settings/
│   ├── api/
│   │   ├── auth/[...nextauth]/    # NextAuth endpoint
│   │   ├── health/                # Healthcheck
│   │   ├── gold/, fuel/           # CRUD + sync + send (Phase 2-3)
│   │   ├── telegram/{webhook,settings,logs,test-send}/  (Phase 4)
│   │   └── cron/{gold-sync,fuel-sync,daily-report}/    (Phase 5)
│   ├── layout.jsx                 # Root layout (theme + toast)
│   └── globals.css
├── components/
│   ├── ui/                        # Button, Card, Input, Modal, DataTable, Badge...
│   └── layout/                    # Sidebar, Header, ThemeToggle, DashboardShell, PageHeader
├── lib/                           # db, auth, auth.config, utils, apiError
├── server/                        # services + providers (Phase 2+)
├── constants/                     # menu, types...
├── hooks/, utils/                 # (mở rộng dần)
└── middleware.js                  # Bảo vệ route bằng NextAuth
prisma/
├── schema.prisma
└── seed.js
```

---

## Roadmap thực thi

Xem chi tiết tại [`docs/roadmap.md`](docs/roadmap.md).

| Phase | Trạng thái | Nội dung |
|---|---|---|
| 0 — Init | ✅ Done | Next.js + Tailwind + Prisma + ESLint/Prettier |
| 1 — Auth + Layout | ✅ Done | Login, Sidebar, Header, ThemeToggle, UI components, NextAuth |
| 2 — Module Gold | ✅ Done | SJC provider, sync, chart, history, stats, send telegram, export CSV |
| 3 — Module Fuel | ✅ Done | Petrolimex scrape provider, đầy đủ chức năng như Gold |
| 4 — Telegram Bot | ✅ Done | Webhook + 7 command handlers, CRUD bot_settings, broadcast, logs page với filter & detail |
| 5 — Cron Jobs | ✅ Done | `vercel.json` + `/api/cron/{gold-sync,fuel-sync,daily-report}` có `CRON_SECRET` bảo vệ |
| 6 — Polish | ✅ Done | Dashboard home real data + Settings (đổi pass + test telegram) + Responsive + Dark/Light |

---

## Deploy lên Vercel

```bash
# Lần đầu
vercel link
vercel env pull .env.local    # kéo env từ dashboard về local

# Push code → Vercel tự deploy
git push
```

### Setup database
1. Trong Vercel dashboard → **Storage** → Create **Postgres** (hoặc kết nối Neon).
2. Vercel auto inject `POSTGRES_PRISMA_URL` + `POSTGRES_URL_NON_POOLING`.
3. Chạy migration sau khi deploy:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

### Setup Telegram Webhook
Sau khi deploy, đăng ký webhook để Telegram POST vào app:
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-app>.vercel.app/api/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

### Cron Jobs
- File `vercel.json` đã định nghĩa 3 cron (gold sync 6h, fuel sync 8h, daily report 9h).
- **Hobby plan** chỉ cho 2 cron/ngày — cân nhắc Pro plan ($20/tháng) hoặc dùng cron-job.org ping `/api/cron/*` với header `Authorization: Bearer $CRON_SECRET`.

---

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Dev server (http://localhost:3000) |
| `npm run build` | Build production |
| `npm run start` | Chạy production |
| `npm run lint` | Lint code |
| `npm run format` | Prettier format |
| `npm run db:migrate` | Tạo migration mới (dev) |
| `npm run db:deploy` | Apply migration (production) |
| `npm run db:seed` | Seed admin user |
| `npm run db:studio` | Mở Prisma Studio GUI |
| `npm run db:reset` | Reset DB (xoá toàn bộ data) |

---

## Telegram bot commands

Sau khi đăng ký webhook, user chat với bot bằng các lệnh:

| Lệnh | Mô tả |
|---|---|
| `/start`, `/help` | Welcome + danh sách lệnh |
| `/gia_vang_hien_tai` | Giá vàng mới nhất theo từng loại |
| `/thong_ke_gia_vang_7_ngay` | Min/Max/TB giá vàng 7 ngày |
| `/thong_ke_3_moc_gio_gan_nhat` | 3 snapshot vàng gần nhất hôm nay |
| `/gia_xang_hien_tai` | Giá xăng dầu mới nhất |
| `/thong_ke_gia_xang_7_ngay` | Min/Max/TB giá xăng 7 ngày |

---

## API endpoints

### Auth
- `POST /api/auth/[...nextauth]` — NextAuth (login/logout/session)
- `POST /api/auth/change-password` — đổi mật khẩu (auth required)

### Gold
- `GET /api/gold` — giá mới nhất theo từng type
- `GET /api/gold/history?range=7d&type=...` — lịch sử
- `GET /api/gold/stats?range=7d&type=...` — min/max/avg
- `GET /api/gold/today-latest-3` — 3 mốc gần nhất hôm nay
- `POST /api/gold/sync` — sync ngay từ SJC
- `POST /api/gold/send-telegram` — `{ kind: 'latest' | 'stats' | 'latest3' }`
- `GET /api/gold/export?range=7d&type=...` — export CSV

### Fuel
- `GET /api/fuel` · `/history` · `/stats` · `POST /sync` · `POST /send-telegram` · `GET /export`

### Telegram
- `GET /api/telegram/logs?page=1&status=&botType=` — log với pagination
- `GET|POST /api/telegram/settings` — list & create bot
- `PUT|DELETE /api/telegram/settings/[id]` — update & delete
- `PATCH /api/telegram/settings/[id]/toggle` — bật/tắt
- `POST /api/telegram/test-send` — gửi test
- `POST /api/telegram/webhook` — Telegram POST (bảo vệ bằng `TELEGRAM_WEBHOOK_SECRET`)

### System
- `GET /api/health` — healthcheck
- `GET|POST /api/cron/gold-sync` — cron sync + gửi vàng (bảo vệ `CRON_SECRET`)
- `GET|POST /api/cron/fuel-sync` — cron sync + gửi xăng
- `GET|POST /api/cron/daily-report` — báo cáo hàng ngày

---

## Tech stack chi tiết

| Layer | Package |
|---|---|
| Framework | `next` 14 (App Router) |
| Auth | `next-auth` v5 + `bcryptjs` |
| ORM | `prisma` + `@prisma/client` + `@vercel/postgres` |
| Style | `tailwindcss` |
| Form | `react-hook-form` + `zod` + `@hookform/resolvers` |
| Chart | `recharts` |
| HTTP | `axios` |
| UI | `lucide-react`, `class-variance-authority`, `sonner`, `next-themes` |
| Utils | `clsx`, `tailwind-merge`, `dayjs`, `json2csv`, `fast-xml-parser`, `cheerio` |
