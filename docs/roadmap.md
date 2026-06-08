# Roadmap Phát Triển Dự Án — Dashboard Thống Kê + Telegram Bot

> Tài liệu này phân tích yêu cầu từ `PROJECT_REQUIREMENTS.md` và lập kế hoạch chi tiết kiến trúc, cấu trúc, database, API, UI và package. **Chưa code, chỉ là blueprint.**

---

## 1. Kiến trúc tổng thể

### 1.1. Mô hình kiến trúc

Hệ thống chia thành **3 tier** chạy độc lập, giao tiếp qua REST API và Telegram Bot API:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         NGƯỜI DÙNG (Admin)                          │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND (ReactJS + Tailwind + SCSS)         Port 5173 (Vite dev)  │
│  - Login page                                                       │
│  - Dashboard layout (Sidebar + Main)                                │
│  - Module: Gold / Fuel / Telegram / Settings                        │
│  - Dark / Light theme                                               │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ REST API (JWT in header)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BACKEND (Node.js + Express)                  Port 5000             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Routes → Controllers → Services → Models (Prisma)           │   │
│  │ Middlewares: auth (JWT), errorHandler, validator, logger    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐      │
│  │  Jobs (cron) │  │ Telegram Bot │  │ External API Fetcher │      │
│  │  node-cron   │  │ (node-tg-bot)│  │ (axios)              │      │
│  └──────────────┘  └──────────────┘  └──────────────────────┘      │
└──────────┬─────────────────────┬──────────────────┬─────────────────┘
           │                     │                  │
           ▼                     ▼                  ▼
   ┌─────────────┐       ┌──────────────┐    ┌──────────────────┐
   │ PostgreSQL  │       │ Telegram API │    │ Gold/Fuel public │
   │ (Prisma)    │       │              │    │ APIs             │
   └─────────────┘       └──────────────┘    └──────────────────┘
