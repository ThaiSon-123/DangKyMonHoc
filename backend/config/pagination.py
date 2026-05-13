from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Cho phép client override page_size qua query param `?page_size=...`.

    Hữu ích cho dropdown UI cần fetch toàn bộ records.
    """

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 1000
