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
  const [actionFilter, setActionFilter] = useState("ALL");
  const [actorFilter, setActorFilter] = useState("");
  const limit = 50;
  const offset = (page - 1) * limit;

  // Build query string
  const params = new URLSearchParams();
  params.set("limit", limit.toString());
  params.set("offset", offset.toString());
  if (actionFilter !== "ALL") {
    params.set("action", actionFilter);
  }
  if (actorFilter) {
    params.set("actor", actorFilter);
  }

  const { data: logsData, isLoading } = useQuery({
    queryKey: [`/api/admin/audit-logs?${params.toString()}`],
  });

  const logs = (logsData as any)?.logs || [];
  const totalPages = Math.ceil(((logsData as any)?.total || 0) / limit);

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-audit-logs-title">Audit Logs</h1>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger data-testid="select-action-filter">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All actions</SelectItem>
                    <SelectItem value="PROMOTION_CREATED">Promotion Created</SelectItem>
                    <SelectItem value="PROMOTION_REDEEMED">Promotion Redeemed</SelectItem>
                    <SelectItem value="WORKER_ADDED">Worker Added</SelectItem>
                    <SelectItem value="RESTAURANT_ONBOARDED">Restaurant Onboarded</SelectItem>
                    <SelectItem value="CREATE_ORGANIZATION">Organization Created</SelectItem>
                    <SelectItem value="UPDATE_ORGANIZATION">Organization Updated</SelectItem>
                    <SelectItem value="DELETE_ORGANIZATION">Organization Deleted</SelectItem>
                    <SelectItem value="UPDATE_USER">User Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Actor (Email)</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter by admin email..."
                    value={actorFilter}
                    onChange={(e) => setActorFilter(e.target.value)}
                    className="pl-9 text-base"
                    data-testid="input-actor-filter"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-lg sm:text-xl">Activity Log</CardTitle>
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
                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {logs.map((log: any) => (
                    <Card key={log.id} className="hover-elevate" data-testid={`row-log-${log.id}`}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm" data-testid={`text-log-action-${log.id}`}>
                                {log.action}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5" data-testid={`text-log-actor-${log.id}`}>
                                {log.actor}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-nowrap" data-testid={`text-log-time-${log.id}`}>
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Subject</p>
                            <p className="text-xs break-words" data-testid={`text-log-subject-${log.id}`}>
                              {log.subject}
                            </p>
                          </div>
                          {log.details && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-1">Details</p>
                              <p className="text-xs break-words line-clamp-2" data-testid={`text-log-details-${log.id}`}>
                                {log.details}
                              </p>
                            </div>
                          )}
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
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
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
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mt-4 pt-3 border-t">
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
                      <ChevronLeft className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= totalPages}
                      data-testid="button-next-page"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4 sm:ml-1" />
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
