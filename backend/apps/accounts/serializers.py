from datetime import date

from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.settings import api_settings

from apps.accounts.models import Role
from apps.majors.models import Major
from apps.profiles.models import StudentProfile, TeacherProfile

User = get_user_model()
LOCKED_ACCOUNT_MESSAGE = "Tài khoản bạn đã bị khóa. Vui lòng liên hệ admin!"


class UserProfileFieldsMixin:
    def _student_profile(self, user):
        try:
            return user.student_profile
        except ObjectDoesNotExist:
            return None

    def _teacher_profile(self, user):
        try:
            return user.teacher_profile
        except ObjectDoesNotExist:
            return None

    def validate(self, attrs):
        attrs = super().validate(attrs)
        role = attrs.get("role", getattr(self.instance, "role", None))
        should_validate_profile = (
            self.instance is None
            or "role" in attrs
            or "student_major" in attrs
            or "teacher_department" in attrs
        )
        if not should_validate_profile:
            return attrs

        if role == Role.STUDENT:
            profile = self._student_profile(self.instance) if self.instance else None
            if "student_major" in attrs:
                has_major = attrs["student_major"] is not None
            else:
                has_major = bool(profile and profile.major_id)
            if not has_major:
                raise serializers.ValidationError(
                    {"student_major": "Sinh viên bắt buộc phải có ngành học."}
                )

        if role == Role.TEACHER:
            profile = self._teacher_profile(self.instance) if self.instance else None
            if "teacher_department" in attrs:
                has_department = bool(attrs["teacher_department"].strip())
            else:
                has_department = bool(profile and profile.department.strip())
            if not has_department:
                raise serializers.ValidationError(
                    {"teacher_department": "Giáo viên bắt buộc phải thuộc khoa."}
                )

        return attrs

    def _sync_profile(self, user, student_major=None, teacher_department=None):
        if user.role == Role.STUDENT:
            profile = self._student_profile(user)
            major = student_major or (profile.major if profile else None)
            if major:
                StudentProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        "student_code": user.username,
                        "major": major,
                        "enrollment_year": profile.enrollment_year if profile else date.today().year,
                    },
                )

        if user.role == Role.TEACHER:
            profile = self._teacher_profile(user)
            department = teacher_department
            if department is None and profile:
                department = profile.department
            if department:
                TeacherProfile.objects.update_or_create(
                    user=user,
                    defaults={
                        "teacher_code": user.username,
                        "department": department.strip(),
                    },
                )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        student_profile = self._student_profile(instance)
        teacher_profile = self._teacher_profile(instance)
        data["student_major"] = student_profile.major_id if student_profile else None
        data["teacher_department"] = teacher_profile.department if teacher_profile else ""
        return data


class UserSerializer(UserProfileFieldsMixin, serializers.ModelSerializer):
    student_major = serializers.PrimaryKeyRelatedField(
        queryset=Major.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    teacher_department = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "full_name",
            "role",
            "phone",
            "is_locked",
            "is_active",
            "student_major",
            "teacher_department",
        )
        read_only_fields = ("id",)

    def update(self, instance, validated_data):
        student_major = validated_data.pop("student_major", None)
        teacher_department = validated_data.pop("teacher_department", None)
        user = super().update(instance, validated_data)
        self._sync_profile(user, student_major, teacher_department)
        return user


class UserCreateSerializer(UserProfileFieldsMixin, serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    student_major = serializers.PrimaryKeyRelatedField(
        queryset=Major.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    teacher_department = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "full_name",
            "role",
            "phone",
            "password",
            "student_major",
            "teacher_department",
        )
        read_only_fields = ("id",)

    def validate_role(self, value):
        if value == "ADMIN":
            raise serializers.ValidationError("Không được phép tạo tài khoản Admin.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        student_major = validated_data.pop("student_major", None)
        teacher_department = validated_data.pop("teacher_department", None)
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        self._sync_profile(user, student_major, teacher_department)
        return user


class LockedAwareTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        username = attrs.get(self.username_field)
        if username and User.objects.filter(
            **{self.username_field: username},
            is_locked=True,
        ).exists():
            raise AuthenticationFailed(LOCKED_ACCOUNT_MESSAGE, code="user_locked")
        data = super().validate(attrs)
        return data


class LockedAwareTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        refresh = self.token_class(attrs["refresh"])
        user_id = refresh.get(api_settings.USER_ID_CLAIM)
        if User.objects.filter(
            **{api_settings.USER_ID_FIELD: user_id},
            is_locked=True,
        ).exists():
            raise AuthenticationFailed(LOCKED_ACCOUNT_MESSAGE, code="user_locked")
        return super().validate(attrs)
