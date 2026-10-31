import { Role, User, UserRole } from "@prisma/client";

import { EmployeeDTO } from "@/types/employees";

type UserWithRoles = User & {
  roles: (UserRole & { role: Role })[];
};

export function mapUserToEmployeeDTO(user: UserWithRoles): EmployeeDTO {
  const computedDisplayName =
    (user.name && user.name.trim().length > 0
      ? user.name
      : `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()) || user.email;

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    displayName: computedDisplayName,
    image: user.image,
    roles: user.roles.map(({ role }) => ({
      id: role.id,
      name: role.name,
      description: role.description,
    })),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    activatedAt: user.activatedAt ? user.activatedAt.toISOString() : null,
    deactivatedAt: user.deactivatedAt ? user.deactivatedAt.toISOString() : null,
    deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
  };
}
