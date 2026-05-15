from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from apps.classes.models import ClassSection
from apps.classes.serializers import ClassSectionSerializer, ScheduleSerializer
from apps.curriculums.models import Curriculum
from apps.profiles.models import StudentProfile
from apps.semesters.models import Semester
from .auto_schedule import PriorityPreset, Preferences
from .models import Registration


class RegistrationSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(), required=False, allow_null=True
    )
    semester = serializers.PrimaryKeyRelatedField(
        queryset=Semester.objects.all(), required=False, allow_null=True
    )
    student_code = serializers.CharField(source="student.student_code", read_only=True)
    student_name = serializers.SerializerMethodField()
    class_section_code = serializers.CharField(source="class_section.code", read_only=True)
    course_code = serializers.CharField(source="class_section.course.code", read_only=True)
    course_name = serializers.CharField(source="class_section.course.name", read_only=True)
    course_credits = serializers.IntegerField(source="class_section.course.credits", read_only=True)
    semester_code = serializers.CharField(source="semester.code", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    teacher_name = serializers.SerializerMethodField()
    teacher_code = serializers.CharField(source="class_section.teacher.teacher_code", read_only=True, default=None)
    teacher_user_id = serializers.IntegerField(source="class_section.teacher.user_id", read_only=True, default=None)
    schedules = ScheduleSerializer(source="class_section.schedules", many=True, read_only=True)
    enrolled_count = serializers.IntegerField(source="class_section.enrolled_count", read_only=True)
    max_students = serializers.IntegerField(source="class_section.max_students", read_only=True)
    retake_confirmed = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Registration
        fields = (
            "id", "student", "student_code", "student_name",
            "class_section", "class_section_code", "course_code", "course_name", "course_credits",
            "semester", "semester_code",
            "status", "status_display", "registered_at", "cancelled_at", "cancel_reason",
            "teacher_name", "teacher_code", "teacher_user_id",
            "schedules", "enrolled_count", "max_students", "retake_confirmed",
        )
        read_only_fields = ("id", "registered_at", "cancelled_at")
        # Disable auto UniqueTogetherValidator vì nó bắt student field phải có sẵn
        validators = []

    def get_student_name(self, obj) -> str:
        u = obj.student.user
        return u.get_full_name() or u.username

    def get_teacher_name(self, obj) -> str | None:
        teacher = obj.class_section.teacher
        if not teacher:
            return None
        return teacher.user.get_full_name() or teacher.user.username

    # ---------- Validation helpers ----------

    def _get_student(self, attrs):
        """Force student = user.student_profile nếu request từ SV."""
        request = self.context.get("request")
        if request and getattr(request.user, "role", None) == "STUDENT":
            try:
                return request.user.student_profile
            except StudentProfile.DoesNotExist:
                raise serializers.ValidationError(
                    "Tài khoản chưa được tạo StudentProfile. Liên hệ Admin."
                )
        return attrs.get("student")

    def _check_window_open(self, semester):
        """BR-003."""
        if not semester.is_open:
            raise serializers.ValidationError(
                {"semester": "Học kỳ chưa được mở để đăng ký."}
            )
        now = timezone.now()
        if semester.registration_start and now < semester.registration_start:
            raise serializers.ValidationError(
                {"semester": f"Đăng ký bắt đầu lúc {semester.registration_start:%Y-%m-%d %H:%M}."}
            )
        if semester.registration_end and now > semester.registration_end:
            raise serializers.ValidationError(
                {"semester": f"Đã quá thời gian đăng ký ({semester.registration_end:%Y-%m-%d %H:%M})."}
            )

    def _check_class_not_full(self, class_section):
        """BR-005."""
        if class_section.enrolled_count >= class_section.max_students:
            raise serializers.ValidationError(
                {"class_section": f"Lớp {class_section.code} đã đầy ({class_section.enrolled_count}/{class_section.max_students})."}
            )

    def _check_prerequisites(self, student, class_section):
        """BR-002."""
        required = list(
            class_section.course.prerequisite_links.values_list(
                "required_course_id", "required_course__code"
            )
        )
        if not required:
            return
        passing_score = settings.GRADE_PASSING_SCORE
        passed_ids = set(
            Registration.objects.filter(
                student=student,
                status=Registration.Status.CONFIRMED,
                grade__total_score__gte=passing_score,
            ).values_list("class_section__course_id", flat=True)
        )
        missing = [code for cid, code in required if cid not in passed_ids]
        if missing:
            raise serializers.ValidationError(
                {"class_section": f"Thiếu môn tiên quyết: {', '.join(missing)}"}
            )

    def _get_student_curriculum(self, student):
        cur = Curriculum.objects.filter(
            major=student.major,
            cohort_year=student.enrollment_year,
            is_active=True,
        ).first()
        if cur:
            return cur
        return (
            Curriculum.objects.filter(
                major=student.major,
                cohort_year__lte=student.enrollment_year,
                is_active=True,
            )
            .order_by("-cohort_year")
            .first()
        )

    def _check_course_in_curriculum(self, student, class_section):
        curriculum = self._get_student_curriculum(student)
        if not curriculum:
            return
        if not curriculum.curriculum_courses.filter(course=class_section.course).exists():
            raise serializers.ValidationError(
                {"class_section": "Môn không có trong chương trình đào tạo."}
            )

    def _check_retake_confirmation(self, student, class_section, retake_confirmed):
        has_grade = Registration.objects.filter(
            student=student,
            class_section__course=class_section.course,
            grade__total_score__isnull=False,
        ).exists()
        if has_grade and not retake_confirmed:
            raise serializers.ValidationError(
                {"class_section": "Môn đã học rồi. Bạn có muốn học lại không?"}
            )

    @staticmethod
    def _schedules_overlap(left, right) -> bool:
        """BR-004: trùng nếu cùng thứ và khoảng tiết giao nhau."""
        return (
            left.weekday == right.weekday
            and left.start_period <= right.end_period
            and right.start_period <= left.end_period
        )

    def _check_schedule_conflict(self, student, semester, class_section, instance_pk=None):
        """BR-004."""
        new_schedules = list(class_section.schedules.all())
        if not new_schedules:
            return
        active = [Registration.Status.PENDING, Registration.Status.CONFIRMED]
        qs = (
            Registration.objects.filter(
                student=student, semester=semester, status__in=active
            )
            .exclude(class_section_id=class_section.id)
            .select_related("class_section__course")
            .prefetch_related("class_section__schedules")
        )
        if instance_pk:
            qs = qs.exclude(pk=instance_pk)
        for reg in qs:
            for new_schedule in new_schedules:
                for existing in reg.class_section.schedules.all():
                    if self._schedules_overlap(new_schedule, existing):
                        raise serializers.ValidationError(
                            {
                                "class_section": (
                                    f"Trùng lịch với lớp {reg.class_section.code} "
                                    f"({reg.class_section.course.code})."
                                )
                            }
                        )

    # ---------- DRF hooks ----------

    def validate(self, attrs):
        student = self._get_student(attrs) or (self.instance.student if self.instance else None)
        class_section = attrs.get("class_section") or (self.instance.class_section if self.instance else None)
        semester = attrs.get("semester") or (class_section.semester if class_section else None)

        if not (student and class_section and semester):
            raise serializers.ValidationError("Thiếu student / class_section / semester.")

        attrs["student"] = student
        attrs["semester"] = semester

        # Khi chỉ update status (vd. cancel), bỏ qua check tạo mới
        skip_creation_checks = (
            self.instance is not None
            and attrs.get("class_section", self.instance.class_section) == self.instance.class_section
        )

        if not skip_creation_checks:
            # Check unique manual (vì đã disable auto validator)
            dup_qs = Registration.objects.filter(student=student, class_section=class_section)
            if self.instance:
                dup_qs = dup_qs.exclude(pk=self.instance.pk)
            if dup_qs.exists():
                raise serializers.ValidationError(
                    {"class_section": "Đã có đăng ký cho lớp này rồi."}
                )

            self._check_window_open(semester)
            self._check_course_in_curriculum(student, class_section)
            self._check_retake_confirmation(
                student,
                class_section,
                attrs.pop("retake_confirmed", False),
            )
            self._check_class_not_full(class_section)
            self._check_prerequisites(student, class_section)
            instance_pk = self.instance.pk if self.instance else None
            self._check_schedule_conflict(student, semester, class_section, instance_pk)

        attrs.pop("retake_confirmed", None)
        return attrs

    def create(self, validated_data):
        validated_data.setdefault("status", Registration.Status.CONFIRMED)
        return super().create(validated_data)


# ───────────────────────── Auto Schedule (FR-STU-TKB) ─────────────────────────


class AutoScheduleRequestSerializer(serializers.Serializer):
    """Input cho POST /api/auto-schedule/suggest/."""
    semester = serializers.PrimaryKeyRelatedField(queryset=Semester.objects.all())
    course_ids = serializers.ListField(
        child=serializers.IntegerField(), min_length=1, max_length=10
    )
    avoid_weekdays = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=6),
        required=False,
        default=list,
    )
    preferred_sessions = serializers.ListField(
        child=serializers.ChoiceField(choices=["MORNING", "AFTERNOON", "EVENING"]),
        required=False,
        default=list,
    )
    preferred_teacher_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    preset = serializers.ChoiceField(
        choices=[p.value for p in PriorityPreset],
        default=PriorityPreset.BALANCED.value,
    )
    # Hard filter per-course: { "<course_id>": <teacher_id> }
    course_teacher_constraints = serializers.DictField(
        child=serializers.IntegerField(),
        required=False,
        default=dict,
    )
    max_results = serializers.IntegerField(default=50, min_value=1, max_value=200)

    def to_preferences(self) -> Preferences:
        v = self.validated_data
        raw_constraints = v.get("course_teacher_constraints", {}) or {}
        constraints = {int(k): int(t) for k, t in raw_constraints.items()}
        return Preferences(
            avoid_weekdays=frozenset(v.get("avoid_weekdays", [])),
            preferred_sessions=frozenset(v.get("preferred_sessions", [])),
            preferred_teacher_ids=frozenset(v.get("preferred_teacher_ids", [])),
            preset=PriorityPreset(v.get("preset", PriorityPreset.BALANCED.value)),
            course_teacher_constraints=constraints,
        )


