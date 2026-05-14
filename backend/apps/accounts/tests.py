from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

from apps.accounts.models import Role, User
from apps.majors.models import Major
from apps.profiles.models import StudentProfile, TeacherProfile

LOCKED_ACCOUNT_MESSAGE = "Tài khoản bạn đã bị khóa. Vui lòng liên hệ admin!"


def test_locked_user_cannot_login(db):
    User.objects.create_user(
        username="sv_locked",
        password="pass",
        role=Role.STUDENT,
        is_locked=True,
    )
    client = APIClient()

    res = client.post("/api/auth/login/", {"username": "sv_locked", "password": "pass"})

    assert res.status_code == status.HTTP_401_UNAUTHORIZED
    assert res.data["detail"] == LOCKED_ACCOUNT_MESSAGE


def test_locked_user_login_shows_locked_message_even_with_wrong_password(db):
    User.objects.create_user(
        username="sv_locked_wrong_password",
        password="pass",
        role=Role.STUDENT,
        is_locked=True,
    )
    client = APIClient()

    res = client.post(
        "/api/auth/login/",
        {"username": "sv_locked_wrong_password", "password": "wrong"},
    )

    assert res.status_code == status.HTTP_401_UNAUTHORIZED
    assert res.data["detail"] == LOCKED_ACCOUNT_MESSAGE


def test_locked_user_cannot_use_existing_access_token(db):
    user = User.objects.create_user(
        username="sv_token",
        password="pass",
        role=Role.STUDENT,
    )
    token = AccessToken.for_user(user)
    user.is_locked = True
    user.save(update_fields=["is_locked"])
    client = APIClient()

    res = client.get("/api/accounts/users/me/", HTTP_AUTHORIZATION=f"Bearer {token}")

    assert res.status_code == status.HTTP_401_UNAUTHORIZED
    assert res.data["detail"] == LOCKED_ACCOUNT_MESSAGE


def test_locked_user_cannot_refresh_existing_token(db):
    user = User.objects.create_user(
        username="sv_refresh",
        password="pass",
        role=Role.STUDENT,
    )
    refresh = RefreshToken.for_user(user)
    user.is_locked = True
    user.save(update_fields=["is_locked"])
    client = APIClient()

    res = client.post("/api/auth/refresh/", {"refresh": str(refresh)})

    assert res.status_code == status.HTTP_401_UNAUTHORIZED
    assert res.data["detail"] == LOCKED_ACCOUNT_MESSAGE


def test_admin_cannot_create_student_without_major(admin_user):
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.post(
        "/api/accounts/users/",
        {
            "username": "sv_no_major",
            "password": "password123",
            "role": Role.STUDENT,
        },
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "student_major" in res.data


def test_admin_create_student_creates_profile_with_major(admin_user, major):
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.post(
        "/api/accounts/users/",
        {
            "username": "sv_with_major",
            "password": "password123",
            "role": Role.STUDENT,
            "student_major": major.id,
        },
        format="json",
    )

    assert res.status_code == status.HTTP_201_CREATED
    profile = StudentProfile.objects.get(user__username="sv_with_major")
    assert profile.major == major
    assert profile.student_code == "sv_with_major"


def test_admin_cannot_create_teacher_without_department(admin_user):
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.post(
        "/api/accounts/users/",
        {
            "username": "gv_no_department",
            "password": "password123",
            "role": Role.TEACHER,
        },
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert "teacher_department" in res.data


def test_admin_create_teacher_creates_profile_with_department(admin_user):
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.post(
        "/api/accounts/users/",
        {
            "username": "gv_with_dept",
            "password": "password123",
            "role": Role.TEACHER,
            "teacher_department": "Khoa Cong nghe thong tin",
        },
        format="json",
    )

    assert res.status_code == status.HTTP_201_CREATED
    profile = TeacherProfile.objects.get(user__username="gv_with_dept")
    assert profile.department == "Khoa Cong nghe thong tin"
    assert profile.teacher_code == "gv_with_dept"


def test_admin_update_student_major_updates_profile(admin_user, student_user, student_profile):
    new_major = Major.objects.create(code="QTKD", name="Quan tri kinh doanh")
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.patch(
        f"/api/accounts/users/{student_user.id}/",
        {"student_major": new_major.id},
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK
    student_profile.refresh_from_db()
    assert student_profile.major == new_major


def test_admin_update_teacher_department_updates_profile(admin_user, teacher_user, teacher_profile):
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.patch(
        f"/api/accounts/users/{teacher_user.id}/",
        {"teacher_department": "Khoa Toan"},
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK
    teacher_profile.refresh_from_db()
    assert teacher_profile.department == "Khoa Toan"


def test_admin_can_lock_existing_student_without_profile(admin_user, db):
    student = User.objects.create_user(username="sv_legacy", password="pass", role=Role.STUDENT)
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.patch(
        f"/api/accounts/users/{student.id}/",
        {"is_locked": True},
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK
    student.refresh_from_db()
    assert student.is_locked is True


def test_admin_can_filter_users_by_department(admin_user, db):
    cntt = Major.objects.create(code="CNTT2", name="Cong nghe thong tin", department="Khoa CNTT")
    kinh_te = Major.objects.create(code="KT2", name="Kinh te", department="Khoa Kinh te")
    cntt_user = User.objects.create_user(username="sv_cntt", password="pass", role=Role.STUDENT)
    kt_user = User.objects.create_user(username="sv_kt", password="pass", role=Role.STUDENT)
    teacher_user = User.objects.create_user(username="gv_cntt", password="pass", role=Role.TEACHER)
    StudentProfile.objects.create(user=cntt_user, student_code="SV-CNTT", major=cntt, enrollment_year=2026)
    StudentProfile.objects.create(user=kt_user, student_code="SV-KT", major=kinh_te, enrollment_year=2026)
    TeacherProfile.objects.create(user=teacher_user, teacher_code="GV-CNTT", department="Khoa CNTT")
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.get("/api/accounts/users/", {"department": "Khoa CNTT"})

    assert res.status_code == status.HTTP_200_OK
    assert {u["username"] for u in res.data["results"]} == {"sv_cntt", "gv_cntt"}


def test_admin_can_filter_users_by_student_major(admin_user, db):
    cntt = Major.objects.create(code="CNTT3", name="Cong nghe thong tin", department="Khoa CNTT")
    kinh_te = Major.objects.create(code="KT3", name="Kinh te", department="Khoa Kinh te")
    cntt_user = User.objects.create_user(username="sv_major_cntt", password="pass", role=Role.STUDENT)
    kt_user = User.objects.create_user(username="sv_major_kt", password="pass", role=Role.STUDENT)
    StudentProfile.objects.create(user=cntt_user, student_code="SV-M-CNTT", major=cntt, enrollment_year=2026)
    StudentProfile.objects.create(user=kt_user, student_code="SV-M-KT", major=kinh_te, enrollment_year=2026)
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.get("/api/accounts/users/", {"major": cntt.id})

    assert res.status_code == status.HTTP_200_OK
    assert [u["username"] for u in res.data["results"]] == ["sv_major_cntt"]
