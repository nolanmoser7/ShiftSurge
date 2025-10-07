import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock } from "lucide-react";

interface PromotionCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  restaurantName: string;
  restaurantLogo?: string;
  distance: string;
  expiresIn: string;
  isClaimed?: boolean;
  onClaim?: (id: string) => void;
  onRedeem?: (id: string) => void;
}

export function PromotionCard({
  id,
  title,
  description,
  imageUrl,
  restaurantName,
  restaurantLogo,
  distance,
  expiresIn,
  isClaimed = false,
  onClaim,
  onRedeem,
}: PromotionCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate active-elevate-2" data-testid={`card-promotion-${id}`}>
      <div className="relative aspect-video">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        <div className="absolute top-4 left-4">
          <Avatar className="h-12 w-12 border-2 border-white">
            <AvatarImage src={restaurantLogo} alt={restaurantName} />
            <AvatarFallback>{restaurantName[0]}</AvatarFallback>
          </Avatar>
        </div>
        {isClaimed && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-chart-3 text-white border-0">
              Claimed
            </Badge>
          </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-display font-semibold text-xl text-white mb-1" data-testid={`text-promotion-title-${id}`}>
            {title}
          </h3>
        </div>
      </div>
      <div className="p-6">
        <p className="text-sm text-muted-foreground mb-4" data-testid={`text-promotion-description-${id}`}>
          {description}
        </p>
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span data-testid={`text-distance-${id}`}>{distance}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span data-testid={`text-expires-${id}`}>{expiresIn}</span>
          </div>
        </div>
        {isClaimed ? (
          <Button
            className="w-full"
            variant="default"
            onClick={() => onRedeem?.(id)}
            data-testid={`button-redeem-${id}`}
          >
            Redeem Now
          </Button>
        ) : (
          <Button
            className="w-full"
            variant="default"
            onClick={() => onClaim?.(id)}
            data-testid={`button-claim-${id}`}
          >
            Claim Deal
          </Button>
        )}
      </div>
    </Card>
  );
}
