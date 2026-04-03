'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageSpinner } from '@/components/ui/Spinner';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import api from '@/lib/api';
import { User } from '@/types';
import { Users, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const roleVariant: Record<string, 'cyan' | 'purple' | 'green'> = {
  admin: 'purple',
  student: 'cyan',
  client: 'green',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data } = await api.get('/admin/users');
        setUsers(data.data || []);
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter !== 'all') result = result.filter((u) => u.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return result;
  }, [users, roleFilter, search]);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-text-muted mt-1">Manage platform users</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-navy-900 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan/50"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-navy-900 border border-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan/50"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="client">Clients</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filters" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} src={user.avatar} size="sm" />
                    <span className="font-medium text-white">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={roleVariant[user.role] || 'default'}>{user.role}</Badge>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
