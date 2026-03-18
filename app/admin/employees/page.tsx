'use client';

import { useCallback, useEffect, useState } from 'react';
import { Edit, Loader2, MoreHorizontal, Plus, Trash2 } from 'lucide-react';

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
        throw new Error(error || t('employeeForm.errors.generic'));
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
        description: error instanceof Error ? error.message : t('employeeForm.errors.generic'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, fetchEmployees, t, toast]);

  return (
    <div className="space-y-6" dir={dir}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('employees.title')}</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
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

      <Card>
        <CardHeader>
          <CardTitle>{t('employees.listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={cellAlignmentClass}>{t('employees.columns.firstName')}</TableHead>
                <TableHead className={cellAlignmentClass}>{t('employees.columns.lastName')}</TableHead>
                <TableHead className={cellAlignmentClass}>{t('employees.columns.email')}</TableHead>
                <TableHead className={cellAlignmentClass}>{t('employees.columns.roles')}</TableHead>
                <TableHead className={actionAlignmentClass}>{t('employees.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" aria-label={t('employees.loading')} />
                  </TableCell>
                </TableRow>
              ) : employees.length ? (
                employees.map((employee) => (
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
                              setDeleteTarget(employee);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                            {t('employees.menu.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {t('employees.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
