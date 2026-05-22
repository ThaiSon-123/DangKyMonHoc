from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from config.pagination import LookupPagination

from .mixins import HandleProtectedDeleteMixin
from .permissions import IsAdminRole
from .serializers import (
    LockedAwareTokenObtainPairSerializer,
    LockedAwareTokenRefreshSerializer,
    UserCreateSerializer,
    UserSerializer,
)
from .throttling import LoginRateThrottle, reset_login_throttle

User = get_user_model()


class LockedAwareTokenObtainPairView(TokenObtainPairView):
    serializer_class = LockedAwareTokenObtainPairSerializer
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            # Login thành công → xoá counter để IP đó dùng được full quota lại
            reset_login_throttle(request)
        return response


class LockedAwareTokenRefreshView(TokenRefreshView):
    serializer_class = LockedAwareTokenRefreshSerializer


class UserViewSet(HandleProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id")
    permission_classes = [IsAdminRole]
    pagination_class = LookupPagination  # cho phép fetch danh sách GV/SV cho dropdown
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
        department = self.request.query_params.get("department")
        if department:
            qs = qs.filter(
                Q(student_profile__major__department=department)
                | Q(teacher_profile__department=department)
            )
        major = self.request.query_params.get("major")
        if major:
            qs = qs.filter(student_profile__major_id=major)
        return qs.distinct()

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

    @action(
        detail=False,
        methods=["post"],
        url_path="change-password",
        permission_classes=[permissions.IsAuthenticated],
    )
    def change_password(self, request):
        """POST /api/accounts/users/change-password/ — SV/GV/Admin tự đổi mật khẩu.

        Body: {old_password, new_password}
        - Verify old_password đúng với mật khẩu hiện tại.
        - new_password ≥ 8 ký tự, pass Django password validators.
        - Sau khi đổi → access token cũ vẫn dùng được tới khi hết hạn (15 phút).
        """
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError

        old_password = (request.data.get("old_password") or "").strip()
        new_password = (request.data.get("new_password") or "").strip()

        if not old_password:
            return Response(
                {"detail": "Vui lòng nhập mật khẩu hiện tại."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not new_password:
            return Response(
                {"detail": "Vui lòng nhập mật khẩu mới."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(new_password) < 8:
            return Response(
                {"detail": "Mật khẩu mới phải có tối thiểu 8 ký tự."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.user.check_password(old_password):
            return Response(
                {"detail": "Mật khẩu hiện tại không đúng."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if old_password == new_password:
            return Response(
                {"detail": "Mật khẩu mới không được trùng với mật khẩu cũ."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate strength qua Django validators
        try:
            validate_password(new_password, user=request.user)
        except ValidationError as exc:
            return Response(
                {"detail": " ".join(exc.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(new_password)
        request.user.save(update_fields=["password"])

        return Response(
            {"detail": "Đổi mật khẩu thành công. Lần đăng nhập tiếp theo hãy dùng mật khẩu mới."},
            status=status.HTTP_200_OK,
        )
