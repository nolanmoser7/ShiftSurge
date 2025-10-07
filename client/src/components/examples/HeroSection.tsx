import { HeroSection } from '../HeroSection';

export default function HeroSectionExample() {
  return (
    <HeroSection
      userType="worker"
      onGetStarted={() => console.log('Get started clicked')}
    />
  );
}
