// path: types/employees.ts
export interface RoleDTO {
  id: number;
  name: string;
  description: string | null;
}

export interface EmployeeDTO {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  displayName: string;
  image?: string | null;
  roles: RoleDTO[];
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
  deletedAt: string | null;
}

export interface CreateEmployeeDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleNames: string[];
}

export interface UpdateEmployeeDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  roleNames?: string[];
}
