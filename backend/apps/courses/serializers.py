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
    prerequisite_ids = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )

    class Meta:
        model = Course
        fields = (
            "id", "code", "name", "credits", "theory_hours", "practice_hours",
            "description", "is_active", "prerequisites_detail", "prerequisite_ids",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        prerequisites = attrs.get("prerequisite_ids")
        if self.instance and prerequisites:
            if any(course.id == self.instance.id for course in prerequisites):
                raise serializers.ValidationError({
                    "prerequisite_ids": "Môn học không thể là tiên quyết của chính nó."
                })
        return attrs

    def create(self, validated_data):
        prerequisites = validated_data.pop("prerequisite_ids", [])
        course = super().create(validated_data)
        self._sync_prerequisites(course, prerequisites)
        return course

    def update(self, instance, validated_data):
        prerequisites = validated_data.pop("prerequisite_ids", None)
        course = super().update(instance, validated_data)
        if prerequisites is not None:
            self._sync_prerequisites(course, prerequisites)
        return course

    def _sync_prerequisites(self, course, prerequisites):
        course.prerequisite_links.all().delete()
        Prerequisite.objects.bulk_create(
            Prerequisite(course=course, required_course=required_course)
            for required_course in dict.fromkeys(prerequisites)
        )
