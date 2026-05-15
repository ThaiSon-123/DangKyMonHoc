"""Seed demo users: 15 students and 40 teachers.

Run inside Docker backend container:
python manage.py shell -c "exec(open('/app/scripts/seed_users_15_students_40_teachers.py', encoding='utf-8').read())"
"""

import re
import unicodedata

from django.db import transaction
from django.db.models import Count

from apps.accounts.models import Role, User
from apps.majors.models import Major
from apps.profiles.models import StudentProfile, TeacherProfile


STUDENT_PASSWORD = "12345678"
TEACHER_PASSWORD = "12345678"

STUDENT_NAMES = [
    "Nguyễn Minh Anh",
    "Trần Quốc Bảo",
    "Lê Thị Cẩm Tú",
    "Phạm Gia Huy",
    "Hoàng Thảo Linh",
    "Vũ Đức Mạnh",
    "Đặng Ngọc Mai",
    "Bùi Thanh Phong",
    "Đỗ Khánh Vy",
    "Ngô Nhật Nam",
    "Hồ Bảo Ngọc",
    "Lý Minh Quân",
    "Phan Hà My",
    "Trương Tuấn Kiệt",
    "Cao Phương Nhi",
]

STUDENT_MAJOR_BASE = {
    "CNOTO": "24248010300",
    "KTPM": "24258010300",
    "QTKD": "24228010300",
    "SPTH": "24258010400",
    "TNMT": "24238010300",
}

STUDENT_SEEDS = [
    {"old_username": "sv001", "major_code": "CNOTO", "suffix": "30", "name_index": 0},
    {"old_username": "sv006", "major_code": "CNOTO", "suffix": "31", "name_index": 5},
    {"old_username": "sv011", "major_code": "CNOTO", "suffix": "32", "name_index": 10},
    {"old_username": "sv002", "major_code": "KTPM", "suffix": "30", "name_index": 1},
    {"old_username": "sv007", "major_code": "KTPM", "suffix": "31", "name_index": 6},
    {"old_username": "sv012", "major_code": "KTPM", "suffix": "32", "name_index": 11},
    {"old_username": "sv003", "major_code": "QTKD", "suffix": "30", "name_index": 2},
    {"old_username": "sv008", "major_code": "QTKD", "suffix": "31", "name_index": 7},
    {"old_username": "sv013", "major_code": "QTKD", "suffix": "32", "name_index": 12},
    {"old_username": "sv004", "major_code": "SPTH", "suffix": "30", "name_index": 3},
    {"old_username": "sv009", "major_code": "SPTH", "suffix": "31", "name_index": 8},
    {"old_username": "sv014", "major_code": "SPTH", "suffix": "32", "name_index": 13},
    {"old_username": "sv005", "major_code": "TNMT", "suffix": "30", "name_index": 4},
    {"old_username": "sv010", "major_code": "TNMT", "suffix": "31", "name_index": 9},
    {"old_username": "sv015", "major_code": "TNMT", "suffix": "32", "name_index": 14},
]

STUDENT_PHONES = [
    "0812345630",
    "0912345631",
    "0712345632",
]

PHONE_PREFIXES = ["08", "09", "07"]

TEACHER_NAMES = [
    "Nguyễn Văn An",
    "Trần Thị Bình",
    "Lê Hoàng Chương",
    "Phạm Thị Dung",
    "Hoàng Minh Đức",
    "Vũ Thị Giang",
    "Đặng Quốc Huy",
    "Bùi Thị Hương",
    "Đỗ Văn Khoa",
    "Ngô Thị Lan",
    "Hồ Minh Long",
    "Lý Thị Mai",
    "Phan Văn Nam",
    "Trương Thị Oanh",
    "Cao Hữu Phúc",
    "Nguyễn Thùy Dương",
    "Trần Minh Hải",
    "Lê Gia Khánh",
    "Phạm Quỳnh Chi",
    "Hoàng Anh Tuấn",
    "Vũ Mai Phương",
    "Đặng Hải Đăng",
    "Bùi Ngọc Trâm",
    "Đỗ Thành Luân",
    "Ngô Bích Ngân",
    "Hồ Quốc Việt",
    "Lý Thu Hà",
    "Phan Đức Anh",
    "Trương Mỹ Hạnh",
    "Cao Minh Trí",
    "Nguyễn Hoài Nam",
    "Trần Kim Ngân",
    "Lê Tuấn Anh",
    "Phạm Bảo Châu",
    "Hoàng Khánh Duy",
    "Vũ Thanh Tâm",
    "Đặng Minh Nhật",
    "Bùi Phương Uyên",
    "Đỗ Hoài Sơn",
    "Ngô Thảo My",
]

TITLE_CYCLE = ["ThS.", "TS.", "PGS.TS.", "ThS.", "TS."]


def normalize_department(value: str) -> str:
    return value.strip().casefold()


