Tôi muốn xây dựng một web app dashboard thống kê dữ liệu từ API và tạo bot nhắc thông báo qua Telegram.

## Công nghệ sử dụng

Frontend:

* ReactJS
* Tailwind CSS
* SCSS
* React Router
* Chart.js hoặc Recharts

Backend:

* Node.js + ExpressJS
* Database: MySQL hoặc PostgreSQL
* ORM: Prisma hoặc Sequelize
* Authentication: JWT
* Environment config: `.env`

Bot:

* Telegram Bot API
* Cron job để tự động gửi dữ liệu định kỳ

## Mục tiêu dự án

Xây dựng hệ thống dashboard admin có đăng nhập, quản lý dữ liệu thống kê từ API như:

* Giá vàng
* Giá xăng Việt Nam
* Có thể mở rộng thêm các loại dữ liệu khác trong tương lai

Hệ thống cần có:

* Trang đăng nhập admin
* Lưu cấu hình bảo mật trong file `.env`
* Database lưu user admin
* Dashboard sau khi đăng nhập
* Sidebar bên trái
* Main view bên phải
* Dark mode / Light mode
* Bot Telegram gửi thông báo dữ liệu theo lệnh và theo cron

## Giao diện

### Layout chính

Sau khi đăng nhập, giao diện dashboard gồm:

Sidebar bên trái:

* Phía trên cùng hiển thị:

  * “Xin chào”
  * Tên admin đang đăng nhập
* Menu điều hướng:

  * Thống kê vàng
  * Thống kê giá xăng
  * Quản lý bot Telegram
  * Lịch sử thông báo
  * Cài đặt
* Bên dưới cùng có nút:

  * Logout

Main view bên phải:

* Hiển thị nội dung theo menu đang chọn
* Có card thống kê tổng quan
* Có biểu đồ chart
* Có bảng dữ liệu gần nhất
* Có các nút thao tác nhanh

## Theme màu

Có 2 chế độ:

* Light mode
* Dark mode

Light mode sử dụng tone màu nâu làm chủ đạo.

Đề xuất 3 màu chính:

```css
--color-primary: #8B5E3C;
--color-secondary: #D6B08A;
--color-accent: #F5E6D3;
```

Dark mode có thể dùng:

```css
--color-dark-bg: #1E1A17;
--color-dark-card: #2A241F;
--color-dark-text: #F5E6D3;
```

Cần có nút toggle dark/light mode ở header hoặc sidebar.

## Module thống kê giá vàng

Trang “Thống kê vàng” cần có:

* Card hiển thị giá vàng mới nhất
* Giá mua vào
* Giá bán ra
* Thời gian cập nhật gần nhất
* Biểu đồ giá vàng theo thời gian
* Bộ lọc:

  * Hôm nay
  * 7 ngày gần nhất
  * 30 ngày gần nhất
* Bảng lịch sử giá vàng
* Nút:

  * Cập nhật dữ liệu ngay
  * Gửi Telegram ngay
  * Xuất dữ liệu CSV

API backend cần có:

* Lấy giá vàng hiện tại
* Lưu lịch sử giá vàng vào database
* Lấy thống kê 7 ngày gần nhất
* Lấy 3 mốc giá gần nhất trong ngày
* Gửi dữ liệu qua Telegram

## Module thống kê giá xăng

Trang “Thống kê giá xăng” cần có:

* Card giá xăng mới nhất
* Loại xăng/dầu
* Giá hiện tại
* Thời gian cập nhật
* Biểu đồ biến động giá
* Bảng lịch sử
* Nút:

  * Cập nhật dữ liệu ngay
  * Gửi Telegram ngay
  * Xuất dữ liệu CSV

## Telegram Bot

Tạo bot Telegram có thể dùng chung cho nhiều loại dữ liệu như:

* Giá vàng
* Giá xăng
* Các dữ liệu khác trong tương lai

Bot cần hỗ trợ 2 hình thức:

### 1. Gửi tự động bằng cron

Có cron job chạy định kỳ, ví dụ:

