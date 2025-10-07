import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { FilterBar } from "@/components/FilterBar";
import { PromotionCard } from "@/components/PromotionCard";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import burgerImage from '@assets/generated_images/Gourmet_burger_food_photography_4d2703b3.png';
import cocktailImage from '@assets/generated_images/Craft_cocktails_bar_photography_80fb81cd.png';
import pizzaImage from '@assets/generated_images/Artisan_pizza_food_photography_e076d973.png';
import sushiImage from '@assets/generated_images/Elegant_sushi_platter_photography_2aa2653e.png';

//todo: remove mock functionality
const MOCK_PROMOTIONS = [
  {
    id: "1",
    title: "50% Off Gourmet Burgers",
    description: "Get half off any premium burger on our menu. Valid for dine-in only.",
    imageUrl: burgerImage,
    restaurantName: "The Burger Joint",
    restaurantAddress: "123 Main St, Downtown",
    distance: "0.3 mi",
    expiresIn: "2 hours",
  },
  {
    id: "2",
    title: "Buy 2 Get 1 Free Cocktails",
    description: "Happy hour special extended for service workers. Premium cocktails included.",
    imageUrl: cocktailImage,
    restaurantName: "Skyline Lounge",
    restaurantAddress: "456 High St, Uptown",
    distance: "0.8 mi",
    expiresIn: "4 hours",
  },
  {
    id: "3",
    title: "Free Dessert Pizza",
    description: "Order any large pizza and get a free dessert pizza on us.",
    imageUrl: pizzaImage,
    restaurantName: "Bella Italia",
    restaurantAddress: "789 Oak Ave, Midtown",
    distance: "1.2 mi",
    expiresIn: "3 hours",
  },
  {
    id: "4",
    title: "30% Off Sushi Platters",
    description: "All sushi platters are 30% off for verified workers. Dine-in or takeout.",
    imageUrl: sushiImage,
    restaurantName: "Sakura Sushi",
    restaurantAddress: "321 Pine St, Eastside",
    distance: "0.6 mi",
    expiresIn: "5 hours",
  },
];

export default function WorkerFeed() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["All"]);
  const [searchQuery, setSearchQuery] = useState("");
  const [claimedPromotions, setClaimedPromotions] = useState<Set<string>>(new Set());
  const [selectedPromotion, setSelectedPromotion] = useState<typeof MOCK_PROMOTIONS[0] | null>(null);

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
    setClaimedPromotions((prev) => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
    const promo = MOCK_PROMOTIONS.find((p) => p.id === id);
    if (promo) {
      setSelectedPromotion(promo);
    }
  };

  const handleRedeem = (id: string) => {
    const promo = MOCK_PROMOTIONS.find((p) => p.id === id);
    if (promo) {
      setSelectedPromotion(promo);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Shift Surge</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_PROMOTIONS.map((promo) => (
            <PromotionCard
              key={promo.id}
              {...promo}
              isClaimed={claimedPromotions.has(promo.id)}
              onClaim={handleClaim}
              onRedeem={handleRedeem}
            />
          ))}
        </div>
      </div>

      <Dialog open={!!selectedPromotion} onOpenChange={() => setSelectedPromotion(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedPromotion && (
            <QRCodeDisplay
              code={`DEAL${selectedPromotion.id}`}
              promotionTitle={selectedPromotion.title}
              restaurantName={selectedPromotion.restaurantName}
              restaurantAddress={selectedPromotion.restaurantAddress}
              expiresIn={selectedPromotion.expiresIn}
              onClose={() => setSelectedPromotion(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