```

### 1.2. Luồng dữ liệu chính

| Luồng | Mô tả |
|---|---|
| **Login** | FE gửi email/password → BE verify (bcrypt) → trả JWT → FE lưu localStorage → đính vào header `Authorization` cho mọi request |
| **Sync giá** | Admin bấm "Cập nhật ngay" hoặc Cron trigger → Service gọi API ngoài → Lưu vào DB → Trả về FE |
| **Bot lệnh** | User chat `/gia_vang_hien_tai` → Telegram → BE bot handler → Query DB → Reply user |
| **Bot cron** | `node-cron` chạy theo `cron_expression` → Lấy dữ liệu mới nhất → Gửi qua bot → Log vào `telegram_logs` |
| **Alert** | Job kiểm tra `alert_condition` (vd: giá > X) → Nếu đạt → Bot gửi cảnh báo |

### 1.3. Nguyên tắc thiết kế

- **Modular**: Mỗi loại dữ liệu (gold, fuel, ...) là 1 module độc lập (controller + service + route + job) → dễ mở rộng.
- **Separation of concerns**: Controller chỉ xử lý HTTP, Service chứa business logic, Model là Prisma schema.
- **Config-driven**: Toàn bộ secret/endpoint nằm trong `.env`. Cron expression có thể lưu trong DB để admin chỉnh sửa qua UI.
- **Stateless API**: JWT không lưu session ở server → dễ scale ngang.
- **Reusable provider pattern** cho data source: tạo interface `IPriceProvider` để dễ thêm source mới (PNJ, SJC, DOJI...).

---

## 2. Cấu trúc thư mục

### 2.1. Backend (`/backend`)

```text
backend/
├── prisma/
│   ├── schema.prisma              # Định nghĩa DB schema
│   ├── migrations/                # Auto-generated
│   └── seed.js                    # Tạo admin mặc định
│
├── src/
│   ├── config/
│   │   ├── env.js                 # Load + validate .env (joi/zod)
│   │   ├── db.js                  # Prisma client singleton
│   │   └── logger.js              # Winston/Pino logger
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── gold.controller.js
│   │   ├── fuel.controller.js
│   │   └── telegram.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js        # Hash password, sign JWT
│   │   ├── gold.service.js        # CRUD + sync giá vàng
│   │   ├── fuel.service.js        # CRUD + sync giá xăng
│   │   ├── telegram.service.js    # Wrapper gửi tin nhắn + log
│   │   └── providers/             # Adapter gọi API ngoài
│   │       ├── gold.provider.js
│   │       └── fuel.provider.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js     # Verify JWT
│   │   ├── error.middleware.js    # Global error handler
│   │   ├── validate.middleware.js # Joi/Zod schema validator
│   │   └── rateLimit.middleware.js
│   │
│   ├── routes/
│   │   ├── index.js               # Mount tất cả route /api/*
│   │   ├── auth.routes.js
│   │   ├── gold.routes.js
│   │   ├── fuel.routes.js
│   │   └── telegram.routes.js
│   │
│   ├── validators/                # Schema input validation
│   │   ├── auth.schema.js
│   │   └── telegram.schema.js
│   │
│   ├── jobs/
│   │   ├── index.js               # Khởi tạo tất cả cron job
│   │   ├── gold.job.js            # Cron sync + alert giá vàng
│   │   └── fuel.job.js            # Cron sync + alert giá xăng
│   │
│   ├── bot/
│   │   ├── index.js               # Khởi tạo telegram bot instance
│   │   ├── commands/              # Mỗi command 1 file
│   │   │   ├── gold.commands.js
│   │   │   ├── fuel.commands.js
│   │   │   └── help.command.js
│   │   └── formatters/            # Format message gửi đi (Markdown)
│   │       ├── gold.formatter.js
│   │       └── fuel.formatter.js
│   │
│   ├── utils/
│   │   ├── asyncHandler.js        # Wrap async route
│   │   ├── ApiError.js            # Custom error class
│   │   ├── csv.js                 # Export CSV helper
│   │   └── date.js
│   │
│   └── app.js                     # Express app bootstrap
│
├── tests/                         # (Phase sau) Jest + Supertest
├── .env.example
├── .gitignore
├── package.json
└── server.js                      # Entry point (require app + start)
```

### 2.2. Frontend (`/frontend`)

```text
frontend/
├── public/
│   └── favicon.svg
│
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/
│   │   ├── common/                # Reusable cơ bản
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   ├── Input/
│   │   │   ├── Spinner/
│   │   │   ├── EmptyState/
│   │   │   └── ThemeToggle/
│   │   ├── charts/
│   │   │   ├── LineChart.jsx      # Wrapper Recharts
│   │   │   └── BarChart.jsx
│   │   ├── tables/
│   │   │   └── DataTable.jsx
│   │   └── layout/
│   │       ├── Sidebar.jsx
│   │       ├── Header.jsx
│   │       └── ProtectedRoute.jsx
│   │
│   ├── layouts/
│   │   ├── AuthLayout.jsx         # Cho trang login
│   │   └── DashboardLayout.jsx    # Sidebar + Header + Outlet
│   │
│   ├── pages/
│   │   ├── Login/
│   │   │   └── LoginPage.jsx
│   │   ├── Dashboard/
│   │   │   └── DashboardHome.jsx  # Tổng quan
│   │   ├── Gold/
│   │   │   └── GoldPage.jsx
│   │   ├── Fuel/
│   │   │   └── FuelPage.jsx
│   │   ├── Telegram/
│   │   │   ├── BotManagementPage.jsx
│   │   │   └── TelegramLogsPage.jsx
│   │   ├── Settings/
│   │   │   └── SettingsPage.jsx
│   │   └── NotFound/
│   │       └── NotFoundPage.jsx
│   │
│   ├── routes/
│   │   ├── AppRouter.jsx          # React Router config
│   │   └── routePaths.js          # Constants
│   │
│   ├── services/                  # API client
│   │   ├── api.js                 # Axios instance + interceptor
│   │   ├── auth.service.js
│   │   ├── gold.service.js
│   │   ├── fuel.service.js
│   │   └── telegram.service.js
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useTheme.js
│   │   └── useFetch.js
│   │
│   ├── context/
│   │   ├── AuthContext.jsx        # User state + token
│   │   └── ThemeContext.jsx       # Dark/Light state
│   │
│   ├── store/                     # (Tùy chọn) Zustand
│   │   └── useUiStore.js
│   │
│   ├── styles/
│   │   ├── _variables.scss        # Màu chính + dark/light tokens
│   │   ├── _mixins.scss
│   │   ├── globals.scss
│   │   └── tailwind.css           # @tailwind base/components/utilities
│   │
│   ├── utils/
│   │   ├── formatCurrency.js
│   │   ├── formatDate.js
│   │   └── exportCsv.js
│   │
│   ├── constants/
│   │   └── menu.js                # Cấu hình sidebar
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env.example                   # VITE_API_BASE_URL=...
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

