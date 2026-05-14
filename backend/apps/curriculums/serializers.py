from rest_framework import serializers
from .models import Curriculum, CurriculumCourse


class CurriculumCourseSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source="course.code", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_credits = serializers.IntegerField(source="course.credits", read_only=True)
    knowledge_block_display = serializers.CharField(source="get_knowledge_block_display", read_only=True)

    class Meta:
        model = CurriculumCourse
        fields = (
            "id", "curriculum", "course", "course_code", "course_name", "course_credits",
            "knowledge_block", "knowledge_block_display", "is_required", "suggested_semester",
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        course = attrs.get("course") or (self.instance.course if self.instance else None)
        if course and course.code.upper().startswith("KTCH"):
            attrs["knowledge_block"] = CurriculumCourse.Knowledge.GENERAL
        return attrs


class CurriculumSerializer(serializers.ModelSerializer):
    major_code = serializers.CharField(source="major.code", read_only=True)
    major_name = serializers.CharField(source="major.name", read_only=True)
    curriculum_courses = CurriculumCourseSerializer(many=True, read_only=True)

    class Meta:
        model = Curriculum
        fields = (
            "id", "code", "name", "major", "major_code", "major_name",
            "cohort_year", "total_credits_required", "description", "is_active",
            "curriculum_courses", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
