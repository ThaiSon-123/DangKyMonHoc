from django.core.exceptions import ObjectDoesNotExist
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.mixins import HandleProtectedDeleteMixin
from apps.accounts.permissions import IsAdminOrReadOnly
from .models import Curriculum, CurriculumCourse
from .serializers import CurriculumCourseSerializer, CurriculumSerializer


class CurriculumViewSet(HandleProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = Curriculum.objects.select_related("major").prefetch_related("curriculum_courses__course")
    serializer_class = CurriculumSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name"]
    ordering_fields = ["code", "cohort_year"]
    object_label_singular = "CTĐT"

    def get_queryset(self):
        qs = super().get_queryset()
        major = self.request.query_params.get("major")
        if major:
            qs = qs.filter(major_id=major)
        cohort = self.request.query_params.get("cohort_year")
        if cohort:
            qs = qs.filter(cohort_year=cohort)
        return qs

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path="my")
    def my_curriculum(self, request):
        """SV đang đăng nhập xem CTĐT của ngành + khóa mình.

        Logic match:
        1. Ưu tiên CTĐT khớp cả `major` và `cohort_year` của SV.
        2. Nếu không có, fallback CTĐT khớp `major` + `is_active=True`, cohort gần nhất ≤ enrollment_year.
        3. Nếu vẫn không có, trả 404.
        """
        try:
            student = request.user.student_profile
        except ObjectDoesNotExist:
            return Response(
                {"detail": "Tài khoản chưa có hồ sơ sinh viên."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Match chính xác cohort + major
        cur = Curriculum.objects.filter(
            major=student.major,
            cohort_year=student.enrollment_year,
            is_active=True,
        ).first()

        # Fallback: cohort gần nhất ≤ enrollment_year
        if not cur:
            cur = (
                Curriculum.objects.filter(
                    major=student.major,
                    cohort_year__lte=student.enrollment_year,
                    is_active=True,
                )
                .order_by("-cohort_year")
                .first()
            )

        if not cur:
            return Response(
                {
                    "detail": (
                        f"Chưa có CTĐT cho ngành {student.major.code} khóa "
                        f"{student.enrollment_year}. Liên hệ phòng đào tạo."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(CurriculumSerializer(cur).data)


class CurriculumCourseViewSet(viewsets.ModelViewSet):
    queryset = CurriculumCourse.objects.select_related("curriculum", "course")
    serializer_class = CurriculumCourseSerializer
    permission_classes = [IsAdminOrReadOnly]
