from rest_framework import filters, viewsets

from apps.accounts.mixins import HandleProtectedDeleteMixin
from apps.accounts.permissions import IsAdminOrReadOnly
from .models import Major
from .serializers import MajorSerializer


class MajorViewSet(HandleProtectedDeleteMixin, viewsets.ModelViewSet):
    queryset = Major.objects.all()
    serializer_class = MajorSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name", "department"]
    ordering_fields = ["code", "name", "updated_at"]
    object_label_singular = "ngành"
