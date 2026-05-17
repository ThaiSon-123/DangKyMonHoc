"""Đổi username của GV thành {firstname}{khoa_abbrev}.

Ví dụ: "Trần Trung Kiên" + khoa "Công nghệ số" → "kiencns"

Logic:
- firstname = từ cuối cùng của user.full_name (theo quy ước VN)
- khoa_abbrev = chữ cái đầu của mỗi từ trong department, lowercase
- Bỏ dấu (đ→d, ă→a, ê→e, ...)
- Nếu trùng → append số suffix (kiencns2, kiencns3, ...)

Chạy:
docker compose exec backend python manage.py shell -c "exec(open('/app/scripts/rename_teacher_usernames.py', encoding='utf-8').read())"
"""
import re
import unicodedata

from django.db import transaction

from apps.profiles.models import TeacherProfile


def remove_diacritics(text: str) -> str:
    """Bỏ dấu tiếng Việt: 'Đức' → 'duc', 'Bình' → 'binh'."""
    # NFD decomposition + remove combining marks
    nfd = unicodedata.normalize("NFD", text)
    no_marks = "".join(c for c in nfd if not unicodedata.combining(c))
    # Special: đ/Đ không tự decompose
    return no_marks.replace("đ", "d").replace("Đ", "D")


def slugify_simple(text: str) -> str:
    """Lowercase + bỏ dấu + bỏ ký tự không phải a-z."""
    s = remove_diacritics(text).lower()
    return re.sub(r"[^a-z0-9]", "", s)


def first_name(full_name: str) -> str:
    """Lấy từ cuối cùng làm tên (quy ước VN: họ tên đệm tên)."""
    parts = (full_name or "").strip().split()
    if not parts:
        return "gv"
    return slugify_simple(parts[-1]) or "gv"


def department_abbrev(department: str) -> str:
    """Lấy chữ cái đầu của mỗi từ trong tên khoa.

    'Công nghệ số' → 'cns'
    'Kỹ thuật công nghệ' → 'ktcn'
    'Sư phạm' → 'sp'
    """
    if not department:
        return ""
    words = re.split(r"\s+", department.strip())
    initials = "".join(slugify_simple(w)[:1] for w in words if w)
    return initials or "kh"


@transaction.atomic
def main():
    print("=" * 70)
    print("Đổi username GV: {firstname}{khoa_abbrev}")
    print("=" * 70)

    teachers = list(TeacherProfile.objects.select_related("user").all())
    print(f"Tổng {len(teachers)} GV")
    print()

    # Bước 1: tính username mới (chưa apply)
    mapping: list[tuple[TeacherProfile, str]] = []
    base_count: dict[str, int] = {}

    for t in teachers:
        fn = first_name(t.user.full_name or t.user.username)
        abbrev = department_abbrev(t.department or "")
        base = f"{fn}{abbrev}"
        if not base:
            base = t.user.username  # fallback giữ nguyên

        # Resolve trùng — append số nếu cần
        count = base_count.get(base, 0)
        if count == 0:
            new_username = base
        else:
            new_username = f"{base}{count + 1}"
        base_count[base] = count + 1
        mapping.append((t, new_username))

    # Bước 2: in preview
    print(f"{'Cũ':<35} → {'Mới':<20} | {'Họ tên':<25} | Khoa")
    print("-" * 105)
    sample = mapping[:10] + (mapping[-5:] if len(mapping) > 15 else [])
    seen = set()
    for t, new_u in sample:
        if t.id in seen:
            continue
        seen.add(t.id)
        old = t.user.username
        if old == new_u:
            continue
        print(f"{old:<35} → {new_u:<20} | {t.user.full_name:<25} | {t.department}")
    if len(mapping) > len(sample):
        print(f"  ... ({len(mapping) - len(sample)} GV khác)")

    print()
    # Bước 3: apply
    updated = 0
    conflicts = []
    for t, new_u in mapping:
        if t.user.username == new_u:
            continue
        # Kiểm tra trùng với user khác
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.exclude(pk=t.user.pk).filter(username=new_u).exists():
            conflicts.append((t.user.username, new_u))
            continue
        t.user.username = new_u
        t.user.save(update_fields=["username"])
        updated += 1

    print(f"✓ Đã đổi {updated} username")
    if conflicts:
        print(f"⚠ {len(conflicts)} bị trùng với user khác (giữ nguyên):")
        for old, new in conflicts[:10]:
            print(f"    {old} → {new}")


main()
