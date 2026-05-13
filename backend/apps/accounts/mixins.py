"""Shared viewset mixins."""
from collections import Counter

from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response


# Map class name → tên tiếng Việt dễ hiểu cho người dùng cuối.
PROTECTED_LABELS = {
    "CurriculumCourse": "CTĐT",
    "ClassSection": "lớp học phần",
    "Prerequisite": "môn tiên quyết",
    "Registration": "đăng ký môn",
    "Grade": "bảng điểm",
    "StudentProfile": "hồ sơ sinh viên",
    "TeacherProfile": "hồ sơ giáo viên",
    "Curriculum": "chương trình đào tạo",
    "Schedule": "lịch học",
}


def _summarize_blockers(error: ProtectedError) -> str:
    counts: Counter[str] = Counter()
    for obj in error.protected_objects:
        cls = obj.__class__.__name__
        counts[PROTECTED_LABELS.get(cls, cls)] += 1
    return ", ".join(f"{count} {label}" for label, count in counts.items())


class HandleProtectedDeleteMixin:
    """Catch ProtectedError trong destroy và trả 409 với message thân thiện."""

    object_label_field = "code"
    object_label_singular = "đối tượng"

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        label = getattr(instance, self.object_label_field, None) or str(instance)
        try:
            instance.delete()
        except ProtectedError as e:
            blockers = _summarize_blockers(e)
            return Response(
                {
                    "detail": (
                        f"Không thể xoá {self.object_label_singular} '{label}' vì đang có "
                        f"dữ liệu liên kết: {blockers}. Gỡ các liên kết trước, hoặc đặt "
                        f"`is_active=false` để ẩn thay vì xoá."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
