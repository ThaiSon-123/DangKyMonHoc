from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """Phân trang chuẩn cho mọi list endpoint.

    Tuân thủ NFR "≤50 bản ghi/lần":
      • Mặc định 25 bản ghi/page (cân bằng tốc độ và UX).
      • Tối đa 50 bản ghi/page (chặn client lạm dụng để dump bảng).
      • Client override qua `?page_size=...` (chỉ có hiệu lực nếu ≤50).
    """

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 50


class LookupPagination(PageNumberPagination):
    """Dùng riêng cho dropdown/lookup cần lấy toàn bộ danh mục (ngành, môn...).

    Cho phép page_size lớn hơn vì đây là metadata read-only ít records (<1000).
    KHÔNG dùng cho list view hiển thị cho người dùng cuối.
    """

    page_size = 100
    page_size_query_param = "page_size"
    max_page_size = 1000
