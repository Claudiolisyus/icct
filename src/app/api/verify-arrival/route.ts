import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, appointmentId } = body;

    if (!studentId || !appointmentId) {
      return NextResponse.json(
        { success: false, message: 'Missing student ID or appointment ID.' },
        { status: 400 }
      );
    }

    const snapshot = await adminDb
      .collection('appointments')
      .where('appointmentCode', '==', appointmentId)
      .where('customStudentIdNumber', '==', studentId)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, message: 'No matching appointment found.' },
        { status: 404 }
      );
    }

    const appointmentDoc = snapshot.docs[0];
    const appointmentData = appointmentDoc.data();

    if (appointmentData.status !== 'Confirmed') {
      return NextResponse.json(
        { success: false, message: `Appointment status is "${appointmentData.status}", not confirmed.` },
        { status: 400 }
      );
    }

    // Atomically increment a daily counter to generate a sequential queue number
    const today = new Date().toISOString().split('T')[0]; // e.g. "2026-06-22"
    const counterRef = adminDb.collection('queueCounters').doc(today);

    const queueNumber = await adminDb.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      const currentCount = counterDoc.exists ? counterDoc.data()?.count || 0 : 0;
      const nextCount = currentCount + 1;

      transaction.set(counterRef, { count: nextCount }, { merge: true });

      return `Q-${String(nextCount).padStart(4, '0')}`;
    });

    await appointmentDoc.ref.update({
      checkedIn: true,
      checkedInAt: new Date().toISOString(),
      queueNumber,
    });

    return NextResponse.json({ success: true, queueNumber });
  } catch (error: any) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error during check-in.' },
      { status: 500 }
    );
  }
}