from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

SCORE_VALIDATORS = [MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("10"))]


class Grade(models.Model):
    registration = models.OneToOneField(
        "registrations.Registration", on_delete=models.CASCADE, related_name="grade"
    )
    process_score = models.DecimalField(
        max_digits=4, decimal_places=2, null=True, blank=True,
        validators=SCORE_VALIDATORS, help_text="Điểm quá trình (0-10)",
    )
    midterm_score = models.DecimalField(
        max_digits=4, decimal_places=2, null=True, blank=True,
        validators=SCORE_VALIDATORS, help_text="Điểm giữa kỳ (0-10)",
    )
    final_score = models.DecimalField(
        max_digits=4, decimal_places=2, null=True, blank=True,
        validators=SCORE_VALIDATORS, help_text="Điểm cuối kỳ (0-10)",
    )
    total_score = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, help_text="Tổng kết (auto)")
    gpa_4 = models.DecimalField(
        max_digits=3, decimal_places=2, null=True, blank=True,
        help_text="GPA thang 4 (auto, plan §7.2.13).",
    )
    grade_letter = models.CharField(max_length=2, blank=True, help_text="A/B/C/D/F")
    note = models.CharField(max_length=200, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Điểm"
        verbose_name_plural = "Điểm"

    def compute_total(self) -> Decimal | None:
        """Công thức tạm: quá trình 10% + giữa kỳ 40% + cuối kỳ 50% (TBD trong SRS)."""
        if self.process_score is None or self.midterm_score is None or self.final_score is None:
            return None
        return (
            self.process_score * Decimal("0.10")
            + self.midterm_score * Decimal("0.40")
            + self.final_score * Decimal("0.50")
        ).quantize(Decimal("0.01"))

    def compute_letter(self) -> str:
        if self.total_score is None:
            return ""
        s = float(self.total_score)
        if s >= 8.5:
            return "A"
        if s >= 8.0:
            return "B+"
        if s >= 7.0:
            return "B"
        if s >= 6.5:
            return "C+"
        if s >= 5.5:
            return "C"
        if s >= 5.0:
            return "D+"
        if s >= 4.0:
            return "D"
        return "F"

    def compute_gpa_4(self) -> Decimal | None:
        """Quy đổi điểm 10 → GPA thang 4 tuyến tính: gpa_4 = total_score × 0.4.

        - Nếu môn rớt (total_score < 4.0 = F) → gpa_4 = 0.00 (môn không tích luỹ).
        - Khác với `grade_letter` (vẫn quy chuẩn A/B+/B/C+/C/D+/D/F theo bậc),
          gpa_4 cho các môn pass tính liên tục để giữ độ chính xác — phù hợp khi
          cumulative GPA cần phân biệt mịn giữa 2 SV có cùng điểm chữ.
        """
        if self.total_score is None:
            return None
        s = Decimal(str(self.total_score))
        if s < Decimal("4.0"):
            return Decimal("0.00")
        return (s * Decimal("0.4")).quantize(Decimal("0.01"))

    def save(self, *args, **kwargs):
        self.total_score = self.compute_total()
        self.grade_letter = self.compute_letter()
        self.gpa_4 = self.compute_gpa_4()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"{self.registration} = {self.total_score or '—'}"
