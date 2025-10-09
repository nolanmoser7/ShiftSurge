import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminUsers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: usersData, isLoading } = useQuery({
    queryKey: searchQuery 
      ? [`/api/admin/users?q=${encodeURIComponent(searchQuery)}`]
      : ["/api/admin/users"],
  });

  const { data: userDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: [`/api/admin/users/${selectedUser?.id}`],
    enabled: !!selectedUser?.id && isDetailsOpen,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User updated",
        description: "User has been updated successfully",
      });
    },
  });

  const allUsers = Array.isArray(usersData) ? usersData : [];
  
  // Filter users based on selected role tab
  const users = roleFilter === "all" 
    ? allUsers 
    : allUsers.filter((user: any) => user.role === roleFilter);

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "restaurant":
        return "default";
      case "worker":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-users-title">User Management</h1>
        </div>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Search Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-base"
                  data-testid="input-search-users"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={roleFilter} onValueChange={setRoleFilter} className="space-y-4">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-lg sm:text-xl">Users</CardTitle>
                <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
                  <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
                  <TabsTrigger value="worker" data-testid="tab-worker">Worker</TabsTrigger>
                  <TabsTrigger value="restaurant" data-testid="tab-restaurant">Restaurant</TabsTrigger>
                  <TabsTrigger value="super_admin" data-testid="tab-superadmin">Admin</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground" data-testid="text-no-users">No users found</p>
                </div>
              ) : (
                <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {users.map((user: any) => (
                    <Card key={user.id} className="hover-elevate" data-testid={`row-user-${user.id}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate" data-testid={`text-user-email-${user.id}`}>
                                {user.email}
                              </p>
                              <p className="text-sm text-muted-foreground truncate" data-testid={`text-user-name-${user.id}`}>
                                {user.workerName || user.restaurantName || "-"}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                              data-testid={`button-view-user-${user.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={getRoleBadgeVariant(user.role)} data-testid={`badge-role-${user.id}`}>
                              {user.role}
                            </Badge>
                            {user.workerRole && (
                              <Badge variant="outline" className="text-xs" data-testid={`badge-worker-role-${user.id}`}>
                                {user.workerRole}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground" data-testid={`text-user-created-${user.id}`}>
                            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: any) => (
                        <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                          <TableCell className="font-medium" data-testid={`text-user-email-${user.id}`}>
                            {user.email}
                          </TableCell>
                          <TableCell data-testid={`text-user-name-${user.id}`}>
                            {user.workerName || user.restaurantName || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={getRoleBadgeVariant(user.role)} data-testid={`badge-role-${user.id}`}>
                                {user.role}
                              </Badge>
                              {user.workerRole && (
                                <Badge variant="outline" className="text-xs" data-testid={`badge-worker-role-${user.id}`}>
                                  {user.workerRole}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-user-created-${user.id}`}>
                            {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                              data-testid={`button-view-user-${user.id}`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        </Tabs>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md" data-testid="dialog-user-details">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl">User Details</DialogTitle>
            <DialogDescription className="text-sm">View user information and profile</DialogDescription>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">Loading user details...</p>
            </div>
          ) : userDetails ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Email</label>
                <p className="text-sm text-muted-foreground break-all" data-testid="text-detail-email">
                  {(userDetails as any).user.email}
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Role</label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getRoleBadgeVariant((userDetails as any).user.role)}>
                    {(userDetails as any).user.role}
                  </Badge>
                </div>
              </div>
              {(userDetails as any).profile && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Profile</label>
                  <div className="mt-2 space-y-2.5">
                    {(userDetails as any).profile.name && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="text-sm text-muted-foreground min-w-[100px]">Name:</span>
                        <span className="text-sm font-medium" data-testid="text-detail-profile-name">
                          {(userDetails as any).profile.name}
                        </span>
                      </div>
                    )}
                    {(userDetails as any).profile.workerRole && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="text-sm text-muted-foreground min-w-[100px]">Worker Role:</span>
                        <Badge variant="outline" className="text-xs w-fit" data-testid="text-detail-worker-role">
                          {(userDetails as any).profile.workerRole}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
