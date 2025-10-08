import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  LogOut,
  Shield,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  role: string;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  // Check admin authentication
  const { data: adminData, isLoading } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !adminData) {
      setLocation("/admin/login");
    }
  }, [adminData, isLoading, setLocation]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/logout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/admin/login");
      toast({
        title: "Logged out",
        description: "Admin session ended",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!adminData) {
    return null;
  }

  const adminUser = (adminData as any).user as AdminUser;

  const menuItems = [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: Users,
    },
    {
      title: "Organizations",
      url: "/admin/organizations",
      icon: Building2,
    },
    {
      title: "Audit Logs",
      url: "/admin/audit-logs",
      icon: FileText,
    },
  ];

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar data-testid="sidebar-admin">
          <SidebarContent>
            <SidebarGroup>
              <div className="px-4 py-4 border-b">
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" data-testid="icon-admin-logo" />
                  <div>
                    <h2 className="font-semibold text-sm" data-testid="text-admin-title">Admin Panel</h2>
                    <p className="text-xs text-muted-foreground" data-testid="text-admin-email">{adminUser.email}</p>
                  </div>
                </div>
              </div>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url} data-testid={`link-admin-${item.title.toLowerCase().replace(' ', '-')}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  data-testid="button-admin-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
