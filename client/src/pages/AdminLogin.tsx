import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield } from "lucide-react";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await apiRequest("POST", "/api/admin/login", { email, password });
      const data = await res.json();

      if (data.user) {
        toast({
          title: "Login successful",
          description: "Welcome back, admin.",
        });
        setLocation("/admin/dashboard");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 sm:space-y-3 pb-4 sm:pb-6">
          <div className="flex items-center justify-center mb-2 sm:mb-4">
            <div className="rounded-full bg-primary/10 p-2.5 sm:p-3">
              <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-primary" data-testid="icon-admin-shield" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl text-center leading-tight" data-testid="text-admin-login-title">
            Superadmin Login
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base" data-testid="text-admin-login-description">
            Secure access to platform administration
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@shiftsurge.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base"
                data-testid="input-admin-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-base"
                data-testid="input-admin-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full mt-6 text-base"
              disabled={isLoading}
              data-testid="button-admin-login"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
