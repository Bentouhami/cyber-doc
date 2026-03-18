type RoleAwareUser = {
  roles: { role: { name: string } }[];
};

export function hasAnyRole(user: RoleAwareUser, allowed: string[]) {
  return user.roles.some((role) => allowed.includes(role.role.name));
}
