from django.db import transaction
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.mixins import HandleProtectedDeleteMixin
from apps.accounts.permissions import IsAdminOrReadOnly, IsAdminRole
from .models import Semester
from .serializers import SemesterSerializer
from .services import close_class_sections_for_semester


class SemesterViewSet(HandleProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name", "academic_year"]
    ordering_fields = ["start_date", "academic_year"]
    object_label_singular = "học kỳ"

    @action(detail=True, methods=["post"], permission_classes=[IsAdminRole])
    def open(self, request, pk=None):
        semester = self.get_object()
        semester.is_open = True
        semester.save(update_fields=["is_open", "updated_at"])
        return Response(SemesterSerializer(semester).data)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminRole])
    def close(self, request, pk=None):
        semester = self.get_object()
        with transaction.atomic():
            semester.is_open = False
            semester.save(update_fields=["is_open", "updated_at"])
            close_class_sections_for_semester(semester)
        return Response(SemesterSerializer(semester).data)