### 2.3. Cấu trúc tổng

```text
bot-telegram/
├── backend/
├── frontend/
├── docs/
│   ├── roadmap.md
│   └── api.md                     # (Sẽ tạo sau) Swagger/Postman
├── docker-compose.yml             # (Tùy chọn) Postgres + adminer
├── README.md
└── PROJECT_REQUIREMENTS.md
```

---

## 3. Database Schema

Sử dụng **PostgreSQL** + **Prisma ORM**. Dưới đây là phác thảo `schema.prisma`:

### 3.1. Bảng `users`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | Int | PK, autoincrement | |
| `name` | String | NOT NULL | Tên admin |
| `email` | String | UNIQUE, NOT NULL | Dùng để login |
| `password_hash` | String | NOT NULL | bcrypt (10 rounds) |
| `role` | Enum(`ADMIN`,`VIEWER`) | DEFAULT `ADMIN` | Mở rộng phân quyền |
| `is_active` | Boolean | DEFAULT true | |
| `last_login_at` | DateTime | NULL | |
| `created_at` | DateTime | DEFAULT now() | |
| `updated_at` | DateTime | @updatedAt | |

### 3.2. Bảng `gold_prices`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | BigInt | PK, autoincrement | |
| `type` | String | NOT NULL | "SJC", "DOJI", "PNJ", "9999"... |
| `buy_price` | Decimal(15,2) | NOT NULL | VND/lượng |
| `sell_price` | Decimal(15,2) | NOT NULL | |
| `source` | String | NOT NULL | "sjc.com.vn", "doji.vn"... |
| `recorded_at` | DateTime | NOT NULL, INDEX | Thời điểm giá có hiệu lực |
| `created_at` | DateTime | DEFAULT now() | |

→ **Index**: `(type, recorded_at DESC)` để query "latest by type".

### 3.3. Bảng `fuel_prices`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | BigInt | PK, autoincrement | |
| `fuel_type` | String | NOT NULL | "RON95-V", "RON95-III", "E5RON92", "DO 0.05S"... |
| `price` | Decimal(10,2) | NOT NULL | VND/lít |
| `source` | String | NOT NULL | "petrolimex.com.vn"... |
| `recorded_at` | DateTime | NOT NULL, INDEX | |
| `created_at` | DateTime | DEFAULT now() | |

→ **Index**: `(fuel_type, recorded_at DESC)`.

### 3.4. Bảng `telegram_logs`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | BigInt | PK, autoincrement | |
| `bot_type` | Enum(`GOLD`,`FUEL`,`ALERT`,`MANUAL`,`OTHER`) | NOT NULL | |
| `trigger` | Enum(`CRON`,`COMMAND`,`MANUAL`) | NOT NULL | |
| `chat_id` | String | NULL | ID Telegram nhận |
| `message` | Text | NOT NULL | Nội dung gửi đi |
| `status` | Enum(`SUCCESS`,`FAILED`) | NOT NULL | |
| `error_message` | Text | NULL | Khi status = FAILED |
| `sent_at` | DateTime | NOT NULL | |
| `created_at` | DateTime | DEFAULT now() | |

### 3.5. Bảng `bot_settings`

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | Int | PK, autoincrement | |
| `bot_name` | String | NOT NULL | "Daily Gold Report" |
| `bot_type` | Enum(`GOLD`,`FUEL`,`ALERT`) | NOT NULL | |
| `chat_id` | String | NOT NULL | Đích gửi |
| `is_active` | Boolean | DEFAULT true | |
| `cron_expression` | String | NULL | vd: "0 8 * * *" |
| `alert_condition` | Json | NULL | `{ op: ">", value: 80000000, field: "sell_price" }` |
| `message_template` | Text | NULL | Template Markdown |
| `created_at` | DateTime | DEFAULT now() | |
| `updated_at` | DateTime | @updatedAt | |

### 3.6. (Tùy chọn) Bảng `audit_logs`

Ghi lại các action quan trọng của admin (login, đổi cấu hình bot, sync thủ công...).

---

## 4. Danh sách API

### 4.1. Authentication (`/api/auth`)

| Method | Endpoint | Auth | Mô tả | Request | Response |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | ❌ | Đăng nhập | `{ email, password }` | `{ token, user }` |
| POST | `/api/auth/logout` | ✅ | Logout (client xoá token, server log) | – | `{ success: true }` |
| GET | `/api/auth/me` | ✅ | Lấy info user hiện tại | – | `{ user }` |
| POST | `/api/auth/change-password` | ✅ | Đổi mật khẩu | `{ oldPassword, newPassword }` | `{ success }` |

