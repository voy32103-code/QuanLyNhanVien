(function () {
  "use strict";

  window.HR_DATA = {
    departments: [
      {
        name: "Kinh doanh",
        owner: "Nguyễn Minh Anh",
        color: "#0f766e",
        description: "Quản lý khách hàng, doanh số và chăm sóc sau bán."
      },
      {
        name: "Nhân sự",
        owner: "Trần Bảo Châu",
        color: "#2563eb",
        description: "Tuyển dụng, đào tạo, chính sách và trải nghiệm nhân viên."
      },
      {
        name: "Kế toán",
        owner: "Lê Hoàng Phúc",
        color: "#b7791f",
        description: "Theo dõi lương, chi phí, công nợ và báo cáo tài chính."
      },
      {
        name: "Kỹ thuật",
        owner: "Phạm Quốc Huy",
        color: "#be3455",
        description: "Vận hành hệ thống, sản phẩm nội bộ và hỗ trợ kỹ thuật."
      },
      {
        name: "Marketing",
        owner: "Võ Ngọc Linh",
        color: "#7c3aed",
        description: "Chiến dịch thương hiệu, nội dung và phân tích thị trường."
      }
    ],
    employees: [
      {
        id: "NV001",
        name: "Nguyễn Thanh Bình",
        email: "binh.nt@congty.vn",
        phone: "0901 245 889",
        department: "Kinh doanh",
        role: "Trưởng nhóm bán hàng",
        salary: 24000000,
        startDate: "2023-08-15",
        status: "active",
        performance: 92,
        color: "#0f766e"
      },
      {
        id: "NV002",
        name: "Trần Hà My",
        email: "my.th@congty.vn",
        phone: "0907 112 436",
        department: "Nhân sự",
        role: "Chuyên viên tuyển dụng",
        salary: 18000000,
        startDate: "2024-01-08",
        status: "active",
        performance: 88,
        color: "#2563eb"
      },
      {
        id: "NV003",
        name: "Lê Đức Anh",
        email: "anh.ld@congty.vn",
        phone: "0914 630 202",
        department: "Kỹ thuật",
        role: "Kỹ sư hệ thống",
        salary: 30000000,
        startDate: "2022-11-22",
        status: "leave",
        performance: 81,
        color: "#be3455"
      },
      {
        id: "NV004",
        name: "Phạm Quỳnh Trang",
        email: "trang.pq@congty.vn",
        phone: "0938 450 771",
        department: "Kế toán",
        role: "Kế toán tổng hợp",
        salary: 21000000,
        startDate: "2021-05-10",
        status: "active",
        performance: 90,
        color: "#b7791f"
      },
      {
        id: "NV005",
        name: "Võ Hoàng Nam",
        email: "nam.vh@congty.vn",
        phone: "0986 771 305",
        department: "Marketing",
        role: "Content Lead",
        salary: 22000000,
        startDate: "2024-09-02",
        status: "probation",
        performance: 76,
        color: "#7c3aed"
      },
      {
        id: "NV006",
        name: "Đặng Kim Ngân",
        email: "ngan.dk@congty.vn",
        phone: "0972 114 906",
        department: "Kinh doanh",
        role: "Chuyên viên khách hàng",
        salary: 16500000,
        startDate: "2025-03-18",
        status: "active",
        performance: 84,
        color: "#0f766e"
      },
      {
        id: "NV007",
        name: "Bùi Quốc Khánh",
        email: "khanh.bq@congty.vn",
        phone: "0905 992 641",
        department: "Kỹ thuật",
        role: "Frontend Developer",
        salary: 28000000,
        startDate: "2023-12-04",
        status: "active",
        performance: 86,
        color: "#be3455"
      },
      {
        id: "NV008",
        name: "Hoàng Thu Uyên",
        email: "uyen.ht@congty.vn",
        phone: "0963 331 508",
        department: "Nhân sự",
        role: "HR Business Partner",
        salary: 26000000,
        startDate: "2022-06-27",
        status: "active",
        performance: 94,
        color: "#2563eb"
      }
    ],
    serviceCategories: [
      {
        name: "Nghỉ phép & chấm công",
        owner: "Nhân sự",
        slaHours: 24
      },
      {
        name: "Bảng lương & phúc lợi",
        owner: "Kế toán",
        slaHours: 48
      },
      {
        name: "Thiết bị & tài khoản",
        owner: "Kỹ thuật",
        slaHours: 16
      },
      {
        name: "Tuyển dụng & hội nhập",
        owner: "Nhân sự",
        slaHours: 72
      },
      {
        name: "Hỗ trợ kinh doanh",
        owner: "Kinh doanh",
        slaHours: 24
      }
    ],
    serviceRequests: [
      {
        id: "YC001",
        title: "Cấp laptop cho nhân viên mới",
        requesterId: "NV002",
        category: "Thiết bị & tài khoản",
        owner: "Kỹ thuật",
        priority: "high",
        status: "inProgress",
        createdAt: "2026-05-12",
        dueDate: "2026-05-14",
        description: "Chuẩn bị laptop, tài khoản email và quyền truy cập hệ thống nội bộ."
      },
      {
        id: "YC002",
        title: "Xác nhận ngày phép còn lại",
        requesterId: "NV006",
        category: "Nghỉ phép & chấm công",
        owner: "Nhân sự",
        priority: "normal",
        status: "open",
        createdAt: "2026-05-13",
        dueDate: "2026-05-15",
        description: "Kiểm tra số ngày phép trước khi đăng ký nghỉ cuối tháng."
      },
      {
        id: "YC003",
        title: "Điều chỉnh phụ cấp tháng 05",
        requesterId: "NV004",
        category: "Bảng lương & phúc lợi",
        owner: "Kế toán",
        priority: "urgent",
        status: "open",
        createdAt: "2026-05-10",
        dueDate: "2026-05-12",
        description: "Đối soát phụ cấp đi lại trước kỳ chốt lương."
      },
      {
        id: "YC004",
        title: "Chuẩn bị onboarding nhóm kinh doanh",
        requesterId: "NV001",
        category: "Tuyển dụng & hội nhập",
        owner: "Nhân sự",
        priority: "high",
        status: "waiting",
        createdAt: "2026-05-09",
        dueDate: "2026-05-16",
        description: "Lên lịch đào tạo sản phẩm, chính sách hoa hồng và buddy nội bộ."
      },
      {
        id: "YC005",
        title: "Cập nhật danh sách khách hàng bàn giao",
        requesterId: "NV005",
        category: "Hỗ trợ kinh doanh",
        owner: "Kinh doanh",
        priority: "normal",
        status: "resolved",
        createdAt: "2026-05-07",
        dueDate: "2026-05-09",
        description: "Hoàn tất file bàn giao trước chiến dịch chăm sóc lại khách hàng."
      }
    ],
    tasks: [
      {
        date: "20/05",
        title: "Đánh giá thử việc",
        description: "Hoàn tất nhận xét cho nhóm nhân viên mới trong quý."
      },
      {
        date: "25/05",
        title: "Chốt bảng lương",
        description: "Đối soát phụ cấp, nghỉ phép và dữ liệu chấm công."
      },
      {
        date: "31/05",
        title: "Báo cáo nhân sự",
        description: "Gửi báo cáo biến động và kế hoạch tuyển dụng tháng tới."
      }
    ]
  };
}());
