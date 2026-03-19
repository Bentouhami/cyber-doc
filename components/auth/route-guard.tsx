"use client";

import type { ReactNode } from "react";

import { useUser } from "@/hooks/use-user";

type RouteGuardProps = {
  children: ReactNode;
  allowRoles?: string[];
  redirectTo?: string;
  redirectUnauthorizedTo?: string;
};

export function RouteGuard({
  children,
  allowRoles,
  redirectTo,
  redirectUnauthorizedTo,
}: RouteGuardProps) {
  const { isLoading } = useUser({
    requireAuth: true,
    allowRoles,
    redirectTo,
    redirectUnauthorizedTo,
  });

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  return <>{children}</>;
}
