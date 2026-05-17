"""Thêm field `full_name` vào User và copy data từ first_name + last_name.

Theo plan §7.2.1: dùng `full_name` (CharField 200) thay vì first/last name.
AbstractUser vẫn giữ first_name/last_name (di sản Django), nhưng app không
dùng nữa.
"""
from django.db import migrations, models


def copy_to_full_name(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    for u in User.objects.all():
        full = f"{u.last_name or ''} {u.first_name or ''}".strip()
        if full:
            u.full_name = full
            u.save(update_fields=["full_name"])


def copy_back(apps, schema_editor):
    """Tách ngược lại: phần cuối là first_name, phần đầu là last_name."""
    User = apps.get_model("accounts", "User")
    for u in User.objects.all():
        if not u.full_name:
            continue
        parts = u.full_name.strip().split()
        if len(parts) == 1:
            u.first_name = parts[0]
            u.last_name = ""
        else:
            u.first_name = parts[-1]
            u.last_name = " ".join(parts[:-1])
        u.save(update_fields=["first_name", "last_name"])


class Migration(migrations.Migration):
    dependencies = [("accounts", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="user",
            name="full_name",
            field=models.CharField(
                blank=True, help_text="Họ và tên đầy đủ.", max_length=200
            ),
        ),
        migrations.RunPython(copy_to_full_name, reverse_code=copy_back),
    ]
