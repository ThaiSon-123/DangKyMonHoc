# Tóm tắt chức năng hệ thống đăng ký môn học

Tài liệu này mô tả các chức năng chính của hệ thống theo từng vai trò người dùng, kèm luồng xử lý và ràng buộc nghiệp vụ bằng ngôn ngữ tự nhiên. Tài liệu không đi vào chi tiết mã nguồn, chỉ tập trung vào cách hệ thống vận hành.

## 1. Tổng quan hệ thống

Hệ thống đăng ký môn học hỗ trợ ba nhóm người dùng chính: quản trị viên, sinh viên và giáo viên. Quản trị viên vận hành dữ liệu đào tạo, mở học kỳ, tạo lớp học phần, quản lý đăng ký và gửi thông báo. Sinh viên xem chương trình đào tạo, đăng ký môn học, tạo thời khóa biểu tự động, xem lịch học, lịch sử, bảng điểm và thông báo. Giáo viên xem lịch dạy, quản lý lớp phụ trách, nhập điểm và gửi thông báo cho sinh viên trong lớp.

Toàn hệ thống được bảo vệ bằng đăng nhập và phân quyền theo vai trò. Mỗi người dùng chỉ được nhìn thấy và thao tác trên dữ liệu phù hợp với vai trò của mình. Các nghiệp vụ quan trọng như đăng ký môn, xếp lịch, nhập điểm, hủy đăng ký và gửi thông báo đều có ràng buộc để tránh sai dữ liệu.

## 2. Chức năng chung

### 2.1. Đăng nhập và phân quyền

Người dùng truy cập hệ thống qua màn hình đăng nhập. Sinh viên và giáo viên dùng cổng đăng nhập chung, còn quản trị viên có cổng đăng nhập riêng. Sau khi đăng nhập thành công, hệ thống chuyển người dùng về trang chủ tương ứng với vai trò.

Luồng xử lý bắt đầu bằng việc người dùng nhập tài khoản và mật khẩu. Hệ thống kiểm tra thông tin đăng nhập, trạng thái tài khoản và vai trò. Nếu hợp lệ, phiên đăng nhập được lưu để người dùng tiếp tục thao tác mà không cần đăng nhập lại trong thời gian ngắn. Khi phiên hết hạn, hệ thống cố gắng làm mới phiên trước khi yêu cầu đăng nhập lại.

Ràng buộc chính là tài khoản bị khóa không được đăng nhập, không được làm mới phiên và không được tiếp tục dùng phiên cũ. Người dùng đăng nhập sai cổng sẽ bị từ chối ở giao diện và được hướng dẫn sang đúng cổng. Các trang nội bộ luôn kiểm tra vai trò trước khi cho truy cập.

### 2.2. Trang chủ theo vai trò

Sau khi đăng nhập, mỗi vai trò có một trang chủ riêng. Trang chủ giúp người dùng nhìn nhanh các khu vực chức năng quan trọng và đi đến các màn hình cần dùng thường xuyên.

Luồng xử lý đơn giản: hệ thống đọc vai trò của người dùng đang đăng nhập, sau đó hiển thị menu và trang chủ phù hợp. Nếu người dùng cố truy cập khu vực không thuộc vai trò của mình, hệ thống chuyển hướng hoặc chặn truy cập.

Ràng buộc chính là menu, dữ liệu và hành động đều phải khớp với vai trò. Sinh viên không được vào màn hình quản trị, giáo viên không được dùng chức năng của sinh viên, và quản trị viên không dùng giao diện nhập điểm với tư cách giáo viên trừ khi chức năng đó cho phép quyền quản trị can thiệp.

### 2.3. Thông báo và trạng thái đã đọc

Hệ thống có chức năng thông báo cho người dùng. Thông báo có thể gửi cho tất cả người dùng, cho toàn bộ sinh viên, cho toàn bộ giáo viên hoặc cho danh sách người nhận cụ thể.

Luồng xử lý gồm tạo thông báo, xác định đối tượng nhận, hiển thị thông báo trong danh sách của người nhận, và đánh dấu đã đọc khi người dùng mở thông báo. Người dùng cũng có thể đánh dấu tất cả thông báo là đã đọc.

