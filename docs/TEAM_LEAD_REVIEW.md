# Đánh giá của team lead

## Điểm tốt

- Dự án chạy trực tiếp bằng `index.html`, không cần cài dependency, phù hợp demo và học tập.
- CSS được chia thành token, base, layout, component và responsive nên dễ tìm đúng nơi cần sửa.
- Có đủ luồng quản lý nhân viên cơ bản: xem, thêm, sửa, xóa, tìm kiếm, lọc, sắp xếp, báo cáo và xuất CSV.
- Dữ liệu mẫu tách khỏi logic giao diện, thuận tiện thay bằng API trong giai đoạn sau.

## Điểm yếu

- `app.js` ban đầu chứa cả tính toán thống kê, kiểm tra dữ liệu, render và xử lý sự kiện nên sẽ khó bảo trì khi dự án lớn hơn.
- Form mới chỉ dựa vào validation mặc định của trình duyệt, chưa chặn trùng email, trùng số điện thoại hoặc ngày vào làm ở tương lai.
- Xóa hồ sơ dùng `window.confirm`, trải nghiệm chưa mượt và không có cơ chế khôi phục khi thao tác nhầm.
- CSV ban đầu xuất toàn bộ dữ liệu, chưa khớp với danh sách người dùng đang lọc trên màn hình.
- Góc business/service ban đầu còn mỏng: chưa có quy trình xử lý yêu cầu nội bộ, SLA, backlog hoặc cảnh báo quá hạn.

## Giải pháp đã triển khai

- Tách thống kê sang `assets/js/analytics.js`.
- Tách kiểm tra dữ liệu sang `assets/js/validators.js`.
- Thêm cảnh báo lỗi trực tiếp trong form và đánh dấu trường sai bằng `aria-invalid`.
- Đổi xóa nhân viên sang cơ chế hoàn tác nhanh bằng toast hoặc `Ctrl+Z`.
- CSV chỉ xuất danh sách hiện đang khớp bộ lọc.
- Bổ sung quy ước bảo trì trong `README.md`.
- Bổ sung module Dịch vụ nội bộ với ticket service, SLA, trạng thái, mức ưu tiên, người phụ trách và CSV riêng.
- Dashboard có thêm danh sách yêu cầu cần xử lý để phục vụ quản trị vận hành.

## Gợi ý giai đoạn tiếp theo

- Duy trì frontend gọi backend API làm nguồn dữ liệu chính, không quay lại `localStorage` cho production.
- Tiếp tục siết phân quyền đọc dữ liệu nhạy cảm và luồng xuất dữ liệu.
- Bổ sung test tự động bằng Playwright cho luồng thêm, sửa, xóa và xuất CSV.
- Tách render UI thành các module nhỏ hơn nếu số màn hình tiếp tục tăng.
