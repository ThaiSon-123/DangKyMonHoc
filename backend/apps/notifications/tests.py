from rest_framework.test import APIClient

from apps.accounts.models import Role, User
from apps.notifications.models import Notification, NotificationRead
from apps.profiles.models import TeacherProfile
from apps.registrations.models import Registration


def test_notification_list_can_filter_unread_for_current_user(admin_user):
    read = Notification.objects.create(
        title="Da doc",
        body="Thong bao da doc",
        audience=Notification.Audience.ALL,
        sender=admin_user,
    )
    unread = Notification.objects.create(
        title="Chua doc",
        body="Thong bao chua doc",
        audience=Notification.Audience.ALL,
        sender=admin_user,
    )
    NotificationRead.objects.create(notification=read, user=admin_user)
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.get("/api/notifications/", {"unread": "true"})

    assert res.status_code == 200
    assert [item["id"] for item in res.data["results"]] == [unread.id]


def test_student_can_send_specific_notification_to_teacher_of_registered_class(
    student_user,
    student_profile,
    teacher_user,
    teacher_profile,
    open_semester,
    course_factory,
    class_section_factory,
):
    course = course_factory(code="NOT101")
    class_section = class_section_factory(course, teacher=teacher_profile)
    Registration.objects.create(
        student=student_profile,
        class_section=class_section,
        semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    client = APIClient()
    client.force_authenticate(student_user)

    res = client.post(
        "/api/notifications/",
        {
            "title": "Xin nghỉ học",
            "body": "Em xin nghỉ buổi học hôm nay.",
            "category": Notification.Category.OTHER,
            "audience": Notification.Audience.SPECIFIC,
            "recipients": [teacher_user.id],
        },
        format="json",
    )

    assert res.status_code == 201, res.data
    notification = Notification.objects.get(id=res.data["id"])
    assert notification.sender == student_user
    assert list(notification.recipients.all()) == [teacher_user]


def test_student_cannot_send_notification_to_teacher_outside_registered_classes(
    student_user,
    student_profile,
    teacher_profile,
    open_semester,
    course_factory,
    class_section_factory,
):
    course = course_factory(code="NOT102")
    class_section = class_section_factory(course, teacher=teacher_profile)
    Registration.objects.create(
        student=student_profile,
        class_section=class_section,
        semester=open_semester,
        status=Registration.Status.CONFIRMED,
    )
    other_teacher_user = User.objects.create_user(
        username="gv_not_owner",
        password="pass",
        role=Role.TEACHER,
    )
    TeacherProfile.objects.create(
        user=other_teacher_user,
        teacher_code="GV-NOT-OWNER",
        department="Khoa CNTT",
    )
    client = APIClient()
    client.force_authenticate(student_user)

    res = client.post(
        "/api/notifications/",
        {
            "title": "Xin nghỉ học",
            "body": "Em xin nghỉ buổi học hôm nay.",
            "category": Notification.Category.OTHER,
            "audience": Notification.Audience.SPECIFIC,
            "recipients": [other_teacher_user.id],
        },
        format="json",
    )

    assert res.status_code == 400
    assert "lớp mình học" in str(res.data)


def test_student_cannot_send_notification_to_non_teacher(student_user, admin_user):
    client = APIClient()
    client.force_authenticate(student_user)

    res = client.post(
        "/api/notifications/",
        {
            "title": "Xin nghỉ học",
            "body": "Em xin nghỉ buổi học hôm nay.",
            "category": Notification.Category.OTHER,
            "audience": Notification.Audience.SPECIFIC,
            "recipients": [admin_user.id],
        },
        format="json",
    )

    assert res.status_code == 400
    assert "giáo viên" in str(res.data)
