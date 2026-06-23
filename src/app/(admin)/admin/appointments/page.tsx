'use client';

import { useEffect, useState } from "react"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Appointment } from "@/lib/data"

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<'active' | 'archived'>('active');

  useEffect(() => {
    const q = query(collection(db, 'appointments'), orderBy('appointmentDateTime', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Appointment[];
        setAppointments(data);
        setIsLoading(false);
      },
      (err) => {
        if (err.code !== 'permission-denied') {
          console.error('Failed to load appointments:', err);
          setError('Error loading appointments. Please try again later.');
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // ✅ AUTOMATIC FILTER: Route rows automatically based on status
  const displayedAppointments = appointments.filter((appt) => {
    const isPastOrEnded = appt.status === 'Completed' || appt.status === 'Cancelled';
    return currentTab === 'active' ? !isPastOrEnded : isPastOrEnded;
  });

  const activeCount = appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled').length;
  const archivedCount = appointments.filter(a => a.status === 'Completed' || a.status === 'Cancelled').length;

  if (error) {
    return <div className="p-4">{error}</div>
  }

  return (
    <div className="container mx-auto py-2 space-y-4">
      {/* View Switcher Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setCurrentTab('active')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            currentTab === 'active'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Active Appointments ({activeCount})
        </button>
        <button
          onClick={() => setCurrentTab('archived')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
            currentTab === 'archived'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Archived ({archivedCount})
        </button>
      </div>

      <DataTable columns={columns} data={displayedAppointments} isLoading={isLoading} />
    </div>
  )
}