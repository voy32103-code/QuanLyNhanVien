const departments = [
  {
    name: "Kinh doanh",
    owner: "Nguyen Minh Anh",
    color: "#0f766e",
    description: "Quan ly khach hang, doanh so va cham soc sau ban."
  },
  {
    name: "Nhan su",
    owner: "Tran Bao Chau",
    color: "#2563eb",
    description: "Tuyen dung, dao tao, chinh sach va trai nghiem nhan vien."
  },
  {
    name: "Ke toan",
    owner: "Le Hoang Phuc",
    color: "#b7791f",
    description: "Theo doi luong, chi phi, cong no va bao cao tai chinh."
  },
  {
    name: "Ky thuat",
    owner: "Pham Quoc Huy",
    color: "#be3455",
    description: "Van hanh he thong, san pham noi bo va ho tro ky thuat."
  },
  {
    name: "Marketing",
    owner: "Vo Ngoc Linh",
    color: "#7c3aed",
    description: "Chien dich thuong hieu, noi dung va phan tich thi truong."
  }
];

const employees = [
  {
    id: "NV001",
    name: "Nguyen Thanh Binh",
    email: "binh.nt@congty.vn",
    phone: "0901 245 889",
    department: "Kinh doanh",
    role: "Truong nhom ban hang",
    salary: 24000000,
    startDate: "2023-08-15",
    status: "active",
    performance: 92,
    color: "#0f766e"
  },
  {
    id: "NV002",
    name: "Tran Ha My",
    email: "my.th@congty.vn",
    phone: "0907 112 436",
    department: "Nhan su",
    role: "Chuyen vien tuyen dung",
    salary: 18000000,
    startDate: "2024-01-08",
    status: "active",
    performance: 88,
    color: "#2563eb"
  },
  {
    id: "NV003",
    name: "Le Duc Anh",
    email: "anh.ld@congty.vn",
    phone: "0914 630 202",
    department: "Ky thuat",
    role: "Ky su he thong",
    salary: 30000000,
    startDate: "2022-11-22",
    status: "leave",
    performance: 81,
    color: "#be3455"
  },
  {
    id: "NV004",
    name: "Pham Quynh Trang",
    email: "trang.pq@congty.vn",
    phone: "0938 450 771",
    department: "Ke toan",
    role: "Ke toan tong hop",
    salary: 21000000,
    startDate: "2021-05-10",
    status: "active",
    performance: 90,
    color: "#b7791f"
  },
  {
    id: "NV005",
    name: "Vo Hoang Nam",
    email: "nam.vh@congty.vn",
    phone: "0986 771 305",
    department: "Marketing",
    role: "Content Lead",
    salary: 22000000,
    startDate: "2024-09-02",
    status: "probation",
    performance: 76,
    color: "#7c3aed"
  }
];

const serviceCategories = [
  {
    name: "Nghi phep & cham cong",
    owner: "Nhan su",
    slaHours: 24,
    color: "#2563eb"
  },
  {
    name: "Bang luong & phuc loi",
    owner: "Ke toan",
    slaHours: 48,
    color: "#b7791f"
  },
  {
    name: "Thiet bi & tai khoan",
    owner: "Ky thuat",
    slaHours: 16,
    color: "#be3455"
  },
  {
    name: "Tuyen dung & hoi nhap",
    owner: "Nhan su",
    slaHours: 72,
    color: "#7c3aed"
  },
  {
    name: "Ho tro kinh doanh",
    owner: "Kinh doanh",
    slaHours: 24,
    color: "#0f766e"
  }
];

const serviceRequests = [
  {
    id: "YC001",
    title: "Cap laptop cho nhan vien moi",
    requesterId: "NV002",
    category: "Thiet bi & tai khoan",
    owner: "Ky thuat",
    priority: "high",
    status: "inProgress",
    createdAt: "2026-05-12",
    dueDate: "2026-05-14",
    description: "Chuan bi laptop, tai khoan email va quyen truy cap he thong noi bo."
  },
  {
    id: "YC002",
    title: "Xac nhan ngay phep con lai",
    requesterId: "NV005",
    category: "Nghi phep & cham cong",
    owner: "Nhan su",
    priority: "normal",
    status: "open",
    createdAt: "2026-05-13",
    dueDate: "2026-05-15",
    description: "Kiem tra so ngay phep truoc khi dang ky nghi cuoi thang."
  },
  {
    id: "YC003",
    title: "Dieu chinh phu cap thang 05",
    requesterId: "NV004",
    category: "Bang luong & phuc loi",
    owner: "Ke toan",
    priority: "urgent",
    status: "open",
    createdAt: "2026-05-10",
    dueDate: "2026-05-12",
    description: "Doi soat phu cap di lai truoc ky chot luong."
  }
];

module.exports = {
  departments,
  employees,
  serviceCategories,
  serviceRequests
};
