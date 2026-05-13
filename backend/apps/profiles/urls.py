from rest_framework.routers import DefaultRouter
from .views import StudentProfileViewSet, TeacherProfileViewSet

router = DefaultRouter()
router.register(r"students", StudentProfileViewSet, basename="student-profile")
router.register(r"teachers", TeacherProfileViewSet, basename="teacher-profile")

urlpatterns = router.urls
