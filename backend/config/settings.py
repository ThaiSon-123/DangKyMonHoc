from datetime import timedelta
from pathlib import Path

import dj_database_url
from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("DJANGO_SECRET_KEY", default="dev-insecure-key")
DEBUG = config("DJANGO_DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("DJANGO_ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

# Render đặt sẵn env RENDER_EXTERNAL_HOSTNAME = <app>.onrender.com
RENDER_EXTERNAL_HOSTNAME = config("RENDER_EXTERNAL_HOSTNAME", default=None)
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "drf_spectacular",
    "corsheaders",
    "apps.accounts",
    "apps.majors",
    "apps.courses",
    "apps.semesters",
    "apps.profiles",
    "apps.curriculums",
    "apps.classes",
    "apps.registrations",
    "apps.grades",
    "apps.notifications",
]

MIDDLEWARE = [
    "config.middleware.ResponseTimeMiddleware",  # đo thời gian xử lý → header X-Response-Time-Ms
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",  # serve static files trên production
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database: ưu tiên DATABASE_URL (Neon, Render, Heroku...) — fallback DB_* riêng lẻ.
DATABASE_URL = config("DATABASE_URL", default=None)
if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,  # tái sử dụng connection 10 phút
            ssl_require=True,   # Neon yêu cầu SSL
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": config("DB_NAME", default="dangkymonhoc"),
            "USER": config("DB_USER", default="postgres"),
            "PASSWORD": config("DB_PASSWORD", default="postgres"),
            "HOST": config("DB_HOST", default="localhost"),
            "PORT": config("DB_PORT", default="5432"),
        }
    }

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "vi"
TIME_ZONE = "Asia/Ho_Chi_Minh"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
# WhiteNoise nén + cache static files trên production (Django 5+ syntax)
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Production security — chỉ bật khi DEBUG=False
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 năm
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.accounts.authentication.LockedAwareJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_PAGINATION_CLASS": "config.pagination.StandardPagination",
    "PAGE_SIZE": 25,
}

# Cache backend dùng cho rate-limit login (LoginRateThrottle).
# Local-memory đủ cho dev/single-process; production nên đổi sang Redis.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "dkmh-login-throttle",
    }
}

# ──────────────────────── Email (cho quên mật khẩu) ────────────────────────
# 3 chế độ:
#   1. Dev local (default): console backend — email in ra docker logs.
#   2. Production Render: dùng RESEND_API_KEY (HTTPS API port 443).
#      Render Free chặn SMTP outbound nên KHÔNG dùng được Gmail/Brevo SMTP.
#   3. Self-hosted với SMTP riêng: set EMAIL_BACKEND=smtp + EMAIL_HOST_*.
#
# Setup Resend (production):
#   - resend.com → tạo API key → set env RESEND_API_KEY=re_xxxxx
#   - DEFAULT_FROM_EMAIL=onboarding@resend.dev (test) hoặc domain đã verified
RESEND_API_KEY = config("RESEND_API_KEY", default="")
EMAIL_BACKEND = config(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = config(
    "DEFAULT_FROM_EMAIL",
    default="ĐKMH <onboarding@resend.dev>",
)

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Hệ Thống Đăng Ký Môn Học API",
    "DESCRIPTION": "REST API cho hệ thống đăng ký môn học (Admin / Sinh viên / Giáo viên).",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# CORS: nếu env CORS_ALLOWED_ORIGINS = "*" → cho phép mọi origin (dùng cho dev/test).
# Production nên set danh sách URL cụ thể, vd. "https://app.vercel.app,https://dkmh.id.vn".
_cors_raw = config("CORS_ALLOWED_ORIGINS", default="http://localhost:5173,http://localhost:3000")
if _cors_raw.strip() == "*":
    CORS_ALLOW_ALL_ORIGINS = True
    CORS_ALLOWED_ORIGINS = []
else:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]

# --- Business rules (plan §5 - các giá trị tạm, có thể override qua env) ---
REGISTRATION_MIN_CREDITS_PER_SEMESTER = config("REG_MIN_CREDITS", default=1, cast=int)
REGISTRATION_MAX_CREDITS_PER_SEMESTER = config("REG_MAX_CREDITS", default=24, cast=int)
# Số ngày sau khi mở đăng ký, sinh viên vẫn được hủy reg đã CONFIRMED
REGISTRATION_CANCEL_GRACE_DAYS = config("REG_CANCEL_GRACE_DAYS", default=14, cast=int)
# Số ngày sau khi học kỳ kết thúc, GV vẫn được cập nhật điểm
GRADE_UPDATE_GRACE_DAYS = config("GRADE_UPDATE_GRACE_DAYS", default=30, cast=int)
# Điểm tối thiểu để coi 1 môn là PASSED (dùng cho check tiên quyết)
GRADE_PASSING_SCORE = config("GRADE_PASSING_SCORE", default=5.0, cast=float)
