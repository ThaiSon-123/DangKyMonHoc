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


# ---------- Mở học kỳ → mở lại các lớp HP đã bị đóng ----------

def test_open_semester_action_reopens_closed_class_sections(
    admin_user, closed_semester, teacher_profile, course_factory
):
    """Khi admin mở học kỳ, các lớp CLOSED (có teacher) tự chuyển sang OPEN."""
    client = APIClient()
    client.force_authenticate(admin_user)
    closed_class = ClassSection.objects.create(
        code="SEM-OPEN-CLOSED.01",
        course=course_factory(code="SEM-OPEN-CLOSED"),
        semester=closed_semester,
        teacher=teacher_profile,
        status=ClassSection.Status.CLOSED,
    )
    # DRAFT giữ nguyên, không tự mở
    draft_class = ClassSection.objects.create(
        code="SEM-OPEN-DRAFT.01",
        course=course_factory(code="SEM-OPEN-DRAFT"),
        semester=closed_semester,
        teacher=teacher_profile,
        status=ClassSection.Status.DRAFT,
    )
    # CANCELLED giữ nguyên
    cancelled_class = ClassSection.objects.create(
        code="SEM-OPEN-CANCEL.01",
        course=course_factory(code="SEM-OPEN-CANCEL"),
        semester=closed_semester,
        teacher=teacher_profile,
        status=ClassSection.Status.CANCELLED,
    )
    # CLOSED nhưng KHÔNG có teacher → giữ CLOSED (Plan §7.2: OPEN cần teacher)
    closed_no_teacher = ClassSection.objects.create(
        code="SEM-OPEN-NOGV.01",
        course=course_factory(code="SEM-OPEN-NOGV"),
        semester=closed_semester,
        teacher=None,
        status=ClassSection.Status.CLOSED,
    )

    res = client.post(f"/api/semesters/{closed_semester.id}/open/")

    assert res.status_code == 200, res.data
    closed_semester.refresh_from_db()
    closed_class.refresh_from_db()
    draft_class.refresh_from_db()
    cancelled_class.refresh_from_db()
    closed_no_teacher.refresh_from_db()
    assert closed_semester.is_open is True
    assert closed_class.status == ClassSection.Status.OPEN, "CLOSED có teacher phải được mở lại"
    assert draft_class.status == ClassSection.Status.DRAFT, "DRAFT giữ nguyên"
    assert cancelled_class.status == ClassSection.Status.CANCELLED, "CANCELLED giữ nguyên"
    assert closed_no_teacher.status == ClassSection.Status.CLOSED, "Không teacher phải giữ CLOSED"


def test_patch_semester_open_reopens_closed_class_sections(
    admin_user, closed_semester, teacher_profile, course_factory
):
    """PATCH is_open=True cũng có behavior tương tự action /open/."""
    client = APIClient()
    client.force_authenticate(admin_user)
    closed_class = ClassSection.objects.create(
        code="SEM-PATCH-OPEN.01",
        course=course_factory(code="SEM-PATCH-OPEN"),
        semester=closed_semester,
        teacher=teacher_profile,
        status=ClassSection.Status.CLOSED,
    )

    res = client.patch(
        f"/api/semesters/{closed_semester.id}/",
        {"is_open": True},
        format="json",
    )

    assert res.status_code == 200, res.data
    closed_class.refresh_from_db()
    assert closed_class.status == ClassSection.Status.OPEN
