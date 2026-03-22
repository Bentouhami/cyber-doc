'use client';

import { useCallback, useEffect, useState } from 'react';
import { Edit, Loader2, MoreHorizontal, Plus, Trash2, Users } from 'lucide-react';

import { EmployeeForm } from '@/components/admin/employee-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/hooks/use-locale';
import { EmployeeDTO } from '@/types/employees';
import { translateRoleName } from '@/utils/roles';

export default function EmployeesPage() {
  const { toast } = useToast();
  const { t, dir, isRTL } = useLocale();
  const cellAlignmentClass = isRTL ? 'text-right' : 'text-left';
  const actionAlignmentClass = isRTL ? 'text-left' : 'text-right';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeDTO[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users');

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || t('employees.fetchError'));
      }

      const data: EmployeeDTO[] = await res.json();
      setEmployees(data);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('employees.fetchError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (!response.ok) return;
        const currentUser: EmployeeDTO = await response.json();
        setCurrentUserId(currentUser.id);
      } catch {
        // noop
      }
    };
    loadCurrentUser();
  }, []);

  const mapEmployeeApiError = useCallback(
    (message: string) => {
      if (message.includes('cannot deactivate your own account')) {
        return t('employeeStatus.selfDeactivateBlocked');
      }
      if (message.includes('cannot delete your own account')) {
        return t('employeeStatus.selfDeleteBlocked');
      }
      if (message.includes('cannot remove your own admin role')) {
        return t('employeeStatus.selfRoleBlocked');
      }
      return message || t('employeeStatus.genericError');
    },
    [t],
  );

  const handleCreateSuccess = useCallback(() => {
    setIsCreateOpen(false);
    fetchEmployees();
  }, [fetchEmployees]);

  const handleEditSuccess = useCallback(() => {
    setIsEditOpen(false);
    setSelectedEmployee(null);
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCancelEdit = useCallback(() => {
    setIsEditOpen(false);
    setSelectedEmployee(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/users/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(mapEmployeeApiError(error));
      }

      const fullName = `${deleteTarget.firstName ?? ''} ${deleteTarget.lastName ?? ''}`.trim() || deleteTarget.email;
      toast({
        title: t('employees.delete.successTitle'),
        description: t('employees.delete.successDescription', { name: fullName }),
      });

      setDeleteTarget(null);
      fetchEmployees();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('employeeStatus.genericError'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, fetchEmployees, mapEmployeeApiError, t, toast]);

  const handleToggleStatus = useCallback(
    async (employee: EmployeeDTO, isActive: boolean) => {
      try {
        setIsTogglingStatus(true);
        const res = await fetch(`/api/users/${employee.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        });

        if (!res.ok) {
          const error = await res.text();
          throw new Error(mapEmployeeApiError(error));
        }

        toast({
          title: t('common.success'),
          description: isActive
            ? t('employeeStatus.activatedSuccess')
            : t('employeeStatus.deactivatedSuccess'),
        });
        fetchEmployees();
      } catch (error) {
        toast({
          title: t('common.error'),
          description: error instanceof Error ? error.message : t('employeeStatus.genericError'),
          variant: 'destructive',
        });
      } finally {
        setIsTogglingStatus(false);
      }
    },
    [fetchEmployees, mapEmployeeApiError, t, toast],
  );

  const filteredEmployees = employees.filter((employee) => {
    const isActive = !employee.deactivatedAt && !employee.deletedAt;
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const fullName = `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      fullName.includes(normalizedQuery) ||
      employee.email.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);

    return matchesQuery && matchesStatus;
  });

  const stats = {
    total: employees.length,
    active: employees.filter((employee) => !employee.deactivatedAt && !employee.deletedAt).length,
    inactive: employees.filter((employee) => Boolean(employee.deactivatedAt || employee.deletedAt)).length,
    admins: employees.filter((employee) => employee.roles.some((role) => role.name === 'admin')).length,
  };

  const adminEmployees = employees.filter((employee) => employee.roles.some((role) => role.name === 'admin'));
  const activeAdminCount = adminEmployees.filter((employee) => !employee.deactivatedAt && !employee.deletedAt).length;

  return (
    <div className="space-y-6" dir={dir}>
      <div className="rounded-2xl border border-border/70 bg-gradient-to-r from-slate-900 via-sky-900 to-teal-800 p-6 text-white shadow-lg shadow-slate-900/15 dark:from-slate-800 dark:via-sky-900 dark:to-teal-900">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
          <Users className="h-3.5 w-3.5" />
          {t('employees.managementBadge')}
        </div>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{t('employees.title')}</h1>
            <p className="mt-1 text-sm text-white/80">{t('employees.listTitle')}</p>
          </div>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <Plus className="mr-2 h-4 w-4" /> {t('employees.newEmployee')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('employees.createDialogTitle')}</DialogTitle>
            </DialogHeader>
            <EmployeeForm onSuccess={handleCreateSuccess} mode="create" />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{t('employees.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{t('employees.stats.total')}</p>
              <p className="text-lg font-semibold">{stats.total}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{t('employees.stats.active')}</p>
              <p className="text-lg font-semibold">{stats.active}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{t('employees.stats.inactive')}</p>
              <p className="text-lg font-semibold">{stats.inactive}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">{t('employees.stats.admins')}</p>
              <p className="text-lg font-semibold">{stats.admins}</p>
            </div>
          </div>
          <div className="mb-4 rounded-md border bg-muted/20 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">{t('employees.audit.title')}</p>
              {activeAdminCount <= 1 ? (
                <Badge variant="destructive">{t('employees.audit.riskSingleAdmin')}</Badge>
              ) : (
                <Badge variant="outline">{t('employees.audit.safeAdminCount', { count: activeAdminCount })}</Badge>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {adminEmployees.map((admin) => (
                <div key={admin.id} className="rounded border bg-background px-3 py-2 text-xs">
                  <p className="font-medium">{admin.displayName}</p>
                  <p className="text-muted-foreground">{admin.email}</p>
                  <p className="mt-1">
                    {!admin.deactivatedAt && !admin.deletedAt
                      ? t('employees.status.active')
                      : t('employees.status.inactive')}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t('employees.filters.search')}</p>
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t('employees.filters.search')}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{t('employees.filters.status')}</p>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
                <SelectTrigger aria-label={t('employees.filters.status')}>
                  <SelectValue placeholder={t('employees.filters.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('employees.filters.all')}</SelectItem>
                  <SelectItem value="active">{t('employees.filters.active')}</SelectItem>
                  <SelectItem value="inactive">{t('employees.filters.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={cellAlignmentClass}>{t('employees.columns.firstName')}</TableHead>
                <TableHead className={cellAlignmentClass}>{t('employees.columns.lastName')}</TableHead>
                <TableHead className={cellAlignmentClass}>{t('employees.columns.email')}</TableHead>
                <TableHead className={cellAlignmentClass}>{t('employees.columns.roles')}</TableHead>
                <TableHead className={cellAlignmentClass}>{t('employees.columns.status')}</TableHead>
                <TableHead className={actionAlignmentClass}>{t('employees.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label={t('employees.loading')} />
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length ? (
                filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className={cellAlignmentClass}>{employee.firstName ?? '—'}</TableCell>
                      <TableCell className={cellAlignmentClass}>{employee.lastName ?? '—'}</TableCell>
                      <TableCell className={cellAlignmentClass}>{employee.email}</TableCell>
                      <TableCell className={cellAlignmentClass}>
                        {employee.roles.length ? (
                          <div className="flex flex-wrap gap-2">
                            {employee.roles.map((role) => (
                              <Badge key={`${employee.id}-${role.id}`} variant="secondary">
                                {translateRoleName(role.name, t)}
                              </Badge>
                            ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">{t('employees.noRole')}</span>
                      )}
                    </TableCell>
                    <TableCell className={cellAlignmentClass}>
                      {!employee.deactivatedAt && !employee.deletedAt ? (
                        <Badge variant="default">{t('employees.status.active')}</Badge>
                      ) : (
                        <Badge variant="secondary">{t('employees.status.inactive')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className={actionAlignmentClass}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                          <DropdownMenuItem
                            onSelect={(event) => {
                              event.preventDefault();
                              setSelectedEmployee(employee);
                              setIsEditOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t('employees.menu.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={(event) => {
                              event.preventDefault();
                              if (currentUserId && currentUserId === employee.id) {
                                toast({
                                  title: t('common.error'),
                                  description: t('employeeStatus.selfDeleteBlocked'),
                                  variant: 'destructive',
                                });
                                return;
                              }
                              setDeleteTarget(employee);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                            {t('employees.menu.delete')}
                          </DropdownMenuItem>
                          {!employee.deactivatedAt && !employee.deletedAt ? (
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                if (currentUserId && currentUserId === employee.id) {
                                  toast({
                                    title: t('common.error'),
                                    description: t('employeeStatus.selfDeactivateBlocked'),
                                    variant: 'destructive',
                                  });
                                  return;
                                }
                                handleToggleStatus(employee, false);
                              }}
                              disabled={isTogglingStatus}
                            >
                              {t('employeeStatus.deactivate')}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onSelect={(event) => {
                                event.preventDefault();
                                handleToggleStatus(employee, true);
                              }}
                              disabled={isTogglingStatus}
                            >
                              {t('employeeStatus.activate')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {searchQuery || statusFilter !== 'all' ? t('employees.filters.empty') : t('employees.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setSelectedEmployee(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('employees.editDialogTitle')}</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            mode="edit"
            employee={selectedEmployee}
            currentUserId={currentUserId}
            onSuccess={handleEditSuccess}
            onCancel={handleCancelEdit}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('employees.delete.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('employees.delete.confirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {t('employees.delete.inProgress')}
                </>
              ) : (
                t('employees.delete.button')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
