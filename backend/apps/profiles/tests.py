from decimal import Decimal

from rest_framework.test import APIClient

from apps.grades.models import Grade
from apps.registrations.models import Registration


def test_student_profile_me_returns_realtime_gpa_and_completed_credits(
    student_profile, student_user, open_semester, course_factory, class_section_factory
):
    student_profile.gpa = "0.00"
    student_profile.completed_credits = 0
    student_profile.save(update_fields=["gpa", "completed_credits"])
    passing_course = course_factory(code="PROF-PASS", credits=3)
    low_pass_course = course_factory(code="PROF-LOW-PASS", credits=2)
    failed_course = course_factory(code="PROF-FAIL", credits=4)
    registrations = []
    for course in (passing_course, low_pass_course, failed_course):
        class_section = class_section_factory(course)
        registrations.append(
            Registration.objects.create(
                student=student_profile,
                class_section=class_section,
                semester=open_semester,
                status=Registration.Status.CONFIRMED,
            )
        )
    Grade.objects.create(
        registration=registrations[0],
        process_score=Decimal("8.00"),
        midterm_score=Decimal("8.00"),
        final_score=Decimal("8.00"),
    )
    Grade.objects.create(
        registration=registrations[1],
        process_score=Decimal("4.00"),
        midterm_score=Decimal("4.00"),
        final_score=Decimal("4.00"),
    )
    Grade.objects.create(
        registration=registrations[2],
        process_score=Decimal("3.00"),
        midterm_score=Decimal("3.00"),
        final_score=Decimal("3.00"),
    )
    client = APIClient()
    client.force_authenticate(student_user)

    res = client.get("/api/students/me/")

    assert res.status_code == 200, res.data
    assert res.data["gpa"] == "4.89"
    assert res.data["completed_credits"] == 5
