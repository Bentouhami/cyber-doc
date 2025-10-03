
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { RoleDTO } from '@/types/employees';

const formSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  roleId: z.string(),
});

export function EmployeeForm({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleDTO[]>([]);

  useEffect(() => {
    async function fetchRoles() {
      const res = await fetch('/api/roles');
      const data = await res.json();
      setRoles(data);
    }
    fetchRoles();
  }, []);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      roleId: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    if (res.ok) {
      toast({ title: 'Employé créé avec succès' });
      setOpen(false);
      // You might want to trigger a refresh of the employee list here
    } else {
      const error = await res.text();
      toast({ title: 'Erreur', description: error, variant: 'destructive' });
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="firstName">Prénom</Label>
        <Input id="firstName" {...form.register('firstName')} />
        {form.formState.errors.firstName && <p className="text-red-500 text-sm">{form.formState.errors.firstName.message}</p>}
      </div>
      <div>
        <Label htmlFor="lastName">Nom</Label>
        <Input id="lastName" {...form.register('lastName')} />
        {form.formState.errors.lastName && <p className="text-red-500 text-sm">{form.formState.errors.lastName.message}</p>}
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register('email')} />
        {form.formState.errors.email && <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">Mot de passe</Label>
        <Input id="password" type="password" {...form.register('password')} />
        {form.formState.errors.password && <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>}
      </div>
      <div>
        <Label htmlFor="roleId">Rôle</Label>
        <Select onValueChange={(value) => form.setValue('roleId', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un rôle" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((role) => (
              <SelectItem key={role.id} value={String(role.id)}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.roleId && <p className="text-red-500 text-sm">{form.formState.errors.roleId.message}</p>}
      </div>
      <Button type="submit">Créer l&apos;employé</Button>
    </form>
  );
}
