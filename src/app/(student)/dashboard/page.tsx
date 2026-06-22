'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { CalendarPlus, Clock, Loader2, XCircle, Copy, QrCode } from "lucide-react";

// 🛠️ FIREBASE IMPORTS
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Confirmed: 'default',
  Pending: 'secondary',
  Completed: 'outline',
  Cancelled: 'destructive',
};

export default function StudentDashboard() {
  const [userName, setUserName] = useState<string>('Student');
  const [studentAppointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || 'Student');

        const q = query(
          collection(db, 'appointments'),
          where('studentId', '==', user.uid)
        );

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const appointmentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as any[];

          appointmentsData.sort((a, b) => new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime());
          setAppointments(appointmentsData);
          setIsLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setAppointments([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const appointmentRef = doc(db, 'appointments', appointmentId);
      await updateDoc(appointmentRef, {
        status: 'Cancelled'
      });
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been successfully removed from the queue.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error cancelling:", error);
      toast({
        title: "Error",
        description: "Could not cancel the appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `Appointment code ${code} copied to clipboard.`,
    });
  };

  const upcomingAppointments = useMemo(() => studentAppointments.filter(a => a.status === 'Confirmed' || a.status === 'Pending'), [studentAppointments]);
  const pastAppointments = useMemo(() => studentAppointments.filter(a => a.status === 'Completed' || a.status === 'Cancelled'), [studentAppointments]);

  return (
    <div className="grid flex-1 items-start gap-4 md:gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-headline tracking-tight">Welcome, {userName}</h1>
        <Button asChild>
          <Link href="/book-appointment"><CalendarPlus className="mr-2 h-4 w-4" /> Book New Appointment</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>Loading your appointments...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4 font-headline text-primary">Your Upcoming Schedule</h2>
            {upcomingAppointments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingAppointments.map(app => (
                  <Card key={app.id} className="border-l-4 border-l-primary shadow-md">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{app.serviceName}</CardTitle>
                        <Badge variant={statusColors[app.status]}>{app.status}</Badge>
                      </div>
                      <CardDescription>
                        {new Date(app.appointmentDateTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(app.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {app.appointmentCode && (
                        <div className={`rounded-md border p-3 ${app.status === 'Confirmed' ? 'bg-primary/5 border-primary/30' : 'bg-muted border-dashed'}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <QrCode className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground leading-none mb-1">
                                  {app.status === 'Confirmed' ? 'Check-in code' : 'Code (pending approval)'}
                                </p>
                                <p className="font-mono font-semibold text-sm tracking-wide truncate">
                                  {app.appointmentCode}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 flex-shrink-0"
                              onClick={() => handleCopyCode(app.appointmentCode)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          {app.status === 'Confirmed' && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Enter this code at the registrar kiosk to check in.
                            </p>
                          )}
                        </div>
                      )}

                      {app.status === 'Pending' && (
                        <div className="flex justify-end">
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleCancelAppointment(app.id)}>
                            <XCircle className="h-4 w-4 mr-1" /> Cancel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg bg-card/50">
                <p className="text-muted-foreground">You have no upcoming appointments.</p>
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 font-headline opacity-70">Past Appointment Records</h2>
            {pastAppointments.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pastAppointments.map(app => (
                      <Card key={app.id} className="bg-muted opacity-80">
                          <CardHeader>
                              <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg">{app.serviceName}</CardTitle>
                                  <Badge variant={statusColors[app.status] || 'outline'}>{app.status}</Badge>
                              </div>
                              <CardDescription>
                                  {new Date(app.appointmentDateTime).toLocaleDateString()}
                              </CardDescription>
                          </CardHeader>
                          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(app.appointmentDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </CardContent>
                      </Card>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-lg opacity-50">
                <p className="text-muted-foreground">No historical records available.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}