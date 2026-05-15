"""Seed prerequisite relationships by major.

Each major gets 15 courses with prerequisites. The script validates that the
required course appears in an earlier suggested semester in that major's
curriculum before writing anything.

Run inside Docker backend container:
python manage.py shell -c "exec(open('/app/scripts/seed_prerequisites_by_major.py', encoding='utf-8').read())"
"""

from django.db import transaction

from apps.courses.models import Course, Prerequisite
from apps.curriculums.models import CurriculumCourse


PREREQUISITES_BY_MAJOR = {
    "CNOTO": [
        ("LING235", "LING017"),
        ("LING164", "LING017"),
        ("LING033", "LING017"),
        ("LING268", "LING033"),
        ("CNOT035", "LING041"),
        ("CNOT037", "LING235"),
        ("CNOT004", "LING055"),
        ("CNOT028", "LING017"),
        ("CNOT008", "CNOT037"),
        ("CNOT015", "LING041"),
        ("CNOT016", "CNOT035"),
        ("CNOT024", "CNOT037"),
        ("CNOT021", "LING235"),
        ("CNOT006", "CNOT028"),
        ("CNOT011", "CNOT012"),
    ],
    "KTPM": [
        ("LING105", "LING022"),
        ("LING010", "LING105"),
        ("LING068", "LING020"),
        ("LING196", "LING105"),
        ("LING110", "LING105"),
        ("LING109", "LING256"),
        ("KTPM031", "LING196"),
        ("LING031", "KTPM031"),
        ("KTPM004", "KTPM031"),
        ("LING189", "LING196"),
        ("LING137", "LING093"),
        ("LING005", "CNTT043"),
        ("LING358", "LING010"),
        ("LING081", "LING358"),
        ("KTPM034", "LING031"),
    ],
    "QTKD": [
        ("LING096", "LING095"),
        ("LING138", "QTKD014"),
        ("LING166", "QTKD014"),
        ("LING127", "KTCH014"),
        ("QTKD002", "LING138"),
        ("LING182", "LING166"),
        ("LING238", "LING096"),
        ("MKTG005", "LING166"),
        ("LING454", "LING138"),
        ("LING152", "LING138"),
        ("LING225", "LING456"),
        ("LING462", "LING238"),
        ("TMDT021", "LING238"),
        ("LING216", "LING456"),
        ("LING463", "LING226"),
    ],
    "SPTH": [
        ("LING240", "LING239"),
        ("LING061", "LING239"),
        ("GDTH005", "GDTH004"),
        ("GDTH007", "GDTH031"),
        ("GDTH028", "GDTH006"),
        ("GDTH045", "GDTH006"),
        ("GDTH027", "GDTH004"),
        ("GDTH046", "GDTH005"),
        ("GDTH009", "GDTH031"),
        ("GDTH025", "GDTH008"),
        ("GDTH051", "GDTH009"),
        ("GDTH012", "LING061"),
        ("GDTH056", "GDTH055"),
        ("GDTH057", "GDTH056"),
        ("GDTH073", "GDTH056"),
    ],
    "TNMT": [
        ("LING007", "LING414"),
        ("LING230", "LING414"),
        ("LING021", "LING121"),
        ("QLMT016", "LING121"),
        ("LING034", "LING414"),
        ("QLMT013", "LING414"),
        ("QLMT014", "LING414"),
        ("LING029", "LING021"),
        ("QLMT015", "LING021"),
        ("LING039", "QLMT019"),
        ("LING038", "QLMT019"),
        ("QLMT022", "LING021"),
        ("LING092", "LING034"),
        ("LING213", "QLMT013"),
        ("QLMT012", "QLMT013"),
    ],
}


def curriculum_semesters(major_code: str) -> dict[str, int]:
    rows = CurriculumCourse.objects.filter(
        curriculum__major__code=major_code,
        curriculum__is_active=True,
    ).select_related("course")
    return {row.course.code: row.suggested_semester for row in rows}


def validate_pairs() -> None:
    errors: list[str] = []
    all_codes = {code for pair_list in PREREQUISITES_BY_MAJOR.values() for pair in pair_list for code in pair}
    existing_codes = set(Course.objects.filter(code__in=all_codes).values_list("code", flat=True))
    missing_courses = sorted(all_codes - existing_codes)
    if missing_courses:
        errors.append(f"Không tìm thấy môn: {', '.join(missing_courses)}")

    for major_code, pairs in PREREQUISITES_BY_MAJOR.items():
        if len(pairs) != 15:
            errors.append(f"{major_code} có {len(pairs)} cặp, cần đúng 15.")
        semesters = curriculum_semesters(major_code)
        for course_code, required_code in pairs:
            course_sem = semesters.get(course_code)
            required_sem = semesters.get(required_code)
            if course_sem is None:
                errors.append(f"{major_code}: {course_code} không nằm trong CTĐT.")
                continue
            if required_sem is None:
                errors.append(f"{major_code}: {required_code} không nằm trong CTĐT.")
                continue
            if required_sem >= course_sem:
                errors.append(
                    f"{major_code}: {required_code} HK{required_sem} không đứng trước "
                    f"{course_code} HK{course_sem}."
                )
    if errors:
        raise RuntimeError("\n".join(errors))


def seed_prerequisites() -> tuple[int, int]:
    courses = {course.code: course for course in Course.objects.all()}
    created = 0
    existing = 0
    for major_code, pairs in PREREQUISITES_BY_MAJOR.items():
        for course_code, required_code in pairs:
            _, was_created = Prerequisite.objects.get_or_create(
                course=courses[course_code],
                required_course=courses[required_code],
                defaults={"note": f"Seed tiên quyết ngành {major_code}."},
            )
            if was_created:
                created += 1
            else:
                existing += 1
    return created, existing


validate_pairs()
with transaction.atomic():
    created_count, existing_count = seed_prerequisites()

print(f"Prerequisites: +{created_count} created, {existing_count} already existed")
for major_code, pairs in PREREQUISITES_BY_MAJOR.items():
    print(f"- {major_code}: {len(pairs)} configured pairs")
