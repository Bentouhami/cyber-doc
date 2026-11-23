import { LEGACY_ADMIN_ROLE, MANAGEMENT_ROLES } from "@/lib/management-role-policy";

type RoleAwareUser = {
  roles: { role: { name: string } }[];
};

export function hasAnyRole(user: RoleAwareUser, allowed: string[]) {
  const acceptedRoles = allowed.includes(LEGACY_ADMIN_ROLE)
    ? new Set([...allowed, ...MANAGEMENT_ROLES])
    : new Set(allowed);

  return user.roles.some((role) => acceptedRoles.has(role.role.name));
}