def normalize_identifier(value: str) -> str:
    value = value.strip().lower().replace("đ", "d")
    value = unicodedata.normalize("NFKD", value)
    value = "".join(char for char in value if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", "", value)


def teacher_username(name: str, department: str) -> str:
    return f"{normalize_identifier(name)}{normalize_identifier(department)}"


def phone_for_index(index: int) -> str:
    prefix = PHONE_PREFIXES[(index - 1) % len(PHONE_PREFIXES)]
    return f"{prefix}{index:08d}"


def department_distribution(departments: list[str]) -> list[str]:
    digital = next(
        (dept for dept in departments if normalize_department(dept) == "công nghệ số"),
        None,
    )
    if not digital:
        raise RuntimeError("Không tìm thấy khoa Công nghệ số trong danh sách ngành.")

    others = [dept for dept in departments if dept != digital]
    if not others:
        raise RuntimeError("Cần có thêm khoa khác ngoài Công nghệ số để chia giáo viên.")

    distribution = [digital] * 17
    for index in range(23):
        distribution.append(others[index % len(others)])
    return distribution


def seed_students() -> tuple[int, int]:
    majors = {
        major.code: major
        for major in Major.objects.filter(code__in=STUDENT_MAJOR_BASE, is_active=True)
    }
    missing = sorted(set(STUDENT_MAJOR_BASE) - set(majors))
    if missing:
        raise RuntimeError(f"Thiếu ngành active để gán sinh viên: {', '.join(missing)}")

    created = 0
    updated = 0

    for index, seed in enumerate(STUDENT_SEEDS):
        major = majors[seed["major_code"]]
        username = f"{STUDENT_MAJOR_BASE[seed['major_code']]}{seed['suffix']}"
        old_username = seed["old_username"]
        existing_user = User.objects.filter(username=username).first()
        old_user = User.objects.filter(username=old_username).first()
        if existing_user and old_user and existing_user.id != old_user.id:
            raise RuntimeError(f"Trùng username sinh viên khi đổi {old_username} thành {username}.")

        user = existing_user or old_user or User(username=username)
        was_created = user.pk is None
        user.username = username
        user.email = f"{username}@student.tdmu.edu.vn"
        user.full_name = STUDENT_NAMES[seed["name_index"]]
        user.role = Role.STUDENT
        user.phone = STUDENT_PHONES[index % len(STUDENT_PHONES)]
        user.is_active = True
        user.is_locked = False
        user.set_password(STUDENT_PASSWORD)
        user.save()

        StudentProfile.objects.update_or_create(
            user=user,
            defaults={
                "student_code": username,
                "major": major,
                "enrollment_year": 2024,
                "is_active": True,
            },
        )
        if was_created:
            created += 1
        else:
            updated += 1
    return created, updated


def seed_teachers() -> tuple[int, int]:
    departments = sorted(
        {
            major.department.strip()
            for major in Major.objects.filter(is_active=True)
            if major.department.strip()
        }
    )
    distribution = department_distribution(departments)

    created = 0
    updated = 0
    for index, (name, department) in enumerate(zip(TEACHER_NAMES, distribution), start=1):
        username = teacher_username(name, department)
        old_username = f"gv{index:03d}"
        code = f"GV{index:03d}"
        title = TITLE_CYCLE[(index - 1) % len(TITLE_CYCLE)]
        existing_user = User.objects.filter(username=username).first()
        old_user = User.objects.filter(username=old_username).first()
        if existing_user and old_user and existing_user.id != old_user.id:
            raise RuntimeError(f"Trùng username giáo viên khi đổi {old_username} thành {username}.")

        user = existing_user or old_user or User(username=username)
        was_created = user.pk is None
        user.username = username
        user.email = f"{username}@gmail.com"
        user.full_name = name
        user.role = Role.TEACHER
        user.phone = phone_for_index(index)
        user.is_active = True
        user.is_locked = False
        user.set_password(TEACHER_PASSWORD)
        user.save()

        TeacherProfile.objects.update_or_create(
            user=user,
            defaults={
                "teacher_code": code,
                "department": department,
                "title": title,
                "is_active": True,
            },
        )
        if was_created:
            created += 1
        else:
            updated += 1
    return created, updated


with transaction.atomic():
    student_created, student_updated = seed_students()
    teacher_created, teacher_updated = seed_teachers()

print(f"Students seeded: +{student_created} created, {student_updated} updated")
print(f"Teachers seeded: +{teacher_created} created, {teacher_updated} updated")
print(f"Student password: {STUDENT_PASSWORD}")
print(f"Teacher password: {TEACHER_PASSWORD}")

print("Student distribution by major:")
seeded_codes = [
    f"{STUDENT_MAJOR_BASE[seed['major_code']]}{seed['suffix']}"
    for seed in STUDENT_SEEDS
]
for major in Major.objects.order_by("code"):
    count = StudentProfile.objects.filter(student_code__in=seeded_codes, major=major).count()
    print(f"- {major.code}: {count}")

print("Teacher distribution by department:")
seeded_teacher_codes = [f"GV{index:03d}" for index in range(1, len(TEACHER_NAMES) + 1)]
teacher_counts = (
    TeacherProfile.objects.filter(teacher_code__in=seeded_teacher_codes)
    .values("department")
    .annotate(total=Count("id"))
    .order_by("department")
)
for row in teacher_counts:
    print(f"- {row['department']}: {row['total']}")
