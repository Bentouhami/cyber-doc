export type UserAccessState = {
  activatedAt: Date | null;
  deactivatedAt: Date | null;
  deletedAt: Date | null;
};

export const userAccessStateSelect = {
  activatedAt: true,
  deactivatedAt: true,
  deletedAt: true,
} as const;

export function isUserActive(user: UserAccessState) {
  return Boolean(user.activatedAt) && !user.deactivatedAt && !user.deletedAt;
}
