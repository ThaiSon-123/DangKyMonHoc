"""Shared fixtures for pytest-django."""

from datetime import date, timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import Role, User
from apps.classes.models import ClassSection, Schedule
from apps.courses.models import Course, Prerequisite
from apps.majors.models import Major
from apps.profiles.models import StudentProfile, TeacherProfile
from apps.registrations.models import Registration
from apps.semesters.models import Semester


# ---------- Users / Profiles ----------

@pytest.fixture
def admin_user(db):
    return User.objects.create_user(username="admin1", password="pass", role=Role.ADMIN, email="a@x.com")


@pytest.fixture
def teacher_user(db):
    return User.objects.create_user(username="gv001", password="pass", role=Role.TEACHER, email="gv001@x.com")


@pytest.fixture
def student_user(db):
    return User.objects.create_user(username="sv001", password="pass", role=Role.STUDENT, email="sv001@x.com")


@pytest.fixture
def major(db):
    obj, _ = Major.objects.get_or_create(
        code="CNTT", defaults={"name": "Cong nghe thong tin"}
    )
    return obj


@pytest.fixture
def student_profile(student_user, major):
    return StudentProfile.objects.create(
        user=student_user, student_code="21520001", major=major, enrollment_year=2021
    )


@pytest.fixture
def teacher_profile(teacher_user):
    return TeacherProfile.objects.create(
        user=teacher_user, teacher_code="GV001", department="Khoa CNTT"
    )


# ---------- Academic ----------

@pytest.fixture
def open_semester(db):
    today = date.today()
    return Semester.objects.create(
        code="2025-2026-HK2",
        name="HK2 2025-2026",
        term=Semester.Term.HK2,
        academic_year="2025-2026",
        start_date=today,
        end_date=today + timedelta(days=120),
        registration_start=timezone.now() - timedelta(days=1),
        registration_end=timezone.now() + timedelta(days=14),
        is_open=True,
    )


@pytest.fixture
def closed_semester(db):
    today = date.today()
    return Semester.objects.create(
        code="2025-2026-HK1",
        name="HK1 2025-2026",
        term=Semester.Term.HK1,
        academic_year="2025-2026",
        start_date=today - timedelta(days=200),
        end_date=today - timedelta(days=80),
        is_open=False,
    )


@pytest.fixture
def course_factory(db):
    counter = {"i": 0}

    def make(code=None, name=None, credits=3):
        counter["i"] += 1
        return Course.objects.create(
            code=code or f"CS{100 + counter['i']}",
            name=name or f"Course {counter['i']}",
            credits=credits,
        )

    return make


@pytest.fixture
def class_section_factory(db, open_semester, teacher_profile):
    counter = {"i": 0}

    def make(
        course, *, teacher=None, max_students=50, weekday=0,
        session=Schedule.Session.MORNING, start_period=1,
        periods_per_session=3, semester=None,
    ):
        counter["i"] += 1
        cs = ClassSection.objects.create(
            code=f"{course.code}.0{counter['i']}",
            course=course,
            semester=semester or open_semester,
            teacher=teacher if teacher is not None else teacher_profile,
            periods_per_session=periods_per_session,
            max_students=max_students,
            status=ClassSection.Status.OPEN,
        )
        Schedule.objects.create(
            class_section=cs,
            weekday=weekday,
            session=session,
            start_period=start_period,
            room="A1.01",
        )
        return cs

    return make
