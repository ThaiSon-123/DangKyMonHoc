"""Tests cho:
1. Admin sửa username + reset password của SV/GV qua PATCH /api/accounts/users/{id}/
2. Self-service đổi mật khẩu qua POST /api/accounts/users/change-password/
"""
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import Role, User


# ───────────────────────── Admin update username + password ─────────────────────────


def test_admin_can_update_student_username(admin_user, student_user):
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.patch(
        f"/api/accounts/users/{student_user.id}/",
        {"username": "sv_new_username"},
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK, res.data
    student_user.refresh_from_db()
    assert student_user.username == "sv_new_username"


def test_admin_cannot_set_duplicate_username(admin_user, student_user, teacher_user):
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.patch(
        f"/api/accounts/users/{student_user.id}/",
        {"username": teacher_user.username},
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "username" in res.data or "Tên đăng nhập" in str(res.data)


def test_admin_can_reset_student_password(admin_user, student_user):
    client = APIClient()
    client.force_authenticate(admin_user)
    student_user.set_password("oldpass123")
    student_user.save()

    res = client.patch(
        f"/api/accounts/users/{student_user.id}/",
        {"password": "newpass789"},
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK, res.data
    student_user.refresh_from_db()
    assert student_user.check_password("newpass789")
    assert not student_user.check_password("oldpass123")


def test_admin_empty_password_means_no_change(admin_user, student_user):
    """Admin gửi password='' (rỗng) → KHÔNG đổi mật khẩu, giữ nguyên cũ."""
    client = APIClient()
    client.force_authenticate(admin_user)
    student_user.set_password("keepthispass")
    student_user.save()

    res = client.patch(
        f"/api/accounts/users/{student_user.id}/",
        {"password": "", "full_name": "Tên mới"},
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK, res.data
    student_user.refresh_from_db()
    assert student_user.check_password("keepthispass")
    assert student_user.full_name == "Tên mới"


def test_admin_password_min_length(admin_user, student_user):
    """Password < 8 ký tự → reject."""
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.patch(
        f"/api/accounts/users/{student_user.id}/",
        {"password": "abc"},
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST


def test_admin_password_not_returned_in_response(admin_user, student_user):
    """Password field là write_only → không leak ra response."""
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.patch(
        f"/api/accounts/users/{student_user.id}/",
        {"password": "newsecret123"},
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK
    assert "password" not in res.data


# ───────────────────────── Self-service change password ─────────────────────────


def test_student_can_change_own_password(student_user):
    student_user.set_password("oldpass123")
    student_user.save()
    client = APIClient()
    client.force_authenticate(student_user)

    res = client.post(
        "/api/accounts/users/change-password/",
        {"old_password": "oldpass123", "new_password": "newpass456"},
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK, res.data
    student_user.refresh_from_db()
    assert student_user.check_password("newpass456")


def test_teacher_can_change_own_password(teacher_user):
    teacher_user.set_password("teacherold")
    teacher_user.save()
    client = APIClient()
    client.force_authenticate(teacher_user)

    res = client.post(
        "/api/accounts/users/change-password/",
        {"old_password": "teacherold", "new_password": "teachernew1"},
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK
    teacher_user.refresh_from_db()
    assert teacher_user.check_password("teachernew1")


def test_change_password_rejects_wrong_old_password(student_user):
    student_user.set_password("correctold")
    student_user.save()
    client = APIClient()
    client.force_authenticate(student_user)

    res = client.post(
        "/api/accounts/users/change-password/",
        {"old_password": "wrongold", "new_password": "anynew1234"},
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "hiện tại" in res.data["detail"].lower() or "không đúng" in res.data["detail"].lower()
    student_user.refresh_from_db()
    assert student_user.check_password("correctold")  # KHÔNG đổi


def test_change_password_rejects_short_new_password(student_user):
    student_user.set_password("oldpass123")
    student_user.save()
    client = APIClient()
    client.force_authenticate(student_user)

    res = client.post(
        "/api/accounts/users/change-password/",
        {"old_password": "oldpass123", "new_password": "abc"},
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "8 ký tự" in res.data["detail"]


def test_change_password_rejects_same_as_old(student_user):
    student_user.set_password("samepass1")
    student_user.save()
    client = APIClient()
    client.force_authenticate(student_user)

    res = client.post(
        "/api/accounts/users/change-password/",
        {"old_password": "samepass1", "new_password": "samepass1"},
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "trùng" in res.data["detail"].lower() or "cũ" in res.data["detail"].lower()


def test_change_password_requires_authentication(db):
    """Không đăng nhập → 401."""
    client = APIClient()

    res = client.post(
        "/api/accounts/users/change-password/",
        {"old_password": "x", "new_password": "newpass123"},
        format="json",
    )

    assert res.status_code == status.HTTP_401_UNAUTHORIZED
