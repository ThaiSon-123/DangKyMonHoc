from rest_framework import serializers
from .models import Semester


class SemesterSerializer(serializers.ModelSerializer):
    term_display = serializers.CharField(source="get_term_display", read_only=True)

    class Meta:
        model = Semester
        fields = (
            "id", "code", "name", "term", "term_display", "academic_year",
            "start_date", "end_date", "registration_start", "registration_end",
            "is_open", "created_at", "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def validate(self, attrs):
        start = attrs.get("start_date", self.instance.start_date if self.instance else None)
        end = attrs.get("end_date", self.instance.end_date if self.instance else None)
        if start and end and start >= end:
            raise serializers.ValidationError({"end_date": "Phải sau ngày bắt đầu."})

        rs = attrs.get(
            "registration_start",
            self.instance.registration_start if self.instance else None,
        )
        re = attrs.get(
            "registration_end",
            self.instance.registration_end if self.instance else None,
        )
        if rs and re and rs >= re:
            raise serializers.ValidationError({"registration_end": "Phải sau lúc bắt đầu đăng ký."})
        return attrs
