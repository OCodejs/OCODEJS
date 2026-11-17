# OCODEJS Interactive CLI — TODO

## Terminal shell and brand surface
- [x] Hiển thị logo pixel OCODEJS và khung terminal tối theo thẩm mỹ cyber-night với bảng màu cyan, xanh điện, indigo, violet và điểm nhấn magenta.
- [x] Thiết kế responsive, giữ bố cục terminal gọn, dễ đọc và sử dụng tốt trên desktop lẫn thiết bị di động.

## Command interaction
- [x] Vùng lịch sử terminal lưu và hiển thị tuần tự câu lệnh cùng phản hồi tương ứng trong phiên sử dụng.
- [x] Ô nhập lệnh tương tác cho phép gõ trực tiếp, có dấu nhắc lệnh rõ ràng và tự động giữ tiêu điểm phù hợp.
- [x] Ô nhập task có viền neon, trạng thái READY/TYPING/RUNNING và placeholder nhận task hoặc đường dẫn file.
- [x] Hỗ trợ các lệnh giả lập help, run, config, clear và status với phản hồi riêng giống hành vi của terminal thật.
- [x] Enter chạy lệnh; phím mũi tên lên/xuống duyệt lịch sử lệnh đã nhập.
- [x] Xử lý lệnh không hợp lệ bằng thông báo lỗi theo phong cách CLI và gợi ý sử dụng lệnh help.

## Motion, media and sound
- [x] Hiệu ứng in chữ theo thời gian cho nội dung phản hồi, tạo cảm giác hệ thống đang xử lý và xuất dữ liệu trực tiếp.
- [x] Hiệu ứng âm thanh riêng cho thao tác gõ phím, thực thi lệnh và báo lỗi, kèm nút bật/tắt âm thanh.
- [x] Ảnh GIF cyber-night `ocodejs-run.gif` hiển thị trong log khi chạy task, chuyển trạng thái từ RUNNING sang DONE.

## Standalone delivery
- [x] Gộp toàn bộ giao diện, CSS, JavaScript và ảnh GIF vào một file HTML duy nhất, có thể mở trực tiếp không cần tải thêm tài nguyên ngoài.
