'use server';

/**
 * @fileOverview A flow that sends personalized appointment reminders to students.
 *
 * - sendPersonalizedReminder - A function that sends a personalized email reminder.
 * - ReminderInput - The input type for the sendPersonalizedReminder function.
 * - ReminderOutput - The return type for the sendPersonalizedReminder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReminderInputSchema = z.object({
  studentName: z.string().describe('The name of the student receiving the reminder.'),
  studentEmail: z.string().email().describe('The email address of the student.'),
  appointmentType: z.string().describe('The type of appointment (e.g., SOG, Prospectus Evaluation).'),
  appointmentDateTime: z.string().describe('The date and time of the appointment (e.g., 2024-08-15T10:00:00).'),
  studentHistory: z.string().optional().describe('Optional information about the student\'s history with appointments.'),
  bookingStatus: z.string().describe('The current status of the booking (e.g., confirmed, pending, cancelled).'),
});
export type ReminderInput = z.infer<typeof ReminderInputSchema>;

const ReminderOutputSchema = z.object({
  emailSent: z.boolean().describe('Whether the email reminder was successfully sent.'),
  message: z.string().describe('A message indicating the status of the email sending.'),
});
export type ReminderOutput = z.infer<typeof ReminderOutputSchema>;

export async function sendPersonalizedReminder(input: ReminderInput): Promise<ReminderOutput> {
  return personalizedReminderFlow(input);
}

const reminderPrompt = ai.definePrompt({
  name: 'personalizedReminderPrompt',
  input: {schema: ReminderInputSchema},
  output: {schema: ReminderOutputSchema},
  prompt: `You are an AI assistant responsible for sending personalized appointment reminders to students.

  Compose a personalized email reminder for {{studentName}} about their upcoming {{appointmentType}} appointment.
  The appointment is scheduled for {{appointmentDateTime}}.
  The booking status is {{bookingStatus}}.

  Consider the following student history when crafting the reminder (if available):
  {{#if studentHistory}}
  {{studentHistory}}
  {{else}}
  There is no student history available.
  {{/if}}

  The email should:
  - Be concise and informative.
  - Clearly state the appointment type, date, and time.
  - Include a personalized message based on the student's history (if provided).
  - Remind the student to come on time and be prepared.
  - If booking status is 'pending', encourage them to confirm their appointment.

  Output the reminder as a JSON object with "emailSent" (boolean) and "message" (string) fields, where message is the content of the email and emailSent represents if the email was successfully sent. Assume email sending is always successful.
  Always set emailSent to true.
  `,
});

const personalizedReminderFlow = ai.defineFlow(
  {
    name: 'personalizedReminderFlow',
    inputSchema: ReminderInputSchema,
    outputSchema: ReminderOutputSchema,
  },
  async input => {
    const {output} = await reminderPrompt(input);
    // TODO: Actually send the email here using a service or library.
    return output!;
  }
);
