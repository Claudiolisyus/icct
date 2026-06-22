'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert, ShieldCheck, MoreVertical, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type AppUser = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  studentId?: string;
  status?: string;
};

const rolePermissions: { [key: string]: string[] } = {
  admin: ['Full Access', 'User Management'],
  registrar: ['Manage Appointments', 'Approve Records'],
  student: ['Book Appointments', 'View Own Records'],
};

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as AppUser[];
        setUsers(data);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load users:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load users.',
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      toast({
        title: 'Role Updated',
        description: `User role changed to ${newRole}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not change role.',
      });
    }
  };

  const handleRevokeAccess = async (userId: string, userName?: string) => {
    if (!confirm(`Revoke access for ${userName || 'this user'}? This will delete their profile record.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      toast({
        title: 'Access Revoked',
        description: `${userName || 'User'}'s profile has been removed.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Action Failed',
        description: error.message || 'Could not revoke access.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-headline">Users & Permissions</h2>
          <p className="text-muted-foreground">Manage user roles and system access levels.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>A list of all users registered in the system and their access levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage data-ai-hint="person portrait" src={`https://picsum.photos/seed/${user.id}/40/40`} />
                          <AvatarFallback>{user.name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || 'Unnamed User'}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : user.role === 'registrar' ? 'secondary' : 'outline'}>
                        {user.role || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.studentId || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(rolePermissions[user.role || ''] || ['Unknown']).map((p) => (
                          <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-muted border">
                            {p}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage Access</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'admin')}>
                            Set as Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'registrar')}>
                            Set as Registrar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'student')}>
                            Set as Student
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRevokeAccess(user.id, user.name)}
                          >
                            Revoke Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Role Definition</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Administrator</h4>
              <p className="text-xs text-muted-foreground">Complete control over the system, including user management and system settings.</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Registrar</h4>
              <p className="text-xs text-muted-foreground">Can manage appointments, view all student records, and generate reports.</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Student</h4>
              <p className="text-xs text-muted-foreground">Limited access to book their own appointments and view their own history.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <CardTitle>Security Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-2 list-disc pl-4 text-muted-foreground">
              <li>All internal user actions are logged.</li>
              <li>Multi-factor authentication (MFA) is recommended for all staff.</li>
              <li>Passwords must be updated every 90 days.</li>
              <li>Session timeout is currently set to 30 minutes of inactivity.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}