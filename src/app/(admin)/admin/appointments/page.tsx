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

  if (error) {
    return <div className="p-4">{error}</div>
  }

  return (
    <div className="container mx-auto py-2">
      <DataTable columns={columns} data={appointments} isLoading={isLoading} />
    </div>
  )
}