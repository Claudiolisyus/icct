// This is a mock email service. In a real application, you would integrate
// with an actual email sending service like SendGrid, Mailgun, or AWS SES.

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

type EmailResult = {
  success: boolean;
  message: string;
};

export async function sendEmail({ to, subject, html }: EmailPayload): Promise<EmailResult> {
  console.log('--- MOCK EMAIL SENDER ---');
  console.log(`Sending email to: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log('Body (HTML):');
  console.log(html);
  console.log('-------------------------');

  // Simulate a network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // In this mock, we'll always assume the email is sent successfully.
  return {
    success: true,
    message: `Mock email sent successfully to ${to}`,
  };
}
