import { StatCard } from '../StatCard';
import { TrendingUp } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="max-w-sm">
      <StatCard
        title="Total Claims"
        value="1,247"
        change="+12.5% from last week"
        trend="up"
        icon={TrendingUp}
      />
    </div>
  );
}
