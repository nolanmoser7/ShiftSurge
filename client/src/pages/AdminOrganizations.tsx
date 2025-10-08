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

  const orgs = (orgsData as any)?.organizations || [];

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold" data-testid="text-organizations-title">
            Organization Management
          </h1>
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-organization">
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
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
                      <TableCell data-testid={`text-org-created-${org.id}`}>
                        {formatDistanceToNow(new Date(org.created_at), { addSuffix: true })}
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
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent data-testid="dialog-create-organization">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>Add a new organization to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter organization name"
                data-testid="input-org-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setOrgName("");
              }}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrg}
              disabled={!orgName.trim() || createOrgMutation.isPending}
              data-testid="button-submit-create"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent data-testid="dialog-edit-organization">
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>Update organization details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-org-name">Organization Name</Label>
              <Input
                id="edit-org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter organization name"
                data-testid="input-edit-org-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedOrg(null);
                setOrgName("");
              }}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateOrg}
              disabled={!orgName.trim() || updateOrgMutation.isPending}
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
