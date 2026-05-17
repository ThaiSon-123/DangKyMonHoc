"""Fix-up: thêm Grade cho các Registration past-semester đã có CONFIRMED mà chưa có Grade.

Chạy:
docker compose exec backend python manage.py shell -c "exec(open('/app/scripts/seed_fix_grades_for_past_regs.py', encoding='utf-8').read())"
"""
import random
from decimal import Decimal

from django.db import transaction

from apps.grades.models import Grade
from apps.registrations.models import Registration
from apps.semesters.models import Semester

random.seed(42)


def random_score(seed: int, weak: bool = False) -> tuple[float, float, float]:
    """Trả (process, midterm, final) — total trong khoảng pass/fail tuỳ weak."""
    rng = random.Random(seed)
    if weak:
        mid = rng.uniform(3.5, 5.5)  # bias dưới passing
    else:
        mid = rng.uniform(5.5, 9.5)
    final = max(0.0, min(10.0, mid + rng.uniform(-0.7, 0.7)))
    process = max(0.0, min(10.0, mid + rng.uniform(-1.0, 1.5)))
    return round(process, 2), round(mid, 2), round(final, 2)


@transaction.atomic
def main():
    # HK hiện tại đang mở — không thêm grade
    current = Semester.objects.filter(is_open=True).order_by("-start_date").first()
    print(f"Current semester (skip): {current.code if current else 'None'}")

    # Find all CONFIRMED regs NOT in current semester AND without Grade
    qs = Registration.objects.filter(
        status=Registration.Status.CONFIRMED,
        grade__isnull=True,
    ).select_related("student", "class_section__course")
    if current:
        qs = qs.exclude(semester=current)

    total = qs.count()
    print(f"Regs cần thêm grade: {total}")

    created = 0
    for reg in qs.iterator():
        seed = reg.id * 31 + reg.student.id * 7
        weak = (seed % 100) < 10  # ~10% rớt
        process, mid, final = random_score(seed, weak=weak)
        Grade.objects.create(
            registration=reg,
            process_score=Decimal(str(process)),
            midterm_score=Decimal(str(mid)),
            final_score=Decimal(str(final)),
        )
        created += 1
        if created % 50 == 0:
            print(f"  ... đã tạo {created}/{total}")

    print()
    print(f"✓ Đã tạo {created} grades mới")
    print(f"Stats: tổng Grade có điểm = {Grade.objects.filter(total_score__isnull=False).count()}")


main()
