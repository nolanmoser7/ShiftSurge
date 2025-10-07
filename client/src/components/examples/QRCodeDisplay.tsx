import { QRCodeDisplay } from '../QRCodeDisplay';

export default function QRCodeDisplayExample() {
  return (
    <QRCodeDisplay
      code="BURGER50"
      promotionTitle="50% Off Gourmet Burgers"
      restaurantName="The Burger Joint"
      restaurantAddress="123 Main St, Downtown"
      expiresIn="2 hours"
      onClose={() => console.log('Close clicked')}
    />
  );
}
