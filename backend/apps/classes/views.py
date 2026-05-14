from django.contrib.auth import get_user_model
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminOrReadOnly
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer
from .models import ClassSection, Schedule
from .serializers import ClassSectionSerializer, ScheduleSerializer

User = get_user_model()


class ClassSectionViewSet(viewsets.ModelViewSet):
    queryset = ClassSection.objects.select_related("course", "semester", "teacher__user").prefetch_related("schedules")
    serializer_class = ClassSectionSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "course__code", "course__name", "schedules__room"]
    ordering_fields = ["code", "enrolled_count", "max_students"]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        for field in ("course", "semester", "teacher", "status"):
            value = params.get(field)
            if value:
                qs = qs.filter(**{f"{field}{'_id' if field != 'status' else ''}": value})
        department = params.get("department")
        if department:
            qs = qs.filter(course__curriculum_links__curriculum__major__department=department)
        major = params.get("major")
        if major:
            qs = qs.filter(course__curriculum_links__curriculum__major_id=major)
        return qs.distinct()

    @action(
        detail=True,
        methods=["post"],
        url_path="notify",
        permission_classes=[permissions.IsAuthenticated],
    )
    def notify_class(self, request, pk=None):
        """GV phụ trách (hoặc Admin) gửi thông báo cho tất cả SV đã đăng ký lớp.

        Body: {title, body, category?} (audience auto = SPECIFIC, recipients = SV CONFIRMED)
        """
        cs = self.get_object()
        user = request.user
        role = getattr(user, "role", None)

        # Quyền: chỉ GV phụ trách hoặc Admin
        if role == "TEACHER":
            if not cs.teacher or cs.teacher.user_id != user.id:
                raise PermissionDenied("Bạn không phụ trách lớp này.")
        elif role != "ADMIN":
            raise PermissionDenied("Chỉ giáo viên phụ trách hoặc Admin mới được gửi thông báo lớp.")

        title = (request.data.get("title") or "").strip()
        body = (request.data.get("body") or "").strip()
        category = request.data.get("category") or "CLASS"

        if not title:
            return Response({"detail": "Tiêu đề không được trống."}, status=status.HTTP_400_BAD_REQUEST)
        if not body:
            return Response({"detail": "Nội dung không được trống."}, status=status.HTTP_400_BAD_REQUEST)
        if category not in dict(Notification.Category.choices):
            return Response({"detail": "Category không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        # Lấy danh sách user của SV đang CONFIRMED trong lớp
        student_users = User.objects.filter(
            student_profile__registrations__class_section=cs,
            student_profile__registrations__status="CONFIRMED",
        ).distinct()

        if not student_users.exists():
            return Response(
                {"detail": "Lớp chưa có sinh viên đăng ký để gửi thông báo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        noti = Notification.objects.create(
            title=title,
            body=body,
            category=category,
            audience=Notification.Audience.SPECIFIC,
            sender=user,
        )
        noti.recipients.set(student_users)

        return Response(
            {
                "notification": NotificationSerializer(noti, context={"request": request}).data,
                "recipient_count": student_users.count(),
                "class_code": cs.code,
            },
            status=status.HTTP_201_CREATED,
        )


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.select_related("class_section")
    serializer_class = ScheduleSerializer
    permission_classes = [IsAdminOrReadOnly]
