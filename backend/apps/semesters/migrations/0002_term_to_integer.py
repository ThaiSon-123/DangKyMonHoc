"""Convert Semester.term từ CharField(SPRING/FALL/SUMMER) sang PositiveSmallInteger (1/2/3).

Theo plan §7.2.9 — chốt term là số nguyên 1/2/3.
- SPRING → 1 (HK1)
- FALL   → 2 (HK2)
- SUMMER → 3 (HK hè)
"""
from django.db import migrations, models

MAPPING = {"SPRING": 1, "FALL": 2, "SUMMER": 3}
REVERSE = {v: k for k, v in MAPPING.items()}


def to_int(apps, schema_editor):
    Semester = apps.get_model("semesters", "Semester")
    for sem in Semester.objects.all():
        sem.term_int = MAPPING.get(sem.term, 1)
        sem.save(update_fields=["term_int"])


def to_str(apps, schema_editor):
    Semester = apps.get_model("semesters", "Semester")
    for sem in Semester.objects.all():
        sem.term = REVERSE.get(sem.term_int, "SPRING")
        sem.save(update_fields=["term"])


class Migration(migrations.Migration):
    dependencies = [("semesters", "0001_initial")]

    operations = [
        # 1. Thêm column tạm dạng int (nullable cho phép populate sau)
        migrations.AddField(
            model_name="semester",
            name="term_int",
            field=models.PositiveSmallIntegerField(null=True),
        ),
        # 2. Copy data
        migrations.RunPython(to_int, reverse_code=to_str),
        # 3. Xoá column cũ
        migrations.RemoveField(model_name="semester", name="term"),
        # 4. Đổi tên term_int → term
        migrations.RenameField(model_name="semester", old_name="term_int", new_name="term"),
        # 5. Đổi thành NOT NULL + choices
        migrations.AlterField(
            model_name="semester",
            name="term",
            field=models.PositiveSmallIntegerField(
                choices=[(1, "Học kỳ 1"), (2, "Học kỳ 2"), (3, "Học kỳ hè")],
                help_text="1=HK1, 2=HK2, 3=HK hè (plan §7.2.9).",
            ),
        ),
    ]
