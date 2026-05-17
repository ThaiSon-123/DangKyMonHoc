from rest_framework import status
from rest_framework.test import APIClient

from apps.courses.models import Course, Prerequisite
from apps.curriculums.models import Curriculum, CurriculumCourse
from apps.majors.models import Major


def _api_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_course_create_accepts_prerequisite_ids(admin_user):
    required = Course.objects.create(code="CS101", name="Nhap mon lap trinh")
    api = _api_for(admin_user)

    res = api.post(
        "/api/courses/",
        {
            "code": "CS201",
            "name": "Cau truc du lieu",
            "credits": 3,
            "theory_hours": 30,
            "practice_hours": 15,
            "prerequisite_ids": [required.id],
        },
        format="json",
    )

    assert res.status_code == status.HTTP_201_CREATED, res.data
    assert res.data["prerequisites_detail"][0]["required_course_code"] == "CS101"
    assert Prerequisite.objects.filter(
        course_id=res.data["id"],
        required_course=required,
    ).exists()


def test_course_duplicate_code_returns_plain_admin_message(admin_user):
    Course.objects.create(code="CS101", name="Nhap mon lap trinh")
    api = _api_for(admin_user)

    res = api.post(
        "/api/courses/",
        {
            "code": "CS101",
            "name": "Nhap mon lap trinh 2",
            "credits": 3,
            "theory_hours": 30,
            "practice_hours": 0,
        },
        format="json",
    )

    assert res.status_code == status.HTTP_400_BAD_REQUEST
    assert res.data["code"] == ["Mã môn học đã tồn tại"]


def test_course_update_replaces_prerequisite_ids(admin_user):
    old_required = Course.objects.create(code="CS101", name="Nhap mon lap trinh")
    new_required = Course.objects.create(code="MA101", name="Toan cao cap")
    course = Course.objects.create(code="CS201", name="Cau truc du lieu")
    Prerequisite.objects.create(course=course, required_course=old_required)
    api = _api_for(admin_user)

    res = api.patch(
        f"/api/courses/{course.id}/",
        {"prerequisite_ids": [new_required.id]},
        format="json",
    )

    assert res.status_code == status.HTTP_200_OK, res.data
    assert [p["required_course_code"] for p in res.data["prerequisites_detail"]] == ["MA101"]
    assert not Prerequisite.objects.filter(course=course, required_course=old_required).exists()
    assert Prerequisite.objects.filter(course=course, required_course=new_required).exists()


def test_course_list_filters_by_department_major_and_curriculum(admin_user):
    cntt = Major.objects.create(code="TSTCNTT", name="Cong nghe thong tin", department="Khoa CNTT")
    kt = Major.objects.create(code="TSTKT", name="Ke toan", department="Khoa Kinh te")
    cntt_curriculum = Curriculum.objects.create(
        major=cntt,
        code="CNTT-2024",
        name="CTDT CNTT 2024",
        cohort_year=2024,
    )
    kt_curriculum = Curriculum.objects.create(
        major=kt,
        code="KT-2024",
        name="CTDT KT 2024",
        cohort_year=2024,
    )
    algorithms = Course.objects.create(code="CS301", name="Thuat toan")
    accounting = Course.objects.create(code="AC101", name="Ke toan dai cuong")
    CurriculumCourse.objects.create(curriculum=cntt_curriculum, course=algorithms)
    CurriculumCourse.objects.create(curriculum=kt_curriculum, course=accounting)
    api = _api_for(admin_user)

    by_department = api.get("/api/courses/", {"department": "Khoa CNTT"})
    by_major = api.get("/api/courses/", {"major": cntt.id})
    by_curriculum = api.get("/api/courses/", {"curriculum": cntt_curriculum.id})

    assert [c["code"] for c in by_department.data["results"]] == ["CS301"]
    assert [c["code"] for c in by_major.data["results"]] == ["CS301"]
    assert [c["code"] for c in by_curriculum.data["results"]] == ["CS301"]
