'use server';
/**
 * @fileOverview Implements an AI-powered flow to send follow-up emails to students after their appointments.
 *
 * - smartFollowUpAfterAppointments - A function that sends follow-up emails to students after appointments.
 * - SmartFollowUpAfterAppointmentsInput - The input type for the smartFollowUpAfterAppointments function.
 * - SmartFollowUpAfterAppointmentsOutput - The return type for the smartFollowUpAfterAppointments function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { sendEmail } from '@/services/email';

const SmartFollowUpAfterAppointmentsInputSchema = z.object({
  studentEmail: z.string().email().describe('The email address of the student.'),
  appointmentType: z.string().describe('The type of appointment (e.g., SOG, Prospectus Evaluation).'),
  appointmentDate: z.string().describe('The date of the appointment.'),
  additionalNotes: z.string().optional().describe('Any additional notes from the registrar about the appointment.'),
});
export type SmartFollowUpAfterAppointmentsInput = z.infer<typeof SmartFollowUpAfterAppointmentsInputSchema>;

const SmartFollowUpAfterAppointmentsOutputSchema = z.object({
  success: z.boolean().describe('Indicates whether the follow-up email was sent successfully.'),
  message: z.string().describe('A message indicating the status of the follow-up email sending process.'),
});
export type SmartFollowUpAfterAppointmentsOutput = z.infer<typeof SmartFollowUpAfterAppointmentsOutputSchema>;

export async function smartFollowUpAfterAppointments(input: SmartFollowUpAfterAppointmentsInput): Promise<SmartFollowUpAfterAppointmentsOutput> {
  return smartFollowUpAfterAppointmentsFlow(input);
}

const followUpPrompt = ai.definePrompt({
  name: 'followUpPrompt',
  input: {schema: SmartFollowUpAfterAppointmentsInputSchema},
  output: {schema: z.string().describe('The content of the follow-up email.')},
  prompt: `You are an AI assistant designed to compose follow-up emails to students after their appointments with the registrar.\n\n  Compose a personalized email to the student with the following information:\n  - A thank you for attending their appointment.\n  - A brief summary of the appointment type: {{{appointmentType}}}.\n  - The date of the appointment: {{{appointmentDate}}}.\n  - An invitation to provide feedback or ask any remaining questions.\n  - Include any additional notes from the registrar: {{{additionalNotes}}}.\n\n  The email should be professional, friendly, and concise.  Make sure to address the student using their name, which can be derived from the email address {{{studentEmail}}}.\n  Ensure the student's name is properly capitalized in the greeting.\n  The email should be in HTML format.\n  `,
});

const smartFollowUpAfterAppointmentsFlow = ai.defineFlow(
  {
    name: 'smartFollowUpAfterAppointmentsFlow',
    inputSchema: SmartFollowUpAfterAppointmentsInputSchema,
    outputSchema: SmartFollowUpAfterAppointmentsOutputSchema,
  },
  async input => {
    try {
      const {output: emailContent} = await followUpPrompt(input);

      const emailResult = await sendEmail({
        to: input.studentEmail,
        subject: `Follow-up after your ${input.appointmentType} appointment`,
        html: emailContent!,
      });

      if (emailResult.success) {
        return {
          success: true,
          message: 'Follow-up email sent successfully.',
        };
      } else {
        return {
          success: false,
          message: `Failed to send follow-up email: ${emailResult.message}`,
        };
      }
    } catch (error: any) {
      console.error('Error sending follow-up email:', error);
      return {
        success: false,
        message: `An error occurred while sending the follow-up email: ${error.message}`,
      };
    }
  }
);
