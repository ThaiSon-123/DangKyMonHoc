"""Seed 15 tài khoản giáo viên + TeacherProfile.

Chạy: docker compose exec backend python manage.py shell < scripts/seed_teachers.py
"""
from apps.accounts.models import Role, User
from apps.profiles.models import TeacherProfile

DEFAULT_PASSWORD = "Gv@2026"

TEACHERS = [
    # (code, full_name, department, title, phone)
    ("GV001", "Nguyễn Văn An",       "Khoa Công nghệ thông tin", "TS.",      "0901100001"),
    ("GV002", "Trần Thị Bình",        "Khoa Công nghệ thông tin", "ThS.",     "0901100002"),
    ("GV003", "Lê Hoàng Chương",      "Khoa Công nghệ thông tin", "PGS.TS.",  "0901100003"),
    ("GV004", "Phạm Thị Dung",        "Khoa Khoa học máy tính",   "TS.",      "0901100004"),
    ("GV005", "Hoàng Minh Đức",       "Khoa Khoa học máy tính",   "ThS.",     "0901100005"),
    ("GV006", "Vũ Thị Giang",         "Khoa Khoa học máy tính",   "TS.",      "0901100006"),
    ("GV007", "Đặng Quốc Huy",        "Khoa Hệ thống thông tin",  "PGS.TS.",  "0901100007"),
    ("GV008", "Bùi Thị Hương",        "Khoa Hệ thống thông tin",  "ThS.",     "0901100008"),
    ("GV009", "Đỗ Văn Khoa",          "Khoa Hệ thống thông tin",  "TS.",      "0901100009"),
    ("GV010", "Ngô Thị Lan",          "Khoa Kỹ thuật phần mềm",   "ThS.",     "0901100010"),
    ("GV011", "Hồ Minh Long",         "Khoa Kỹ thuật phần mềm",   "TS.",      "0901100011"),
    ("GV012", "Lý Thị Mai",           "Khoa Kỹ thuật phần mềm",   "PGS.TS.",  "0901100012"),
    ("GV013", "Phan Văn Nam",         "Khoa An toàn thông tin",   "TS.",      "0901100013"),
    ("GV014", "Trương Thị Oanh",      "Khoa An toàn thông tin",   "ThS.",     "0901100014"),
    ("GV015", "Cao Hữu Phúc",         "Khoa An toàn thông tin",   "GS.TS.",   "0901100015"),
]


def run():
    created_users = 0
    skipped_users = 0
    created_profiles = 0
    skipped_profiles = 0

    for code, full_name, dept, title, phone in TEACHERS:
        username = code.lower()
        email = f"{username}@dkmh.edu"

        user, u_created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "full_name": full_name,
                "role": Role.TEACHER,
                "phone": phone,
                "is_active": True,
            },
        )
        if u_created:
            user.set_password(DEFAULT_PASSWORD)
            user.save()
            created_users += 1
        else:
            skipped_users += 1

        _, p_created = TeacherProfile.objects.get_or_create(
            user=user,
            defaults={
                "teacher_code": code,
                "department": dept,
                "title": title,
                "is_active": True,
            },
        )
        if p_created:
            created_profiles += 1
        else:
            skipped_profiles += 1

    print(f"✓ Users: +{created_users} mới, {skipped_users} đã tồn tại")
    print(f"✓ TeacherProfiles: +{created_profiles} mới, {skipped_profiles} đã tồn tại")
    print(f"✓ Default password: {DEFAULT_PASSWORD}")
    print(f"✓ Tổng GV trong DB hiện tại: {User.objects.filter(role=Role.TEACHER).count()}")


run()
