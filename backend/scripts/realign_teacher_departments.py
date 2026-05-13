"""Map khoa 'cũ' (theo seed cũ) → khoa hiện tại trong Major.

Chạy: docker compose exec backend python manage.py shell < scripts/realign_teacher_departments.py
Sửa MAPPING phía dưới cho phù hợp ý đồ trước khi chạy.
"""
from apps.profiles.models import TeacherProfile

# Map từ khoa cũ → khoa mới (theo Major.department hiện tại)
MAPPING = {
    "Khoa Công nghệ thông tin": "Công nghệ số",
    "Khoa Khoa học máy tính":   "Công nghệ số",
    "Khoa Hệ thống thông tin":  "Kỹ thuật công nghê",
    "Khoa Kỹ thuật phần mềm":   "Kỹ thuật công nghê",
    "Khoa An toàn thông tin":   "Kỹ thuật công nghê",
}


def run():
    changed = 0
    for tp in TeacherProfile.objects.all():
        new = MAPPING.get(tp.department)
        if new and new != tp.department:
            old = tp.department
            tp.department = new
            tp.save(update_fields=["department", "updated_at"])
            print(f"  {tp.teacher_code}: '{old}' → '{new}'")
            changed += 1
    print(f"\n✓ Đã realign {changed} GV.")


run()
