import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroSectionProps {
  userType: "worker" | "restaurant";
  onGetStarted?: () => void;
}

export function HeroSection({ userType, onGetStarted }: HeroSectionProps) {
  if (userType === "worker") {
    return (
      <div className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-chart-2 to-chart-1" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-6">
            Exclusive Deals for
            <br />
            Service Workers
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Claim instant discounts from top restaurants in your area. Show your
            industry badge and enjoy perks you deserve.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              variant="default"
              className="bg-white text-chart-2 hover:bg-white/90 border-white"
              onClick={onGetStarted}
              data-testid="button-get-started"
            >
              Browse Deals
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 backdrop-blur-sm"
              data-testid="button-learn-more"
            >
              How It Works
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-sidebar-primary" />
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-6">
          Fill Your Tables with
          <br />
          Targeted Promotions
        </h1>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Connect with verified service-industry workers. Create promotions,
          track engagement, and grow your restaurant community.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            size="lg"
            variant="default"
            className="bg-white text-primary hover:bg-white/90 border-white"
            onClick={onGetStarted}
            data-testid="button-create-promotion"
          >
            Create Promotion
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white/10 backdrop-blur-sm"
            data-testid="button-view-analytics"
          >
            View Analytics
          </Button>
        </div>
      </div>
    </div>
  );
}
