from rest_framework import serializers
from .models import Grade


class GradeSerializer(serializers.ModelSerializer):
    student_code = serializers.CharField(source="registration.student.student_code", read_only=True)
    course_code = serializers.CharField(source="registration.class_section.course.code", read_only=True)
    class_section_code = serializers.CharField(source="registration.class_section.code", read_only=True)

    class Meta:
        model = Grade
        fields = (
            "id", "registration", "student_code", "course_code", "class_section_code",
            "process_score", "midterm_score", "final_score",
            "total_score", "grade_letter", "note", "updated_at",
        )
        read_only_fields = ("id", "total_score", "grade_letter", "updated_at")

    def validate(self, attrs):
        for field in ("process_score", "midterm_score", "final_score"):
            v = attrs.get(field)
            if v is not None and (v < 0 or v > 10):
                raise serializers.ValidationError({field: "Điểm phải trong [0, 10]."})
        return attrs
