# Backend - Hệ Thống Đăng Ký Môn Học

Backend Django REST Framework cho hệ thống đăng ký môn học. Tham chiếu `doc/plan.md` (SRS-DKMH v0.2).

## Tech stack

- Python 3.12+ (Docker dùng 3.12; bản local cao hơn vẫn chạy được)
- Django 5.1 + Django REST Framework
- PostgreSQL 16
- JWT auth (djangorestframework-simplejwt)
- Swagger / OpenAPI (drf-spectacular)
- Docker + docker-compose

## Cấu trúc thư mục

```
backend/
├── config/                 # Django project (settings, urls, wsgi)
├── apps/
│   └── accounts/           # Custom User + role (ADMIN/STUDENT/TEACHER)
├── manage.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Cách 1 — Chạy bằng Docker (khuyến nghị)

Yêu cầu: Docker Desktop đang chạy.

```powershell
cd backend
copy .env.example .env
docker compose up --build
```

Lần đầu chạy:

```powershell
docker compose exec backend python manage.py createsuperuser
```

Endpoints:

- API root: http://localhost:8000/api/
- Swagger UI: http://localhost:8000/api/docs/
- Redoc: http://localhost:8000/api/redoc/
- Django admin: http://localhost:8000/admin/

## Cách 2 — Chạy local (không dùng Docker)

Yêu cầu: Python 3.12+, PostgreSQL 14+ đã cài sẵn.

```powershell
cd backend

# Tạo virtualenv
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Cài dependency
pip install -r requirements.txt

# Cấu hình
copy .env.example .env
# Sau đó sửa .env cho khớp PostgreSQL local

# Tạo DB trong psql (chạy 1 lần):
# CREATE DATABASE dangkymonhoc;

# Migrate & chạy
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Auth flow (JWT)

1. `POST /api/auth/login/` với `{ "username": "...", "password": "..." }` → trả về `access` + `refresh`
2. Gọi API khác với header `Authorization: Bearer <access>`
3. Khi `access` hết hạn → `POST /api/auth/refresh/` với `{ "refresh": "..." }`

Cấu hình token lifetime trong `config/settings.py` (`SIMPLE_JWT`).

## Thêm app mới

```powershell
cd backend
python manage.py startapp <ten_app> apps/<ten_app>
```

Sau đó:

1. Đăng ký app trong `INSTALLED_APPS` của `config/settings.py` (dạng `"apps.<ten_app>"`)
2. Thêm `default_auto_field` và `label` trong `apps/<ten_app>/apps.py`
3. Thêm `path("api/<ten_app>/", include("apps.<ten_app>.urls"))` vào `config/urls.py`

Các app cần xây tiếp theo SRS:

- `majors` — ngành đào tạo
- `curriculums` — chương trình đào tạo
- `courses` — môn học + tiên quyết
- `semesters` — học kỳ
- `classes` — lớp học phần + schedule + room
- `registrations` — đăng ký môn học
- `grades` — điểm
- `notifications` — thông báo Admin gửi cho SV/GV

## Lưu ý

- SRS ghi `ORM: TypeORM` — đó là ORM JS/TS, không tương thích với Django. Backend dùng **Django ORM** mặc định đi kèm Django. Nên cập nhật lại SRS.
- `AUTH_USER_MODEL = accounts.User` đã được khai báo trước migration đầu tiên — KHÔNG đổi sau khi đã migrate, sẽ rất khó rollback.
- Admin được tạo qua `createsuperuser`. API `/api/accounts/users/` chỉ cho phép tạo role `STUDENT` hoặc `TEACHER` (FR-ADM-ACC-006).
