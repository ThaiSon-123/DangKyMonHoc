import unicodedata

from .models import CurriculumCourse


def _normalize(value: str) -> str:
    text = unicodedata.normalize("NFD", value or "")
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return text.lower()


def classify_knowledge_block(course, *, is_required: bool, suggested_semester: int = 1):
    code = (course.code or "").upper()
    name = _normalize(course.name)

    if any(term in name for term in ("tot nghiep", "khoa luan")):
        return CurriculumCourse.Knowledge.THESIS

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
        return CurriculumCourse.Knowledge.GENERAL

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
        return CurriculumCourse.Knowledge.BASIC

    if not is_required:
        return CurriculumCourse.Knowledge.ELECTIVE

    return CurriculumCourse.Knowledge.MAJOR
