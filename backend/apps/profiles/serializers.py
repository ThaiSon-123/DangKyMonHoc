from decimal import Decimal

from django.conf import settings
from rest_framework import serializers
from apps.registrations.models import Registration
from .models import StudentProfile, TeacherProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.SerializerMethodField()
    major_code = serializers.CharField(source="major.code", read_only=True)
    major_name = serializers.CharField(source="major.name", read_only=True)
    major_duration_years = serializers.IntegerField(source="major.duration_years", read_only=True)
    gpa = serializers.SerializerMethodField()
    completed_credits = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = (
            "id", "user", "username", "full_name", "student_code",
            "major", "major_code", "major_name", "major_duration_years",
            "enrollment_year", "gpa", "completed_credits", "is_active",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_full_name(self, obj) -> str:
        return obj.user.get_full_name() or obj.user.username

    def _graded_registrations(self, obj):
        return obj.registrations.filter(
            status=Registration.Status.CONFIRMED,
            grade__total_score__isnull=False,
        ).select_related("grade", "class_section__course")

    def get_gpa(self, obj) -> str:
        total_credits = 0
        weighted_score = Decimal("0.00")
        for registration in self._graded_registrations(obj):
            credits = registration.class_section.course.credits
            total_credits += credits
            weighted_score += registration.grade.total_score * credits
        if not total_credits:
            return "0.00"
        return str((weighted_score / total_credits).quantize(Decimal("0.01")))

    def get_completed_credits(self, obj) -> int:
        passing_score = Decimal(str(settings.GRADE_PASSING_SCORE))
        return sum(
            registration.class_section.course.credits
            for registration in self._graded_registrations(obj)
            if registration.grade.total_score >= passing_score
        )


class TeacherProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = TeacherProfile
        fields = (
            "id", "user", "username", "full_name", "teacher_code",
            "department", "title", "is_active", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_full_name(self, obj) -> str:
        return obj.user.get_full_name() or obj.user.username
