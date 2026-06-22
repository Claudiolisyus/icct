import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, Phone } from "lucide-react";

export default function HelpCenterPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold font-headline tracking-tight mb-6">Help Center</h1>
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Find answers to common questions about the appointment system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I book an appointment?</AccordionTrigger>
              <AccordionContent>
                To book an appointment, log in to your student account, go to the "Book Appointment" page, select your desired service, date, and time, and fill in your details.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>How can I cancel or reschedule my appointment?</AccordionTrigger>
              <AccordionContent>
                {/* 🛠️ UPDATED FAQ TEXT */}
                You can easily cancel an upcoming appointment directly from your Dashboard! Just locate the appointment under your "Upcoming Schedule" and click the red "Cancel" button. To reschedule, simply cancel the existing appointment and book a new one.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>What do I need to prepare for my appointment?</AccordionTrigger>
              <AccordionContent>
                Please bring your student ID and any required documents for your specific service. You can upload documents when booking the appointment if needed.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>I forgot my password. What should I do?</AccordionTrigger>
              <AccordionContent>
                Click the "Forgot Password?" link on the login page and follow the instructions to reset your password. You will receive an email with a reset link.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="mx-auto max-w-4xl mt-8">
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
          <CardDescription>
            If you can't find the answer you're looking for, please contact us.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="flex items-center gap-4">
              <Mail className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Email Support</h3>
                <p className="text-sm text-muted-foreground">
                  <a href="mailto:support@icct.edu.ph" className="text-primary hover:underline">
                    support@icct.edu.ph
                  </a>
                </p>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <Phone className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-semibold">Phone Support</h3>
                <p className="text-sm text-muted-foreground">(02) 8-123-4567</p>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}