Ràng buộc chính là người dùng chỉ thấy thông báo dành cho vai trò của mình, thông báo gửi đích danh cho mình hoặc thông báo do chính mình gửi. Sinh viên chỉ được gửi thông báo đích danh cho giáo viên đang dạy lớp mà sinh viên đã đăng ký xác nhận. Giáo viên chỉ gửi thông báo cho sinh viên của lớp mình phụ trách thông qua chức năng gửi thông báo lớp. Quản trị viên có quyền gửi thông báo rộng hơn.

## 3. Vai trò quản trị viên

### 3.1. Quản lý tài khoản

Quản trị viên quản lý tài khoản sinh viên và giáo viên. Chức năng này dùng để tạo tài khoản mới, cập nhật thông tin, lọc danh sách, khóa hoặc mở khóa tài khoản và kiểm soát vai trò.

Luồng xử lý thường bắt đầu bằng việc quản trị viên mở danh sách tài khoản, tìm kiếm hoặc lọc theo vai trò, khoa, ngành hoặc trạng thái khóa. Khi tạo tài khoản sinh viên, quản trị viên nhập thông tin người dùng và ngành học. Khi tạo tài khoản giáo viên, quản trị viên nhập thông tin người dùng và khoa phụ trách. Hệ thống tự đồng bộ hồ sơ sinh viên hoặc hồ sơ giáo viên tương ứng.

Ràng buộc chính là không được tạo tài khoản quản trị viên thông qua giao diện quản lý tài khoản. Quản trị viên cũng không được đổi tài khoản thường thành quản trị viên qua chức năng này. Sinh viên bắt buộc có ngành học, giáo viên bắt buộc có khoa. Tài khoản quản trị viên không được xóa qua API quản lý thông thường, và quản trị viên không được tự xóa chính mình.

### 3.2. Quản lý ngành đào tạo

Quản trị viên quản lý danh mục ngành đào tạo. Mỗi ngành có mã ngành, tên ngành, khoa, thời gian đào tạo và trạng thái hoạt động.

Luồng xử lý gồm thêm ngành, cập nhật ngành, tìm kiếm ngành và ngừng sử dụng hoặc xóa ngành khi phù hợp. Ngành là dữ liệu nền cho sinh viên, chương trình đào tạo, môn học và thống kê.

Ràng buộc chính là mã ngành cần duy nhất. Nếu ngành đã được liên kết với dữ liệu khác, hệ thống ưu tiên chặn xóa trực tiếp hoặc xử lý theo hướng ngừng hoạt động để tránh mất dữ liệu liên quan.

### 3.3. Quản lý chương trình đào tạo

Quản trị viên tạo và cập nhật chương trình đào tạo theo ngành và khóa tuyển sinh. Chương trình đào tạo chứa danh sách môn học, nhóm kiến thức, trạng thái bắt buộc hoặc tự chọn, học kỳ gợi ý và tổng tín chỉ yêu cầu.

Luồng xử lý bắt đầu bằng việc chọn ngành và khóa, tạo chương trình đào tạo, sau đó thêm các môn học vào chương trình. Quản trị viên có thể xem chi tiết chương trình, chỉnh thông tin và import danh sách môn từ file dữ liệu nếu cần.

Ràng buộc chính là sinh viên sẽ được ghép với chương trình đào tạo dựa trên ngành và năm nhập học. Nếu không có chương trình đúng khóa, hệ thống dùng chương trình gần nhất trước hoặc bằng năm nhập học. Nếu vẫn không có chương trình phù hợp, sinh viên sẽ không xem được chương trình và cần liên hệ phòng đào tạo.

### 3.4. Quản lý môn học và môn tiên quyết

Quản trị viên quản lý danh mục môn học. Mỗi môn có mã môn, tên môn, số tín chỉ, số giờ lý thuyết, số giờ thực hành, mô tả, trạng thái hoạt động và danh sách môn tiên quyết.

Luồng xử lý gồm thêm môn, cập nhật môn, gán môn tiên quyết, lọc môn theo khoa, ngành hoặc chương trình đào tạo. Khi thay đổi danh sách tiên quyết, hệ thống đồng bộ lại quan hệ tiên quyết của môn.

Ràng buộc chính là mã môn phải duy nhất. Một môn không được là tiên quyết của chính nó. Khi môn đã liên kết với chương trình đào tạo, lớp học phần hoặc dữ liệu khác, việc xóa cần được bảo vệ để tránh phá vỡ lịch sử học tập.

