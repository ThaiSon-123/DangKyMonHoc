from rest_framework import serializers
from .models import StudentProfile, TeacherProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.SerializerMethodField()
    major_code = serializers.CharField(source="major.code", read_only=True)
    major_name = serializers.CharField(source="major.name", read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            "id", "user", "username", "full_name", "student_code",
            "major", "major_code", "major_name",
            "enrollment_year", "gpa", "completed_credits", "is_active",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def get_full_name(self, obj) -> str:
        return obj.user.get_full_name() or obj.user.username


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
