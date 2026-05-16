from django.core.management import call_command
from openpyxl import Workbook
from rest_framework import status
from rest_framework.test import APIClient

from apps.courses.models import Course
from apps.curriculums.knowledge_blocks import classify_knowledge_block
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


def test_classify_curriculum_course_knowledge_blocks():
    thesis = Course(code="KTPM002", name="Báo cáo/Đồ án tốt nghiệp")
    elective = Course(code="KTPM011", name="Công nghệ .NET")
    general = Course(code="LING344", name="Toán cao cấp A1")
    basic = Course(code="LING020", name="Cơ sở dữ liệu")
    major = Course(code="KTPM004", name="Chất lượng và kiểm thử phần mềm")

    assert (
        classify_knowledge_block(thesis, is_required=True, suggested_semester=9)
        == CurriculumCourse.Knowledge.THESIS
    )
    assert (
        classify_knowledge_block(elective, is_required=False, suggested_semester=8)
        == CurriculumCourse.Knowledge.ELECTIVE
    )
    assert (
        classify_knowledge_block(general, is_required=True, suggested_semester=1)
        == CurriculumCourse.Knowledge.GENERAL
    )
    assert (
        classify_knowledge_block(basic, is_required=True, suggested_semester=2)
        == CurriculumCourse.Knowledge.BASIC
    )
    assert (
        classify_knowledge_block(major, is_required=True, suggested_semester=6)
        == CurriculumCourse.Knowledge.MAJOR
    )


def test_import_curriculum_xlsx_reads_required_column_by_header(tmp_path, major):
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.append(
        [
            "STT",
            "Mã MH",
            "Tên môn học",
            "Số tín chỉ",
            "Số tín chỉ học phí",
            "Môn bắt buộc",
            "Đã học",
            "Môn học đã học và đạt",
            "lý thuyết",
            "thực hành",
        ]
    )
    worksheet.append([None, None, "Học kỳ 1 - Năm học 2024 - 2025", 0, None, None, None, None, None, None])
    worksheet.append([1, "TEST101", "Nhập môn kiểm thử (2+0)", 2, 0, "x", None, None, 30, 0])
    path = tmp_path / "curriculum.xlsx"
    workbook.save(path)

    call_command(
        "import_curriculum_xlsx",
        str(path),
        major=major.code,
        cohort_year=2024,
        curriculum_code="TEST-HEADER-2024",
        curriculum_name="CTDT test header",
    )

    link = CurriculumCourse.objects.get(curriculum__code="TEST-HEADER-2024", course__code="TEST101")
    assert link.is_required is True
    assert link.knowledge_block == CurriculumCourse.Knowledge.BASIC
