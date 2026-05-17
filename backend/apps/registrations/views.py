from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.profiles.models import StudentProfile
from apps.semesters.models import Semester
from .auto_schedule import AutoScheduleError, build_available_courses, suggest_schedules
from .models import Registration
from .serializers import (
    AutoScheduleCandidateSerializer,
    AutoScheduleRequestSerializer,
    AvailableCourseSerializer,
    RegistrationSerializer,
)


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.select_related(
        "student__user", "student__major", "class_section__course", "semester"
    ).prefetch_related("class_section__schedules")
    serializer_class = RegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["student__student_code", "class_section__code"]
    ordering_fields = ["registered_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        # Sinh viên chỉ xem được đăng ký của chính mình
        if getattr(user, "role", None) == "STUDENT":
            qs = qs.filter(student__user=user)
        params = self.request.query_params
        for field in ("student", "class_section", "semester", "status"):
            value = params.get(field)
            if value:
                key = f"{field}{'_id' if field != 'status' else ''}"
                qs = qs.filter(**{key: value})
        department = params.get("department")
        if department:
            qs = qs.filter(student__major__department=department)
        major = params.get("major")
        if major:
            qs = qs.filter(student__major_id=major)
        return qs

    # ---------- BR-006: thời hạn hủy đăng ký ----------

    @staticmethod
    def _within_cancel_window(registration: Registration) -> tuple[bool, str | None]:
        now = timezone.now()
        semester = registration.semester
        grace_days = settings.REGISTRATION_CANCEL_GRACE_DAYS
        if semester.registration_end:
            deadline = semester.registration_end + timedelta(days=grace_days)
            if now <= deadline:
                return True, None
            return False, f"Đã quá thời hạn hủy ({deadline:%Y-%m-%d})."
        # Không có registration_end → so với registered_at
        deadline = registration.registered_at + timedelta(days=grace_days)
        if now <= deadline:
            return True, None
        return False, f"Đã quá thời hạn hủy ({deadline:%Y-%m-%d})."

    def perform_destroy(self, instance):
        """Soft delete: chuyển sang CANCELLED thay vì xoá thật."""
        ok, reason = self._within_cancel_window(instance)
        if not ok and getattr(self.request.user, "role", None) != "ADMIN":
            raise PermissionDenied(reason)
        instance.status = Registration.Status.CANCELLED
        instance.cancelled_at = timezone.now()
        if not instance.cancel_reason:
            instance.cancel_reason = self.request.data.get("cancel_reason", "Hủy bởi người dùng")
        instance.save(update_fields=["status", "cancelled_at", "cancel_reason"])

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """POST /api/registrations/{id}/cancel/ — hủy có lý do."""
        registration = self.get_object()
        if registration.status == Registration.Status.CANCELLED:
            return Response({"detail": "Đăng ký này đã bị hủy."}, status=status.HTTP_400_BAD_REQUEST)
        ok, reason = self._within_cancel_window(registration)
        if not ok and getattr(request.user, "role", None) != "ADMIN":
            return Response({"detail": reason}, status=status.HTTP_403_FORBIDDEN)
        registration.status = Registration.Status.CANCELLED
        registration.cancelled_at = timezone.now()
        registration.cancel_reason = request.data.get("cancel_reason", "Hủy bởi người dùng")
        registration.save(update_fields=["status", "cancelled_at", "cancel_reason"])
        return Response(RegistrationSerializer(registration).data)


class AvailableCoursesView(APIView):
    """GET /api/auto-schedule/available-courses/?semester=<id>&search=&unlearned_only=

    Trả list môn có lớp HP OPEN còn slot, thuộc CTĐT của SV.
    Group theo course → teacher → class_sections.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if getattr(request.user, "role", None) != "STUDENT":
            raise PermissionDenied("Chỉ sinh viên được dùng chức năng này.")
        try:
            student = request.user.student_profile
        except StudentProfile.DoesNotExist:
            raise PermissionDenied("Tài khoản chưa có StudentProfile. Liên hệ Admin.")

        semester_id = request.query_params.get("semester")
        if not semester_id:
            return Response({"detail": "Thiếu query param `semester`."}, status=400)
        try:
            semester = Semester.objects.get(pk=int(semester_id))
        except (Semester.DoesNotExist, ValueError):
            return Response({"detail": "Học kỳ không tồn tại."}, status=400)

        search = request.query_params.get("search", "") or ""
        unlearned_only = request.query_params.get("unlearned_only", "").lower() in (
            "true", "1", "yes",
        )

        data = build_available_courses(
            student=student,
            semester=semester,
            search=search,
            unlearned_only=unlearned_only,
        )
        serializer = AvailableCourseSerializer(data, many=True)
        return Response({"count": len(data), "results": serializer.data})


class AutoScheduleSuggestView(APIView):
    """POST /api/auto-schedule/suggest/ — FR-STU-TKB.

    Trả tất cả phương án TKB không trùng lịch + score theo preferences.
    Chỉ SV được dùng (cần student_profile).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if getattr(request.user, "role", None) != "STUDENT":
            raise PermissionDenied("Chỉ sinh viên được dùng chức năng này.")
        try:
            student = request.user.student_profile
        except StudentProfile.DoesNotExist:
            raise PermissionDenied(
                "Tài khoản chưa có StudentProfile. Liên hệ Admin."
            )

        ser = AutoScheduleRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        try:
            candidates = suggest_schedules(
                student=student,
                semester=ser.validated_data["semester"],
                course_ids=ser.validated_data["course_ids"],
                prefs=ser.to_preferences(),
                max_results=ser.validated_data.get("max_results", 50),
            )
        except AutoScheduleError as e:
            payload = {"detail": str(e)}
            if e.details:
                payload["details"] = e.details
            return Response(payload, status=status.HTTP_400_BAD_REQUEST)

        data = AutoScheduleCandidateSerializer(candidates, many=True).data
        return Response({"count": len(data), "results": data})
