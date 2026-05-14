from django.db import transaction
from rest_framework import serializers
from .models import ClassSection, Schedule


def _periods_overlap(left_start, left_end, right_start, right_end):
    return left_start <= right_end and right_start <= left_end


def _date_range(schedule, fallback_semester):
    start = schedule.start_date or fallback_semester.start_date
    end = schedule.end_date or fallback_semester.end_date
    return start, end


def _date_ranges_overlap(left_start, left_end, right_start, right_end):
    return left_start <= right_end and right_start <= left_end


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
        weekday = attrs.get("weekday", self.instance.weekday if self.instance else None)
        session = attrs.get("session", self.instance.session if self.instance else None)
        start_period = attrs.get(
            "start_period",
            self.instance.start_period if self.instance else None,
        )
        room = attrs.get("room", self.instance.room if self.instance else "")
        start_date = attrs.get("start_date", self.instance.start_date if self.instance else None)
        end_date = attrs.get("end_date", self.instance.end_date if self.instance else None)

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

        errors = {}
        semester = class_section.semester
        if start_date and end_date and start_date > end_date:
            errors["end_date"] = "Ngày kết thúc học phải sau hoặc bằng ngày bắt đầu học."
        if start_date and start_date < semester.start_date:
            errors["start_date"] = "Ngày bắt đầu học phải nằm trong thời gian học kỳ."
        if end_date and end_date > semester.end_date:
            errors["end_date"] = "Ngày kết thúc học phải nằm trong thời gian học kỳ."

        if errors:
            raise serializers.ValidationError(errors)

        effective_start = start_date or semester.start_date
        effective_end = end_date or semester.end_date
        candidates = (
            Schedule.objects.select_related("class_section__semester", "class_section__teacher")
            .filter(weekday=weekday)
            .exclude(class_section__status=ClassSection.Status.CANCELLED)
        )
        if self.instance:
            candidates = candidates.exclude(pk=self.instance.pk)

        room_value = (room or "").strip()
        if room_value:
            for other in candidates.filter(room__iexact=room_value):
                if not _periods_overlap(start_period, end_period, other.start_period, other.end_period):
                    continue
                other_start, other_end = _date_range(other, other.class_section.semester)
                if _date_ranges_overlap(effective_start, effective_end, other_start, other_end):
                    raise serializers.ValidationError(
                        {"room": "Phòng học này đã có lớp khác trong cùng thời điểm."}
                    )

        teacher = class_section.teacher
        if teacher:
            for other in candidates.filter(class_section__teacher=teacher):
                if not _periods_overlap(start_period, end_period, other.start_period, other.end_period):
                    continue
                other_start, other_end = _date_range(other, other.class_section.semester)
                if _date_ranges_overlap(effective_start, effective_end, other_start, other_end):
                    raise serializers.ValidationError(
                        {"teacher": "Giáo viên này đã dạy lớp khác trong cùng thời điểm."}
                    )

        return attrs


class ClassSectionSerializer(serializers.ModelSerializer):
    primary_schedule = serializers.DictField(write_only=True, required=False)
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
            "status", "status_display", "note", "primary_schedule", "schedules",
            "created_at", "updated_at",
        )
        read_only_fields = ("id", "enrolled_count", "created_at", "updated_at")

    def get_teacher_name(self, obj) -> str | None:
        if not obj.teacher:
            return None
        return obj.teacher.user.get_full_name() or obj.teacher.user.username

    def _save_primary_schedule(self, class_section, schedule_data):
        payload = {
            **schedule_data,
            "class_section": class_section.id,
        }
        instance = class_section.schedules.order_by("weekday", "start_period", "id").first()
        serializer = ScheduleSerializer(instance, data=payload) if instance else ScheduleSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        serializer.save()

    def create(self, validated_data):
        schedule_data = validated_data.pop("primary_schedule", None)
        with transaction.atomic():
            class_section = super().create(validated_data)
            if schedule_data is not None:
                self._save_primary_schedule(class_section, schedule_data)
            return class_section

    def update(self, instance, validated_data):
        schedule_data = validated_data.pop("primary_schedule", None)
        with transaction.atomic():
            class_section = super().update(instance, validated_data)
            if schedule_data is not None:
                self._save_primary_schedule(class_section, schedule_data)
            return class_section
