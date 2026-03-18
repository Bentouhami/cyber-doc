"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { EmployeeDTO } from "@/types/employees";

export type UserStatus = "idle" | "loading" | "ready" | "error";

export type UseUserOptions = {
  requireAuth?: boolean;
  allowRoles?: string[];
  redirectTo?: string;
  redirectUnauthorizedTo?: string;
};

type UserState = {
  status: UserStatus;
  user: EmployeeDTO | null;
  error: string | null;
};

function hasAllowedRole(user: EmployeeDTO, allowRoles?: string[]) {
  if (!allowRoles || allowRoles.length === 0) return true;
  return user.roles.some((role) => allowRoles.includes(role.name));
}

export function useUser(options: UseUserOptions = {}) {
  const {
    requireAuth = false,
    allowRoles,
    redirectTo = "/documents",
    redirectUnauthorizedTo = "/",
  } = options;
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<UserState>({
    status: "idle",
    user: null,
    error: null,
  });

  const fetchProfile = useCallback(async (signal?: AbortSignal) => {
    setState((prev) => ({ ...prev, status: "loading", error: null }));
    try {
      const response = await fetch("/api/users/me", { cache: "no-store", signal });

      if (response.status === 401) {
        if (requireAuth) {
          const loginUrl = new URL(redirectUnauthorizedTo, window.location.origin);
          if (pathname) {
            loginUrl.searchParams.set("from", pathname);
          }
          router.replace(loginUrl.toString());
        }
        setState({ status: "idle", user: null, error: null });
        return;
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to load user profile");
      }

      const profile = (await response.json()) as EmployeeDTO;
      if (!hasAllowedRole(profile, allowRoles)) {
        router.replace(redirectTo);
        setState({ status: "ready", user: profile, error: null });
        return;
      }

      setState({ status: "ready", user: profile, error: null });
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      setState({
        status: "error",
        user: null,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [allowRoles, pathname, redirectTo, redirectUnauthorizedTo, requireAuth, router]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProfile(controller.signal);
    return () => controller.abort();
  }, [fetchProfile]);

  const refresh = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return useMemo(
    () => ({
      user: state.user,
      status: state.status,
      isLoading: state.status === "loading",
      error: state.error,
      refresh,
    }),
    [refresh, state.error, state.status, state.user],
  );
}
