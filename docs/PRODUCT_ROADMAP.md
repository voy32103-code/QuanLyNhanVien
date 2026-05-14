# Product Roadmap: QuanLyNV

## 1. Mục Tiêu Product

QuanLyNV cần chuyển từ một MVP kỹ thuật thành một product quản lý nhân sự và dịch vụ nội bộ có thể dùng trong môi trường doanh nghiệp nhỏ hoặc phòng ban nội bộ.

Mục tiêu không phải là thêm thật nhiều màn hình, mà là làm cho hệ thống có thể vận hành thật:

- Dữ liệu thống nhất giữa frontend và backend.
- Người dùng có vai trò và quyền hạn rõ ràng.
- Dữ liệu nhân sự có lịch sử thay đổi.
- Các luồng nghiệp vụ chính không phụ thuộc dữ liệu demo.
- Có kiểm thử, triển khai, backup và giám sát cơ bản.

## 2. Trạng Thái Hiện Tại

Mức hiện tại: **Technical MVP / Internal Prototype**

Điểm mạnh:

- Frontend đã có giao diện quản lý nhân viên, phòng ban, báo cáo và service desk.
- Backend Express/PostgreSQL đã chạy được.
- API chính cho nhân viên, service request và báo cáo đã có.
- PostgreSQL schema có foreign key, unique constraint, check constraint và index.
- Dữ liệu demo trong database đã được xóa.

Điểm chưa đạt product:

- Frontend đã gọi backend API làm nguồn dữ liệu chính; `localStorage` không còn là production path.
- Đã có CRUD cho `departments` và `service_categories`.
- Đã có đăng nhập, phân quyền role, audit log, soft delete và production init data.
- Read API nhạy cảm yêu cầu auth; lương/payroll được redact theo role.
- Chưa có deployment pipeline, backup/monitoring và browser E2E Playwright.

## 3. Nguyên Tắc Triển Khai

- Ưu tiên blocker product trước tính năng đẹp.
- Không thêm feature mới khi dữ liệu còn phân mảnh giữa frontend và backend.
- Mỗi phase phải có tiêu chí hoàn thành rõ ràng.
- Backend là nguồn dữ liệu chính; frontend chỉ render và gọi API.
- Mọi thao tác nhạy cảm phải có quyền hạn và audit log trước khi go-live.
- Demo data, seed data và production init data phải tách riêng.

## 4. Phase 1: Đồng Bộ Frontend Với Backend

Mục tiêu: frontend không còn phụ thuộc `localStorage` làm nguồn dữ liệu chính.

Việc cần làm:

- Tạo `assets/js/api-client.js`.
- Thay `assets/js/storage.js` bằng lớp gọi API hoặc đổi `storage.js` thành adapter.
- Load dữ liệu từ:
  - `GET /api/departments`
  - `GET /api/employees`
  - `GET /api/services/categories`
  - `GET /api/services/requests`
  - `GET /api/reports/summary`
- Đổi thao tác thêm/sửa/xóa nhân viên sang API.
- Đổi thao tác tạo/sửa/xóa/chuyển trạng thái service request sang API.
- Thêm trạng thái loading, empty, error trong UI.
- Bỏ fallback demo data khi backend đang chạy.

Deliverable:

- Frontend hiển thị đúng dữ liệu đang có trong PostgreSQL.
- Khi database trống, UI cũng trống và hướng người dùng tạo dữ liệu thật.
- Thao tác CRUD trên UI ghi vào PostgreSQL.

Tiêu chí hoàn thành:

- Tạo nhân viên từ UI, reload trang vẫn còn dữ liệu.
- Xóa nhân viên từ UI, API `/api/employees` phản ánh đúng.
- Tạo service request từ UI, API `/api/services/requests` phản ánh đúng.
- Không còn dùng `localStorage` cho dữ liệu production.

Ưu tiên: **P0**

## 5. Phase 2: Quản Lý Danh Mục Nền

Mục tiêu: người dùng có thể tự khởi tạo hệ thống sau khi database trống.

Việc cần làm:

- Thêm API CRUD cho `departments`.
- Thêm API CRUD cho `service_categories`.
- Thêm màn hình hoặc modal quản lý danh mục:
  - Phòng ban
  - Nhóm dịch vụ
  - SLA mặc định
  - Người phụ trách
  - Màu hiển thị
- Chặn xóa danh mục đang được nhân viên hoặc ticket sử dụng.
- Thêm production init command riêng, ví dụ:

```bash
npm run backend:init-production
```

Deliverable:

