from rest_framework import filters, viewsets

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


class CurriculumCourseViewSet(viewsets.ModelViewSet):
    queryset = CurriculumCourse.objects.select_related("curriculum", "course")
    serializer_class = CurriculumCourseSerializer
    permission_classes = [IsAdminOrReadOnly]
