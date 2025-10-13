import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building2, Activity, FileText, Tag, Ticket, CheckCircle, TrendingUp } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Helper to format audit log entries for display
function formatAuditLogMessage(log: any): { title: string; description: string; variant: any } {
  try {
    const details = log.details ? JSON.parse(log.details) : {};
    
    switch (log.action) {
      case "PROMOTION_CREATED":
        return {
          title: "Promotion Created",
          description: `"${details.title}" - ${details.discountType}: ${details.discountValue}`,
          variant: "default"
        };
      
      case "PROMOTION_REDEEMED":
        return {
          title: "Promotion Redeemed",
          description: `${details.workerName || "Worker"} redeemed "${details.promotionTitle}"`,
          variant: "secondary"
        };
      
      case "WORKER_ADDED":
        return {
          title: "Worker Added",
          description: `${details.name} (${details.workerRole}) - ${details.email}`,
          variant: "outline"
        };
      
      case "RESTAURANT_ONBOARDED":
        return {
          title: "Restaurant Onboarded",
          description: `${details.name} - ${details.email}`,
          variant: "outline"
        };
      
      case "CREATE_ORGANIZATION":
        return {
          title: "Organization Created",
          description: `${details.name}`,
          variant: "default"
        };
      
      case "UPDATE_ORGANIZATION":
      case "DELETE_ORGANIZATION":
        return {
          title: log.action.replace("_", " ").toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: log.subject,
          variant: "outline"
        };
      
      case "UPDATE_USER":
        return {
          title: "User Updated",
          description: log.subject,
          variant: "outline"
        };
      
      default:
        return {
          title: log.action,
          description: log.subject,
          variant: "outline"
        };
    }
  } catch (e) {
    return {
      title: log.action,
      description: log.subject,
      variant: "outline"
    };
  }
}

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
      title: "Total Promotions",
      value: metricsData?.promotionStats?.totalPromotions || 0,
      icon: Tag,
      testId: "stat-total-promotions",
    },
    {
      title: "Total Claims",
      value: metricsData?.promotionStats?.totalClaims || 0,
      icon: Ticket,
      testId: "stat-total-claims",
    },
    {
      title: "Total Redemptions",
      value: metricsData?.promotionStats?.totalRedemptions || 0,
      icon: CheckCircle,
      testId: "stat-total-redemptions",
    },
    {
      title: "Organizations",
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
  ];

  const dailyActivity = metricsData?.dailyActivity || [];
  const topRestaurants = metricsData?.topRestaurants || [];

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>

        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <CardTitle className="text-xs sm:text-sm font-medium leading-tight">{stat.title}</CardTitle>
                <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-xl sm:text-2xl font-bold" data-testid={stat.testId}>
                  {stat.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Activity Overview (30 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyActivity.length > 0 ? (
                <div className="h-[250px] sm:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => format(new Date(date), 'MMM d')}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="promotions" 
                        stroke="hsl(var(--primary))" 
                        name="Promotions"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="claims" 
                        stroke="hsl(var(--chart-2))" 
                        name="Claims"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="redemptions" 
                        stroke="hsl(var(--chart-3))" 
                        name="Redemptions"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No activity data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-lg sm:text-xl">Top Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              {topRestaurants.length > 0 ? (
                <div className="space-y-3">
                  {topRestaurants.map((restaurant: any, index: number) => (
                    <div 
                      key={restaurant.id} 
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                      data-testid={`top-restaurant-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{restaurant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {restaurant.totalPromotions} promotion{restaurant.totalPromotions !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {restaurant.totalClaims} claim{restaurant.totalClaims !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No restaurant data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Recent Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {metricsData?.recentLogs && metricsData.recentLogs.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {metricsData.recentLogs.map((log: any) => {
                  const formatted = formatAuditLogMessage(log);
                  return (
                    <div
                      key={log.id}
                      className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 border-b pb-3 last:border-0"
                      data-testid={`log-${log.id}`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={formatted.variant as any} className="text-xs" data-testid={`log-action-${log.id}`}>
                            {formatted.title}
                          </Badge>
                          <p className="text-xs text-muted-foreground sm:hidden" data-testid={`log-time-mobile-${log.id}`}>
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground break-words" data-testid={`log-description-${log.id}`}>
                          {formatted.description}
                        </p>
                      </div>
                      <p className="hidden sm:block text-xs text-muted-foreground whitespace-nowrap ml-4" data-testid={`log-time-${log.id}`}>
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  );
                })}
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