### 3.5. Quản lý học kỳ và đợt đăng ký

Quản trị viên tạo học kỳ, cập nhật thời gian học kỳ, thiết lập thời gian đăng ký và mở hoặc đóng học kỳ cho đăng ký môn học.

Luồng xử lý gồm tạo học kỳ với mã học kỳ, tên, năm học, học kỳ trong năm, ngày bắt đầu, ngày kết thúc và khoảng thời gian đăng ký. Khi đến thời điểm vận hành, quản trị viên mở học kỳ để sinh viên có thể đăng ký. Khi hết đợt, quản trị viên đóng học kỳ.

Ràng buộc chính là ngày kết thúc học kỳ phải sau ngày bắt đầu học kỳ. Thời điểm kết thúc đăng ký phải sau thời điểm bắt đầu đăng ký. Việc mở học kỳ chỉ bật trạng thái cho phép đăng ký; sinh viên vẫn phải nằm trong cửa sổ thời gian đăng ký nếu cửa sổ này được khai báo.

### 3.6. Quản lý lớp học phần và lịch học

Quản trị viên tạo lớp học phần cho từng môn trong từng học kỳ, gán giáo viên, đặt sĩ số, trạng thái lớp, số tiết mỗi buổi và lịch học.

Luồng xử lý thường là chọn môn, chọn học kỳ, nhập mã lớp học phần, chọn giáo viên phụ trách, nhập sĩ số tối đa, khai báo số tiết mỗi buổi và tạo lịch học chính. Sau đó quản trị viên có thể thêm hoặc sửa các lịch học khác của lớp, xem chi tiết lớp và danh sách liên quan.

Ràng buộc chính là lớp đang mở cần có giáo viên phụ trách. Số tiết mỗi buổi nằm trong giới hạn hợp lệ của hệ thống. Một lịch học không được vượt quá tiết cuối trong ngày và phải nằm đúng buổi sáng, chiều hoặc tối. Ngày học phải nằm trong thời gian học kỳ. Cùng một phòng không được có hai lớp trùng thứ, trùng khoảng tiết và giao nhau về ngày học. Cùng một giáo viên không được dạy hai lớp trùng thời điểm. Khi tạo lớp kèm lịch chính, nếu lịch không hợp lệ thì toàn bộ thao tác tạo lớp bị hủy để tránh lưu lớp dở dang.

### 3.7. Quản lý đăng ký môn học

Quản trị viên xem, lọc và quản lý các đăng ký môn học của sinh viên. Có thể lọc theo sinh viên, lớp học phần, học kỳ, trạng thái, khoa hoặc ngành. Quản trị viên cũng có thể hủy đăng ký khi cần xử lý nghiệp vụ.

Luồng xử lý gồm mở danh sách đăng ký, lọc dữ liệu, xem thông tin sinh viên, lớp học phần, môn học, trạng thái và thời gian đăng ký. Khi cần hủy, quản trị viên thực hiện thao tác hủy và nhập lý do nếu có.

Ràng buộc chính là hủy đăng ký không xóa bản ghi thật mà chuyển trạng thái sang đã hủy. Điều này giúp giữ lịch sử đăng ký. Quản trị viên có quyền hủy vượt thời hạn trong trường hợp cần can thiệp, trong khi sinh viên bị giới hạn bởi thời hạn hủy.

### 3.8. Gửi thông báo

Quản trị viên tạo thông báo cho toàn hệ thống, cho sinh viên, cho giáo viên hoặc cho danh sách người nhận cụ thể.

Luồng xử lý gồm nhập tiêu đề, nội dung, loại thông báo, chọn phạm vi nhận và gửi. Sau khi gửi, người nhận phù hợp sẽ thấy thông báo trong khu vực thông báo của mình.

Ràng buộc chính là thông báo phải có tiêu đề và nội dung. Nếu gửi đích danh, cần có danh sách người nhận. Quản trị viên thấy được toàn bộ thông báo để phục vụ quản lý.

### 3.9. Báo cáo và cấu hình

Trong giao diện quản trị có khu vực báo cáo và cấu hình hệ thống. Các khu vực này được định hướng cho thống kê đăng ký, lớp đầy hoặc còn chỗ, thống kê theo ngành, theo môn và các tham số vận hành.

