# QuanLyNV

Website quản lý nhân viên và service desk nội bộ, frontend render bằng HTML/CSS/JS và dùng backend Express/PostgreSQL làm nguồn dữ liệu chính.

## Cấu trúc

```text
.
├── index.html
├── package.json
├── assets/
│   ├── css/
│   │   ├── tokens.css
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── responsive.css
│   └── js/
│       ├── data.js
│       ├── api-client.js
│       ├── storage.js
│       ├── helpers.js
│       ├── analytics.js
│       ├── validators.js
│       └── app.js
├── docs/
│   ├── API.md
│   ├── BACKEND_PHASES.md
│   ├── PRODUCT_ROADMAP.md
│   └── TEAM_LEAD_REVIEW.md
├── backend/
│   ├── db/
│   │   ├── migrations/
│   │   ├── migrate.js
│   │   └── seed.js
│   └── src/
│       ├── config/
│       ├── db/
│       ├── middleware/
│       ├── repositories/
│       ├── routes/
│       ├── utils/
│       └── server.js
└── README.md
```

## Chức năng

- Dashboard tổng quan nhân sự, hiệu suất, quỹ lương và service desk.
- Danh sách nhân viên có tìm kiếm, lọc, sắp xếp.
- Thêm, sửa, xóa và xem chi tiết nhân viên.
- Tạo, sửa, xóa phòng ban và nhóm dịch vụ nền.
- Soft delete cho dữ liệu nghiệp vụ và audit log cho thao tác quan trọng.
- Kiểm tra trùng email, trùng số điện thoại, lương, ngày vào làm và dữ liệu danh mục.
- Xóa có hoàn tác nhanh bằng nút trên thông báo hoặc `Ctrl+Z`.
- Trang Dịch vụ nội bộ để quản lý yêu cầu HR/business service theo SLA.
- Tạo, sửa, xóa, chuyển trạng thái và lọc ticket theo nhóm, trạng thái, ưu tiên.
- Báo cáo SLA, ticket quá hạn, backlog mở và hiệu quả xử lý theo nhóm dịch vụ.
- Lưu dữ liệu production bằng PostgreSQL thông qua REST API.
- Xuất danh sách nhân viên đang được lọc ra CSV.
- Xuất danh sách yêu cầu dịch vụ đang được lọc ra CSV.
- Trang phòng ban và báo cáo cơ bản.
- Backend Express/PostgreSQL với migration, seed data, REST API và báo cáo.
- Đăng nhập bằng token session, phân quyền role và rate limit cho login/write API.
- Responsive cho desktop, tablet và mobile.

## Quy ước bảo trì

- `assets/js/data.js`: dữ liệu tĩnh phụ trợ cho timeline và tham chiếu demo cũ.
- `assets/js/api-client.js`: client gọi REST API backend, hỗ trợ base URL tùy chỉnh qua `window.HR_API_BASE_URL`.
- `assets/js/storage.js`: adapter dữ liệu cho UI, hiện trỏ tới backend API thay vì `localStorage`.
- `assets/js/helpers.js`: định dạng ngày, tiền tệ, mã nhân viên, mã yêu cầu và xử lý chuỗi.
- `assets/js/analytics.js`: tính toán thống kê, quỹ lương, hiệu suất, SLA và top nhân viên.
- `assets/js/validators.js`: kiểm tra dữ liệu trước khi lưu hồ sơ hoặc yêu cầu dịch vụ.
- `assets/js/app.js`: điều phối UI, sự kiện và render màn hình.
- `backend/src/server.js`: entrypoint backend Express.
- `backend/db/migrations`: schema PostgreSQL.
- `backend/src/repositories`: truy vấn database theo từng nghiệp vụ.
- `backend/src/routes`: REST API cho frontend, bao gồm `/api/auth`.
- `backend/src/repositories/audit-repository.js`: ghi và đọc lịch sử thay đổi nghiệp vụ.

## Backend

1. Cài dependency:

```bash
npm install
```

2. Tạo `.env` từ `.env.example` và dán connection string PostgreSQL/Neon thật vào `DATABASE_URL`.

3. Chạy migration:

```bash
npm run backend:migrate
```

4. Khởi tạo danh mục production tối thiểu khi database trống:

```bash
npm run backend:init-production
```

Nếu muốn command này tạo admin đầu tiên, cấu hình `ADMIN_EMAIL` và `ADMIN_PASSWORD` trong `.env` trước khi chạy. Không đặt hai biến này thì command chỉ tạo role và danh mục nền.

5. Chỉ dùng khi cần dữ liệu demo đầy đủ:

```bash
npm run backend:seed
```

6. Xóa dữ liệu demo seed khi cần database trống:

```bash
npm run backend:clear-demo
```

7. Chạy server:

```bash
npm run backend:start
```

8. Mở:

```text
http://localhost:3000
http://localhost:3000/api/health
```

Chi tiết 5 phase: `docs/BACKEND_PHASES.md`.

API: `docs/API.md`.

## Security hardening

Các finding tech lead đã được xử lý trong đợt hardening gần nhất:

- Read API nghiệp vụ yêu cầu đăng nhập: departments, employees, service categories, service requests và reports không còn public.
- Dữ liệu nhạy cảm về lương/payroll được redact theo role. Chỉ `admin` và `hr_manager` nhận `salary`/`payroll`; role khác nhận giá trị `null` kèm `compensationRedacted`.
- User có role `employee` chỉ được tạo và xem service request của employee profile đang liên kết với user qua `users.employee_id`.
- Login đặt session cookie `HttpOnly`, `SameSite=Lax`; client chỉ lưu token trong `sessionStorage` khi chạy legacy/file mode.
- Helmet CSP đã được bật lại để giảm rủi ro XSS lấy session token.
- Mã `NV/YC` được sinh bằng PostgreSQL sequence qua migration `006_user_employee_sequences.sql`, tránh race condition khi tạo đồng thời.
- Rate limiter in-memory có cleanup bucket hết hạn để tránh phình bộ nhớ. Khi deploy nhiều instance, nên thay bằng Redis/shared store.

Sau khi pull thay đổi này, chạy migration trước khi start backend:

```bash
npm run backend:migrate
```

## Kiểm thử

```bash
npm test
```

API smoke/E2E cần backend đang chạy:

```bash
npm run test:api
npm run test:e2e
```

Chi tiết: `docs/TESTING.md`.

## Mở rộng

- CRUD danh mục nền nằm trong phase tiếp theo của `docs/PRODUCT_ROADMAP.md`.
- Thêm trường dữ liệu trong `assets/js/data.js`, rồi cập nhật form, `validators.js` và phần render tương ứng.
- Điều chỉnh nhận diện thương hiệu trong `assets/css/tokens.css`.
- Bổ sung component mới trong `assets/css/components.css` để tránh CSS bị trộn lẫn.