### 4.2. Gold (`/api/gold`)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/gold/latest` | ✅ | Giá vàng mới nhất theo từng `type` |
| GET | `/api/gold/history?range=7d&type=SJC` | ✅ | Lịch sử (range: `1d`,`7d`,`30d`) |
| GET | `/api/gold/today/latest-3` | ✅ | 3 mốc giá gần nhất trong hôm nay |
| GET | `/api/gold/stats?range=7d` | ✅ | Thống kê (min/max/avg) |
| POST | `/api/gold/sync` | ✅ | Sync ngay từ API ngoài |
| POST | `/api/gold/send-telegram` | ✅ | Gửi snapshot hiện tại qua bot |
| GET | `/api/gold/export?format=csv&range=7d` | ✅ | Export CSV |

### 4.3. Fuel (`/api/fuel`)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/fuel/latest` | ✅ | Giá xăng mới nhất theo từng `fuel_type` |
| GET | `/api/fuel/history?range=7d&type=RON95-V` | ✅ | Lịch sử |
| GET | `/api/fuel/stats?range=30d` | ✅ | Thống kê |
| POST | `/api/fuel/sync` | ✅ | Sync ngay |
| POST | `/api/fuel/send-telegram` | ✅ | Gửi snapshot |
| GET | `/api/fuel/export?format=csv&range=7d` | ✅ | Export CSV |

### 4.4. Telegram (`/api/telegram`)

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/telegram/logs?page=1&limit=20&status=SUCCESS` | ✅ | Danh sách log (pagination) |
| GET | `/api/telegram/logs/:id` | ✅ | Chi tiết log |
| GET | `/api/telegram/settings` | ✅ | List bot settings |
| POST | `/api/telegram/settings` | ✅ | Tạo bot setting |
| PUT | `/api/telegram/settings/:id` | ✅ | Cập nhật (vd: đổi cron) |
| DELETE | `/api/telegram/settings/:id` | ✅ | Xoá |
| PATCH | `/api/telegram/settings/:id/toggle` | ✅ | Bật/tắt bot |
| POST | `/api/telegram/test-send` | ✅ | Test gửi tin nhắn tới `chat_id` |

### 4.5. System / Health

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/api/health` | ❌ | Healthcheck (DB + bot) |
| GET | `/api/version` | ❌ | Version info |

### 4.6. Telegram Bot Commands (chat → bot)

| Command | Mô tả |
|---|---|
| `/start` | Welcome + list lệnh |
| `/help` | Danh sách lệnh |
| `/gia_vang_hien_tai` | Giá vàng mới nhất tất cả các type |
| `/thong_ke_gia_vang_7_ngay` | Min/Max/Avg + biến động 7 ngày |
| `/thong_ke_3_moc_gio_gan_nhat` | 3 snapshot gần nhất hôm nay |
| `/gia_xang_hien_tai` | Giá tất cả loại xăng |
| `/thong_ke_gia_xang_7_ngay` | Stats xăng 7 ngày |

---

## 5. Danh sách màn hình giao diện

| # | Route | Tên màn hình | Layout | Mô tả thành phần chính |
|---|---|---|---|---|
| 1 | `/login` | **Login** | AuthLayout | Form email/password, button submit, error message, toggle theme. |
| 2 | `/` hoặc `/dashboard` | **Dashboard Home** | DashboardLayout | 4 card tổng quan (giá vàng SJC, giá RON95, số bot active, số log hôm nay) + mini chart 7 ngày + bảng log gần nhất. |
| 3 | `/gold` | **Thống kê vàng** | DashboardLayout | Card giá mới nhất (buy/sell/updated_at) + Filter (1d/7d/30d) + Line chart + Table lịch sử + 3 nút: Sync / Send Telegram / Export CSV. |
| 4 | `/fuel` | **Thống kê giá xăng** | DashboardLayout | Card cho từng loại xăng + Filter + Bar/Line chart + Table + 3 nút thao tác. |
| 5 | `/telegram/bots` | **Quản lý bot Telegram** | DashboardLayout | Bảng list `bot_settings` + nút Add/Edit/Delete/Toggle + Modal form (bot_name, type, chat_id, cron, alert_condition, template). |
| 6 | `/telegram/logs` | **Lịch sử thông báo** | DashboardLayout | Filter (date range, status, bot_type) + DataTable phân trang + Modal xem chi tiết log. |
| 7 | `/settings` | **Cài đặt** | DashboardLayout | Tab: Profile (đổi tên/đổi mật khẩu) / Theme / Bot global config (test gửi tin). |
| 8 | `*` | **404 Not Found** | AuthLayout | |

