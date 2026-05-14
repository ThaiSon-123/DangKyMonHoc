from rest_framework.test import APIClient

from apps.notifications.models import Notification, NotificationRead


def test_notification_list_can_filter_unread_for_current_user(admin_user):
    read = Notification.objects.create(
        title="Da doc",
        body="Thong bao da doc",
        audience=Notification.Audience.ALL,
        sender=admin_user,
    )
    unread = Notification.objects.create(
        title="Chua doc",
        body="Thong bao chua doc",
        audience=Notification.Audience.ALL,
        sender=admin_user,
    )
    NotificationRead.objects.create(notification=read, user=admin_user)
    client = APIClient()
    client.force_authenticate(admin_user)

    res = client.get("/api/notifications/", {"unread": "true"})

    assert res.status_code == 200
    assert [item["id"] for item in res.data["results"]] == [unread.id]
