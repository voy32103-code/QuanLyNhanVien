const reportRepository = require("../repositories/report-repository");
const { canViewCompensation } = require("../utils/access");

async function getSummary(user) {
  return reportRepository.getSummary({
    includeCompensation: canViewCompensation(user)
  });
}

async function getDepartmentReport(user) {
  return reportRepository.getDepartmentReport({
    includeCompensation: canViewCompensation(user)
  });
}

async function getServiceReport() {
  return reportRepository.getServiceReport();
}

module.exports = {
  getDepartmentReport,
  getServiceReport,
  getSummary
};
