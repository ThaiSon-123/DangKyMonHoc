from rest_framework.routers import DefaultRouter
from .views import ClassSectionViewSet, ScheduleViewSet

router = DefaultRouter()
router.register(r"class-sections", ClassSectionViewSet, basename="class-section")
router.register(r"schedules", ScheduleViewSet, basename="schedule")

urlpatterns = router.urls
