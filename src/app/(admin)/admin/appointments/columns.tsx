"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Appointment } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, MessageSquare, Send, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendPersonalizedReminder } from "@/ai/flows/personalized-appointment-reminders"
import { smartFollowUpAfterAppointments } from "@/ai/flows/smart-follow-up-after-appointments"
import Link from "next/link"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Confirmed: 'default',
  Pending: 'secondary',
  Completed: 'outline',
  Cancelled: 'destructive',
};

const paymentModeLabels: { [key: string]: string } = {
  cash: 'Cash',
  gcash: 'GCash',
  maya: 'Maya',
  credit_debit_card: 'Credit / Debit Card',
};

async function handleSendReminder(appointment: Appointment, toast: any) {
  toast({ title: 'AI Assistant', description: 'Generating personalized reminder...' });
  try {
    const result = await sendPersonalizedReminder({
      studentName: appointment.studentName,
      studentEmail: appointment.studentEmail,
      appointmentType: appointment.serviceName,
      appointmentDateTime: appointment.appointmentDateTime,
      bookingStatus: appointment.status,
    });
    if (result.emailSent) {
      toast({ title: 'AI Reminder Sent', description: 'A personalized reminder has been sent.' });
    } else {
      throw new Error('Failed to send email.');
    }
  } catch (error) {
    toast({ variant: 'destructive', title: 'Error', description: 'Could not send reminder.' });
  }
}

async function handleSendFollowUp(appointment: Appointment, toast: any) {
  toast({ title: 'AI Assistant', description: 'Generating smart follow-up...' });
  try {
    const result = await smartFollowUpAfterAppointments({
      studentEmail: appointment.studentEmail,
      appointmentType: appointment.serviceName,
      appointmentDate: new Date(appointment.appointmentDateTime).toLocaleDateString(),
      additionalNotes: 'Please ensure you have submitted all required documents.'
    });
    if (result.success) {
      toast({ title: 'AI Follow-up Sent', description: 'A smart follow-up has been sent.' });
    } else {
      throw new Error(result.message);
    }
  } catch (error: any) {
    toast({ variant: 'destructive', title: 'Error', description: error.message || 'Could not send follow-up.' });
  }
}

async function handleUpdateStatus(appointmentId: string, status: 'Confirmed' | 'Cancelled' | 'Completed', toast: any) {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), { status });
    toast({
      title: status === 'Confirmed' ? 'Appointment Approved' : status === 'Completed' ? 'Appointment Completed' : 'Appointment Cancelled',
      description: `Status updated to ${status}.`,
    });
  } catch (error: any) {
    toast({
      variant: 'destructive',
      title: 'Update Failed',
      description: error.message || 'Could not update appointment status.',
    });
  }
}

const paymentStatusColors: { [key: string]: string } = {
  'Submitted': 'text-green-600',
  'Awaiting Reference': 'text-yellow-600',
  'Payment Pending': 'text-orange-500',
  'Not Required Online': 'text-muted-foreground',
};

export const columns: ColumnDef<Appointment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "studentName",
    header: "Student",
    cell: ({ row }) => {
      const { studentName, studentEmail, studentId } = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage data-ai-hint="person portrait" src={`https://picsum.photos/seed/${studentId}/40/40`} alt={studentName} />
            <AvatarFallback>{studentName?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{studentName}</div>
            <div className="text-sm text-muted-foreground">{studentEmail}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "serviceName",
    header: "Service",
  },
  {
    accessorKey: "paymentMode",
    header: "Payment",
    cell: ({ row }) => {
      const { serviceName, paymentMode } = row.original;
      if (serviceName !== 'SOG') {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      if (!paymentMode) {
        return <span className="text-xs text-muted-foreground">Not set</span>;
      }
      return (
        <Badge variant="outline" className="text-xs">
          {paymentModeLabels[paymentMode] ?? paymentMode}
        </Badge>
      );
    },
  },
  // ✅ NEW: Reference Number column
  {
    accessorKey: "referenceNumber",
    header: "Reference No.",
    cell: ({ row }) => {
      const appointment = row.original as any;
      const { serviceName } = appointment;

      // Only relevant for SOG with online payment
      if (serviceName !== 'SOG') {
        return <span className="text-xs text-muted-foreground">—</span>;
      }

      if (appointment.referenceNumber) {
        return (
          <div className="space-y-0.5">
            <span className="font-mono text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded">
              {appointment.referenceNumber}
            </span>
          </div>
        );
      }

      // Show payment status if no reference number yet
      const paymentStatus = appointment.paymentStatus;
      const colorClass = paymentStatusColors[paymentStatus] ?? 'text-muted-foreground';
      return (
        <span className={`text-xs ${colorClass}`}>
          {paymentStatus ?? '—'}
        </span>
      );
    },
  },
  {
    accessorKey: "appointmentCode",
    header: "Code",
    cell: ({ row }) => {
      const code = row.original.appointmentCode;
      if (!code) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <span className="font-mono text-xs font-medium bg-muted px-2 py-1 rounded">
          {code}
        </span>
      );
    },
  },
  {
    accessorKey: "appointmentDateTime",
    header: "Date & Time",
    cell: ({ row }) => {
      const { appointmentDateTime } = row.original;
      if (!appointmentDateTime) return null;
      const date = new Date(appointmentDateTime);
      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant={statusColors[status]}>{status}</Badge>
    },
  },
  {
    id: "checkedIn",
    header: "Check-in",
    cell: ({ row }) => {
      const appointment = row.original as any;
      if (!appointment.checkedIn) {
        return <span className="text-xs text-muted-foreground">Not arrived</span>;
      }
      return (
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
      );
    },
  },
  {
    id: "actions",
    cell: function Cell({ row }) {
      const appointment = row.original as any;
      const { toast } = useToast();

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(appointment.id)}>
              Copy ID
            </DropdownMenuItem>
            {appointment.appointmentCode && (
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(appointment.appointmentCode!)}>
                Copy Appointment Code
              </DropdownMenuItem>
            )}
            {appointment.referenceNumber && (
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(appointment.referenceNumber)}>
                Copy Reference Number
              </DropdownMenuItem>
            )}
            {appointment.documentUrl && (
              <DropdownMenuItem asChild>
                <Link href={appointment.documentUrl} target="_blank" rel="noopener noreferrer">
                  View Document
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, 'Confirmed', toast)}>
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, 'Cancelled', toast)}>
              Cancel
            </DropdownMenuItem>
            {appointment.checkedIn && appointment.status !== 'Completed' && (
              <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, 'Completed', toast)}>
                Finish Appointment
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>AI Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleSendReminder(appointment, toast)}>
              <Send className="mr-2 h-4 w-4" />
              <span>Send Reminder</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSendFollowUp(appointment, toast)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Send Follow-up</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]