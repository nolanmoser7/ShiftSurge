import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import WorkerFeed from "@/pages/WorkerFeed";
import RestaurantDashboard from "@/pages/RestaurantDashboard";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminOrganizations from "@/pages/AdminOrganizations";
import AdminAuditLogs from "@/pages/AdminAuditLogs";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/worker-feed" component={WorkerFeed} />
      <Route path="/restaurant-dashboard" component={RestaurantDashboard} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/organizations" component={AdminOrganizations} />
      <Route path="/admin/audit-logs" component={AdminAuditLogs} />
      <Route component={NotFound} />
    </Switch>
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
