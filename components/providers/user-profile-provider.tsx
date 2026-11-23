"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useSession } from "@/lib/auth-client";
import {
  isCurrentProfileRequest,
  type ProfileRequestIdentity,
} from "@/lib/profile-request-policy";
import type { EmployeeDTO } from "@/types/employees";

type UserProfileStatus = "idle" | "loading" | "ready" | "error";

interface UserProfileState {
  subjectEmail: string | null;
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

async function fetchProfile(): Promise<EmployeeDTO | null> {
  const response = await fetch("/api/users/me", { cache: "no-store" });

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
  const sessionEmail = session?.user?.email ?? null;
  const [state, setState] = useState<UserProfileState>({
    subjectEmail: null,
    status: "idle",
    user: null,
    error: null,
  });
  const currentSubjectEmailRef = useRef(sessionEmail);
  const requestGenerationRef = useRef(0);
  const profileRequestRef = useRef<ProfileRequestIdentity & {
    promise: Promise<EmployeeDTO | null>;
  } | null>(null);

  useEffect(() => {
    currentSubjectEmailRef.current = sessionEmail;
  }, [sessionEmail]);

  const loadProfile = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      if (!sessionEmail || currentSubjectEmailRef.current !== sessionEmail) {
        return;
      }

      setState((prev) => ({
        ...prev,
        subjectEmail: sessionEmail,
        status: "loading",
        error: null,
      }));

      let profileRequest = profileRequestRef.current;

      try {
        if (!profileRequest || profileRequest.subjectEmail !== sessionEmail) {
          const generation = requestGenerationRef.current + 1;
          requestGenerationRef.current = generation;
          profileRequest = {
            subjectEmail: sessionEmail,
            generation,
            promise: fetchProfile(),
          };
          profileRequestRef.current = profileRequest;
        }

        const profile = await profileRequest.promise;
        if (profileRequestRef.current === profileRequest) {
          profileRequestRef.current = null;
        }
        if (
          !isCurrentProfileRequest(
            profileRequest,
            currentSubjectEmailRef.current,
            requestGenerationRef.current,
            options?.signal?.aborted,
          )
        ) {
          return;
        }
        setState({ subjectEmail: sessionEmail, status: "ready", user: profile, error: null });
      } catch (error) {
        if (profileRequestRef.current === profileRequest) {
          profileRequestRef.current = null;
        }
        if (
          !profileRequest ||
          !isCurrentProfileRequest(
            profileRequest,
            currentSubjectEmailRef.current,
            requestGenerationRef.current,
            options?.signal?.aborted,
          )
        ) {
          return;
        }
        setState({
          subjectEmail: sessionEmail,
          status: "error",
          user: null,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
    [sessionEmail],
  );

  useEffect(() => {
    if (!sessionEmail) {
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
  }, [loadProfile, sessionEmail]);

  const effectiveState = useMemo<UserProfileState>(() => {
    if (!sessionEmail) {
      return { subjectEmail: null, status: "idle", user: null, error: null };
    }
    if (state.subjectEmail !== sessionEmail) {
      return { subjectEmail: sessionEmail, status: "loading", user: null, error: null };
    }
    return state;
  }, [sessionEmail, state]);

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
