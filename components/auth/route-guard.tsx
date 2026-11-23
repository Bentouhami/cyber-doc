"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useUserProfile } from "@/components/providers/user-profile-provider";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";

type RouteGuardProps = {
  children: ReactNode;
  allowRoles?: string[];
  redirectTo?: string;
  redirectUnauthorizedTo?: string;
};

export function RouteGuard({
  children,
  allowRoles,
  redirectTo = "/documents",
  redirectUnauthorizedTo = "/",
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, status, isLoading, refresh } = useUserProfile();
  const { t } = useLocale();
  const hasAllowedRole = Boolean(
    user && (!allowRoles?.length || user.roles.some((role) => allowRoles.includes(role.name))),
  );

  useEffect(() => {
    if (isLoading || status === "error") {
      return;
    }

    if (!user) {
      const loginUrl = new URL(redirectUnauthorizedTo, window.location.origin);
      if (pathname) {
        loginUrl.searchParams.set("from", pathname);
      }
      router.replace(loginUrl.toString());
      return;
    }

    if (!hasAllowedRole) {
      router.replace(redirectTo);
    }
  }, [hasAllowedRole, isLoading, pathname, redirectTo, redirectUnauthorizedTo, router, status, user]);

  if (status === "error") {
    return (
      <div className="flex flex-col items-start gap-3 p-6" role="alert">
        <p className="text-sm text-destructive">{t("auth.session.verifyError")}</p>
        <Button type="button" variant="outline" onClick={() => void refresh()}>
          {t("auth.session.retry")}
        </Button>
      </div>
    );
  }

  if (isLoading || !hasAllowedRole) {
    return <div className="p-6 text-sm text-muted-foreground">{t("auth.session.loading")}</div>;
  }

  return <>{children}</>;
}
