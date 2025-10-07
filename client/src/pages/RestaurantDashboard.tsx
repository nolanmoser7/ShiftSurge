import { useState } from "react";
import { StatCard } from "@/components/StatCard";
import { PromotionForm } from "@/components/PromotionForm";
import {
  Eye,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

//todo: remove mock functionality
const MOCK_STATS = [
  {
    title: "Total Impressions",
    value: "12,847",
    change: "+18.2% from last week",
    trend: "up" as const,
    icon: Eye,
  },
  {
    title: "Active Promotions",
    value: "8",
    change: "3 expiring soon",
    trend: "neutral" as const,
    icon: TrendingUp,
  },
  {
    title: "Total Claims",
    value: "1,247",
    change: "+12.5% from last week",
    trend: "up" as const,
    icon: Users,
  },
  {
    title: "Redemptions",
    value: "892",
    change: "71.5% conversion rate",
    trend: "up" as const,
    icon: CheckCircle2,
  },
];

//todo: remove mock functionality
const MOCK_PROMOTIONS = [
  {
    id: "1",
    title: "50% Off Gourmet Burgers",
    status: "active",
    claims: 247,
    redemptions: 189,
    impressions: 3521,
  },
  {
    id: "2",
    title: "Buy 2 Get 1 Free Cocktails",
    status: "active",
    claims: 412,
    redemptions: 298,
    impressions: 5234,
  },
  {
    id: "3",
    title: "Free Dessert Pizza",
    status: "scheduled",
    claims: 0,
    redemptions: 0,
    impressions: 0,
  },
];

export default function RestaurantDashboard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Restaurant Dashboard</h1>
          <div className="flex items-center gap-2">
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
                <PromotionForm />
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
          {MOCK_STATS.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold mb-6">Active Promotions</h2>
          <div className="space-y-4">
            {MOCK_PROMOTIONS.map((promo) => (
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
                      Pause
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Impressions</p>
                    <p className="text-2xl font-semibold" data-testid={`text-impressions-${promo.id}`}>
                      {promo.impressions.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Claims</p>
                    <p className="text-2xl font-semibold" data-testid={`text-claims-${promo.id}`}>
                      {promo.claims}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Redemptions</p>
                    <p className="text-2xl font-semibold" data-testid={`text-redemptions-${promo.id}`}>
                      {promo.redemptions}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
