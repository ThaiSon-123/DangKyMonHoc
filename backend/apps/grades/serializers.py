from rest_framework import serializers
from .models import Grade


class GradeSerializer(serializers.ModelSerializer):
    student_code = serializers.CharField(source="registration.student.student_code", read_only=True)
    student_name = serializers.SerializerMethodField()
    course_code = serializers.CharField(source="registration.class_section.course.code", read_only=True)
    course_name = serializers.CharField(source="registration.class_section.course.name", read_only=True)
    course_credits = serializers.IntegerField(source="registration.class_section.course.credits", read_only=True)
    class_section_code = serializers.CharField(source="registration.class_section.code", read_only=True)
    semester_code = serializers.CharField(source="registration.semester.code", read_only=True)
    semester_name = serializers.CharField(source="registration.semester.name", read_only=True)

    class Meta:
        model = Grade
        fields = (
            "id", "registration",
            "student_code", "student_name",
            "course_code", "course_name", "course_credits",
            "class_section_code", "semester_code", "semester_name",
            "process_score", "midterm_score", "final_score",
            "total_score", "gpa_4", "grade_letter", "note", "updated_at",
        )
        read_only_fields = ("id", "total_score", "gpa_4", "grade_letter", "updated_at")

    def get_student_name(self, obj) -> str:
        u = obj.registration.student.user
        return u.get_full_name() or u.username

    def validate(self, attrs):
        for field in ("process_score", "midterm_score", "final_score"):
            v = attrs.get(field)
            if v is not None and (v < 0 or v > 10):
                raise serializers.ValidationError({field: "Điểm phải trong [0, 10]."})
        return attrs
