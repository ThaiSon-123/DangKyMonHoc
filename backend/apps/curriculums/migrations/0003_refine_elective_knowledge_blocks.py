import unicodedata

from django.db import migrations


def normalize(value):
    text = unicodedata.normalize("NFD", value or "")
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return text.lower()


def classify(course_code, course_name, is_required, suggested_semester):
    code = (course_code or "").upper()
    name = normalize(course_name)

    if "tot nghiep" in name or "khoa luan" in name:
        return "THESIS"

    general_terms = (
        "giao duc the chat",
        "giao duc quoc phong",
        "quoc phong an ninh",
        "phap luat dai cuong",
        "triet hoc",
        "mac - lenin",
        "kinh te chinh tri",
        "chu nghia xa hoi",
        "tu tuong ho chi minh",
        "lich su dang",
        "tu duy bien luan",
        "dong nam bo",
        "toan cao cap",
        "xac suat thong ke",
        "cac phuong phap thong ke",
        "vat ly dai cuong",
        "phuong phap nghien cuu khoa hoc",
        "doi moi, sang tao va khoi nghiep",
        "van hoa viet nam",
        "co so van hoa viet nam",
    )
    if code.startswith("KTCH") or any(term in name for term in general_terms):
        return "GENERAL"

    basic_terms = (
        "nhap mon",
        "co so",
        "nguyen ly",
        "can ban",
        "kinh te vi mo",
        "quan tri hoc",
        "marketing can ban",
        "giao duc hoc",
        "tam ly hoc",
        "sinh ly",
        "sinh thai hoc",
        "moi truong va con nguoi",
        "kien truc may tinh",
        "ky thuat lap trinh",
        "cau truc du lieu",
        "co so du lieu",
        "he quan tri co so du lieu",
        "co ky thuat",
        "suc ben vat lieu",
        "hinh hoa",
        "dung sai",
        "dien - dien tu co ban",
        "an toan lao dong",
        "luat va chinh sach",
    )
    if suggested_semester <= 4 or any(term in name for term in basic_terms):
        return "BASIC"

    if not is_required:
        return "ELECTIVE"

    return "MAJOR"


def refine_knowledge_blocks(apps, schema_editor):
    CurriculumCourse = apps.get_model("curriculums", "CurriculumCourse")
    links = CurriculumCourse.objects.select_related("course")
    for link in links.iterator():
        link.knowledge_block = classify(
            link.course.code,
            link.course.name,
            link.is_required,
            link.suggested_semester,
        )
        link.save(update_fields=["knowledge_block"])


class Migration(migrations.Migration):

    dependencies = [
        ("curriculums", "0002_reclassify_knowledge_blocks"),
    ]

    operations = [
        migrations.RunPython(refine_knowledge_blocks, migrations.RunPython.noop),
    ]
