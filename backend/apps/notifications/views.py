from django.db.models import Q
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminRole
from .models import Notification, NotificationRead
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "body"]
    ordering_fields = ["created_at"]

    def get_permissions(self):
        if self.action in ("list", "retrieve", "mark_read", "mark_all_read", "unread_count"):
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        role = getattr(user, "role", None)
        if role == "ADMIN":
            return qs
        # SV/GV: chỉ thấy noti gửi cho audience phù hợp hoặc đích danh
        audience_match = Q(audience="ALL")
        if role == "STUDENT":
            audience_match |= Q(audience="ALL_STUDENTS")
        elif role == "TEACHER":
            audience_match |= Q(audience="ALL_TEACHERS")
        return qs.filter(audience_match | Q(recipients=user)).distinct()

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    @action(detail=True, methods=["post"], url_path="mark-read")
    def mark_read(self, request, pk=None):
        """Đánh dấu thông báo này là đã đọc cho user hiện tại."""
        noti = self.get_object()
        NotificationRead.objects.get_or_create(notification=noti, user=request.user)
        return Response({"status": "marked_read", "notification_id": noti.id})

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        """Đánh dấu tất cả noti hiện thị là đã đọc."""
        qs = self.get_queryset()
        read_ids = set(
            NotificationRead.objects.filter(user=request.user).values_list(
                "notification_id", flat=True
            )
        )
        new_reads = [
            NotificationRead(notification=n, user=request.user)
            for n in qs
            if n.id not in read_ids
        ]
        NotificationRead.objects.bulk_create(new_reads, ignore_conflicts=True)
        return Response({"status": "all_read", "marked": len(new_reads)})

    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        """Số notification chưa đọc của user hiện tại."""
        qs = self.get_queryset()
        read_ids = set(
            NotificationRead.objects.filter(user=request.user).values_list(
                "notification_id", flat=True
            )
        )
        unread = qs.exclude(id__in=read_ids).count()
        return Response({"unread": unread})
