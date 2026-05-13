from django.db.models import Q
from rest_framework import filters, permissions, viewsets
from apps.accounts.permissions import IsAdminRole
from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "body"]
    ordering_fields = ["created_at"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
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
