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
        start = attrs.get("start_date")
        end = attrs.get("end_date")
        if start and end and start >= end:
            raise serializers.ValidationError({"end_date": "Phải sau ngày bắt đầu."})
        rs = attrs.get("registration_start")
        re = attrs.get("registration_end")
        if rs and re and rs >= re:
            raise serializers.ValidationError({"registration_end": "Phải sau lúc bắt đầu đăng ký."})
        return attrs