Luồng xử lý hiện tại chủ yếu là điều hướng đến trang chức năng. Một số báo cáo và cấu hình nâng cao chưa hoàn thiện thành nghiệp vụ đầy đủ.

Ràng buộc chính là khi hoàn thiện, các báo cáo phải dựa trên dữ liệu đăng ký, lớp học phần, sinh viên và ngành đào tạo. Các cấu hình nghiệp vụ cần được kiểm soát quyền quản trị để tránh thay đổi sai quy tắc toàn hệ thống.

## 4. Vai trò sinh viên

### 4.1. Xem hồ sơ cá nhân

Sinh viên xem thông tin cá nhân, mã sinh viên, ngành học, năm nhập học và các thông tin học tập liên quan.

Luồng xử lý là sinh viên mở trang hồ sơ, hệ thống lấy hồ sơ gắn với tài khoản đang đăng nhập và hiển thị thông tin. Sinh viên chỉ xem hồ sơ của chính mình.

Ràng buộc chính là tài khoản sinh viên phải có hồ sơ sinh viên. Nếu tài khoản chưa được gán hồ sơ, hệ thống báo cần liên hệ quản trị viên hoặc phòng đào tạo.

### 4.2. Xem chương trình đào tạo

Sinh viên xem chương trình đào tạo của ngành và khóa của mình, gồm các môn học, số tín chỉ, nhóm kiến thức, môn bắt buộc hoặc tự chọn và học kỳ gợi ý.

Luồng xử lý bắt đầu khi sinh viên mở màn hình chương trình đào tạo. Hệ thống tự tìm chương trình phù hợp với ngành và năm nhập học. Nếu tìm thấy, hệ thống hiển thị danh sách môn và thông tin liên quan. Nếu không có chương trình đúng khóa, hệ thống thử dùng chương trình gần nhất còn hiệu lực.

Ràng buộc chính là sinh viên chỉ xem chương trình đào tạo của chính mình. Nếu không có chương trình phù hợp, sinh viên không thể tự chọn chương trình khác mà cần liên hệ bộ phận quản lý đào tạo.

### 4.3. Đăng ký môn học thủ công

Sinh viên đăng ký lớp học phần bằng cách chọn học kỳ, tìm lớp đang mở, xem môn học, giáo viên, lịch học, sĩ số và gửi đăng ký.

Luồng xử lý gồm chọn học kỳ, tìm lớp học phần phù hợp, mở chi tiết nếu cần, chọn lớp và xác nhận đăng ký. Hệ thống tự lấy sinh viên hiện tại làm người đăng ký, tự xác định học kỳ từ lớp học phần và lưu đăng ký nếu qua toàn bộ kiểm tra.

Ràng buộc chính gồm nhiều lớp bảo vệ. Học kỳ phải đang mở và đang trong thời gian đăng ký. Môn phải thuộc chương trình đào tạo của sinh viên. Lớp học phần phải còn chỗ. Sinh viên không được đăng ký trùng cùng một lớp. Nếu môn đã có điểm, hệ thống yêu cầu xác nhận học lại. Nếu môn có tiên quyết, sinh viên phải đã đạt các môn tiên quyết. Lịch của lớp mới không được trùng với các lớp đang đăng ký hoặc đã xác nhận trong cùng học kỳ. Hệ thống hiện không áp dụng giới hạn tín chỉ tối thiểu hoặc tối đa.

### 4.4. Tạo thời khóa biểu tự động

Sinh viên có thể tạo nhiều phương án thời khóa biểu tự động từ các môn có lớp học phần đang mở. Chức năng này giúp sinh viên chọn môn, chọn giáo viên cho từng môn nếu muốn, đặt ưu tiên cá nhân và nhận danh sách phương án không trùng lịch.

Luồng xử lý gồm chọn học kỳ, tải danh sách môn hợp lệ, tìm kiếm hoặc lọc môn chưa học, chọn các môn muốn học, chọn giáo viên cụ thể cho từng môn hoặc để hệ thống tự chọn, cấu hình ưu tiên và yêu cầu hệ thống tìm phương án. Hệ thống mô hình hóa bài toán như việc chọn đúng một lớp học phần cho mỗi môn. Sau đó hệ thống thử các tổ hợp lớp học phần, loại bỏ tổ hợp trùng lịch, chấm điểm các phương án còn lại và trả về nhiều kết quả để sinh viên lựa chọn. Sinh viên có thể xem điểm tổng, điểm thành phần, danh sách lớp học phần, giáo viên, phòng, lịch học và bản xem trước thời khóa biểu.

