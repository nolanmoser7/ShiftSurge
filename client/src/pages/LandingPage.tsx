import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowRight, Zap, Users, BarChart3, Smartphone } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/LoginForm";
import { SignupForm } from "@/components/SignupForm";
import { useAuth } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import workersImage from '@assets/generated_images/Happy_service_workers_celebrating_90fd3651.png';
import kitchenImage from '@assets/generated_images/Busy_restaurant_kitchen_scene_387a1353.png';

export default function LandingPage() {
  const [authDialog, setAuthDialog] = useState(false);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleAuthSuccess = async () => {
    setAuthDialog(false);
    // Re-fetch user data to ensure we have the latest role
    const userData = await queryClient.fetchQuery({ queryKey: ["/api/auth/me"] });
    const userRole = (userData as any)?.user?.role;
    if (userRole === "worker") {
      setLocation("/worker-feed");
    } else if (userRole === "restaurant") {
      setLocation("/restaurant-dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Shift Surge</h1>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href={user.role === "worker" ? "/worker-feed" : "/restaurant-dashboard"}>
                <Button data-testid="button-dashboard">Dashboard</Button>
              </Link>
            ) : (
              <Button onClick={() => setAuthDialog(true)} data-testid="button-login">
                Login / Sign Up
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-chart-1 to-chart-2" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6">
            Connect Workers with
            <br />
            Restaurant Deals
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
            A platform bridging restaurants and service-industry workers through
            targeted, real-time promotions.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              onClick={() => setAuthDialog(true)}
              className="bg-white text-primary hover:bg-white/90 border-white text-lg"
              data-testid="button-get-started"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, fast, and designed for the hospitality industry
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <img
                src={workersImage}
                alt="Service workers"
                className="rounded-lg shadow-lg"
              />
            </div>
            <div className="space-y-6">
              <h3 className="text-3xl font-display font-bold">For Workers</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-6 w-6 text-chart-2" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Browse Exclusive Deals</h4>
                    <p className="text-muted-foreground">
                      Access real-time promotions from restaurants in your area
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-chart-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Instant Claim & Redeem</h4>
                    <p className="text-muted-foreground">
                      One-tap claiming with QR code redemption at the venue
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Industry Verified</h4>
                    <p className="text-muted-foreground">
                      Exclusive perks for verified service-industry workers
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 order-2 md:order-1">
              <h3 className="text-3xl font-display font-bold">For Restaurants</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Create Targeted Promotions</h4>
                    <p className="text-muted-foreground">
                      Schedule and manage offers with audience targeting
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-chart-3/10 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="h-6 w-6 text-chart-3" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Track Performance</h4>
                    <p className="text-muted-foreground">
                      Real-time analytics on impressions, claims, and redemptions
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-lg bg-chart-2/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-chart-2" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Build Community</h4>
                    <p className="text-muted-foreground">
                      Connect with service workers and fill tables during slow hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <img
                src={kitchenImage}
                alt="Restaurant kitchen"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-display font-bold mb-4">Key Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need for a seamless promotion platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8">
              <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6">
                <Smartphone className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">PWA Ready</h3>
              <p className="text-muted-foreground">
                Install on mobile devices, work offline, and receive push notifications
                for new deals.
              </p>
            </Card>

            <Card className="p-8">
              <div className="h-14 w-14 rounded-lg bg-chart-3/10 flex items-center justify-center mb-6">
                <Zap className="h-7 w-7 text-chart-3" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Updates</h3>
              <p className="text-muted-foreground">
                Live promotion feeds with instant claim notifications and redemption
                tracking.
              </p>
            </Card>

            <Card className="p-8">
              <div className="h-14 w-14 rounded-lg bg-chart-2/10 flex items-center justify-center mb-6">
                <BarChart3 className="h-7 w-7 text-chart-2" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Analytics Dashboard</h3>
              <p className="text-muted-foreground">
                Comprehensive metrics tracking impressions, claims, redemptions, and ROI.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of workers and restaurants already using Shift Surge
          </p>
          <Button
            size="lg"
            onClick={() => setAuthDialog(true)}
            className="bg-white text-primary hover:bg-white/90 text-lg"
            data-testid="button-cta"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <p className="font-display font-semibold text-foreground text-lg mb-2">
              Shift Surge
            </p>
            <p className="text-sm">
              Connecting restaurants with service-industry workers through targeted
              promotions
            </p>
          </div>
        </div>
      </footer>

      <Dialog open={authDialog} onOpenChange={setAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to Shift Surge</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
              <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm onSuccess={handleAuthSuccess} />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm onSuccess={handleAuthSuccess} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
