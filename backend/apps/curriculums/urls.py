from rest_framework.routers import DefaultRouter
from .views import CurriculumCourseViewSet, CurriculumViewSet

router = DefaultRouter()
router.register(r"curriculums", CurriculumViewSet, basename="curriculum")
router.register(r"curriculum-courses", CurriculumCourseViewSet, basename="curriculum-course")

urlpatterns = router.urls
