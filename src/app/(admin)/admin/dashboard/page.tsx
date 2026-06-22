'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  Users,
  CheckCircle2,
} from 'lucide-react';
import type { Appointment } from '@/lib/data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Confirmed: 'default',
  Pending: 'secondary',
  Completed: 'outline',
  Cancelled: 'destructive',
};

export default function DashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'appointments'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];
        setAppointments(data);
        setIsLoading(false);
      },
      (error) => {
        if (error.code !== 'permission-denied') {
          console.error('Failed to load appointments:', error);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'Completed',
      });
      toast({
        title: 'Appointment Completed',
        description: 'This appointment has been marked as finished.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not mark appointment as completed.',
      });
    }
  };

  const upcomingAppointments = useMemo(() => {
    return [...appointments]
      .filter((a) => a.status === 'Pending' || a.status === 'Confirmed')
      .sort((a, b) => new Date(a.appointmentDateTime).getTime() - new Date(b.appointmentDateTime).getTime())
      .slice(0, 5);
  }, [appointments]);

  const totalAppointments = appointments.length;
  const pendingAppointments = appointments.filter(a => a.status === 'Pending').length;
  const completedTotal = appointments.filter(a => a.status === 'Completed').length;
  const checkedInToday = appointments.filter(a => (a as any).checkedIn === true).length;

  const uniqueStudents = useMemo(() => {
    const studentIds = new Set(appointments.map(a => a.studentId));
    return studentIds.size;
  }, [appointments]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Appointments
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalAppointments}</div>
            )}
            <p className="text-xs text-muted-foreground">total bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{pendingAppointments}</div>
            )}
            <p className="text-xs text-muted-foreground">awaiting confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Checked In
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{checkedInToday}</div>
            )}
            <p className="text-xs text-muted-foreground">via kiosk</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Total
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{completedTotal}</div>
            )}
            <p className="text-xs text-muted-foreground">
              successful visits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{uniqueStudents}</div>
            )}
            <p className="text-xs text-muted-foreground">
              total student count
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Appointments</CardTitle>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/appointments">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment: any) => (
                  <TableRow key={appointment.id} className={appointment.checkedIn ? 'bg-green-50/50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            data-ai-hint="person portrait"
                            src={`https://picsum.photos/seed/${appointment.studentId}/40/40`}
                            alt={appointment.studentName}
                          />
                          <AvatarFallback>
                            {appointment.studentName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {appointment.studentName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.studentEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{appointment.serviceName}</TableCell>
                    <TableCell>
                      {new Date(appointment.appointmentDateTime).toLocaleDateString()} at {new Date(appointment.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[appointment.status]}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {appointment.checkedIn ? (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <div>
                            <span className="text-xs font-medium block leading-none">Checked in</span>
                            {appointment.queueNumber && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {appointment.queueNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not arrived</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {appointment.checkedIn && appointment.status !== 'Completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteAppointment(appointment.id)}
                        >
                          Finish
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No upcoming appointments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}