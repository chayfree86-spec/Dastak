export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OPERATIONS_ADMIN: 'OPERATIONS_ADMIN',
  FINANCE_ADMIN: 'FINANCE_ADMIN',
  SUPPORT_ADMIN: 'SUPPORT_ADMIN',
}

export const normalizeRole = (role) => {
  if (!role) return ROLES.SUPER_ADMIN
  const clean = String(role).toUpperCase().replace(/[-\s]/g, '_')
  if (
    clean === 'ADMIN' ||
    clean === 'SUPERADMIN' ||
    clean === 'SUPER_ADMIN' ||
    clean === 'SUPER_ADMINISTRATOR' ||
    clean === 'ROOT'
  ) {
    return ROLES.SUPER_ADMIN
  }
  if (clean === 'OPERATIONS' || clean === 'OPERATIONS_ADMIN' || clean === 'OPS_ADMIN') {
    return ROLES.OPERATIONS_ADMIN
  }
  if (clean === 'FINANCE' || clean === 'FINANCE_ADMIN') {
    return ROLES.FINANCE_ADMIN
  }
  if (clean === 'SUPPORT' || clean === 'SUPPORT_ADMIN') {
    return ROLES.SUPPORT_ADMIN
  }
  return clean
}

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.OPERATIONS_ADMIN]: 'Operations Admin',
  [ROLES.FINANCE_ADMIN]: 'Finance Admin',
  [ROLES.SUPPORT_ADMIN]: 'Support Admin',
}

export const PERMISSIONS = {
  DASHBOARD: [ROLES.SUPER_ADMIN, ROLES.OPERATIONS_ADMIN, ROLES.FINANCE_ADMIN, ROLES.SUPPORT_ADMIN],
  ORDERS: [ROLES.SUPER_ADMIN, ROLES.OPERATIONS_ADMIN, ROLES.SUPPORT_ADMIN],
  RESTAURANTS: [ROLES.SUPER_ADMIN, ROLES.OPERATIONS_ADMIN],
  DELIVERY_BOYS: [ROLES.SUPER_ADMIN, ROLES.OPERATIONS_ADMIN],
  CUSTOMERS: [ROLES.SUPER_ADMIN, ROLES.SUPPORT_ADMIN],
  FINANCE: [ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN],
  MARKETING: [ROLES.SUPER_ADMIN, ROLES.OPERATIONS_ADMIN],
  REPORTS: [ROLES.SUPER_ADMIN, ROLES.FINANCE_ADMIN, ROLES.OPERATIONS_ADMIN],
  SUPPORT: [ROLES.SUPER_ADMIN, ROLES.SUPPORT_ADMIN, ROLES.OPERATIONS_ADMIN],
  SETTINGS: [ROLES.SUPER_ADMIN],
  SYSTEM_LOG: [ROLES.SUPER_ADMIN, ROLES.OPERATIONS_ADMIN],
}

export const hasPermission = (userRole, moduleKey) => {
  if (!userRole) return true
  const norm = normalizeRole(userRole)
  if (norm === ROLES.SUPER_ADMIN) return true
  const allowedRoles = PERMISSIONS[moduleKey] || []
  return allowedRoles.includes(norm)
}
