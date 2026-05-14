# API Reference

Base URL khi chay local:

```text
http://localhost:3000/api
```

## Health

```http
GET /health
```

Tra ve trang thai server va ket noi database.

## Auth

```http
POST /auth/login
GET /auth/me
POST /auth/logout
```

Login payload:

```json
{
  "email": "admin@example.com",
  "password": "your-strong-password"
}
```

Backend dat cookie session `HttpOnly` khi login. Client mo truc tiep bang file hoac tich hop cu van co the gui header:

```http
Authorization: Bearer <token>
```

`POST /auth/login` co rate limit. Cac read/write route nghiep vu yeu cau dang nhap; write route co them rate limit theo user token.

## Audit Logs

```http
GET /audit-logs?entityType=&entityId=&actorUserId=&limit=100
```

Yeu cau role `admin` hoac `hr_manager`.

Tra ve lich su thay doi cho employee, department, service category va service request.

## Departments

```http
GET /departments
GET /departments/:id
POST /departments
PUT /departments/:id
DELETE /departments/:id
```

Read routes yeu cau dang nhap.
Write routes yeu cau role `admin` hoac `hr_manager`.
Delete la soft delete: record duoc set `deleted_at/deleted_by` va khong xuat hien trong list mac dinh.

Department payload:

```json
{
  "name": "Nhan su",
  "owner": "Tran Bao Chau",
  "color": "#2563eb",
  "description": "Tuyen dung, dao tao, chinh sach va trai nghiem nhan vien."
}
```

`DELETE /departments/:id` tra `409` neu phong ban dang co nhan vien.

## Employees

```http
GET /employees?search=&department=all&status=all&sortBy=name
GET /employees/:id
POST /employees
PUT /employees/:id
DELETE /employees/:id
PATCH /employees/:id/restore
```

Read routes yeu cau dang nhap. Truong `salary` chi duoc tra ve cho role `admin` hoac `hr_manager`; cac role khac nhan `salary: null` va `compensationRedacted: true`.
Write routes yeu cau role `admin` hoac `hr_manager`.
Delete la soft delete. Restore dung de khoi phuc nhanh ho so vua xoa.

Employee payload:

```json
{
  "name": "Nguyen Van A",
  "email": "a@example.com",
  "phone": "0901234567",
  "department": "Kinh doanh",
  "role": "Sales Executive",
  "salary": 15000000,
  "startDate": "2026-05-14",
  "status": "active",
  "performance": 85,
  "color": "#0f766e"
}
```

`status` hop le: `active`, `probation`, `leave`.

## Services

```http
GET /services/categories
GET /services/categories/:id
POST /services/categories
PUT /services/categories/:id
DELETE /services/categories/:id
GET /services/requests?search=&category=all&status=all&priority=all
GET /services/requests/:id
POST /services/requests
PUT /services/requests/:id
PATCH /services/requests/:id/advance
DELETE /services/requests/:id
```

Category va request read routes yeu cau dang nhap.
Category write routes yeu cau role `admin` hoac `hr_manager`.
Request create route cho phep `admin`, `hr_manager`, `manager`, `employee`.
Role `employee` chi duoc tao va xem request cua employee profile dang lien ket voi user.
Request update/advance cho phep `admin`, `hr_manager`, `manager`.
Request delete cho phep `admin`, `hr_manager`.
Category va request delete deu la soft delete.

Service category payload:

```json
{
  "name": "Thiet bi & tai khoan",
  "owner": "Ky thuat",
  "slaHours": 16,
  "color": "#be3455"
}
```

`DELETE /services/categories/:id` tra `409` neu nhom dich vu dang co ticket.

Service request payload:

```json
{
  "title": "Cap tai khoan email",
  "requesterId": "NV001",
  "category": "Thiet bi & tai khoan",
  "owner": "Ky thuat",
  "priority": "high",
  "status": "open",
  "createdAt": "2026-05-14",
  "dueDate": "2026-05-15",
  "description": "Tao email va quyen truy cap he thong noi bo."
}
```

`priority` hop le: `urgent`, `high`, `normal`.

`status` hop le: `open`, `inProgress`, `waiting`, `resolved`.

## Reports

```http
GET /reports/summary
GET /reports/departments
GET /reports/services
```

Bao cao yeu cau dang nhap. Payroll/quy luong chi duoc tra ve cho role `admin` hoac `hr_manager`; cac role khac nhan gia tri `null` kem co `compensationRedacted`.
Bao cao gom tong nhan vien, quy luong, hieu suat, backlog service, ticket qua han va SLA.
