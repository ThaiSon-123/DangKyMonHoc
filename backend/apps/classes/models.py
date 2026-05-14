from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class ClassSection(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Nháp"
        OPEN = "OPEN", "Đang mở"
        CLOSED = "CLOSED", "Đã đóng"
        CANCELLED = "CANCELLED", "Đã huỷ"

    code = models.CharField(max_length=24, unique=True, help_text="VD: CS201.01")
    course = models.ForeignKey(
        "courses.Course", on_delete=models.PROTECT, related_name="class_sections"
    )
    semester = models.ForeignKey(
        "semesters.Semester", on_delete=models.PROTECT, related_name="class_sections"
    )
    teacher = models.ForeignKey(
        "profiles.TeacherProfile",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="class_sections",
        help_text="Plan §7.2: MUST có teacher khi lớp được OPEN (validate qua clean()).",
    )
    periods_per_session = models.PositiveSmallIntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Số tiết mỗi buổi học (1-5).",
    )
    max_students = models.PositiveSmallIntegerField(default=50)
    enrolled_count = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT)
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["code"]
        verbose_name = "Lớp học phần"
        verbose_name_plural = "Lớp học phần"
        indexes = [
            models.Index(fields=["semester", "status"], name="cls_sem_status_idx"),
            models.Index(fields=["course", "semester"], name="cls_course_sem_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.code} - {self.course.code}"

    @property
    def is_full(self) -> bool:
        return self.enrolled_count >= self.max_students

    def clean(self):
        """Plan §7.2: lớp ở trạng thái OPEN bắt buộc phải có giáo viên."""
        super().clean()
        if self.status == self.Status.OPEN and self.teacher_id is None:
            raise ValidationError(
                {"teacher": "Lớp ở trạng thái 'Đang mở' phải có giáo viên phụ trách."}
            )


class Schedule(models.Model):
    """Lịch học của 1 lớp học phần. 1 lớp có thể có nhiều buổi/tuần."""

    class Weekday(models.IntegerChoices):
        MONDAY = 0, "Thứ 2"
        TUESDAY = 1, "Thứ 3"
        WEDNESDAY = 2, "Thứ 4"
        THURSDAY = 3, "Thứ 5"
        FRIDAY = 4, "Thứ 6"
        SATURDAY = 5, "Thứ 7"
        SUNDAY = 6, "Chủ nhật"

    class Session(models.TextChoices):
        MORNING = "MORNING", "Sáng"
        AFTERNOON = "AFTERNOON", "Chiều"
        EVENING = "EVENING", "Tối"

    SESSION_PERIODS = {
        Session.MORNING: (1, 5),
        Session.AFTERNOON: (6, 10),
        Session.EVENING: (11, 15),
    }

    class_section = models.ForeignKey(
        ClassSection, on_delete=models.CASCADE, related_name="schedules"
    )
    weekday = models.PositiveSmallIntegerField(choices=Weekday.choices)
    session = models.CharField(max_length=16, choices=Session.choices, default=Session.MORNING)
    start_period = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(15)],
        help_text="Tiết bắt đầu trong ngày (1-15).",
    )
    end_period = models.PositiveSmallIntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(15)],
        editable=False,
        help_text="Tiết kết thúc, tự tính theo số tiết mỗi buổi.",
    )
    room = models.CharField(max_length=32, blank=True, help_text="VD: B4.12")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ["class_section", "weekday", "start_period"]
        verbose_name = "Lịch học"
        verbose_name_plural = "Lịch học"
        constraints = [
            models.UniqueConstraint(
                fields=["class_section", "weekday", "start_period"],
                name="unique_schedule_start_period",
            ),
        ]
        indexes = [
            models.Index(fields=["weekday", "start_period"], name="schedule_period_idx"),
        ]

    def clean(self):
        super().clean()
        if self.start_period is None or self.session not in self.SESSION_PERIODS:
            return
        periods = self.class_section.periods_per_session if self.class_section_id else 1
        self.end_period = self.start_period + periods - 1
        if self.end_period > 15:
            raise ValidationError(
                {"start_period": "Lịch học không được vượt quá tiết 15 trong ngày."}
            )
        session_start, session_end = self.SESSION_PERIODS[self.session]
        if not (session_start <= self.start_period <= self.end_period <= session_end):
            raise ValidationError(
                {
                    "start_period": (
                        f"Buổi {self.get_session_display()} chỉ được xếp trong "
                        f"tiết {session_start}-{session_end}."
                    )
                }
            )
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError(
                {"end_date": "Ngày kết thúc học phải sau hoặc bằng ngày bắt đầu học."}
            )
        if self.class_section_id:
            semester = self.class_section.semester
            if self.start_date and self.start_date < semester.start_date:
                raise ValidationError(
                    {"start_date": "Ngày bắt đầu học phải nằm trong thời gian học kỳ."}
                )
            if self.end_date and self.end_date > semester.end_date:
                raise ValidationError(
                    {"end_date": "Ngày kết thúc học phải nằm trong thời gian học kỳ."}
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return (
            f"{self.class_section.code} · {self.get_weekday_display()} · "
            f"{self.get_session_display()} tiết {self.start_period}-{self.end_period}"
        )
