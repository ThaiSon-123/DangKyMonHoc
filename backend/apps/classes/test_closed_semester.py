from rest_framework.test import APIClient

from apps.classes.models import ClassSection


def test_admin_cannot_open_class_section_in_closed_semester(
    admin_user, closed_semester, teacher_profile, course_factory
):
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.post(
        "/api/class-sections/",
        {
            "code": "CLOSED-SEM-OPEN.01",
            "course": course_factory(code="CLOSED-SEM-OPEN").id,
            "semester": closed_semester.id,
            "teacher": teacher_profile.id,
            "periods_per_session": 3,
            "max_students": 50,
            "status": ClassSection.Status.OPEN,
        },
        format="json",
    )

    assert res.status_code == 400
    assert "status" in res.data
