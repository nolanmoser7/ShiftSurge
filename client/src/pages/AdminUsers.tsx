import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Eye, ShieldCheck, Key } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminUsers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [editRole, setEditRole] = useState<string>("");
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const { data: usersData, isLoading } = useQuery({
    queryKey: searchQuery 
      ? [`/api/admin/users?q=${encodeURIComponent(searchQuery)}`]
      : ["/api/admin/users"],
  });

  const { data: userDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: [`/api/admin/users/${selectedUser?.id}`],
    enabled: !!selectedUser?.id && isDetailsOpen,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/reset-password`, { newPassword });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
      
      return data;
    },
    onSuccess: () => {
      setShowPasswordReset(false);
      setNewPassword("");
      toast({
        title: "Password reset",
        description: "User password has been reset successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, updates);
      const data = await res.json();
      
      if (!res.ok) {
        const error: any = new Error(data.error || "Failed to update user");
        error.status = res.status;
        error.data = data;
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${selectedUser?.id}`] });
      setIsDetailsOpen(false);
      setSelectedUser(null);
      toast({
        title: "User updated",
        description: "User has been updated successfully",
      });
    },
    onError: (error: any) => {
      if (error?.status === 409 && error?.data?.partialSuccess && error?.data?.user) {
        // Partial success - update local state with actual database values
        const actualUser = error.data.user;
        
        // Update all state to reflect actual database values
        setSelectedUser((prev: any) => ({
          ...prev,
          role: actualUser.role,
          isActive: actualUser.isActive ?? true,
        }));
        setEditRole(actualUser.role);
        setEditIsActive(actualUser.isActive ?? true);
        
        // Invalidate queries to refresh lists
        queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
        queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${selectedUser?.id}`] });
        
        toast({
          title: "Partial update",
          description: error.data.error || "Some changes were saved, but others could not be applied. Please try again later.",
        });
      } else {
        toast({
          title: "Update failed",
          description: error?.message || "Failed to update user",
          variant: "destructive",
        });
      }
    },
  });

  const allUsers = Array.isArray(usersData) ? usersData : [];
  
  // Filter users based on selected role tab
  const users = roleFilter === "all" 
    ? allUsers 
    : allUsers.filter((user: any) => user.role === roleFilter);

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setEditRole(user.role);
    setEditIsActive(user.isActive ?? true);
    setShowPasswordReset(false);
    setNewPassword("");
    setIsDetailsOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    
    const updates: any = {};
    if (editRole !== selectedUser.role) {
      updates.role = editRole;
    }
    if (editIsActive !== (selectedUser.isActive ?? true)) {
      updates.isActive = editIsActive;
    }

    if (Object.keys(updates).length === 0) {
      toast({
        title: "No changes",
        description: "No changes were made to the user",
      });
      return;
    }

    updateUserMutation.mutate({ userId: selectedUser.id, updates });
  };

  const handleResetPassword = () => {
    if (!selectedUser || !newPassword.trim()) {
      toast({
        title: "Invalid password",
        description: "Please enter a new password",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({ userId: selectedUser.id, newPassword });
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
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate" data-testid={`text-user-email-${user.id}`}>
                                  {user.email}
                                </p>
                                {user.isActive === false && (
                                  <Badge variant="outline" className="text-xs">Inactive</Badge>
                                )}
                              </div>
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
                            <div className="flex items-center gap-2">
                              {user.email}
                              {user.isActive === false && (
                                <Badge variant="outline" className="text-xs">Inactive</Badge>
                              )}
                            </div>
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
            <DialogTitle className="text-lg sm:text-xl">Manage User</DialogTitle>
            <DialogDescription className="text-sm">View and update user settings</DialogDescription>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">Loading user details...</p>
            </div>
          ) : userDetails ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground break-all" data-testid="text-detail-email">
                  {(userDetails as any).user.email}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger data-testid="select-edit-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">Worker</SelectItem>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="super_admin">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Super Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Active Status</Label>
                  <p className="text-xs text-muted-foreground">
                    {editIsActive ? "User can log in" : "User is deactivated"}
                  </p>
                </div>
                <Switch
                  checked={editIsActive}
                  onCheckedChange={setEditIsActive}
                  data-testid="switch-is-active"
                />
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Password Reset</Label>
                  {!showPasswordReset && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPasswordReset(true)}
                      data-testid="button-show-password-reset"
                    >
                      <Key className="h-3.5 w-3.5 mr-1.5" />
                      Reset Password
                    </Button>
                  )}
                </div>
                {showPasswordReset && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        data-testid="input-new-password"
                      />
                      <p className="text-xs text-muted-foreground">
                        Minimum 6 characters required
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowPasswordReset(false);
                          setNewPassword("");
                        }}
                        disabled={resetPasswordMutation.isPending}
                        data-testid="button-cancel-password-reset"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleResetPassword}
                        disabled={resetPasswordMutation.isPending || !newPassword.trim()}
                        data-testid="button-confirm-password-reset"
                      >
                        {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {(userDetails as any).profile && (
                <div className="space-y-1.5 pt-2 border-t">
                  <Label className="text-sm font-medium">Profile Information</Label>
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
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDetailsOpen(false)}
              className="w-full sm:w-auto"
              data-testid="button-cancel-edit-user"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              disabled={updateUserMutation.isPending || isLoadingDetails}
              className="w-full sm:w-auto"
              data-testid="button-save-user"
            >
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
