import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Building2, Plus, Edit, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminOrganizations() {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [orgName, setOrgName] = useState("");

  const { data: orgsData, isLoading } = useQuery({
    queryKey: ["/api/admin/organizations"],
  });

  const createOrgMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/admin/organizations", { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setIsCreateOpen(false);
      setOrgName("");
      toast({
        title: "Organization created",
        description: "New organization has been created successfully",
      });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/organizations/${id}`, { name });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      setIsEditOpen(false);
      setSelectedOrg(null);
      setOrgName("");
      toast({
        title: "Organization updated",
        description: "Organization has been updated successfully",
      });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/organizations/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations"] });
      toast({
        title: "Organization deleted",
        description: "Organization has been deleted successfully",
      });
    },
  });

  const orgs = Array.isArray(orgsData) ? orgsData : [];

  const handleCreateOrg = () => {
    if (!orgName.trim()) return;
    createOrgMutation.mutate(orgName.trim());
  };

  const handleEditOrg = (org: any) => {
    setSelectedOrg(org);
    setOrgName(org.name);
    setIsEditOpen(true);
  };

  const handleUpdateOrg = () => {
    if (!orgName.trim() || !selectedOrg) return;
    updateOrgMutation.mutate({ id: selectedOrg.id, name: orgName.trim() });
  };

  const handleDeleteOrg = (org: any) => {
    if (confirm(`Are you sure you want to delete "${org.name}"?`)) {
      deleteOrgMutation.mutate(org.id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-organizations-title">
            Organization Management
          </h1>
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-organization">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Create Organization</span>
            <span className="sm:hidden">Create</span>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading organizations...</p>
              </div>
            ) : orgs.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground" data-testid="text-no-organizations">
                  No organizations found
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {orgs.map((org: any) => (
                    <Card key={org.id} className="hover-elevate" data-testid={`row-organization-${org.id}`}>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm" data-testid={`text-org-name-${org.id}`}>
                                {org.name}
                              </p>
                              {org.address && (
                                <p className="text-xs text-muted-foreground mt-1" data-testid={`text-org-address-${org.id}`}>
                                  {org.address}
                                </p>
                              )}
                            </div>
                          </div>
                          {org.restaurantUsers && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Restaurant Users</p>
                              <p className="text-xs truncate" data-testid={`text-org-users-${org.id}`}>
                                {org.restaurantUsers}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground" data-testid={`text-org-created-${org.id}`}>
                              {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                            </p>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditOrg(org)}
                                data-testid={`button-edit-org-${org.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOrg(org)}
                                disabled={deleteOrgMutation.isPending}
                                data-testid={`button-delete-org-${org.id}`}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
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
                        <TableHead>Name</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Restaurant Users</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orgs.map((org: any) => (
                        <TableRow key={org.id} data-testid={`row-organization-${org.id}`}>
                          <TableCell className="font-medium" data-testid={`text-org-name-${org.id}`}>
                            {org.name}
                          </TableCell>
                          <TableCell data-testid={`text-org-address-${org.id}`}>
                            {org.address || "-"}
                          </TableCell>
                          <TableCell data-testid={`text-org-users-${org.id}`}>
                            <div className="max-w-xs truncate">
                              {org.restaurantUsers || "No users"}
                            </div>
                          </TableCell>
                          <TableCell data-testid={`text-org-created-${org.id}`}>
                            {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditOrg(org)}
                                data-testid={`button-edit-org-${org.id}`}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteOrg(org)}
                                disabled={deleteOrgMutation.isPending}
                                data-testid={`button-delete-org-${org.id}`}
                              >
                                <Trash className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
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
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md" data-testid="dialog-create-organization">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl">Create Organization</DialogTitle>
            <DialogDescription className="text-sm">Add a new organization to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="org-name" className="text-sm font-medium">Organization Name</Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter organization name"
                className="text-base"
                data-testid="input-org-name"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setOrgName("");
              }}
              className="w-full sm:w-auto"
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrg}
              disabled={!orgName.trim() || createOrgMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-submit-create"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md" data-testid="dialog-edit-organization">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg sm:text-xl">Edit Organization</DialogTitle>
            <DialogDescription className="text-sm">Update organization details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-org-name" className="text-sm font-medium">Organization Name</Label>
              <Input
                id="edit-org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter organization name"
                className="text-base"
                data-testid="input-edit-org-name"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedOrg(null);
                setOrgName("");
              }}
              className="w-full sm:w-auto"
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateOrg}
              disabled={!orgName.trim() || updateOrgMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-submit-edit"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
