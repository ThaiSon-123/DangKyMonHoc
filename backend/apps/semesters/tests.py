from datetime import date, datetime, timedelta

from django.utils import timezone
from rest_framework.test import APIClient

from apps.semesters.models import Semester


def test_admin_cannot_create_semester_when_end_date_is_not_after_start_date(admin_user):
    client = APIClient()
    client.force_authenticate(admin_user)
    start = date.today()

    res = client.post(
        "/api/semesters/",
        {
            "code": "INVALID-DATE",
            "name": "Invalid date",
            "term": Semester.Term.HK1,
            "academic_year": "2026-2027",
            "start_date": start.isoformat(),
            "end_date": start.isoformat(),
        },
        format="json",
    )

    assert res.status_code == 400
    assert "end_date" in res.data


def test_admin_cannot_patch_semester_to_invalid_date_range(admin_user, open_semester):
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.patch(
        f"/api/semesters/{open_semester.id}/",
        {"end_date": (open_semester.start_date - timedelta(days=1)).isoformat()},
        format="json",
    )

    assert res.status_code == 400
    assert "end_date" in res.data


def test_admin_can_set_registration_window_before_semester_start(admin_user):
    client = APIClient()
    client.force_authenticate(admin_user)
    start = date.today() + timedelta(days=30)
    registration_start = timezone.make_aware(datetime.combine(start - timedelta(days=14), datetime.min.time()))
    registration_end = timezone.make_aware(datetime.combine(start - timedelta(days=1), datetime.min.time()))

    res = client.post(
        "/api/semesters/",
        {
            "code": "REG-BEFORE-SEM",
            "name": "Registration before semester",
            "term": Semester.Term.HK2,
            "academic_year": "2026-2027",
            "start_date": start.isoformat(),
            "end_date": (start + timedelta(days=120)).isoformat(),
            "registration_start": registration_start.isoformat(),
            "registration_end": registration_end.isoformat(),
        },
        format="json",
    )

    assert res.status_code == 201, res.data
