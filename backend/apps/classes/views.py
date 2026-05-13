from rest_framework import filters, viewsets
from apps.accounts.permissions import IsAdminOrReadOnly
from .models import ClassSection, Schedule
from .serializers import ClassSectionSerializer, ScheduleSerializer


class ClassSectionViewSet(viewsets.ModelViewSet):
    queryset = ClassSection.objects.select_related("course", "semester", "teacher__user").prefetch_related("schedules")
    serializer_class = ClassSectionSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "course__code", "course__name"]
    ordering_fields = ["code", "enrolled_count", "max_students"]

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        for field in ("course", "semester", "teacher", "status"):
            value = params.get(field)
            if value:
                qs = qs.filter(**{f"{field}{'_id' if field != 'status' else ''}": value})
        return qs


class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.select_related("class_section")
    serializer_class = ScheduleSerializer
    permission_classes = [IsAdminOrReadOnly]
