import { Suspense } from "react";

import { ActivityLogScreen } from "@/components/admin/activity-logs/activity-log-screen";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityLogPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <ActivityLogScreen />
    </Suspense>
  );
}
