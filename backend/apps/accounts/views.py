from django.contrib.auth import get_user_model
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .mixins import HandleProtectedDeleteMixin
from .permissions import IsAdminRole
from .serializers import (
    LockedAwareTokenObtainPairSerializer,
    LockedAwareTokenRefreshSerializer,
    UserCreateSerializer,
    UserSerializer,
)

User = get_user_model()


class LockedAwareTokenObtainPairView(TokenObtainPairView):
    serializer_class = LockedAwareTokenObtainPairSerializer


class LockedAwareTokenRefreshView(TokenRefreshView):
    serializer_class = LockedAwareTokenRefreshSerializer


class UserViewSet(HandleProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id")
    permission_classes = [IsAdminRole]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["username", "email", "full_name"]
    ordering_fields = ["username", "email", "role", "full_name", "date_joined"]
    object_label_field = "username"
    object_label_singular = "tài khoản"

    def get_serializer_class(self):
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role.upper())
        is_locked = self.request.query_params.get("is_locked")
        if is_locked is not None:
            qs = qs.filter(is_locked=is_locked.lower() in ("true", "1"))
        return qs

    def perform_update(self, serializer):
        """Chặn đổi role thành ADMIN qua API (FR-ADM-ACC-006)."""
        new_role = serializer.validated_data.get("role")
        if new_role == "ADMIN" and serializer.instance.role != "ADMIN":
            raise PermissionDenied("Không được phép gán role ADMIN qua API.")
        serializer.save()

    def perform_destroy(self, instance):
        """Không cho admin tự xoá chính mình."""
        if instance.id == self.request.user.id:
            raise PermissionDenied("Không thể xoá tài khoản đang đăng nhập.")
        if instance.role == "ADMIN":
            raise PermissionDenied("Không xoá được tài khoản ADMIN qua API.")
        super().perform_destroy(instance)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        return Response(UserSerializer(request.user).data)
