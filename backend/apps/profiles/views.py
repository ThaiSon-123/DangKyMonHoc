from rest_framework import filters, viewsets
from apps.accounts.permissions import IsAdminOrReadOnly
from .models import StudentProfile, TeacherProfile
from .serializers import StudentProfileSerializer, TeacherProfileSerializer


class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.select_related("user", "major")
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
<<<<<<< HEAD
    search_fields = ["student_code", "user__username", "user__email", "user__full_name"]
=======
    search_fields = ["student_code", "user__username", "user__email", "user__first_name", "user__last_name"]
>>>>>>> 1f46ee961aae46de3dde0ef63ebc43bccbea96d6
    ordering_fields = ["student_code", "enrollment_year", "gpa"]

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