### 5.1. Component layout chung

- **Sidebar (trái)**: avatar + "Xin chào, [name]" → menu (Dashboard, Vàng, Xăng, Bot, Logs, Settings) → button Logout dưới cùng.
- **Header (trên)**: breadcrumb + ThemeToggle + dropdown user (avatar).
- **Responsive**: Sidebar collapse thành drawer trên mobile, header có hamburger.

### 5.2. State patterns cho mỗi page

Tất cả page data phải xử lý 3 state: **Loading** (skeleton/spinner), **Empty** (illustration + CTA), **Error** (retry button).

---

## 6. Package cần cài

### 6.1. Backend (`backend/package.json`)

**Dependencies chính:**

| Package | Mục đích |
|---|---|
| `express` | HTTP framework |
| `cors` | Cho phép FE gọi BE |
| `helmet` | Security headers |
| `compression` | Gzip response |
| `morgan` | HTTP request logger |
| `dotenv` | Load `.env` |
| `bcrypt` | Hash password |
| `jsonwebtoken` | JWT sign/verify |
| `@prisma/client` | ORM client |
| `joi` *hoặc* `zod` | Validate input |
| `axios` | Gọi API ngoài (gold/fuel) |
| `node-cron` | Cron job |
| `node-telegram-bot-api` *hoặc* `telegraf` | Telegram bot SDK |
| `winston` *hoặc* `pino` | Logger có level |
| `express-rate-limit` | Chống brute force /login |
| `cookie-parser` | (Tùy chọn) nếu lưu JWT trong cookie |
| `dayjs` | Xử lý ngày tháng |
| `json2csv` | Export CSV |

**DevDependencies:**

| Package | Mục đích |
|---|---|
| `prisma` | CLI migration |
| `nodemon` | Auto reload dev |
| `eslint`, `prettier` | Lint/format |
| `jest`, `supertest` | (Phase test) |
| `cross-env` | Set env đa nền tảng |

### 6.2. Frontend (`frontend/package.json`)

**Dependencies chính:**

| Package | Mục đích |
|---|---|
| `react`, `react-dom` | Core |
| `react-router-dom` | Routing v6 |
| `axios` | API client |
| `recharts` *hoặc* `chart.js` + `react-chartjs-2` | Biểu đồ |
| `clsx` *hoặc* `classnames` | Conditional className |
| `react-hook-form` | Form handling |
| `zod` + `@hookform/resolvers` | Form validation |
| `react-hot-toast` *hoặc* `sonner` | Toast notify |
| `lucide-react` | Icon set |
| `dayjs` | Date format |
| `zustand` | (Tùy chọn) global UI state |
| `@tanstack/react-query` | (Khuyến nghị) cache + revalidate API |

**DevDependencies:**

| Package | Mục đích |
|---|---|
| `vite`, `@vitejs/plugin-react` | Build tool |
| `tailwindcss`, `postcss`, `autoprefixer` | Tailwind |
| `sass` | Compile SCSS |
| `eslint`, `prettier`, `eslint-plugin-react` | Lint/format |
| `@types/react` (nếu dùng TS) | – |

### 6.3. Tooling toàn dự án (root)

| Package | Mục đích |
|---|---|
| `concurrently` | (Tùy chọn) chạy FE + BE cùng lúc bằng `npm run dev` ở root |
| `husky` + `lint-staged` | (Tùy chọn) git hooks |

---

## 7. Roadmap thực thi theo Phase

> Sau khi kế hoạch ở trên được duyệt, code sẽ triển khai theo thứ tự sau.

### Phase 0 — Khởi tạo (0.5 ngày)
- Init repo, `.gitignore`, README, monorepo structure.
- Setup ESLint + Prettier chung.
- Tạo `docker-compose.yml` cho Postgres (tùy chọn).

### Phase 1 — Backend Foundation (1.5 ngày)
- Init Express + folder structure.
- Setup Prisma + schema `users`, migration đầu.
- Auth: register seed admin + `/login`, `/me`, `/logout`.
- Middleware: auth, error, validate, rate-limit.
- Healthcheck + logger.

