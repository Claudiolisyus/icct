'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Upload, X, FileText, Loader2 } from 'lucide-react';

import { db, auth } from '@/lib/firebase'; 
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
];

function generateAppointmentCode(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `APPT-${mm}${dd}-${randomSuffix}`;
}

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash' },
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'credit_debit_card', label: 'Credit / Debit Card' },
];

export default function BookAppointmentPage() {
  const [service, setService] = useState<string>('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>('');
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentMode, setPaymentMode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !date || !time || !name || !studentId || !email || !contactNumber) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all required fields.',
      });
      return;
    }

    if (service === 'SOG' && !paymentMode) {
      toast({
        variant: 'destructive',
        title: 'Missing Payment Mode',
        description: 'Please select a mode of payment for SOG.',
      });
      return;
    }

    setIsLoading(true);

    const currentUser = auth.currentUser;

    if (!currentUser) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be signed in to submit an appointment request.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const appointmentsCollectionRef = collection(db, 'appointments');
      const newAppointmentDocRef = doc(appointmentsCollectionRef);

      const combinedDateTime = new Date(date || new Date());
      const [timeStr, modifier] = time.split(' ');
      let [hoursStr, minutesStr] = timeStr.split(':');
      let parsedHours = parseInt(hoursStr, 10);

      if (modifier === 'PM' && parsedHours < 12) parsedHours += 12;
      if (modifier === 'AM' && parsedHours === 12) parsedHours = 0;

      combinedDateTime.setHours(parsedHours, parseInt(minutesStr, 10), 0, 0);

      const appointmentCode = generateAppointmentCode();

      await setDoc(newAppointmentDocRef, {
        id: newAppointmentDocRef.id,
        appointmentCode,
        studentId: currentUser.uid,
        customStudentIdNumber: studentId,
        studentName: name,
        studentEmail: email,
        contactNumber: contactNumber,
        serviceName: service,
        appointmentDateTime: combinedDateTime.toISOString(),
        status: 'Pending',
        checkedIn: false,
        hasAttachment: !!selectedFile,
        fileName: selectedFile ? selectedFile.name : null,
        paymentMode: service === 'SOG' ? paymentMode : null,
        createdAt: serverTimestamp()
      });

      toast({
        title: 'Appointment Booked!',
        description: `Your code is ${appointmentCode}. Save this — you'll need it to check in.`,
      });

      setService('');
      setTime('');
      setName('');
      setStudentId('');
      setEmail('');
      setContactNumber('');
      setSelectedFile(null);
      setPaymentMode('');
      router.push('/dashboard');

    } catch (error: any) {
      console.error("Firestore Save Error: ", error);
      toast({
        variant: 'destructive',
        title: 'Database Connection Error',
        description: error.message || 'Could not reach database. Please check permissions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold font-headline tracking-tight mb-6">Book an Appointment</h1>
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle>New Appointment</CardTitle>
          <CardDescription>Fill out the form below to schedule your visit.</CardDescription>
        </CardHeader>
        <form onSubmit={handleBooking}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="service">Service Type</Label>
              <Select
                onValueChange={(val) => {
                  setService(val);
                  setPaymentMode('');
                }}
                value={service}
              >
                <SelectTrigger id="service" className="w-full md:max-w-sm">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOG">SOG (Summary of Grades)</SelectItem>
                  <SelectItem value="Prospectus Evaluation">Prospectus Evaluation</SelectItem>
                  <SelectItem value="TOR">TOR (Transcript of Records)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {service === 'SOG' && (
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Mode of Payment</Label>
                <Select onValueChange={setPaymentMode} value={paymentMode}>
                  <SelectTrigger id="paymentMode" className="w-full md:max-w-sm">
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  SOG processing requires payment. Please select your preferred mode.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <Label>Appointment Date & Time</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <div className="border rounded-md">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      fromDate={new Date()}
                      className="rounded-md"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Available Time Slots</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map(slot => (
                      <Button
                        key={slot}
                        type="button"
                        variant={time === slot ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTime(slot)}
                        className={cn(time === slot && "bg-primary text-primary-foreground")}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Your Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    type="text"
                    placeholder="Enter your student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    placeholder="Enter your contact number"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">Add a Document</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={fileInputRef}
                        id="document"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, DOCX, JPG, or PNG (max. 10MB)
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select File
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !service || !date || !time}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Booking...' : 'Confirm Appointment'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}