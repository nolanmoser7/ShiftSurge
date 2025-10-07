import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: LucideIcon;
}

export function StatCard({ title, value, change, trend, icon: Icon }: StatCardProps) {
  return (
    <Card className="p-6" data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1" data-testid="text-stat-title">
            {title}
          </p>
          <p className="text-2xl font-semibold" data-testid="text-stat-value">
            {value}
          </p>
          {change && (
            <p
              className={`text-xs mt-1 ${
                trend === "up"
                  ? "text-chart-3"
                  : trend === "down"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
              data-testid="text-stat-change"
            >
              {change}
            </p>
          )}
        </div>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  );
}