- Database trống vẫn có thể khởi tạo từ UI hoặc command init.
- User không cần chạy seed demo để dùng app.

Tiêu chí hoàn thành:

- Tạo phòng ban mới từ UI.
- Tạo nhân viên thuộc phòng ban đó.
- Tạo nhóm dịch vụ mới từ UI.
- Tạo ticket thuộc nhóm dịch vụ đó.
- Xóa danh mục đang được sử dụng trả về lỗi rõ ràng.

Ưu tiên: **P0**

## 6. Phase 3: Authentication Và Authorization

Mục tiêu: không ai có thể thao tác dữ liệu nhân sự nếu chưa đăng nhập và không có quyền.

Vai trò đề xuất:

- `admin`: toàn quyền hệ thống.
- `hr_manager`: quản lý nhân viên, phòng ban, service desk.
- `manager`: xem nhân viên trong phạm vi phụ trách, tạo và xử lý ticket.
- `employee`: xem hồ sơ cơ bản của mình, tạo ticket.

Việc cần làm:

- Thêm bảng:
  - `users`
  - `roles`
  - `user_roles`
  - `sessions` hoặc dùng JWT refresh token.
- Thêm đăng nhập, đăng xuất.
- Hash password bằng `bcrypt`.
- Middleware xác thực request.
- Middleware kiểm tra quyền theo route.
- Ẩn nút UI theo quyền.
- Không trả dữ liệu nhạy cảm nếu role không đủ.

Deliverable:

- API yêu cầu token cho route write.
- UI có màn hình login.
- User chỉ thấy và làm được đúng quyền.

Tiêu chí hoàn thành:

- Gọi `POST /api/employees` không token trả `401`.
- User `employee` không xóa được nhân viên.
- User `hr_manager` tạo/sửa được nhân viên.
- User `admin` quản lý được danh mục và user.

Ưu tiên: **P0**

## 7. Phase 4: Audit Log Và Soft Delete

Mục tiêu: mọi thay đổi quan trọng đều có lịch sử, không mất dữ liệu do xóa nhầm.

Việc cần làm:

- Thêm cột:
  - `deleted_at`
  - `deleted_by`
- Áp dụng soft delete cho:
  - employees
  - service_requests
  - departments
  - service_categories
- Thêm bảng `audit_logs`:
  - `id`
  - `actor_user_id`
  - `entity_type`
  - `entity_id`
  - `action`
  - `before_data`
  - `after_data`
  - `created_at`
- Ghi log khi tạo, sửa, xóa, chuyển trạng thái.
- Thêm API xem audit log cho admin/HR manager.

Deliverable:

- Không còn hard delete dữ liệu nghiệp vụ.
- Có thể truy vết ai đã sửa lương, trạng thái, phòng ban, ticket.

Tiêu chí hoàn thành:

- Xóa nhân viên chỉ set `deleted_at`.
- API danh sách mặc định không trả record đã xóa.
- Admin có thể xem audit log của một nhân viên.
- Chuyển trạng thái ticket ghi audit log.

Ưu tiên: **P0/P1**

## 8. Phase 5: Test Tự Động

Mục tiêu: giảm rủi ro khi sửa code và chuẩn bị cho deploy thật.

Việc cần làm:

- Thêm test framework:
  - Backend: `jest` hoặc `vitest`
  - API test: `supertest`
  - E2E: `playwright`
- Test backend:
  - health
  - employee CRUD
  - service request CRUD
  - validation lỗi
  - authorization
  - report summary
- Test frontend:
  - load dashboard
  - tạo nhân viên
  - tạo service request
  - filter/search
  - trạng thái lỗi API

Deliverable:

- `npm test`
- `npm run test:e2e`
- Test chạy được trên CI.

Tiêu chí hoàn thành:

- Có test cho ít nhất 80% business flow chính.
- PR không được merge nếu test fail.

Ưu tiên: **P1**

## 9. Phase 6: Production Deployment

Mục tiêu: có thể deploy ổn định và vận hành lâu dài.

Việc cần làm:

- Chuẩn hóa biến môi trường production:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `CORS_ORIGIN`
  - `NODE_ENV=production`
- Thêm rate limit cho API login và write.
- Thêm request id cho log.
- Thêm endpoint readiness/liveness:
  - `/api/health`
  - `/api/ready`
- Thêm backup strategy cho PostgreSQL.
- Thêm migration policy:
  - migration chạy trước deploy
  - không sửa migration cũ
  - migration phải backward-compatible nếu có thể
