from django.db import models


class Curriculum(models.Model):
    major = models.ForeignKey(
        "majors.Major", on_delete=models.PROTECT, related_name="curriculums"
    )
    code = models.CharField(max_length=32, unique=True, help_text="VD: CNTT-2021")
    name = models.CharField(max_length=200)
    cohort_year = models.PositiveSmallIntegerField(help_text="Khoá áp dụng, vd: 2021")
    total_credits_required = models.PositiveSmallIntegerField(default=145)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    courses = models.ManyToManyField(
        "courses.Course",
        through="CurriculumCourse",
        related_name="curriculums",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-cohort_year", "code"]
        verbose_name = "Chương trình đào tạo"
        verbose_name_plural = "Chương trình đào tạo"

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class CurriculumCourse(models.Model):
    """Môn học trong 1 CTĐT, đánh dấu bắt buộc / tự chọn + học kỳ gợi ý."""

    class Knowledge(models.TextChoices):
        GENERAL = "GENERAL", "Đại cương"
        BASIC = "BASIC", "Cơ sở ngành"
        MAJOR = "MAJOR", "Chuyên ngành"
        ELECTIVE = "ELECTIVE", "Tự chọn"
        THESIS = "THESIS", "Tốt nghiệp"

    curriculum = models.ForeignKey(
        Curriculum, on_delete=models.CASCADE, related_name="curriculum_courses"
    )
    course = models.ForeignKey(
        "courses.Course", on_delete=models.PROTECT, related_name="curriculum_links"
    )
    knowledge_block = models.CharField(max_length=16, choices=Knowledge.choices, default=Knowledge.MAJOR)
    is_required = models.BooleanField(default=True, help_text="Bắt buộc / tự chọn")
    suggested_semester = models.PositiveSmallIntegerField(default=1, help_text="Học kỳ gợi ý 1-8")

    class Meta:
        unique_together = ("curriculum", "course")
        ordering = ["curriculum", "suggested_semester", "course__code"]
        verbose_name = "Môn học trong CTĐT"
        verbose_name_plural = "Môn học trong CTĐT"

    def __str__(self) -> str:
        return f"{self.curriculum.code} · {self.course.code}"
