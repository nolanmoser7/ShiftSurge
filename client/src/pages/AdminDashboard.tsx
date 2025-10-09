import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Activity, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const metricsData = metrics as any;

  const statsCards = [
    {
      title: "Total Users",
      value: metricsData?.totalUsers || 0,
      icon: Users,
      testId: "stat-total-users",
    },
    {
      title: "Total Organizations",
      value: metricsData?.totalOrgs || 0,
      icon: Building2,
      testId: "stat-total-orgs",
    },
    {
      title: "Active Users (30d)",
      value: metricsData?.activeUsers || 0,
      icon: Activity,
      testId: "stat-active-users",
    },
    {
      title: "Recent Actions",
      value: metricsData?.recentLogs?.length || 0,
      icon: FileText,
      testId: "stat-recent-actions",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid={stat.testId}>
                  {stat.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsData?.recentLogs && metricsData.recentLogs.length > 0 ? (
              <div className="space-y-3">
                {metricsData.recentLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between border-b pb-3 last:border-0"
                    data-testid={`log-${log.id}`}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium" data-testid={`log-action-${log.id}`}>
                        {log.action}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`log-subject-${log.id}`}>
                        {log.subject}
                      </p>
                      {log.details && (
                        <p className="text-xs text-muted-foreground" data-testid={`log-details-${log.id}`}>
                          {log.details}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap" data-testid={`log-time-${log.id}`}>
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground" data-testid="text-no-logs">
                No recent admin actions
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
