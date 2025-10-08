import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminAuditLogs() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const limit = 50;

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["/api/admin/audit-logs", { page, limit, action: actionFilter, actor: actorFilter }],
  });

  const logs = (logsData as any)?.logs || [];
  const totalPages = Math.ceil(((logsData as any)?.total || 0) / limit);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold" data-testid="text-audit-logs-title">Audit Logs</h1>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Action</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger data-testid="select-action-filter">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    <SelectItem value="user_updated">User Updated</SelectItem>
                    <SelectItem value="user_created">User Created</SelectItem>
                    <SelectItem value="org_created">Organization Created</SelectItem>
                    <SelectItem value="org_updated">Organization Updated</SelectItem>
                    <SelectItem value="org_deleted">Organization Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Actor (Email)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter by admin email..."
                    value={actorFilter}
                    onChange={(e) => setActorFilter(e.target.value)}
                    className="pl-9"
                    data-testid="input-actor-filter"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading audit logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground" data-testid="text-no-logs">No audit logs found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log: any) => (
                      <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                        <TableCell data-testid={`text-log-time-${log.id}`}>
                          {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-log-action-${log.id}`}>
                          {log.action}
                        </TableCell>
                        <TableCell data-testid={`text-log-actor-${log.id}`}>
                          {log.actor}
                        </TableCell>
                        <TableCell data-testid={`text-log-subject-${log.id}`}>
                          {log.subject}
                        </TableCell>
                        <TableCell className="max-w-md truncate" data-testid={`text-log-details-${log.id}`}>
                          {log.details}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground" data-testid="text-pagination-info">
                    Page {page} of {totalPages || 1}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
