'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, ShieldCheck } from 'lucide-react';
import { api, type ApiError } from '@/lib/api';
import { Button, Card, Input, cx } from '@/components/ui/primitives';

interface Role {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
  assignmentCount: number;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED';
  isTenantOwner: boolean;
  assignments: Array<{ id: string; role: { code: string; name: string } }>;
}

const STATUS_STYLE: Record<User['status'], string> = {
  ACTIVE: 'bg-success/10 text-success',
  INVITED: 'bg-warning/10 text-warning',
  SUSPENDED: 'bg-destructive/10 text-destructive',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [inviting, setInviting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    api<{ data: User[] }>('/users?limit=200').then((r) => setUsers(r.data)).catch(() => undefined);
    api<Role[]>('/roles').then(setRoles).catch(() => undefined);
  }, []);

  useEffect(refresh, [refresh]);

  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const user = await api<User>('/users', {
        method: 'POST',
        body: JSON.stringify({
          email: String(form.get('email')),
          firstName: String(form.get('firstName')),
          password: String(form.get('password')) || undefined,
          posPin: String(form.get('posPin')) || undefined,
        }),
      });
      const roleId = String(form.get('roleId'));
      if (roleId) {
        await api(`/users/${user.id}/assignments`, {
          method: 'POST',
          body: JSON.stringify({ roleId, scopeType: 'TENANT' }),
        });
      }
      setInviting(false);
      refresh();
    } catch (err) {
      setError(((err as { api?: ApiError }).api?.message as string) ?? 'Failed to create user');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Team</h1>
          <p className="mt-1 text-sm text-muted">
            Staff accounts and role-based access, from owner to waiter.
          </p>
        </div>
        <Button size="sm" onClick={() => setInviting(true)}>
          <Plus className="h-4 w-4" /> Add member
        </Button>
      </div>

      {inviting && (
        <Card>
          <h2 className="mb-4 text-sm font-semibold">New team member</h2>
          <form onSubmit={invite} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input name="firstName" label="First name" required maxLength={80} />
            <Input name="email" label="Email" type="email" required />
            <Input
              name="password"
              label="Password (blank = invite)"
              type="password"
              minLength={10}
              placeholder="Min 10 chars, letters + digits"
            />
            <Input name="posPin" label="POS PIN (optional)" pattern="\d{4,6}" placeholder="4–6 digits" />
            <div className="space-y-1.5">
              <label htmlFor="roleId" className="block text-[13px] font-medium">Role</label>
              <select
                id="roleId"
                name="roleId"
                required
                className="h-9 w-full rounded-control border border-border bg-surface px-3 text-sm"
              >
                {roles
                  .filter((r) => r.code !== 'owner')
                  .map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
              </select>
            </div>
            {error && <p className="col-span-full text-[13px] text-destructive">{error}</p>}
            <div className="col-span-full flex gap-2">
              <Button type="submit" loading={busy}>Add member</Button>
              <Button type="button" variant="ghost" onClick={() => setInviting(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[12px] uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-medium">Member</th>
              <th className="px-5 py-3 font-medium">Roles</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-accent/50">
                <td className="px-5 py-3">
                  <p className="font-medium">
                    {user.firstName} {user.lastName ?? ''}
                    {user.isTenantOwner && (
                      <ShieldCheck className="ml-1.5 inline h-3.5 w-3.5 text-primary" aria-label="Tenant owner" />
                    )}
                  </p>
                  <p className="text-[12px] text-muted">{user.email}</p>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.assignments.map((a) => (
                      <span key={a.id} className="rounded-full bg-accent px-2 py-0.5 text-[12px]">
                        {a.role.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={cx('rounded-full px-2 py-0.5 text-[12px] font-medium', STATUS_STYLE[user.status])}>
                    {user.status.toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold">Roles</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div key={role.id} className="rounded-control border border-border px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-medium">{role.name}</p>
                {role.isSystem && <span className="text-[11px] text-muted">system</span>}
              </div>
              <p className="tnum text-[12px] text-muted">{role.assignmentCount} member(s)</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