* Mỗi 30 phút lấy dữ liệu giá vàng mới nhất
* Mỗi ngày gửi báo cáo giá vàng
* Khi giá vượt ngưỡng thì gửi cảnh báo

Cấu hình cron lưu trong `.env` hoặc database.

Ví dụ `.env`:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
GOLD_API_URL=
FUEL_API_URL=
DATABASE_URL=
JWT_SECRET=
PORT=5000
```

### 2. Gửi theo command Telegram

Bot cần xử lý các command:

```txt
/gia_vang_hien_tai
```

Trả về giá vàng cập nhật gần nhất.

```txt
/thong_ke_gia_vang_7_ngay
```

Trả về thống kê giá vàng 7 ngày gần nhất.

```txt
/thong_ke_3_moc_gio_gan_nhat
```

Trả về 3 mốc giá vàng gần nhất trong ngày.

Có thể thêm command cho giá xăng:

```txt
/gia_xang_hien_tai
/thong_ke_gia_xang_7_ngay
```

## Database

Thiết kế database gồm các bảng cơ bản:

### users

Lưu tài khoản admin.

Fields:

* id
* name
* email
* password_hash
* role
* created_at
* updated_at

### gold_prices

Lưu lịch sử giá vàng.

Fields:

* id
* type
* buy_price
* sell_price
* source
* recorded_at
* created_at

### fuel_prices

Lưu lịch sử giá xăng.

Fields:

* id
* fuel_type
* price
* source
* recorded_at
* created_at

### telegram_logs

Lưu lịch sử gửi bot.

Fields:

* id
* bot_type
* message
* status
* sent_at
* created_at

### bot_settings

Lưu cấu hình bot.

Fields:

* id
* bot_name
* bot_type
* is_active
* cron_expression
* alert_condition
* created_at
* updated_at

## API Backend cần có

Authentication:

* POST `/api/auth/login`
* POST `/api/auth/logout`
* GET `/api/auth/me`

Gold:

* GET `/api/gold/latest`
* GET `/api/gold/history?range=7d`
* GET `/api/gold/today/latest-3`
* POST `/api/gold/sync`
* POST `/api/gold/send-telegram`

Fuel:

* GET `/api/fuel/latest`
* GET `/api/fuel/history?range=7d`
* POST `/api/fuel/sync`
* POST `/api/fuel/send-telegram`

Telegram:

* GET `/api/telegram/logs`
* GET `/api/telegram/settings`
* POST `/api/telegram/settings`
* POST `/api/telegram/test-send`

## Yêu cầu kỹ thuật

* Code rõ ràng, chia folder theo module
* Có validate dữ liệu input
* Mật khẩu admin phải hash bằng bcrypt
* JWT lưu token đăng nhập
* Không hardcode token bot, API key hoặc database password
* Tất cả cấu hình nhạy cảm phải lưu trong `.env`
* Có middleware bảo vệ route admin
* Có xử lý lỗi API
* Có loading state ở frontend
* Có empty state khi chưa có dữ liệu
* Có responsive cho desktop/tablet/mobile
* Có reusable component:

  * Sidebar
  * Header
  * Card
  * Chart
  * DataTable
  * Button
  * Modal
  * ThemeToggle

## Cấu trúc thư mục mong muốn

```txt
project-root/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── jobs/
│   │   ├── bot/
│   │   └── app.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── styles/
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
```

## Kết quả mong muốn

Hãy tạo cho tôi source code dự án fullstack gồm:

1. Backend Node.js Express
2. Frontend ReactJS + Tailwind + SCSS
3. Database schema
4. Auth admin
5. Dashboard layout
6. Sidebar nav bên trái
7. Main view bên phải
8. Dark/light mode
9. Module thống kê giá vàng
10. Module thống kê giá xăng
11. Telegram bot command
12. Cron job gửi thông báo
13. File `.env.example`
14. Hướng dẫn setup và chạy local

Ưu tiên code dễ hiểu, dễ mở rộng thêm nhiều loại dữ liệu API khác trong tương lai.
