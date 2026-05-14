from rest_framework import filters, viewsets

from apps.accounts.mixins import HandleProtectedDeleteMixin
from apps.accounts.permissions import IsAdminOrReadOnly
from .models import Course, Prerequisite
from .serializers import CourseSerializer, PrerequisiteSerializer


class CourseViewSet(HandleProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = Course.objects.all().prefetch_related("prerequisite_links__required_course")
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name"]
    ordering_fields = ["code", "name", "credits"]
    object_label_singular = "môn học"

    def get_queryset(self):
        qs = super().get_queryset()
        department = self.request.query_params.get("department")
        if department:
            qs = qs.filter(curriculum_links__curriculum__major__department=department)
        major = self.request.query_params.get("major")
        if major:
            qs = qs.filter(curriculum_links__curriculum__major_id=major)
        curriculum = self.request.query_params.get("curriculum")
        if curriculum:
            qs = qs.filter(curriculum_links__curriculum_id=curriculum)
        return qs.distinct()


class PrerequisiteViewSet(viewsets.ModelViewSet):
    queryset = Prerequisite.objects.select_related("course", "required_course")
    serializer_class = PrerequisiteSerializer
    permission_classes = [IsAdminOrReadOnly]
