import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
export const dynamic = 'force-dynamic';
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

// ADD THIS:
    if (appointmentData.checkedIn) {
      return NextResponse.json(
        { success: false, message: 'Already checked in.', queueNumber: appointmentData.queueNumber },
        { status: 409 }
      );
    }

    if (appointmentData.status !== 'Confirmed') {
      return NextResponse.json(
        { success: false, message: `Appointment status is "${appointmentData.status}", not confirmed.` },
        { status: 400 }
      );
    }

    const queueNumber = `Q-${Math.floor(1000 + Math.random() * 9000)}`;

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