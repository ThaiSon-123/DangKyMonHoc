"""Tests cho flow quên mật khẩu qua email + PIN."""
from django.core import mail
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.accounts.password_reset import _pin_cache_key


def test_forgot_password_sends_pin_email_to_student(db):
    cache.clear()
    mail.outbox = []
    User.objects.create_user(
        username="sv001",
        email="sv001@school.edu.vn",
        password="oldpass123",
        role=Role.STUDENT,
        full_name="SV Test",
    )
    client = APIClient()

    res = client.post(
        "/api/auth/forgot-password/",
        {"email": "sv001@school.edu.vn"},
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK
    assert len(mail.outbox) == 1
    msg = mail.outbox[0]
    assert "sv001@school.edu.vn" in msg.to
    assert "Mã xác thực" in msg.subject
    # PIN 6 số trong cache
    pin = cache.get(_pin_cache_key("sv001@school.edu.vn"))
    assert pin is not None
    assert len(pin) == 6
    assert pin.isdigit()
    # PIN có trong body email
    assert pin in msg.body


def test_forgot_password_returns_404_when_email_not_found(db):
    """Email không tồn tại → 404 + thông báo tiếng Việt."""
    cache.clear()
    mail.outbox = []
    client = APIClient()

    res = client.post(
        "/api/auth/forgot-password/",
        {"email": "nonexistent@example.com"},
        format="json",
    )

    assert res.status_code == status.HTTP_404_NOT_FOUND
    assert "không tồn tại" in res.data["detail"].lower()
    assert len(mail.outbox) == 0


def test_forgot_password_returns_403_for_admin_account(db):
    """Admin không được dùng flow này → 403 + thông báo tiếng Việt."""
    cache.clear()
    mail.outbox = []
    User.objects.create_user(
        username="admin1",
        email="admin@school.edu.vn",
        password="adminpass",
        role=Role.ADMIN,
    )
    client = APIClient()

    res = client.post(
        "/api/auth/forgot-password/",
        {"email": "admin@school.edu.vn"},
        format="json",
    )

    assert res.status_code == status.HTTP_403_FORBIDDEN
    assert "quản trị" in res.data["detail"].lower()
    assert len(mail.outbox) == 0


def test_forgot_password_returns_403_for_locked_account(db):
    """Tài khoản bị khoá → 403 + thông báo tiếng Việt."""
    cache.clear()
    mail.outbox = []
    User.objects.create_user(
        username="sv_locked",
        email="locked@school.edu.vn",
        password="pass",
        role=Role.STUDENT,
        is_locked=True,
    )
    client = APIClient()

    res = client.post(
        "/api/auth/forgot-password/",
        {"email": "locked@school.edu.vn"},
        format="json",
    )

    assert res.status_code == status.HTTP_403_FORBIDDEN
    assert "khóa" in res.data["detail"].lower() or "khoá" in res.data["detail"].lower()
    assert len(mail.outbox) == 0


def test_forgot_password_rate_limit_3_per_window(db):
    """Quá 3 request → trả 429."""
    cache.clear()
    User.objects.create_user(
        username="sv_rate",
        email="rate@school.edu.vn",
        password="pass",
        role=Role.STUDENT,
    )
    client = APIClient()

    # 3 lần đầu OK
    for _ in range(3):
        res = client.post(
            "/api/auth/forgot-password/",
            {"email": "rate@school.edu.vn"},
            format="json",
        )
        assert res.status_code == status.HTTP_200_OK

    # Lần 4 bị chặn
    res = client.post(
        "/api/auth/forgot-password/",
        {"email": "rate@school.edu.vn"},
        format="json",
    )
    assert res.status_code == status.HTTP_429_TOO_MANY_REQUESTS


def test_reset_password_with_valid_pin_updates_password(db):
    cache.clear()
    user = User.objects.create_user(
        username="sv_reset",
        email="reset@school.edu.vn",
        password="oldpass123",
        role=Role.STUDENT,
    )
    # Giả lập PIN đã được sinh
    cache.set(_pin_cache_key("reset@school.edu.vn"), "123456", timeout=600)
    client = APIClient()

    res = client.post(
        "/api/auth/reset-password/",
        {
            "email": "reset@school.edu.vn",
            "pin": "123456",
            "new_password": "newSecure456",
        },
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK
    user.refresh_from_db()
    assert user.check_password("newSecure456")
    assert not user.check_password("oldpass123")
    # PIN bị xoá sau khi reset thành công
    assert cache.get(_pin_cache_key("reset@school.edu.vn")) is None


def test_reset_password_rejects_wrong_pin(db):
    cache.clear()
    User.objects.create_user(
        username="sv_wrong_pin",
        email="wrong@school.edu.vn",
        password="oldpass",
        role=Role.STUDENT,
    )
    cache.set(_pin_cache_key("wrong@school.edu.vn"), "123456", timeout=600)
    client = APIClient()

    res = client.post(
        "/api/auth/reset-password/",
        {
            "email": "wrong@school.edu.vn",
            "pin": "999999",  # sai
            "new_password": "newpass1234",
        },
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "không đúng" in res.data["detail"].lower()


def test_reset_password_rejects_expired_pin(db):
    """Không có PIN trong cache (đã hết hạn hoặc chưa request)."""
    cache.clear()
    User.objects.create_user(
        username="sv_expired",
        email="expired@school.edu.vn",
        password="oldpass",
        role=Role.STUDENT,
    )
    # KHÔNG set PIN
    client = APIClient()

    res = client.post(
        "/api/auth/reset-password/",
        {
            "email": "expired@school.edu.vn",
            "pin": "123456",
            "new_password": "newpass1234",
        },
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST


def test_reset_password_pin_cannot_be_reused(db):
    """Sau khi reset thành công, PIN cũ không dùng lại được."""
    cache.clear()
    User.objects.create_user(
        username="sv_reuse",
        email="reuse@school.edu.vn",
        password="oldpass",
        role=Role.STUDENT,
    )
    cache.set(_pin_cache_key("reuse@school.edu.vn"), "654321", timeout=600)
    client = APIClient()

    # Reset lần 1 → OK
    res1 = client.post(
        "/api/auth/reset-password/",
        {
            "email": "reuse@school.edu.vn",
            "pin": "654321",
            "new_password": "firstNew123",
        },
        format="json",
    )
    assert res1.status_code == status.HTTP_200_OK

    # Reset lần 2 với cùng PIN → 400
    res2 = client.post(
        "/api/auth/reset-password/",
        {
            "email": "reuse@school.edu.vn",
            "pin": "654321",
            "new_password": "secondNew456",
        },
        format="json",
    )
    assert res2.status_code == status.HTTP_400_BAD_REQUEST


def test_reset_password_validates_password_strength(db):
    cache.clear()
    User.objects.create_user(
        username="sv_weak",
        email="weak@school.edu.vn",
        password="oldpass",
        role=Role.STUDENT,
    )
    cache.set(_pin_cache_key("weak@school.edu.vn"), "111111", timeout=600)
    client = APIClient()

    res = client.post(
        "/api/auth/reset-password/",
        {
            "email": "weak@school.edu.vn",
            "pin": "111111",
            "new_password": "123",  # quá ngắn
        },
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
