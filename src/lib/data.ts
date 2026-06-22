export type Appointment = {
  id: string;
  appointmentCode?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentIdNumber: string;
  contactNumber: string;
  serviceId: string;
  serviceName: 'SOG' | 'Prospectus Evaluation' | 'TOR';
  appointmentDateTime: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  documentUrl?: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  queueNumber?: string;
  createdAt: any; // Firestore ServerTimestamp
  updatedAt: any; // Firestore ServerTimestamp
};