- Deploy option:
  - Render/Railway/Fly.io cho backend
  - Neon cho PostgreSQL
  - Vercel/Netlify hoặc cùng Express server cho frontend

Deliverable:

- Production URL.
- Database backup.
- Log theo request.
- Quy trình deploy có thể lặp lại.

Tiêu chí hoàn thành:

- Deploy từ repo sạch thành công.
- Migration chạy thành công trên production database.
- Health check production OK.
- Có rollback plan.

Ưu tiên: **P1**

## 10. Phase 7: Product Polish

Mục tiêu: nâng trải nghiệm từ “dùng được” lên “dùng thích”.

Việc cần làm:

- Dashboard theo role.
- Bulk import nhân viên từ CSV.
- Export report có filter ngày/tháng.
- Notification cho ticket quá hạn.
- Comment và attachment cho service request.
- Activity timeline trong hồ sơ nhân viên.
- Thiết lập SLA theo category và priority.
- Tìm kiếm nâng cao.
- Phân trang server-side cho danh sách lớn.

Deliverable:

- Trải nghiệm phù hợp vận hành thật.
- Dashboard có giá trị quản trị.
- Service desk gần với quy trình nội bộ doanh nghiệp.

Tiêu chí hoàn thành:

- HR có thể onboarding dữ liệu nhanh.
- Manager thấy backlog và SLA rõ ràng.
- Employee tạo ticket và theo dõi tiến độ.

Ưu tiên: **P2**

## 11. Thứ Tự Thực Hiện Khuyến Nghị

Thứ tự nên làm:

1. Hoàn thiện browser E2E cho luồng đăng nhập, CRUD và service request.
2. Bổ sung backup/monitoring và deployment pipeline.
3. Siết thêm scope dữ liệu theo cấu trúc quản lý thật.
4. Product polish.

Không nên làm trước:

- Thêm nhiều dashboard mới khi chưa có E2E và monitoring.
- Thêm nhiều trường dữ liệu HR khi chưa có chính sách phân quyền đọc rõ ràng.
- Deploy public khi chưa có backup, monitoring và quy trình vận hành.
- Xóa thật dữ liệu production thay vì soft delete/audit.

## 12. Definition Of Done Cho Product Beta

Một bản beta có thể cho nhóm nội bộ dùng thử khi đạt đủ:

- Frontend dùng backend API 100%.
- Có CRUD danh mục nền.
- Có login và role tối thiểu: admin, HR.
- Có audit log cho nhân viên và service request.
- Có soft delete.
- Có test API cho các flow chính.
- Có production environment riêng.
- Có backup database.
- Không còn dữ liệu demo mặc định trong production.

## 13. Risk Register

| Rủi ro | Mức độ | Cách xử lý |
|---|---:|---|
| Frontend và backend lệch dữ liệu | Cao | Phase 1 phải làm trước |
| Database trống không tạo được nhân viên | Cao | Phase 2 CRUD danh mục |
| API không có auth bị ghi/xóa trái phép | Cao | Phase 3 auth |
| Xóa nhầm mất dữ liệu | Cao | Phase 4 soft delete |
| Không biết ai sửa dữ liệu nhạy cảm | Cao | Phase 4 audit log |
| Deploy lỗi không rollback được | Trung bình | Phase 6 deployment policy |
| Dữ liệu nhiều làm UI chậm | Trung bình | Phase 7 phân trang server-side |

## 14. Kế Hoạch Sprint Gợi Ý

Sprint 1:

- Nối frontend sang API.
- Thêm loading/error state.
- Bỏ `localStorage` production path.

Sprint 2:

- CRUD departments.
- CRUD service categories.
- Production init command.

Sprint 3:

- Login.
- Role-based access control.
- Ẩn/hiện UI theo quyền.

Sprint 4:

- Audit log.
- Soft delete.
- Restore basic.

Sprint 5:

- API tests.
- E2E smoke tests.
- CI check.

Sprint 6:

- Production deploy.
- Backup.
- Monitoring/logging.

## 15. Kết Luận Team Lead

Dự án có nền đủ tốt để tiếp tục đầu tư thành product, nhưng chưa nên gọi là product hoàn chỉnh.

Quyết định đề xuất:

- Tiếp tục phát triển.
- Không mở public production trước khi có deployment pipeline, backup và monitoring.
- Có thể demo nội bộ ngay.
- Có thể beta nội bộ sau khi thêm E2E chính và quy trình vận hành tối thiểu.

Mốc quan trọng tiếp theo: **E2E, backup/monitoring và deployment pipeline**.
