// path: types/employees.ts
export interface RoleDTO {
  id: number;
  name: string;
  description: string;
}
export interface UserRoleDTO {
  id: number;
  RoleDTO: RoleDTO;
}
export interface EmployeeDTO {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  UserRoleDTO: UserRoleDTO[];
}
export interface CreateEmployeeDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  RoleDTOs: number[]; // Array of RoleDTO IDs
}
export interface UpdateEmployeeDTO {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  RoleDTOs?: number[]; // Array of RoleDTO IDs
}