class AutoScheduleCandidateSerializer(serializers.Serializer):
    """1 phương án TKB trả về cho frontend."""
    class_sections = ClassSectionSerializer(many=True, read_only=True)
    score = serializers.FloatField()
    breakdown = serializers.DictField(child=serializers.FloatField())
    stats = serializers.DictField(child=serializers.IntegerField())


# ───────────────────────── Available courses (GET endpoint) ─────────────────────────


class AvailableTeacherClassSectionSerializer(serializers.ModelSerializer):
    """Mini class-section trong nhóm teachers của available courses."""
    schedules = ScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = ClassSection
        fields = ("id", "code", "enrolled_count", "max_students", "schedules")


class AvailableTeacherSerializer(serializers.Serializer):
    teacher_id = serializers.IntegerField(allow_null=True)
    teacher_name = serializers.CharField(allow_null=True)
    class_sections = AvailableTeacherClassSectionSerializer(many=True, read_only=True)


class AvailableCourseSerializer(serializers.Serializer):
    """1 môn để hiển thị ở UI chọn TKB (đã group teachers + status flags)."""
    course_id = serializers.IntegerField()
    course_code = serializers.CharField()
    course_name = serializers.CharField()
    credits = serializers.IntegerField()
    has_grade = serializers.BooleanField()
    passed = serializers.BooleanField()
    missing_prerequisites = serializers.ListField(child=serializers.CharField())
    registered = serializers.BooleanField()
    teachers = AvailableTeacherSerializer(many=True, read_only=True)
