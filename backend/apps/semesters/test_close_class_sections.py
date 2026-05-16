from rest_framework.test import APIClient

from apps.classes.models import ClassSection


def test_close_semester_action_closes_class_sections(
    admin_user, open_semester, teacher_profile, course_factory
):
    client = APIClient()
    client.force_authenticate(admin_user)
    open_class = ClassSection.objects.create(
        code="SEM-CLOSE-OPEN.01",
        course=course_factory(code="SEM-CLOSE-OPEN"),
        semester=open_semester,
        teacher=teacher_profile,
        status=ClassSection.Status.OPEN,
    )
    draft_class = ClassSection.objects.create(
        code="SEM-CLOSE-DRAFT.01",
        course=course_factory(code="SEM-CLOSE-DRAFT"),
        semester=open_semester,
        teacher=teacher_profile,
        status=ClassSection.Status.DRAFT,
    )
    cancelled_class = ClassSection.objects.create(
        code="SEM-CLOSE-CANCEL.01",
        course=course_factory(code="SEM-CLOSE-CANCEL"),
        semester=open_semester,
        teacher=teacher_profile,
        status=ClassSection.Status.CANCELLED,
    )

    res = client.post(f"/api/semesters/{open_semester.id}/close/")

    assert res.status_code == 200, res.data
    open_semester.refresh_from_db()
    open_class.refresh_from_db()
    draft_class.refresh_from_db()
    cancelled_class.refresh_from_db()
    assert open_semester.is_open is False
    assert open_class.status == ClassSection.Status.CLOSED
    assert draft_class.status == ClassSection.Status.CLOSED
    assert cancelled_class.status == ClassSection.Status.CANCELLED


def test_patch_semester_closed_closes_class_sections(
    admin_user, open_semester, teacher_profile, course_factory
):
    client = APIClient()
    client.force_authenticate(admin_user)
    class_section = ClassSection.objects.create(
        code="SEM-PATCH-CLOSE.01",
        course=course_factory(code="SEM-PATCH-CLOSE"),
        semester=open_semester,
        teacher=teacher_profile,
        status=ClassSection.Status.OPEN,
    )

    res = client.patch(
        f"/api/semesters/{open_semester.id}/",
        {"is_open": False},
        format="json",
    )

    assert res.status_code == 200, res.data
    class_section.refresh_from_db()
    assert class_section.status == ClassSection.Status.CLOSED