### Phase 2 — Frontend Foundation (1.5 ngày)
- Init Vite + React + Tailwind + SCSS.
- Setup Router + AuthContext + ThemeContext.
- Build Login page + DashboardLayout (Sidebar + Header + ThemeToggle).
- Axios interceptor (gắn JWT, refresh on 401).
- Common components: Button, Card, Input, Modal, Spinner, EmptyState, DataTable.

### Phase 3 — Module Gold (2 ngày)
- DB `gold_prices` + Prisma model.
- Provider giả lập + service sync.
- API: latest / history / stats / sync / send-telegram / export.
- FE: GoldPage (card + filter + chart + table + 3 buttons).

### Phase 4 — Module Fuel (1.5 ngày)
- Tương tự Gold (clone pattern).
- DB `fuel_prices` + provider + API + FuelPage.

### Phase 5 — Telegram Bot (2 ngày)
- DB `telegram_logs`, `bot_settings`.
- Khởi tạo bot instance + handlers cho 5 command.
- Formatters Markdown đẹp.
- API CRUD bot_settings + logs.
- FE: BotManagementPage + TelegramLogsPage.

### Phase 6 — Cron Jobs & Alerts (1 ngày)
- `jobs/index.js` đọc `bot_settings` active → đăng ký cron.
- Job alert kiểm tra ngưỡng → gửi bot.
- Hot reload khi admin chỉnh cron qua UI.

### Phase 7 — Polish & Deploy (1 ngày)
- Dashboard Home (tổng quan).
- Settings page (đổi password, theme).
- Responsive mobile/tablet.
- Empty/Error states đầy đủ.
- README setup local + `.env.example` đầy đủ.
- (Tùy chọn) Dockerfile + deploy guide.

**Tổng dự kiến: ~11 ngày làm việc.**

---

## 8. Cập nhật triển khai thực tế

> **Lưu ý**: Code thực tế đã được build theo **phương án Vercel** (Next.js 1-project) — đơn giản hơn kế hoạch ban đầu ở trên. Xem [`README.md`](../README.md) để biết hướng dẫn setup/deploy.

**Trạng thái mã nguồn (Phase 0–6 đã hoàn thành):**

| Phase | Trạng thái | Kết quả |
|---|---|---|
| 0 — Init Next.js + Tailwind + Prisma + ESLint | ✅ Done | `package.json`, configs, folder skeleton |
| 1 — Auth + Layout | ✅ Done | NextAuth v5 + login + Sidebar + Header + 8 UI components |
| 2 — Module Gold | ✅ Done | SJC XML provider (fallback mock) + 7 API endpoints + Gold dashboard |
| 3 — Module Fuel | ✅ Done | Petrolimex scrape provider (fallback mock) + 6 API endpoints + Fuel dashboard |
| 4 — Telegram Bot | ✅ Done | Webhook + 7 command handlers + CRUD bot_settings + Logs page |
| 5 — Cron Jobs | ✅ Done | `vercel.json` + 3 cron endpoints (`gold-sync`, `fuel-sync`, `daily-report`) bảo vệ `CRON_SECRET` |
| 6 — Polish | ✅ Done | Dashboard home real data, Settings (đổi pass + test telegram), responsive, dark/light brown |

**Build production:** 27 routes compile sạch, middleware 73.5 kB.

---

## 9. Câu hỏi cần làm rõ trước khi code

1. **Database**: Dùng **PostgreSQL** hay **MySQL**? (Roadmap mặc định Postgres + Prisma — flexible hơn cho `Json` field ở `alert_condition`.)
2. **Nguồn API giá vàng/xăng**: Có endpoint cụ thể chưa, hay cần đề xuất (SJC, DOJI, Petrolimex...)?
3. **Chat ID Telegram**: 1 chat duy nhất (group/channel) hay đa chat (mỗi bot setting 1 chat)?
4. **Ngôn ngữ codebase**: JavaScript thuần hay **TypeScript** (khuyến nghị TS cho cả FE & BE)?
5. **State management FE**: Context API + React Query đủ chưa, hay cần Redux Toolkit?
6. **Phân quyền**: Hiện tại chỉ 1 role ADMIN, có cần role VIEWER (read-only) ngay không?
7. **Deploy target**: Local-only / VPS / Docker / cloud (Vercel + Railway)?

> Khi bạn xác nhận các điểm trên, mình sẽ bắt đầu **Phase 0 → Phase 1** ngay.
