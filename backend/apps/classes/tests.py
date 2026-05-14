from datetime import timedelta

import pytest
from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.classes.models import ClassSection, Schedule
from apps.curriculums.models import Curriculum, CurriculumCourse
from apps.majors.models import Major
from apps.notifications.models import Notification
from apps.profiles.models import TeacherProfile
from apps.registrations.models import Registration


def _admin_api(admin_user):
    client = APIClient()
    client.force_authenticate(admin_user)
    return client


def _class_section(course, semester, teacher, code):
    return ClassSection.objects.create(
        code=code,
        course=course,
        semester=semester,
        teacher=teacher,
        periods_per_session=3,
        max_students=50,
        status=ClassSection.Status.OPEN,
    )


def _teacher(username):
    user = User.objects.create_user(username=username, password="pass", role=Role.TEACHER)
    return TeacherProfile.objects.create(
        user=user,
        teacher_code=username.upper(),
        department="Khoa CNTT",
    )


@pytest.fixture
def other_teacher(db):
    return _teacher("gv_other")


@pytest.fixture
def class_with_student(
    open_semester, teacher_profile, student_profile, course_factory, class_section_factory
):
    course = course_factory()
    cs = class_section_factory(course, teacher=teacher_profile)
    Registration.objects.create(
        student=student_profile,
        class_section=cs,
        semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    return cs


def _api_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def test_teacher_can_notify_own_class(class_with_student, teacher_profile, student_user):
    api = _api_for(teacher_profile.user)
    res = api.post(
        f"/api/class-sections/{class_with_student.id}/notify/",
        {
            "title": "Đổi lịch học tuần sau",
            "body": "Tuần sau lớp đổi sang phòng B5.10 thay vì A1.01.",
            "category": "SCHEDULE",
        },
        format="json",
    )

    assert res.status_code == 201, res.data
    assert res.data["recipient_count"] == 1
    assert res.data["class_code"] == class_with_student.code

    noti = Notification.objects.get(id=res.data["notification"]["id"])
    assert noti.audience == "SPECIFIC"
    assert noti.sender == teacher_profile.user
    assert student_user in noti.recipients.all()


def test_teacher_cannot_notify_other_class(class_with_student, other_teacher):
    api = _api_for(other_teacher.user)
    res = api.post(
        f"/api/class-sections/{class_with_student.id}/notify/",
        {"title": "Hello", "body": "Test"},
        format="json",
    )

    assert res.status_code == 403
    assert "không phụ trách" in str(res.data).lower()


def test_admin_can_notify_any_class(class_with_student, admin_user):
    api = _api_for(admin_user)
    res = api.post(
        f"/api/class-sections/{class_with_student.id}/notify/",
        {"title": "Admin notice", "body": "Test from admin"},
        format="json",
    )

    assert res.status_code == 201
    assert res.data["recipient_count"] == 1


def test_student_cannot_notify_class(class_with_student, student_user):
    api = _api_for(student_user)
    res = api.post(
        f"/api/class-sections/{class_with_student.id}/notify/",
        {"title": "Hi", "body": "Test"},
        format="json",
    )

    assert res.status_code == 403


def test_notify_validation_missing_title(class_with_student, teacher_profile):
    api = _api_for(teacher_profile.user)
    res = api.post(
        f"/api/class-sections/{class_with_student.id}/notify/",
        {"body": "Test no title"},
        format="json",
    )

    assert res.status_code == 400
    assert "tiêu đề" in str(res.data).lower()


def test_notify_empty_class_returns_400(
    teacher_profile, course_factory, class_section_factory
):
    course = course_factory()
    cs = class_section_factory(course, teacher=teacher_profile)
    api = _api_for(teacher_profile.user)
    res = api.post(
        f"/api/class-sections/{cs.id}/notify/",
        {"title": "Hi", "body": "Test"},
        format="json",
    )

    assert res.status_code == 400
    assert "chưa có sinh viên" in str(res.data).lower()


def test_admin_cannot_create_schedule_outside_semester(admin_user, open_semester, teacher_profile, course_factory):
    client = _admin_api(admin_user)
    cs = _class_section(course_factory(code="SCH101"), open_semester, teacher_profile, "SCH101.01")

    res = client.post(
        "/api/schedules/",
        {
            "class_section": cs.id,
            "weekday": Schedule.Weekday.MONDAY,
            "session": Schedule.Session.MORNING,
            "start_period": 1,
            "room": "A1.01",
            "start_date": (open_semester.start_date - timedelta(days=1)).isoformat(),
            "end_date": (open_semester.start_date + timedelta(days=30)).isoformat(),
        },
        format="json",
    )

    assert res.status_code == 400
    assert "start_date" in res.data


def test_admin_cannot_create_schedule_when_room_periods_overlap(
    admin_user, open_semester, teacher_profile, course_factory
):
    client = _admin_api(admin_user)
    other_teacher = _teacher("gv_room")
    cs1 = _class_section(course_factory(code="ROOM101"), open_semester, teacher_profile, "ROOM101.01")
    cs2 = _class_section(course_factory(code="ROOM102"), open_semester, other_teacher, "ROOM102.01")
    Schedule.objects.create(
        class_section=cs1,
        weekday=Schedule.Weekday.MONDAY,
        session=Schedule.Session.MORNING,
        start_period=1,
        room="A1.01",
        start_date=open_semester.start_date,
        end_date=open_semester.start_date + timedelta(days=60),
    )

    res = client.post(
        "/api/schedules/",
        {
            "class_section": cs2.id,
            "weekday": Schedule.Weekday.MONDAY,
            "session": Schedule.Session.MORNING,
            "start_period": 2,
            "room": "A1.01",
            "start_date": open_semester.start_date.isoformat(),
            "end_date": (open_semester.start_date + timedelta(days=60)).isoformat(),
        },
        format="json",
    )

    assert res.status_code == 400
    assert "room" in res.data


def test_admin_cannot_create_schedule_when_teacher_periods_overlap(
    admin_user, open_semester, teacher_profile, course_factory
):
    client = _admin_api(admin_user)
    cs1 = _class_section(course_factory(code="TEA101"), open_semester, teacher_profile, "TEA101.01")
    cs2 = _class_section(course_factory(code="TEA102"), open_semester, teacher_profile, "TEA102.01")
    Schedule.objects.create(
        class_section=cs1,
        weekday=Schedule.Weekday.MONDAY,
        session=Schedule.Session.MORNING,
        start_period=1,
        room="A1.01",
        start_date=open_semester.start_date,
        end_date=open_semester.start_date + timedelta(days=60),
    )

    res = client.post(
        "/api/schedules/",
        {
            "class_section": cs2.id,
            "weekday": Schedule.Weekday.MONDAY,
            "session": Schedule.Session.MORNING,
            "start_period": 2,
            "room": "B1.01",
            "start_date": open_semester.start_date.isoformat(),
            "end_date": (open_semester.start_date + timedelta(days=60)).isoformat(),
        },
        format="json",
    )

    assert res.status_code == 400
    assert "teacher" in res.data


def test_admin_can_reuse_same_room_and_period_when_date_ranges_do_not_overlap(
    admin_user, open_semester, teacher_profile, course_factory
):
    client = _admin_api(admin_user)
    other_teacher = _teacher("gv_room_ok")
    cs1 = _class_section(course_factory(code="ROOM201"), open_semester, teacher_profile, "ROOM201.01")
    cs2 = _class_section(course_factory(code="ROOM202"), open_semester, other_teacher, "ROOM202.01")
    Schedule.objects.create(
        class_section=cs1,
        weekday=Schedule.Weekday.MONDAY,
        session=Schedule.Session.MORNING,
        start_period=1,
        room="A1.01",
        start_date=open_semester.start_date,
        end_date=open_semester.start_date + timedelta(days=20),
    )

    res = client.post(
        "/api/schedules/",
        {
            "class_section": cs2.id,
            "weekday": Schedule.Weekday.MONDAY,
            "session": Schedule.Session.MORNING,
            "start_period": 2,
            "room": "A1.01",
            "start_date": (open_semester.start_date + timedelta(days=21)).isoformat(),
            "end_date": (open_semester.start_date + timedelta(days=50)).isoformat(),
        },
        format="json",
    )

    assert res.status_code == 201, res.data


def test_admin_create_class_with_invalid_primary_schedule_rolls_back_class(
    admin_user, open_semester, teacher_profile, course_factory
):
    client = _admin_api(admin_user)
    existing = _class_section(
        course_factory(code="ATOMIC101"),
        open_semester,
        teacher_profile,
        "ATOMIC101.01",
    )
    Schedule.objects.create(
        class_section=existing,
        weekday=Schedule.Weekday.MONDAY,
        session=Schedule.Session.MORNING,
        start_period=1,
        room="A2.01",
        start_date=open_semester.start_date,
        end_date=open_semester.start_date + timedelta(days=60),
    )

    res = client.post(
        "/api/class-sections/",
        {
            "code": "ATOMIC102.01",
            "course": course_factory(code="ATOMIC102").id,
            "semester": open_semester.id,
            "teacher": teacher_profile.id,
            "periods_per_session": 3,
            "max_students": 50,
            "status": ClassSection.Status.OPEN,
            "note": "",
            "primary_schedule": {
                "weekday": Schedule.Weekday.MONDAY,
                "session": Schedule.Session.MORNING,
                "start_period": 2,
                "room": "B2.01",
                "start_date": open_semester.start_date.isoformat(),
                "end_date": (open_semester.start_date + timedelta(days=60)).isoformat(),
            },
        },
        format="json",
    )

    assert res.status_code == 400
    assert "teacher" in res.data
    assert not ClassSection.objects.filter(code="ATOMIC102.01").exists()


def test_admin_update_class_with_invalid_primary_schedule_rolls_back_class(
    admin_user, open_semester, teacher_profile, course_factory
):
    client = _admin_api(admin_user)
    existing = _class_section(
        course_factory(code="ROLL101"),
        open_semester,
        teacher_profile,
        "ROLL101.01",
    )
    Schedule.objects.create(
        class_section=existing,
        weekday=Schedule.Weekday.MONDAY,
        session=Schedule.Session.MORNING,
        start_period=1,
        room="A3.01",
        start_date=open_semester.start_date,
        end_date=open_semester.start_date + timedelta(days=60),
    )
    target = _class_section(
        course_factory(code="ROLL102"),
        open_semester,
        teacher_profile,
        "ROLL102.01",
    )
    target.note = "before"
    target.save(update_fields=["note"])

    res = client.patch(
        f"/api/class-sections/{target.id}/",
        {
            "note": "after",
            "primary_schedule": {
                "weekday": Schedule.Weekday.MONDAY,
                "session": Schedule.Session.MORNING,
                "start_period": 2,
                "room": "B3.01",
                "start_date": open_semester.start_date.isoformat(),
                "end_date": (open_semester.start_date + timedelta(days=60)).isoformat(),
            },
        },
        format="json",
    )

    assert res.status_code == 400
    assert "teacher" in res.data
    target.refresh_from_db()
    assert target.note == "before"


def test_admin_can_filter_classes_by_teacher_department_major_and_room(
    admin_user, open_semester, teacher_profile, course_factory
):
    client = _admin_api(admin_user)
    cntt = Major.objects.create(code="CNTTCLS", name="Cong nghe thong tin", department="Khoa CNTT")
    kt = Major.objects.create(code="KTCLS", name="Kinh te", department="Khoa Kinh te")
    cntt_curriculum = Curriculum.objects.create(
        major=cntt,
        code="CNTTCLS-2026",
        name="CTDT CNTT 2026",
        cohort_year=2026,
    )
    kt_curriculum = Curriculum.objects.create(
        major=kt,
        code="KTCLS-2026",
        name="CTDT KT 2026",
        cohort_year=2026,
    )
    cntt_course = course_factory(code="CLS101")
    kt_course = course_factory(code="CLS102")
    CurriculumCourse.objects.create(curriculum=cntt_curriculum, course=cntt_course)
    CurriculumCourse.objects.create(curriculum=kt_curriculum, course=kt_course)
    kt_teacher_user = User.objects.create_user(username="gv_cls_kt", password="pass", role=Role.TEACHER)
    kt_teacher = TeacherProfile.objects.create(
        user=kt_teacher_user,
        teacher_code="GV-CLS-KT",
        department="Khoa Kinh te",
    )
    cntt_class = _class_section(cntt_course, open_semester, teacher_profile, "CLS101.01")
    kt_class = _class_section(kt_course, open_semester, kt_teacher, "CLS102.01")
    Schedule.objects.create(class_section=cntt_class, weekday=0, session=Schedule.Session.MORNING, start_period=1, room="A1.01")
    Schedule.objects.create(class_section=kt_class, weekday=1, session=Schedule.Session.MORNING, start_period=1, room="B2.02")

    by_teacher = client.get("/api/class-sections/", {"teacher": teacher_profile.id})
    by_department = client.get("/api/class-sections/", {"department": "Khoa CNTT"})
    by_major = client.get("/api/class-sections/", {"major": cntt.id})
    by_room_search = client.get("/api/class-sections/", {"search": "A1.01"})

    assert [c["code"] for c in by_teacher.data["results"]] == ["CLS101.01"]
    assert [c["code"] for c in by_department.data["results"]] == ["CLS101.01"]
    assert [c["code"] for c in by_major.data["results"]] == ["CLS101.01"]
    assert [c["code"] for c in by_room_search.data["results"]] == ["CLS101.01"]
