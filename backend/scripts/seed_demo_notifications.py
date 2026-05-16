"""Seed demo notifications for admin, teachers, and students.

Run inside Docker backend container:
python manage.py shell -c "exec(open('/app/scripts/seed_demo_notifications.py', encoding='utf-8').read())"
"""

from django.db import models, transaction
from django.db.models import Q

from apps.accounts.models import Role, User
from apps.notifications.models import Notification
from apps.registrations.models import Registration


def create_notification(title, body, category, audience, sender, recipients=None):
    notification = Notification.objects.create(
        title=title,
        body=body,
        category=category,
        audience=audience,
        sender=sender,
    )
    if recipients:
        notification.recipients.set(recipients)
    return notification


def first_admin():
    admin = User.objects.filter(role=Role.ADMIN, is_active=True).order_by("id").first()
    if not admin:
        raise RuntimeError("Không tìm thấy tài khoản admin active để gửi thông báo demo.")
    return admin


def seed_admin_notifications(admin):
    create_notification(
        title="Mở đăng ký học phần học kỳ 1 năm 2026-2027",
        body=(
            "Phòng đào tạo thông báo sinh viên kiểm tra chương trình đào tạo, lớp học phần "
            "và thực hiện đăng ký môn trong thời gian quy định. Sinh viên cần hoàn tất đăng ký "
            "trước khi cổng đóng."
        ),
        category=Notification.Category.REGISTRATION,
        audience=Notification.Audience.ALL_STUDENTS,
        sender=admin,
    )
    create_notification(
        title="Rà soát lớp học phần và danh sách sinh viên đăng ký",
        body=(
            "Giảng viên vui lòng kiểm tra lớp học phần được phân công, thời khóa biểu, phòng học "
            "và danh sách sinh viên. Các sai lệch cần phản hồi cho phòng đào tạo trước khi học kỳ bắt đầu."
        ),
        category=Notification.Category.CLASS,
        audience=Notification.Audience.ALL_TEACHERS,
        sender=admin,
    )


def seed_teacher_to_class_notifications():
    registrations = (
        Registration.objects.filter(
            status=Registration.Status.CONFIRMED,
            class_section__teacher__isnull=False,
        )
        .select_related(
            "class_section",
            "class_section__course",
            "class_section__teacher__user",
            "student__user",
        )
        .order_by("class_section__teacher__teacher_code", "class_section__code", "student__student_code")
    )

    seen_classes = set()
    created = 0
    for registration in registrations:
        class_section = registration.class_section
        if class_section.id in seen_classes:
            continue
        class_regs = list(
            Registration.objects.filter(
                class_section=class_section,
                status=Registration.Status.CONFIRMED,
            )
            .select_related("student__user")
            .order_by("student__student_code")
        )
        recipients = [item.student.user for item in class_regs]
        if not recipients:
            continue
        sender = class_section.teacher.user
        create_notification(
            title=f"{class_section.code} - Nhắc sinh viên chuẩn bị buổi học",
            body=(
                f"Giảng viên thông báo lớp {class_section.code} môn {class_section.course.name}: "
                "sinh viên xem lại đề cương, chuẩn bị tài liệu học tập và theo dõi thời khóa biểu "
                "trên hệ thống trước khi đến lớp."
            ),
            category=Notification.Category.CLASS,
            audience=Notification.Audience.SPECIFIC,
            sender=sender,
            recipients=recipients,
        )
        seen_classes.add(class_section.id)
        created += 1
    return created


def seed_student_absence_notifications():
    registrations = (
        Registration.objects.filter(
            status=Registration.Status.CONFIRMED,
            class_section__teacher__isnull=False,
        )
        .select_related(
            "class_section",
            "class_section__course",
            "class_section__teacher__user",
            "student__user",
        )
        .order_by("student__student_code", "class_section__code")
    )

    created = 0
    per_student_counts = {
        row["sender_id"]: row["count"]
        for row in (
            Notification.objects.filter(
                sender__role=Role.STUDENT,
                title__icontains="xin nghỉ",
            )
            .values("sender_id")
            .annotate(count=models.Count("id"))
        )
    }
    for registration in registrations:
        student = registration.student
        count = per_student_counts.get(student.user_id, 0)
        if count >= 2:
            continue
        class_section = registration.class_section
        create_notification(
            title=f"Xin nghỉ học lớp {class_section.code}",
            body=(
                f"Em là {student.user.full_name}, mã số {student.student_code}. "
                f"Em xin phép nghỉ một buổi môn {class_section.course.name} vì lý do cá nhân "
                "và sẽ chủ động xem lại nội dung bài học."
            ),
            category=Notification.Category.CLASS,
            audience=Notification.Audience.SPECIFIC,
            sender=student.user,
            recipients=[class_section.teacher.user],
        )
        per_student_counts[student.user_id] = count + 1
        created += 1
    return created


with transaction.atomic():
    deleted = Notification.objects.filter(
        Q(title__startswith="[DEMO] ")
        | Q(title="Mở đăng ký học phần học kỳ 1 năm 2026-2027")
        | Q(title="Rà soát lớp học phần và danh sách sinh viên đăng ký")
        | Q(title__contains=" - Nhắc sinh viên chuẩn bị buổi học")
        | Q(title__startswith="Xin nghỉ học lớp ")
    ).delete()
    admin_user = first_admin()
    seed_admin_notifications(admin_user)
    teacher_to_class = seed_teacher_to_class_notifications()
    student_absence = seed_student_absence_notifications()

print("Deleted old demo notifications:", deleted)
print("Admin notifications created: 2")
print("Teacher-to-class notifications created:", teacher_to_class)
print("Student absence notifications created:", student_absence)
