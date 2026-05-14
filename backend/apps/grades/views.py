from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import filters, permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from .models import Grade
from .serializers import GradeSerializer


class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.select_related(
        "registration__student",
        "registration__class_section__course",
        "registration__class_section__teacher__user",
        "registration__semester",
    )
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ["registration__student__student_code", "registration__class_section__code"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, "role", None)
        if role == "STUDENT":
            qs = qs.filter(registration__student__user=user)
        elif role == "TEACHER":
            qs = qs.filter(registration__class_section__teacher__user=user)
        # Filter qua query params
        params = self.request.query_params
        if params.get("class_section"):
            qs = qs.filter(registration__class_section_id=params["class_section"])
        if params.get("registration"):
            qs = qs.filter(registration_id=params["registration"])
        if params.get("semester"):
            qs = qs.filter(registration__semester_id=params["semester"])
        return qs

    # ---------- BR-007 + thời hạn cập nhật điểm ----------

    def _check_teacher_owns(self, registration):
        """BR-007: GV chỉ nhập điểm cho lớp mình phụ trách."""
        user = self.request.user
        if getattr(user, "role", None) != "TEACHER":
            return
        teacher = registration.class_section.teacher
        if not teacher or teacher.user_id != user.id:
            raise PermissionDenied("Bạn không được phân công lớp này.")

    def _check_update_window(self, registration):
        if getattr(self.request.user, "role", None) == "ADMIN":
            return
        semester = registration.semester
        if not semester.end_date:
            return
        deadline = semester.end_date + timedelta(days=settings.GRADE_UPDATE_GRACE_DAYS)
        if timezone.now().date() > deadline:
            raise PermissionDenied(f"Đã quá thời hạn cập nhật điểm ({deadline}).")

    def perform_create(self, serializer):
        registration = serializer.validated_data["registration"]
        self._check_teacher_owns(registration)
        self._check_update_window(registration)
        serializer.save()

    def perform_update(self, serializer):
        registration = serializer.instance.registration
        self._check_teacher_owns(registration)
        self._check_update_window(registration)
        serializer.save()
