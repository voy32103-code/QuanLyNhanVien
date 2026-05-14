const SENSITIVE_HR_ROLES = ["admin", "hr_manager"];
const SERVICE_OPERATOR_ROLES = ["admin", "hr_manager", "manager"];

function hasAnyRole(user, roles) {
  const userRoles = user && Array.isArray(user.roles) ? user.roles : [];
  return userRoles.some((role) => roles.includes(role));
}

function canViewCompensation(user) {
  return hasAnyRole(user, SENSITIVE_HR_ROLES);
}

function canReadAllServiceRequests(user) {
  return hasAnyRole(user, SERVICE_OPERATOR_ROLES);
}

module.exports = {
  canReadAllServiceRequests,
  canViewCompensation,
  hasAnyRole
};
