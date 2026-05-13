from rest_framework import serializers
from .models import Course, Prerequisite


class PrerequisiteSerializer(serializers.ModelSerializer):
    required_course_code = serializers.CharField(source="required_course.code", read_only=True)
    required_course_name = serializers.CharField(source="required_course.name", read_only=True)

    class Meta:
        model = Prerequisite
        fields = ("id", "course", "required_course", "required_course_code", "required_course_name", "note")
        read_only_fields = ("id",)


class CourseSerializer(serializers.ModelSerializer):
    prerequisites_detail = PrerequisiteSerializer(source="prerequisite_links", many=True, read_only=True)

    class Meta:
        model = Course
        fields = (
            "id", "code", "name", "credits", "theory_hours", "practice_hours",
            "description", "is_active", "prerequisites_detail",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
