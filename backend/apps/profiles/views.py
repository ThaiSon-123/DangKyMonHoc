from django.core.exceptions import ObjectDoesNotExist
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminOrReadOnly
from .models import StudentProfile, TeacherProfile
from .serializers import StudentProfileSerializer, TeacherProfileSerializer


class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.select_related("user", "major")
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["student_code", "user__username", "user__email", "user__full_name"]
    ordering_fields = ["student_code", "enrollment_year", "gpa"]

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """SV xem hồ sơ của chính mình."""
        try:
            profile = request.user.student_profile
        except ObjectDoesNotExist:
            return Response(
                {"detail": "Tài khoản chưa có hồ sơ sinh viên."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(StudentProfileSerializer(profile).data)

    def get_queryset(self):
        qs = super().get_queryset()
        major = self.request.query_params.get("major")
        if major:
            qs = qs.filter(major_id=major)
        year = self.request.query_params.get("enrollment_year")
        if year:
            qs = qs.filter(enrollment_year=year)
        return qs


class TeacherProfileViewSet(viewsets.ModelViewSet):
    queryset = TeacherProfile.objects.select_related("user")
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["teacher_code", "user__username", "user__email", "department"]
    ordering_fields = ["teacher_code", "department"]

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """GV xem hồ sơ của chính mình."""
        try:
            profile = request.user.teacher_profile
        except ObjectDoesNotExist:
            return Response(
                {"detail": "Tài khoản chưa có hồ sơ giáo viên."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(TeacherProfileSerializer(profile).data)
