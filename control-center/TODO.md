# Tiêu chí — Control Center

## Điều hướng và module vận hành
- [x] Bảng điều khiển tập trung có các mục: Server Management — quản lý máy chủ và tài nguyên; Live Monitoring — theo dõi trạng thái theo thời gian thực; Database Monitoring — giám sát cơ sở dữ liệu; Security Monitoring — theo dõi sự kiện bảo mật; Sandbox Management — quản lý môi trường chạy code; Alert Center — cảnh báo sự cố tập trung.
- [x] Control Center cùng trang còn quản lý/hiển thị các nhóm GitHub repositories và CI/CD; Vercel, Netlify và Cloudflare deployments; server, Docker, Sandbox; database và API; OAuth, Auth và bảo mật; AI Agents và môi trường chạy code; nhật ký lỗi và cảnh báo tự động.
- [x] Các khu vực có điều hướng hoạt động, trạng thái nguồn dễ hiểu và layout dùng được trên màn hình nhỏ.

## Dữ liệu đúng và trung thực
- [x] Không hiển thị số liệu giám sát giả; khi chưa có nguồn hoặc chưa có mẫu, hiển thị “Chưa kết nối”/“Chưa có dữ liệu” và `—`, không đánh đồng với giá trị 0.
- [x] Số liệu thật có nguồn và thời điểm kiểm tra; `formatMetric` giữ phân biệt `—` với zero thật, còn helper freshness phân biệt no-sample/live/stale/unavailable/not-connected. Provider chưa kết nối không được gắn nhãn live.
- [x] GitHub & CI/CD đọc dữ liệu công khai thật của `OCodejs/OCodejs`; chỉ GET metadata repository và workflow runs, không cần token và không cấp quyền ghi từ trình duyệt.
- [x] Vercel, Netlify, Cloudflare, database metrics, host/Sandbox telemetry, security events và agent runs tiếp tục hiển thị “Chưa kết nối” cho tới khi có nguồn xác thực được duyệt.
- [x] Không đưa telemetry riêng tư từ dashboard Sandbox owner-only, secret, token, hostname/IP nội bộ, connection string hoặc dữ liệu cá nhân vào repository công khai, browser storage, URL hay log.

## Hành động và ranh giới an toàn
- [x] Phase này chỉ đọc: không triển khai/deploy, restart/stop, thay cấu hình, xóa dữ liệu, acknowledge/resolve alerts, tạo credential hoặc thực hiện hành động bảo mật.
- [x] Không lưu credential/provider token trong frontend; nguồn chưa xác thực được gắn nhãn rõ thay vì báo Connected.
- [x] Thay đổi nằm trên nhánh riêng `feat/control-center-live-observability`; không push trực tiếp vào `main`.
- [x] Đã đẩy nhánh và mở [Pull Request #40](https://github.com/OCodejs/OCodejs/pull/40); không merge và không deploy.

## Kiểm tra và ghi chú vận hành
- [x] Thêm test cho hợp đồng empty-state/trạng thái và ánh xạ response GitHub; fixture chỉ dùng trong test, không xuất hiện như dữ liệu production.
- [x] README giải thích chính xác nguồn GitHub công khai, các provider chưa nối, giới hạn rate limit và cách chạy static preview.
- [x] Chạy kiểm tra/test: 6/6 test mới của Control Center pass; toàn repo 70 pass và 2 fail tại `tests/homepage.test.mjs` (local asset `plugin-hub.html` và canonical URL SEO), cùng hai lỗi đã có trên CI của `main`; `npm audit --omit=dev` không phát hiện lỗ hổng.
