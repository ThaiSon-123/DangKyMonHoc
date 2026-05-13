from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, PrerequisiteViewSet

router = DefaultRouter()
router.register(r"courses", CourseViewSet, basename="course")
router.register(r"prerequisites", PrerequisiteViewSet, basename="prerequisite")

urlpatterns = router.urls
