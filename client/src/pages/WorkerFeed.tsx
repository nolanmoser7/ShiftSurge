import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { HeroSection } from "@/components/HeroSection";
import { FilterBar } from "@/components/FilterBar";
import { PromotionCard } from "@/components/PromotionCard";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function WorkerFeed() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["All"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPromotion, setSelectedPromotion] = useState<any | null>(null);

  // Redirect if not authenticated or not a worker
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "worker")) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  // Fetch promotions
  const { data: promotions = [], isLoading: promotionsLoading } = useQuery<any[]>({
    queryKey: ["/api/promotions"],
    enabled: !!user,
  });

  // Fetch worker's claims
  const { data: claims = [] } = useQuery<any[]>({
    queryKey: ["/api/claims"],
    enabled: !!user && user.role === "worker",
  });

  // Claim mutation
  const claimMutation = useMutation({
    mutationFn: async (promotionId: string) => {
      const res = await apiRequest("POST", "/api/claims", { promotionId });
      return res.json();
    },
    onSuccess: (claim) => {
      queryClient.invalidateQueries({ queryKey: ["/api/claims"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      
      // Find the promotion for this claim
      const promo = promotions.find((p: any) => p.id === claim.promotionId);
      if (promo) {
        setSelectedPromotion({ ...promo, claimCode: claim.code, claimExpiresAt: claim.expiresAt });
      }
    },
  });

  const handleCategoryToggle = (category: string) => {
    if (category === "All") {
      setSelectedCategories(["All"]);
    } else {
      const newCategories = selectedCategories.includes(category)
        ? selectedCategories.filter((c) => c !== category)
        : [...selectedCategories.filter((c) => c !== "All"), category];
      setSelectedCategories(newCategories.length === 0 ? ["All"] : newCategories);
    }
  };

  const handleClaim = (id: string) => {
    claimMutation.mutate(id);
  };

  const handleRedeem = (id: string) => {
    const claim = claims.find((c: any) => c.promotionId === id);
    const promo = promotions.find((p: any) => p.id === id);
    if (promo && claim) {
      setSelectedPromotion({ ...promo, claimCode: claim.code, claimExpiresAt: claim.expiresAt });
    }
  };

  // Create a Set of claimed promotion IDs
  const claimedPromotionIds = new Set(claims.map((c: any) => c.promotionId));

  // Calculate time remaining for display
  const getTimeRemaining = (endDate: string | null) => {
    if (!endDate) return "No expiration";
    
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours} hours`;
    
    const days = Math.floor(hours / 24);
    return `${days} days`;
  };

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
          <div>
            <h1 className="text-2xl font-display font-bold">Shift Surge</h1>
            {profile && (
              <p className="text-sm text-muted-foreground" data-testid="text-user-name">
                Welcome, {profile.name}
              </p>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <HeroSection userType="worker" onGetStarted={() => window.scrollTo({ top: 600, behavior: 'smooth' })} />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-display font-bold mb-2">Available Deals</h2>
          <p className="text-muted-foreground">
            Discover exclusive promotions from restaurants near you
          </p>
        </div>

        <div className="mb-8">
          <FilterBar
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {promotions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No promotions available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo: any) => (
              <PromotionCard
                key={promo.id}
                id={promo.id}
                title={promo.title}
                description={promo.description}
                imageUrl={promo.imageUrl || ""}
                restaurantName={promo.restaurantName || "Restaurant"}
                restaurantLogo={promo.restaurantLogoUrl}
                distance="0.5 mi"
                expiresIn={getTimeRemaining(promo.endDate)}
                isClaimed={claimedPromotionIds.has(promo.id)}
                onClaim={handleClaim}
                onRedeem={handleRedeem}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedPromotion} onOpenChange={() => setSelectedPromotion(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedPromotion && (
            <QRCodeDisplay
              code={selectedPromotion.claimCode || `DEAL${selectedPromotion.id}`}
              promotionTitle={selectedPromotion.title}
              restaurantName={selectedPromotion.restaurantName || "Restaurant"}
              restaurantAddress={selectedPromotion.restaurantAddress || "Address not available"}
              expiresIn={selectedPromotion.claimExpiresAt 
                ? getTimeRemaining(selectedPromotion.claimExpiresAt) 
                : getTimeRemaining(selectedPromotion.endDate)}
              onClose={() => setSelectedPromotion(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
