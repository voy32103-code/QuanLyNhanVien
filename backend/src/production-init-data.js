const departments = [
  {
    name: "Nhan su",
    owner: "Chua phan cong",
    color: "#2563eb",
    description: "Quan ly ho so nhan su, tuyen dung, chinh sach va cham cong."
  },
  {
    name: "Ke toan",
    owner: "Chua phan cong",
    color: "#b7791f",
    description: "Quan ly bang luong, phuc loi, chi phi va bao cao tai chinh."
  },
  {
    name: "Ky thuat",
    owner: "Chua phan cong",
    color: "#be3455",
    description: "Quan ly thiet bi, tai khoan, he thong va ho tro ky thuat."
  },
  {
    name: "Kinh doanh",
    owner: "Chua phan cong",
    color: "#0f766e",
    description: "Quan ly khach hang, doanh so va ho tro hoat dong kinh doanh."
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
    name: "Ho tro kinh doanh",
    owner: "Kinh doanh",
    slaHours: 24,
    color: "#0f766e"
  }
];

module.exports = {
  departments,
  serviceCategories
};
