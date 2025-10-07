import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, CheckCircle2 } from "lucide-react";

interface QRCodeDisplayProps {
  code: string;
  promotionTitle: string;
  restaurantName: string;
  restaurantAddress: string;
  expiresIn: string;
  onClose?: () => void;
}

export function QRCodeDisplay({
  code,
  promotionTitle,
  restaurantName,
  restaurantAddress,
  expiresIn,
  onClose,
}: QRCodeDisplayProps) {
  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="flex items-center justify-center mb-6">
        <div className="h-12 w-12 rounded-full bg-chart-3/10 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-chart-3" />
        </div>
      </div>
      
      <h2 className="text-2xl font-display font-semibold text-center mb-2">
        Deal Claimed!
      </h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        Show this code to redeem your offer
      </p>

      <div className="bg-white dark:bg-card p-8 rounded-lg border-2 border-dashed border-border mb-6">
        <div className="aspect-square bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center mb-4">
          <div className="text-center">
            <div className="text-6xl font-mono font-bold mb-2">{code}</div>
            <p className="text-xs text-muted-foreground">QR Code Here</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <h3 className="font-semibold mb-1" data-testid="text-promo-title">{promotionTitle}</h3>
          <p className="text-sm text-muted-foreground">{restaurantName}</p>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <span className="text-muted-foreground" data-testid="text-address">{restaurantAddress}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className="text-xs" data-testid="text-expires">
            Expires in {expiresIn}
          </Badge>
        </div>
      </div>

      <Button
        onClick={onClose}
        variant="outline"
        className="w-full"
        data-testid="button-close"
      >
        Close
      </Button>
    </Card>
  );
}