Ràng buộc bắt buộc gồm học kỳ đang mở đăng ký, môn thuộc chương trình đào tạo, môn chưa có điểm, không thiếu tiên quyết, lớp học phần đang mở, lớp chưa đầy, không trùng với lịch đã đăng ký và không trùng lịch giữa các môn trong cùng phương án. Nếu sinh viên chọn giáo viên cho một môn, hệ thống chỉ xét các lớp của giáo viên đó. Nếu không chọn giáo viên, mọi lớp hợp lệ của môn đều có thể được xét. Sinh viên chỉ được chọn số lượng môn trong giới hạn cho phép để tránh số tổ hợp quá lớn.

Tiêu chí chấm điểm gồm tránh ngày sinh viên không muốn học, ưu tiên ca học, ưu tiên giáo viên và ưu tiên thời khóa biểu có nhiều ngày nghỉ trong tuần. Chế độ cân bằng chia đều trọng số cho các tiêu chí. Chế độ ưu tiên giáo viên, ưu tiên ca học hoặc ưu tiên thời khóa biểu gọn sẽ tăng trọng số cho tiêu chí tương ứng. Kết quả trả về là nhiều phương án khả thi, tối đa theo giới hạn mà hệ thống cho phép; nếu chỉ có một phương án hợp lệ thì chỉ hiển thị một phương án, nếu không có tổ hợp hợp lệ thì hiển thị trạng thái không có kết quả.

Khi áp dụng phương án, hệ thống đăng ký từng lớp trong phương án cho sinh viên. Nếu có lỗi ở một lớp, giao diện hiển thị số lớp đăng ký thành công và danh sách lớp thất bại. Bản hoàn chỉnh nên dùng một thao tác áp dụng theo giao dịch để tránh trường hợp đăng ký được một phần rồi dừng.

### 4.5. Xem thời khóa biểu

Sinh viên xem thời khóa biểu các lớp đã đăng ký hoặc đã xác nhận. Giao diện thể hiện lịch theo tuần với các ngày trong tuần và các tiết học trong ngày.

Luồng xử lý là sinh viên mở trang thời khóa biểu, hệ thống lấy các đăng ký của sinh viên, chuyển lịch học thành các ô trên lưới và hiển thị thông tin môn, lớp, phòng, giáo viên. Sinh viên có thể chọn một buổi học để xem chi tiết.

Ràng buộc chính là sinh viên chỉ thấy lịch của chính mình. Chỉ các đăng ký đang có hiệu lực mới nên được tính vào lịch học; đăng ký đã hủy được giữ trong lịch sử nhưng không còn là buổi học hiện tại.

### 4.6. Xem lịch sử đăng ký và hủy đăng ký

Sinh viên xem toàn bộ lịch sử đăng ký môn học của mình, gồm học kỳ, môn, lớp, số tín chỉ, trạng thái, thời gian đăng ký và lý do hủy nếu có.

Luồng xử lý gồm mở danh sách lịch sử, lọc theo học kỳ hoặc trạng thái, xem chi tiết từng dòng và hủy đăng ký nếu còn được phép. Khi hủy, hệ thống chuyển trạng thái đăng ký sang đã hủy và lưu thời điểm hủy.

Ràng buộc chính là sinh viên chỉ hủy được trong thời hạn cho phép. Nếu học kỳ có thời điểm kết thúc đăng ký, thời hạn hủy dựa trên mốc đó cộng số ngày gia hạn của hệ thống. Nếu không có mốc kết thúc đăng ký, thời hạn hủy dựa trên ngày sinh viên đăng ký cộng số ngày gia hạn. Đăng ký đã hủy không được hủy lại.

### 4.7. Xem bảng điểm

Sinh viên xem bảng điểm theo từng học kỳ và thống kê kết quả học tập. Bảng điểm hiển thị điểm quá trình, giữa kỳ, cuối kỳ, điểm tổng kết, điểm chữ và GPA thang bốn.

