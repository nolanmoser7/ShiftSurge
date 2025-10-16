import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import WorkerFeed from "@/pages/WorkerFeed";
import RestaurantDashboard from "@/pages/RestaurantDashboard";
import RestaurantWizard from "@/pages/RestaurantWizard";
import SignupWithInvite from "@/pages/SignupWithInvite";
import WorkerSignupWithInvite from "@/pages/WorkerSignupWithInvite";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminOrganizations from "@/pages/AdminOrganizations";
import AdminAuditLogs from "@/pages/AdminAuditLogs";

function WizardCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();

  const { data: wizardStatus, isLoading: wizardLoading } = useQuery({
    queryKey: ["/api/restaurant/wizard-status"],
    enabled: !!user && user.role === "restaurant",
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !wizardLoading && user?.role === "restaurant" && (wizardStatus as any)?.needsWizard && location !== "/restaurant/wizard") {
      setLocation("/restaurant/wizard");
    }
  }, [user, wizardStatus, authLoading, wizardLoading, location, setLocation]);

  return <>{children}</>;
}

function AdminRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    setLocation("/admin/dashboard");
  }, [setLocation]);
  
  return null;
}

function Router() {
  return (
    <WizardCheck>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/signup" component={SignupWithInvite} />
        <Route path="/worker-signup" component={WorkerSignupWithInvite} />
        <Route path="/worker-feed" component={WorkerFeed} />
        <Route path="/restaurant-dashboard" component={RestaurantDashboard} />
        <Route path="/restaurant/wizard" component={RestaurantWizard} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={AdminRedirect} />
        <Route path="/superadmin" component={AdminRedirect} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/organizations" component={AdminOrganizations} />
        <Route path="/admin/audit-logs" component={AdminAuditLogs} />
        <Route component={NotFound} />
      </Switch>
    </WizardCheck>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
