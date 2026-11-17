# Kế hoạch: Control Center — quan sát hạ tầng theo dữ liệu thật

## Mục tiêu và phạm vi

Tiếp tục nền giao diện Control Center trong `control-center/` đã được hợp nhất qua PR #39. Bản cập nhật bổ sung trải nghiệm dùng được cho các module mà không tuyên bố đã kết nối hạ tầng chưa có nguồn dữ liệu. Tạo một frontend tĩnh độc lập, không sửa package/dependencies hoặc release flow của thư viện OCode.js.

Trong giai đoạn này, GitHub được hiển thị ở chế độ đọc công khai cho đúng repository `OCodejs/OCodejs`, bằng GitHub REST API công khai: metadata repo và workflow runs mới nhất. Không có token, OAuth hay quyền ghi phía trình duyệt. Vercel, Netlify, Cloudflare, database exporters, server agents, Sandbox telemetry và AI Agents giữ trạng thái “Chưa kết nối”/“Chưa có dữ liệu” cho đến khi có adapter thật được phê duyệt. Không chuyển số thiếu thành 0; zero chỉ dùng khi API trả số đếm thật có nguồn. Mỗi trạng thái có nguồn, thời điểm kiểm tra, lỗi/rate-limit và freshness khi có dữ liệu.

Các thao tác deploy, restart/stop, cấu hình, acknowledge/resolve, xóa, nhập secret và các quyền bảo mật không nằm trong phase này. Không đưa dữ liệu telemetry riêng tư của website Sandbox owner-only vào repository công khai. Website Sandbox đang publish và quyền owner-only không bị thay đổi bởi PR.

## Cấu trúc project

- `control-center/index.html`: semantic shell, navigation và các khu vực hiển thị.
- `control-center/styles.css`: theme responsive, typography, empty/loading/error/fresh states.
- `control-center/app.js`: render theo dữ liệu, điều hướng và refresh có kiểm soát.
- `control-center/lib/github-public.js`: GET-only adapter cho GitHub API công khai, giới hạn vào repository được chỉ định, timeout, xử lý rate limit/unavailable.
- `tests/control-center.test.mjs`: kiểm thử hợp đồng trạng thái, empty states và ánh xạ payload GitHub bằng fixture chỉ trong test.
- `control-center/README.md`: nguồn dữ liệu hiện được nối, trạng thái chưa kết nối, giới hạn API, quyền riêng tư và cách preview.
- `control-center/TODO.md`: tiêu chí và tiến độ PR.

## Thiết kế

Giữ ngôn ngữ thị giác graphite/blue hiện có của Control Center: giao diện vận hành rõ ràng, phân cấp thông tin dày nhưng dễ quét, không nhầm trạng thái bình thường với chưa biết. Trang tổng quan ưu tiên thanh nguồn dữ liệu/trạng thái, số liệu chỉ khi API trả về, sáu card module và danh sách connector. Module điều hướng có empty-state riêng. Loading, not connected, no samples, stale, API unavailable và live là các trạng thái tách biệt; `—` thể hiện không có giá trị, không dùng `0` giả. Dùng màu chỉ làm gợi ý, luôn có nhãn chữ. Mobile chuyển sidebar thành menu gọn và xếp card theo một cột.

## Tác vụ build/kiểm thử

Dùng Node built-in test runner hiện có của repository. Trước khi commit, chạy `npm test` và các kiểm tra riêng của static UI. Ghi nhận rõ các lỗi nền đang có trên main để không nhận nhầm là regression. Tạo nhánh `feat/control-center-live-observability`, commit thay đổi và mở PR; không merge, không push thẳng main, không deploy.


## Bao phủ các hệ thống liên quan

Sáu khu vực điều hướng cũng nêu rõ Docker/container inventory trong Server Management, API health check trong Database/API monitoring, OAuth/Auth trong Security Monitoring, và error logs cùng automatic-alert sources trong Alert Center. Đây là các empty-state trung thực, chưa phải connector hoạt động; Vercel, Netlify, Cloudflare, database, telemetry, security events và AI Agents vẫn cần adapter/backend được ủy quyền ở phase riêng.
