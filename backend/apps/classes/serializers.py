from rest_framework import serializers
from .models import ClassSection, Schedule


class ScheduleSerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source="get_weekday_display", read_only=True)
    session_display = serializers.CharField(source="get_session_display", read_only=True)

    class Meta:
        model = Schedule
        fields = (
            "id", "class_section", "weekday", "weekday_display",
            "session", "session_display", "start_period", "end_period",
            "room", "start_date", "end_date",
        )
        read_only_fields = ("id", "end_period")

    def validate(self, attrs):
        class_section = attrs.get(
            "class_section",
            self.instance.class_section if self.instance else None,
        )
        session = attrs.get("session", self.instance.session if self.instance else None)
        start_period = attrs.get(
            "start_period",
            self.instance.start_period if self.instance else None,
        )
        if not (class_section and session and start_period):
            return attrs

        end_period = start_period + class_section.periods_per_session - 1
        if end_period > 15:
            raise serializers.ValidationError(
                {"start_period": "Lịch học không được vượt quá tiết 15 trong ngày."}
            )
        session_start, session_end = Schedule.SESSION_PERIODS[session]
        if not (session_start <= start_period <= end_period <= session_end):
            raise serializers.ValidationError(
                {
                    "start_period": (
                        f"Buổi {Schedule.Session(session).label} chỉ được xếp trong "
                        f"tiết {session_start}-{session_end}."
                    )
                }
            )
        return attrs


class ClassSectionSerializer(serializers.ModelSerializer):
    periods_per_session = serializers.IntegerField(required=True, min_value=1, max_value=5)
    course_code = serializers.CharField(source="course.code", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)
    course_credits = serializers.IntegerField(source="course.credits", read_only=True)
    semester_code = serializers.CharField(source="semester.code", read_only=True)
    teacher_code = serializers.CharField(source="teacher.teacher_code", read_only=True, default=None)
    teacher_name = serializers.SerializerMethodField()
    schedules = ScheduleSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_full = serializers.BooleanField(read_only=True)

    class Meta:
        model = ClassSection
        fields = (
            "id", "code", "course", "course_code", "course_name", "course_credits",
            "semester", "semester_code", "teacher", "teacher_code", "teacher_name",
            "periods_per_session", "max_students", "enrolled_count", "is_full",
            "status", "status_display", "note", "schedules", "created_at", "updated_at",
        )
        read_only_fields = ("id", "enrolled_count", "created_at", "updated_at")

    def get_teacher_name(self, obj) -> str | None:
        if not obj.teacher:
            return None
        return obj.teacher.user.get_full_name() or obj.teacher.user.username
