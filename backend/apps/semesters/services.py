from django.utils import timezone


def close_class_sections_for_semester(semester):
    from apps.classes.models import ClassSection

    return (
        semester.class_sections.exclude(status=ClassSection.Status.CANCELLED)
        .exclude(status=ClassSection.Status.CLOSED)
        .update(status=ClassSection.Status.CLOSED, updated_at=timezone.now())
    )


def open_class_sections_for_semester(semester):
    """Mở lại các lớp HP đã bị CLOSED khi mở học kỳ.

    Quy tắc:
      • Chỉ chuyển CLOSED → OPEN.
      • Lớp CANCELLED giữ nguyên (admin đã chủ động huỷ hẳn).
      • Lớp DRAFT giữ nguyên (admin chưa muốn mở).
      • Lớp KHÔNG có teacher giữ CLOSED (Plan §7.2: lớp OPEN bắt buộc có GV).
        → Admin gán teacher rồi tự mở từng lớp.

    Trả số lớp đã được mở lại.
    """
    from apps.classes.models import ClassSection

    return (
        semester.class_sections
        .filter(status=ClassSection.Status.CLOSED)
        .exclude(teacher__isnull=True)
        .update(status=ClassSection.Status.OPEN, updated_at=timezone.now())
    )
