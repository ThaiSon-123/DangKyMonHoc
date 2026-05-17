"""Admin Reports endpoint — FR-ADM-RPT.

Tổng hợp các thống kê vận hành cho trang `/admin/reports`.
"""
from django.contrib.auth import get_user_model
from django.db.models import Count, F, Q
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminRole
from apps.classes.models import ClassSection
from apps.majors.models import Major
from apps.registrations.models import Registration
from apps.semesters.models import Semester

User = get_user_model()


class AdminReportsView(APIView):
    """GET /api/reports/admin-summary/?semester=<id>

    Trả tổng hợp:
    - users: count theo role + locked
    - classes: count theo status + đầy
    - registrations: count theo status (CONFIRMED/PENDING/CANCELLED)
    - top_courses: 10 môn nhiều đăng ký nhất
    - by_major: registrations + students theo ngành
    - by_semester: registrations qua các HK gần đây (10 HK)
    """
    permission_classes = [IsAdminRole]

    def get(self, request):
        # 1. Chọn HK: ưu tiên query param, fallback HK đang mở, fallback HK mới nhất
        semester_id = request.query_params.get("semester")
        semester = None
        if semester_id:
            try:
                semester = Semester.objects.get(pk=int(semester_id))
            except (Semester.DoesNotExist, ValueError):
                return Response({"detail": "Học kỳ không tồn tại."}, status=400)
        if semester is None:
            semester = Semester.objects.filter(is_open=True).first()
        if semester is None:
            semester = Semester.objects.order_by("-start_date").first()

        # 2. Users (toàn hệ thống, không phụ thuộc HK)
        user_qs = User.objects.all()
        users_data = {
            "total": user_qs.count(),
            "admin": user_qs.filter(role="ADMIN").count(),
            "student": user_qs.filter(role="STUDENT").count(),
            "teacher": user_qs.filter(role="TEACHER").count(),
            "locked": user_qs.filter(is_locked=True).count(),
        }

        # 3. Classes (theo HK đã chọn)
        if semester:
            cls_qs = ClassSection.objects.filter(semester=semester)
        else:
            cls_qs = ClassSection.objects.none()

        classes_data = {
            "total": cls_qs.count(),
            "draft": cls_qs.filter(status=ClassSection.Status.DRAFT).count(),
            "open": cls_qs.filter(status=ClassSection.Status.OPEN).count(),
            "closed": cls_qs.filter(status=ClassSection.Status.CLOSED).count(),
            "cancelled": cls_qs.filter(status=ClassSection.Status.CANCELLED).count(),
            "full": cls_qs.filter(
                status=ClassSection.Status.OPEN,
                enrolled_count__gte=F("max_students"),
            ).count(),
        }

        # 4. Registrations (theo HK đã chọn)
        if semester:
            reg_qs = Registration.objects.filter(semester=semester)
        else:
            reg_qs = Registration.objects.none()

        registrations_data = {
            "confirmed": reg_qs.filter(status=Registration.Status.CONFIRMED).count(),
            "pending": reg_qs.filter(status=Registration.Status.PENDING).count(),
            "cancelled": reg_qs.filter(status=Registration.Status.CANCELLED).count(),
        }

        # 5. Top 10 môn nhiều đăng ký nhất (CONFIRMED, HK đã chọn)
        top_courses_qs = (
            reg_qs.filter(status=Registration.Status.CONFIRMED)
            .values(
                course_code=F("class_section__course__code"),
                course_name=F("class_section__course__name"),
                credits=F("class_section__course__credits"),
            )
            .annotate(registrations=Count("id"))
            .order_by("-registrations")[:10]
        )
        top_courses = list(top_courses_qs)

        # 6. Stats theo ngành (registrations + số SV unique)
        by_major_qs = (
            reg_qs.filter(status=Registration.Status.CONFIRMED)
            .values(
                major_code=F("student__major__code"),
                major_name=F("student__major__name"),
            )
            .annotate(
                registrations=Count("id"),
                students=Count("student_id", distinct=True),
            )
            .order_by("-registrations")
        )
        by_major = [m for m in by_major_qs if m["major_code"]]

        # 7. Registrations qua các HK gần đây (10 HK gần nhất)
        recent_semesters = list(
            Semester.objects.order_by("-start_date")[:10].values("id", "code", "name")
        )
        # Đảo lại theo thứ tự thời gian asc cho FE vẽ chart
        recent_semesters.reverse()
        sem_ids = [s["id"] for s in recent_semesters]
        sem_reg_counts = dict(
            Registration.objects.filter(
                semester_id__in=sem_ids,
                status=Registration.Status.CONFIRMED,
            )
            .values_list("semester_id")
            .annotate(c=Count("id"))
            .values_list("semester_id", "c")
        )
        by_semester = [
            {
                "semester_id": s["id"],
                "semester_code": s["code"],
                "semester_name": s["name"],
                "registrations": sem_reg_counts.get(s["id"], 0),
            }
            for s in recent_semesters
        ]

        # 8. Tổng ngành (cho overview)
        total_majors = Major.objects.filter(is_active=True).count()

        return Response({
            "semester": (
                {
                    "id": semester.id,
                    "code": semester.code,
                    "name": semester.name,
                    "is_open": semester.is_open,
                }
                if semester
                else None
            ),
            "users": users_data,
            "classes": classes_data,
            "registrations": registrations_data,
            "top_courses": top_courses,
            "by_major": by_major,
            "by_semester": by_semester,
            "total_majors": total_majors,
        })
