"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useSession } from "@/lib/auth-client";
import type { EmployeeDTO } from "@/types/employees";

type UserProfileStatus = "idle" | "loading" | "ready" | "error";

interface UserProfileState {
  status: UserProfileStatus;
  user: EmployeeDTO | null;
  error: string | null;
}

interface UserProfileContextValue {
  user: EmployeeDTO | null;
  status: UserProfileStatus;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

async function fetchProfile(signal?: AbortSignal): Promise<EmployeeDTO | null> {
  const response = await fetch("/api/users/me", { cache: "no-store", signal });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }

    const message = await response.text();
    throw new Error(message || "Failed to load profile");
  }

  return response.json();
}

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [state, setState] = useState<UserProfileState>({ status: "idle", user: null, error: null });

  const loadProfile = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!session?.user?.email) {
        return;
      }

      setState((prev) => ({ ...prev, status: "loading", error: null }));

      try {
        const profile = await fetchProfile(options?.signal);
        if (options?.signal?.aborted) {
          return;
        }
        setState({ status: "ready", user: profile, error: null });
      } catch (error) {
        if (options?.signal?.aborted) {
          return;
        }
        setState({
          status: "error",
          user: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [session?.user?.email],
  );

  useEffect(() => {
    if (!session?.user?.email) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      loadProfile({ signal: controller.signal }).catch(() => {
        // Errors handled inside loadProfile.
      });
    }, 0);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [loadProfile, session?.user?.email]);

  const effectiveState = useMemo<UserProfileState>(() => {
    if (!session?.user?.email) {
      return { status: "idle", user: null, error: null };
    }
    return state;
  }, [session?.user?.email, state]);

  const refresh = useCallback(() => loadProfile(), [loadProfile]);

  const value = useMemo<UserProfileContextValue>(
    () => ({
      user: effectiveState.user,
      status: effectiveState.status,
      isLoading: isPending || effectiveState.status === "loading",
      error: effectiveState.status === "error" ? effectiveState.error : null,
      refresh,
    }),
    [effectiveState, isPending, refresh],
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);

  if (!context) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }

  return context;
}
