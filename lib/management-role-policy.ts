export const OWNER_ROLE = "owner";
export const RESPONSIBLE_ROLE = "responsible";
export const EMPLOYEE_ROLE = "employee";
export const LEGACY_ADMIN_ROLE = "admin";

export const MANAGEMENT_ROLES = [
  OWNER_ROLE,
  RESPONSIBLE_ROLE,
  LEGACY_ADMIN_ROLE,
] as const;

export const DOCUMENT_ROLES = [
  OWNER_ROLE,
  RESPONSIBLE_ROLE,
  LEGACY_ADMIN_ROLE,
  EMPLOYEE_ROLE,
] as const;

function roleSet(roleNames: readonly string[]) {
  return new Set(roleNames);
}

export function hasManagementRole(roleNames: readonly string[]) {
  const roles = roleSet(roleNames);
  return MANAGEMENT_ROLES.some((role) => roles.has(role));
}

export function isOwner(roleNames: readonly string[]) {
  return roleNames.includes(OWNER_ROLE);
}

export function isResponsible(roleNames: readonly string[]) {
  return roleNames.includes(RESPONSIBLE_ROLE);
}

function isLegacyAdmin(roleNames: readonly string[]) {
  return roleNames.includes(LEGACY_ADMIN_ROLE);
}

function isSingleRole(roleNames: readonly string[], role: string) {
  return roleNames.length === 1 && roleNames[0] === role;
}

export function canAssignManagedRoles(
  actorRoleNames: readonly string[],
  assignedRoleNames: readonly string[],
) {
  if (assignedRoleNames.length !== 1) {
    return false;
  }

  if (isOwner(actorRoleNames) || isLegacyAdmin(actorRoleNames)) {
    return [RESPONSIBLE_ROLE, EMPLOYEE_ROLE].includes(assignedRoleNames[0]);
  }

  return (
    isResponsible(actorRoleNames) &&
    isSingleRole(assignedRoleNames, EMPLOYEE_ROLE)
  );
}

export function canUpdateManagedUser({
  actorId,
  actorRoleNames,
  targetId,
  targetRoleNames,
  assignedRoleNames,
}: {
  actorId: string;
  actorRoleNames: readonly string[];
  targetId: string;
  targetRoleNames: readonly string[];
  assignedRoleNames?: readonly string[];
}) {
  if (isOwner(targetRoleNames)) {
    return (
      actorId === targetId &&
      isOwner(actorRoleNames) &&
      (!assignedRoleNames || isSingleRole(assignedRoleNames, OWNER_ROLE))
    );
  }

  if (isOwner(actorRoleNames) || isLegacyAdmin(actorRoleNames)) {
    return !assignedRoleNames || canAssignManagedRoles(actorRoleNames, assignedRoleNames);
  }

  return (
    isResponsible(actorRoleNames) &&
    targetRoleNames.length === 1 &&
    targetRoleNames[0] === EMPLOYEE_ROLE &&
    (!assignedRoleNames || isSingleRole(assignedRoleNames, EMPLOYEE_ROLE))
  );
}

export function canDeleteManagedUser(
  actorRoleNames: readonly string[],
  targetRoleNames: readonly string[],
) {
  if (isOwner(targetRoleNames)) {
    return false;
  }

  if (isOwner(actorRoleNames) || isLegacyAdmin(actorRoleNames)) {
    return true;
  }

  return (
    isResponsible(actorRoleNames) &&
    targetRoleNames.length === 1 &&
    targetRoleNames[0] === EMPLOYEE_ROLE
  );
}
