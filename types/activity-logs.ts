export type ActivityLogEntry = {
  id: string;
  activityType: string;
  category: string;
  actor: {
    id: string;
    name: string;
  };
  resource: {
    type: string;
    id: string;
  };
  createdAt: string;
};

export type ActivityLogPage = {
  data: ActivityLogEntry[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ActivityLogFilters = {
  q: string;
  activityType: string;
  resourceType: string;
  userId: string;
  from: string;
  to: string;
  pageSize: string;
};
