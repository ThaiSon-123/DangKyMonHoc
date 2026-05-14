from rest_framework import status
from rest_framework.test import APIClient

from apps.courses.models import Course
from apps.curriculums.models import Curriculum, CurriculumCourse


def _api_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_curriculum_course_with_ktch_code_is_general_knowledge(admin_user, major):
    curriculum = Curriculum.objects.create(
        major=major,
        code="CNTT-KTCH-2026",
        name="CTDT CNTT 2026",
        cohort_year=2026,
    )
    course = Course.objects.create(code="KTCH014", name="Phap luat dai cuong")
    api = _api_for(admin_user)

    res = api.post(
        "/api/curriculum-courses/",
        {
            "curriculum": curriculum.id,
            "course": course.id,
            "knowledge_block": CurriculumCourse.Knowledge.MAJOR,
            "is_required": True,
            "suggested_semester": 1,
        },
        format="json",
    )

    assert res.status_code == status.HTTP_201_CREATED, res.data
    assert res.data["knowledge_block"] == CurriculumCourse.Knowledge.GENERAL
