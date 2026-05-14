# Backend 5 Phase Plan

## Phase 1: Nen tang server

- Tao Node.js backend bang Express.
- Doc cau hinh tu `.env`.
- Bat CORS, Helmet, JSON body parser va request logging.
- Serve frontend hien co tai `/` va API tai `/api`.

## Phase 2: PostgreSQL schema

- Tao migration SQL trong `backend/db/migrations`.
- Cac bang chinh:
  - `departments`
  - `employees`
  - `service_categories`
  - `service_requests`
  - `schema_migrations`
- Them index cho loc nhanh theo phong ban, trang thai, uu tien va han SLA.
- Them seed data de khoi tao demo.

## Phase 3: REST API

- `GET /api/health`
- `GET /api/departments`
- CRUD nhan vien: `/api/employees`
- Service desk: `/api/services/categories`, `/api/services/requests`
- Bao cao: `/api/reports/summary`, `/api/reports/departments`, `/api/reports/services`

## Phase 4: Validation va bao loi

- Validate payload nhan vien va service request truoc khi ghi DB.
- Chuan hoa loi 404, 409, 422 va loi constraint PostgreSQL.
- Khong commit connection string that; dung `.env`.
- Database van co constraint rieng de chan du lieu sai o tang cuoi.

## Phase 5: Chay, test va noi frontend

1. Cai dependency:

```bash
npm install
```

2. Tao `.env` tu `.env.example`, dan connection string Neon/PostgreSQL that vao `DATABASE_URL`.

3. Chay migration va seed:

```bash
npm run backend:migrate
npm run backend:seed
```

4. Xoa du lieu demo seed neu muon bat dau voi database trong:

```bash
npm run backend:clear-demo
```

5. Chay server:

```bash
npm run backend:start
```

6. Kiem tra:

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/employees
curl http://localhost:3000/api/services/requests
```

7. Buoc tiep theo: thay `assets/js/storage.js` bang API client goi cac endpoint tren.
