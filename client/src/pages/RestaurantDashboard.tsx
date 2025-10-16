import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { StatCard } from "@/components/StatCard";
import { PromotionForm } from "@/components/PromotionForm";
import { InviteQRCode } from "@/components/InviteQRCode";
import {
  Eye,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function RestaurantDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [workerInvite, setWorkerInvite] = useState<any>(null);

  // Redirect if not authenticated or not a restaurant
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "restaurant")) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  // Fetch restaurant's promotions
  const { data: promotions = [], isLoading: promotionsLoading } = useQuery<any[]>({
    queryKey: ["/api/restaurant/promotions"],
    enabled: !!user && user.role === "restaurant",
  });

  // Generate worker invite mutation
  const generateInviteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/restaurant/invites", {});
      return res.json();
    },
    onSuccess: (data) => {
      setWorkerInvite(data);
      setIsInviteOpen(true);
      toast({
        title: "Worker invite created",
        description: "Share the QR code or link with your team member",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invite",
        variant: "destructive",
      });
    },
  });

  // Calculate stats from promotions data
  const stats = {
    totalImpressions: promotions.reduce((sum: number, p: any) => sum + (p.impressions || 0), 0),
    activePromotions: promotions.filter((p: any) => p.status === "active").length,
    totalClaims: promotions.reduce((sum: number, p: any) => sum + (p.currentClaims || 0), 0),
    totalRedemptions: promotions.reduce((sum: number, p: any) => sum + (p.redemptions || 0), 0),
  };

  const conversionRate = stats.totalClaims > 0 
    ? ((stats.totalRedemptions / stats.totalClaims) * 100).toFixed(1) 
    : "0.0";

  const statsCards = [
    {
      title: "Total Impressions",
      value: stats.totalImpressions.toLocaleString(),
      change: "Across all promotions",
      trend: "neutral" as const,
      icon: Eye,
    },
    {
      title: "Active Promotions",
      value: stats.activePromotions.toString(),
      change: `${promotions.length - stats.activePromotions} inactive`,
      trend: "neutral" as const,
      icon: TrendingUp,
    },
    {
      title: "Total Claims",
      value: stats.totalClaims.toLocaleString(),
      change: "Workers claimed deals",
      trend: "up" as const,
      icon: Users,
    },
    {
      title: "Redemptions",
      value: stats.totalRedemptions.toLocaleString(),
      change: `${conversionRate}% conversion rate`,
      trend: "up" as const,
      icon: CheckCircle2,
    },
  ];

  if (authLoading || promotionsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Restaurant Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => generateInviteMutation.mutate()}
              disabled={generateInviteMutation.isPending}
              data-testid="button-worker-invite"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {generateInviteMutation.isPending ? "Generating..." : "Invite Worker"}
            </Button>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-promotion">
                  <Plus className="h-4 w-4 mr-2" />
                  New Promotion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Promotion</DialogTitle>
                </DialogHeader>
                <PromotionForm onSuccess={() => {
                  setIsCreateOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/restaurant/promotions"] });
                }} />
              </DialogContent>
            </Dialog>

            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Worker Invite</DialogTitle>
                </DialogHeader>
                {workerInvite && (
                  <InviteQRCode
                    value={workerInvite.url}
                    title="Share with Team Member"
                    description="This QR code is single-use and expires in 24 hours"
                    size={200}
                  />
                )}
              </DialogContent>
            </Dialog>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold mb-2">Analytics Overview</h2>
          <p className="text-muted-foreground">
            Track your promotion performance and engagement
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statsCards.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold mb-6">
            {promotions.length === 0 ? "No Promotions Yet" : "Your Promotions"}
          </h2>
          {promotions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                You haven't created any promotions yet. Click "New Promotion" to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {promotions.map((promo: any) => (
                <Card key={promo.id} className="p-6" data-testid={`card-promo-${promo.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{promo.title}</h3>
                      <Badge
                        variant={promo.status === "active" ? "default" : "outline"}
                        data-testid={`badge-status-${promo.id}`}
                      >
                        {promo.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" data-testid={`button-edit-${promo.id}`}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" data-testid={`button-pause-${promo.id}`}>
                        {promo.status === "active" ? "Pause" : "Activate"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Impressions</p>
                      <p className="text-2xl font-semibold" data-testid={`text-impressions-${promo.id}`}>
                        {(promo.impressions || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Claims</p>
                      <p className="text-2xl font-semibold" data-testid={`text-claims-${promo.id}`}>
                        {promo.currentClaims || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Redemptions</p>
                      <p className="text-2xl font-semibold" data-testid={`text-redemptions-${promo.id}`}>
                        {promo.redemptions || 0}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