Luồng xử lý là sinh viên mở trang bảng điểm, hệ thống lấy điểm của các đăng ký thuộc sinh viên hiện tại, nhóm theo học kỳ và tính các chỉ số tổng quan như GPA tích lũy, tín chỉ tích lũy, số môn đạt và số môn chờ điểm.

Ràng buộc chính là sinh viên chỉ xem điểm của chính mình. Điểm tổng kết chỉ có khi đã đủ các cột điểm thành phần. Điểm chữ và GPA thang bốn được hệ thống tính tự động từ điểm tổng kết. Môn chưa đủ điểm sẽ được xem là đang chờ điểm.

### 4.8. Nhận và gửi thông báo

Sinh viên xem thông báo từ hệ thống, từ quản trị viên hoặc từ giáo viên, đánh dấu đã đọc và gửi thông báo cho giáo viên của lớp mình học.

Luồng xử lý nhận thông báo gồm mở danh sách, lọc hoặc đọc chi tiết, sau đó hệ thống ghi nhận trạng thái đã đọc. Luồng gửi thông báo gồm chọn giáo viên nhận, nhập tiêu đề, nội dung và gửi.

Ràng buộc chính là sinh viên chỉ gửi thông báo đích danh cho giáo viên của các lớp mà mình đã đăng ký xác nhận. Sinh viên không được gửi thông báo cho toàn bộ hệ thống, toàn bộ sinh viên hoặc giáo viên không dạy mình.

## 5. Vai trò giáo viên

### 5.1. Xem hồ sơ cá nhân

Giáo viên xem thông tin cá nhân, mã giáo viên, khoa, học hàm hoặc chức danh và thông tin liên hệ.

Luồng xử lý là giáo viên mở trang hồ sơ, hệ thống lấy hồ sơ giáo viên gắn với tài khoản hiện tại và hiển thị dữ liệu.

Ràng buộc chính là tài khoản giáo viên phải có hồ sơ giáo viên. Giáo viên chỉ xem dữ liệu cá nhân của chính mình trong khu vực hồ sơ.

### 5.2. Xem lịch dạy

Giáo viên xem lịch dạy theo tuần, gồm các lớp được phân công, thứ, tiết, phòng và môn học.

Luồng xử lý là giáo viên mở trang lịch dạy, hệ thống lấy các lớp học phần có giáo viên phụ trách là tài khoản hiện tại, sau đó đưa lịch lên lưới thời khóa biểu. Giáo viên có thể chọn một buổi dạy để xem chi tiết.

Ràng buộc chính là giáo viên chỉ thấy lịch các lớp mình phụ trách. Lịch dạy đã được kiểm tra từ lúc quản trị viên tạo hoặc cập nhật, nên không được trùng giáo viên cùng thời điểm.

### 5.3. Xem lớp phụ trách và danh sách sinh viên

Giáo viên xem danh sách lớp học phần được phân công, lọc theo học kỳ, xem sĩ số, lịch học và danh sách sinh viên trong từng lớp.

Luồng xử lý gồm mở danh sách lớp phụ trách, chọn học kỳ nếu cần, mở chi tiết lớp và xem các thông tin như môn học, mã lớp, phòng, lịch học, sĩ số tối đa, sĩ số hiện tại và danh sách sinh viên đăng ký. Từ lớp, giáo viên có thể chuyển nhanh sang nhập điểm hoặc gửi thông báo cho lớp.

Ràng buộc chính là giáo viên chỉ thao tác với lớp mình phụ trách. Danh sách sinh viên trong lớp dựa trên các đăng ký phù hợp, thường là sinh viên đã đăng ký xác nhận. Nếu lớp chưa có sinh viên xác nhận, chức năng gửi thông báo lớp sẽ báo không có người nhận.

### 5.4. Nhập điểm

Giáo viên nhập điểm quá trình, giữa kỳ và cuối kỳ cho sinh viên trong lớp mình phụ trách. Hệ thống tự tính điểm tổng kết, điểm chữ và GPA thang bốn.

Luồng xử lý gồm chọn lớp, xem danh sách sinh viên, nhập hoặc sửa các cột điểm, xem trước điểm tổng kết trên giao diện và lưu từng dòng hoặc lưu nhiều dòng. Sau khi lưu, giao diện cập nhật lại kết quả theo dữ liệu hệ thống trả về.

