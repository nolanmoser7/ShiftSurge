import { PromotionCard } from '../PromotionCard';
import burgerImage from '@assets/generated_images/Gourmet_burger_food_photography_4d2703b3.png';

export default function PromotionCardExample() {
  return (
    <div className="max-w-md">
      <PromotionCard
        id="1"
        title="50% Off Gourmet Burgers"
        description="Get half off any premium burger on our menu. Valid for dine-in only."
        imageUrl={burgerImage}
        restaurantName="The Burger Joint"
        distance="0.3 mi"
        expiresIn="2 hours"
        onClaim={(id) => console.log('Claim clicked:', id)}
      />
    </div>
  );
}
