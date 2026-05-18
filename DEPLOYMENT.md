# 🚀 Hướng dẫn Deploy Dự Án ĐKMH (MIỄN PHÍ)

Triển khai dự án lên internet **miễn phí** dùng:

- **Vercel** (frontend) — CDN toàn cầu, auto SSL
- **Render** (backend) — chạy Django/gunicorn free tier
- **Neon** (database) — PostgreSQL 3GB miễn phí

**Tổng thời gian setup:** ~30 phút. Không cần thẻ tín dụng.

---

## 📋 Yêu cầu trước khi bắt đầu

- [ ] Tài khoản GitHub (đã push code lên repo)
- [ ] Email cá nhân (để đăng ký Neon/Render/Vercel)
- [ ] Đã merge các thay đổi sau vào branch `main`:
  - `backend/requirements.txt` có `whitenoise`, `dj-database-url`
  - `backend/config/settings.py` đã update production-ready
  - `render.yaml` ở root repo
  - `frontend/vercel.json` ở thư mục frontend

---

## 🗄️ Bước 1: Tạo Database trên Neon (5 phút)

### 1.1. Đăng ký Neon

1. Vào [neon.tech](https://neon.tech) → **Sign up** với GitHub
2. Tạo project mới:
   - **Project name:** `dkmh`
   - **Database name:** `dangkymonhoc`
   - **Region:** `Asia Pacific (Singapore)` — gần Việt Nam nhất
   - **Postgres version:** 16

### 1.2. Lấy connection string

Sau khi tạo project, Neon hiển thị **Connection String** dạng:

```
postgresql://<user>:<password>@<host>.ap-southeast-1.aws.neon.tech/dangkymonhoc?sslmode=require&channel_binding=require
```

📋 **Copy chuỗi này** vào clipboard/notepad — sẽ dùng ở Bước 2.
⚠️ **TUYỆT ĐỐI KHÔNG paste vào file commit lên Git** (DEPLOYMENT.md, README, code, ...). Password lộ ra ngoài là **bất kỳ ai cũng truy cập được DB của anh**.

### 1.3. (Optional) Import data từ local

> ⚠️ **BỎ QUA bước này nếu anh chưa có data quan trọng ở local.**
> Render sẽ tự chạy `migrate` để tạo schema rỗng trên Neon — anh có thể tạo data sau qua admin panel hoặc Django shell.

Nếu muốn đẩy data local lên Neon (ví dụ đã seed users/courses để demo):

#### Bước 1: Tạo backup mới nhất

```bash
# Linux/Mac:
docker compose exec backup /usr/local/bin/backup.sh

# Windows Git Bash (thêm // để tránh path conversion):
docker compose exec backup //usr/local/bin/backup.sh
```

#### Bước 2: Lấy tên file backup

```bash
docker compose exec backup sh -c "ls -lt /backups/" | head -3
```

Copy tên file mới nhất (vd. `dkmh_20260518_140530.sql.gz`).

#### Bước 3: Restore TRỰC TIẾP từ container vào Neon

Container `backup` đã có sẵn `psql` — không cần cài thêm gì ở Windows:

```bash
docker compose exec backup sh -c "gunzip -c /backups/<TÊN_FILE> | psql '<NEON_CONNECTION_STRING>'"
```

**Ví dụ cụ thể:**

```bash
docker compose exec backup sh -c "gunzip -c /backups/dkmh_20260518_143938.sql.gz | psql 'postgresql://neondb_owner:PASSWORD@ep-xxx.ap-southeast-1.aws.neon.tech/dangkymonhoc?sslmode=require'"
```

⚠️ Connection string PHẢI bọc trong `' '` (nháy đơn) — vì chứa `@`, `&`, `?`.

#### Bước 4: Verify

```bash
docker compose exec backup sh -c "psql '<NEON_CONNECTION_STRING>' -c 'SELECT COUNT(*) FROM accounts_user;'"
```


Kết quả phải là số user > 0 giống local.

---

## ⚙️ Bước 2: Deploy Backend trên Render (10 phút)

### 2.1. Đăng ký Render

1. Vào [render.com](https://render.com) → **Get Started for Free**
2. Đăng nhập bằng GitHub, cấp quyền truy cập repo `DangKyMonHoc`

### 2.2. Tạo Web Service từ Blueprint

Vì repo đã có file `render.yaml`, Render sẽ tự cấu hình:

1. Dashboard → **New** → **Blueprint**
2. Chọn repo `DangKyMonHoc`
3. Click **Apply** — Render đọc `render.yaml` và tạo service `dkmh-api`

### 2.3. Cấu hình biến môi trường

Vào service `dkmh-api` → **Environment** → điền 2 biến còn thiếu:

| Key | Value |
|---|---|
| `DATABASE_URL` | Connection string từ Neon (Bước 1.2) |
| `CORS_ALLOWED_ORIGINS` | Tạm để `*` — sẽ update sau khi có URL Vercel |

Các biến khác (`DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`, `PYTHON_VERSION`) đã được auto-fill từ `render.yaml`.

### 2.4. Deploy

Click **Manual Deploy** → **Deploy latest commit**. Render sẽ:

1. `pip install -r requirements.txt`
2. `python manage.py collectstatic --noinput`
3. `python manage.py migrate --noinput` (chạy migration lên Neon)
4. Start gunicorn

⏱️ Lần đầu mất ~3-5 phút. Khi xong sẽ có URL dạng `https://dkmh-api.onrender.com`.

### 2.5. Test backend

```bash
curl https://dkmh-api.onrender.com/api/health/
```

Phải trả:
```json
{"status":"ok","checks":{"app":"ok","database":"ok"},"elapsed_ms":51.7}
```

### 2.6. Tạo superuser (admin đầu tiên)

Render Dashboard → service `dkmh-api` → **Shell** tab:

```bash
python manage.py createsuperuser
# Username: admin
# Email: admin@school.edu.vn
# Password: <strong-password>
```

---

## 🎨 Bước 3: Deploy Frontend trên Vercel (5 phút)

### 3.1. Đăng ký Vercel

1. Vào [vercel.com](https://vercel.com) → **Sign Up** với GitHub
2. Import repo `DangKyMonHoc`

### 3.2. Cấu hình project

Vercel tự detect Vite (vì có `vercel.json`):

| Field | Value |
|---|---|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` (auto) |
| **Output Directory** | `dist` (auto) |

### 3.3. Thêm biến môi trường

Trong màn hình deploy, scroll xuống **Environment Variables** → thêm:

| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://dkmh-api.onrender.com/api` |

### 3.4. Deploy

Click **Deploy**. Sau ~1 phút sẽ có URL dạng `https://dang-ky-mon-hoc.vercel.app`.

### 3.5. Update CORS ở backend

Quay lại Render → service `dkmh-api` → **Environment** → sửa `CORS_ALLOWED_ORIGINS`:

```
https://dang-ky-mon-hoc.vercel.app
```

Click **Save Changes** → Render tự redeploy.

---

## ✅ Bước 4: Verify end-to-end

1. Mở `https://dang-ky-mon-hoc.vercel.app/admin/login`
2. Đăng nhập với superuser đã tạo ở Bước 2.6
3. Mọi tính năng phải hoạt động bình thường

---

## 🔥 Bước 5: Giữ backend KHÔNG sleep (BẮT BUỘC)

Render free tier sleep sau **15 phút không có request** → lần hit sau mất ~30s wake up.

**Giải pháp:** Dùng [UptimeRobot](https://uptimerobot.com) ping `/api/health/` mỗi 5 phút.

### 5.1. Đăng ký UptimeRobot

1. [uptimerobot.com](https://uptimerobot.com) → đăng ký free (50 monitor)
2. **Add New Monitor**:
   - **Type:** HTTP(s)
   - **Friendly Name:** DKMH API Health
   - **URL:** `https://dkmh-api.onrender.com/api/health/`
   - **Monitoring Interval:** 5 minutes
   - **Alert Contacts:** email của anh

✅ **Bonus:** Dashboard UptimeRobot show % uptime — **dùng làm bằng chứng cho NFR #26 Uptime 99.5%** trong báo cáo!

---

## 🎯 Bước 6 (Optional): Custom domain miễn phí

Nếu muốn URL đẹp như `dkmh.id.vn` thay vì `vercel.app`:

### 6.1. Đăng ký domain free

- [id.vn](https://id.vn) — `.id.vn` miễn phí 1 năm
- [DuckDNS](https://duckdns.org) — `dkmh.duckdns.org` miễn phí mãi mãi

### 6.2. Trỏ về Vercel

Vercel dashboard → Project → **Settings** → **Domains** → Add Domain → nhập domain → làm theo hướng dẫn add DNS record (thường là CNAME `cname.vercel-dns.com`).

Vercel tự cấp Let's Encrypt SSL trong 1-2 phút.

---

## 📦 Tóm tắt URL & credentials

Sau khi deploy xong, lưu lại các URL:

```
Frontend (public):  https://dang-ky-mon-hoc.vercel.app
Backend API:        https://dkmh-api.onrender.com/api/
API Docs (Swagger): https://dkmh-api.onrender.com/api/docs/
Health Check:       https://dkmh-api.onrender.com/api/health/
Database:           Neon dashboard (private)
Monitoring:         UptimeRobot dashboard
```

---

## 🐛 Troubleshooting

### Backend crash: "DisallowedHost"

→ Vào Render env, sửa `DJANGO_ALLOWED_HOSTS=.onrender.com,your-custom-domain.com`

### Frontend gọi API bị CORS error

→ Kiểm tra `CORS_ALLOWED_ORIGINS` ở Render khớp **chính xác** URL Vercel (kèm `https://`, không slash cuối)

### "no module named 'whitenoise'"

→ Đảm bảo đã commit `requirements.txt` mới có whitenoise. Render → **Manual Deploy** → **Clear build cache & deploy**

### Migration fail trên Neon: "SSL required"

→ Đảm bảo `DATABASE_URL` có `?sslmode=require` ở cuối, và `dj_database_url.parse(..., ssl_require=True)` trong settings

### Render build timeout (>15 phút)

→ Chuyển `psycopg[binary]` → `psycopg2-binary` trong requirements.txt (build nhanh hơn, dù psycopg3 hiện đại hơn)

### Lần đầu hit API rất chậm (~30s)

→ Render free tier vừa sleep, đang wake up. **Setup UptimeRobot (Bước 5) để fix.**

---

## 📊 So sánh với local development

| | Local (Docker) | Production (Vercel+Render+Neon) |
|---|---|---|
| **URL** | `http://localhost:5173` | `https://...vercel.app` |
| **HTTPS** | Không | Có (auto) |
| **DB** | Postgres trong container | Neon cloud (SSL) |
| **Static files** | Vite dev server | Vercel CDN |
| **Reload code** | Tự động (HMR) | Auto deploy on git push |
| **DEBUG** | True | False |
| **Backup** | Service `backup` cron 00:00 | Neon snapshot tự động |

---

## 🎓 Cho báo cáo / slide

```
[Slide: Triển khai]

Architecture:
  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
  │   Vercel CDN    │───→│  Render.com     │───→│   Neon          │
  │ (Frontend)      │    │  (Django API)   │    │   PostgreSQL    │
  │ React+Vite      │    │  Gunicorn       │    │   3GB free      │
  │ Global edge     │    │  HTTPS + JWT    │    │   SSL only      │
  └─────────────────┘    └─────────────────┘    └─────────────────┘
       Vercel free            Render free            Neon free
     (unlimited)            (750h/tháng)          (3GB storage)

  Monitoring: UptimeRobot ping /api/health/ mỗi 5 phút
              → Bằng chứng cho NFR Uptime 99.5%

Auto-deploy: git push main → Vercel + Render rebuild tự động
```

---

## 🔄 Workflow cập nhật

Sau khi setup xong, mỗi lần sửa code:

```bash
git add .
git commit -m "fix: xyz"
git push origin main
```

→ Vercel và Render tự rebuild + deploy trong 1-3 phút. Không cần thao tác gì thêm.