Ràng buộc chính là giáo viên chỉ được nhập điểm cho lớp mình được phân công. Điểm thành phần phải nằm trong thang điểm hợp lệ. Điểm tổng kết chỉ được tính khi có đủ ba điểm thành phần, theo công thức gồm điểm quá trình, giữa kỳ và cuối kỳ. Giáo viên chỉ được cập nhật điểm trong thời hạn cho phép sau khi học kỳ kết thúc; quản trị viên có thể can thiệp ngoài thời hạn nếu cần. Nếu giáo viên cố nhập điểm cho lớp không phụ trách, hệ thống từ chối.

### 5.5. Gửi và nhận thông báo

Giáo viên xem thông báo dành cho mình, thông báo do mình gửi và có thể gửi thông báo cho sinh viên của lớp phụ trách.

Luồng xử lý nhận thông báo tương tự sinh viên: mở danh sách, đọc chi tiết và đánh dấu đã đọc. Luồng gửi thông báo gồm chọn lớp phụ trách, nhập tiêu đề, nội dung, loại thông báo và gửi. Hệ thống tự lấy danh sách sinh viên đã đăng ký xác nhận trong lớp làm người nhận.

Ràng buộc chính là giáo viên chỉ gửi được cho lớp mình phụ trách. Tiêu đề và nội dung không được để trống. Nếu lớp chưa có sinh viên nhận thông báo, hệ thống không tạo thông báo lớp.

## 6. Các ràng buộc nghiệp vụ quan trọng

Hệ thống không cho đăng ký môn ngoài thời gian cho phép. Học kỳ phải được mở, và nếu có khai báo thời gian bắt đầu hoặc kết thúc đăng ký thì thời điểm hiện tại phải nằm trong khoảng đó.

Hệ thống kiểm tra môn tiên quyết dựa trên điểm đã đạt của sinh viên. Sinh viên chỉ được xem là đạt môn tiên quyết khi có điểm tổng kết đủ điều kiện đạt.

Hệ thống chặn trùng lịch khi sinh viên đăng ký môn thủ công và khi tạo thời khóa biểu tự động. Hai lịch bị xem là trùng nếu cùng ngày trong tuần và khoảng tiết giao nhau.

Hệ thống chặn đăng ký lớp đã đầy. Sĩ số hiện tại của lớp được cập nhật theo các đăng ký còn hiệu lực.

Hệ thống không áp dụng giới hạn tín chỉ tối thiểu hoặc tối đa theo thiết kế hiện tại.

Hệ thống hủy đăng ký theo hướng giữ lịch sử. Bản ghi đăng ký được chuyển sang trạng thái đã hủy thay vì xóa thật.

Hệ thống chia thời khóa biểu thành mười lăm tiết mỗi ngày, gồm buổi sáng, buổi chiều và buổi tối. Lịch học phải nằm đúng khoảng tiết của buổi được chọn.

Hệ thống bảo vệ dữ liệu điểm. Sinh viên chỉ xem điểm của mình, giáo viên chỉ nhập và xem điểm lớp mình phụ trách, quản trị viên có quyền quản lý rộng hơn.

Hệ thống bảo vệ thông báo theo vai trò và người nhận. Người dùng không được gửi hoặc xem thông báo ngoài phạm vi được phép.

## 7. Chức năng còn định hướng hoặc chưa hoàn thiện đầy đủ

Khu vực báo cáo quản trị mới ở mức định hướng giao diện, chưa hoàn thiện đầy đủ các thống kê theo môn, theo ngành, lớp đầy hoặc còn chỗ và xuất báo cáo.

Khu vực cấu hình quản trị mới ở mức định hướng, chưa hoàn thiện đầy đủ giao diện chỉnh các tham số nghiệp vụ.

Một số chức năng xuất file như xuất thời khóa biểu, xuất danh sách đăng ký, xuất danh sách sinh viên và xuất bảng điểm chưa hoàn thiện đầy đủ.

Một số kiểm thử giao diện tự động chưa được thiết lập đầy đủ. Hệ thống đã có nhiều kiểm thử backend cho nghiệp vụ quan trọng, nhưng frontend vẫn chủ yếu cần kiểm tra thủ công hoặc bổ sung kiểm thử sau.
