
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons/logo';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/firebase';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }),
});

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const auth = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handlePasswordReset = async (values: z.infer<typeof forgotPasswordSchema>) => {
    setIsLoading(true);
    try {
      const methods = await fetchSignInMethodsForEmail(auth, values.email);

      if (methods.length === 0) {
        toast({
          variant: "destructive",
          title: "Email Not Found",
          description: "This Email Isnt Amongst Our Database. Make Sure You Use The Email On Your Student Account",
        });
        setIsLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, values.email);
      setEmailSent(true);
      toast({
        title: 'Check your email',
        description: 'We have sent instructions to reset your password.',
      });

    } catch (error: any) {
      console.error("Password reset error:", error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // The two-column layout is not used here for simplicity and focus on the task.
  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background p-4">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Logo className="mx-auto h-8 w-auto text-primary" />
          <h1 className="text-3xl font-bold font-headline">Forgot Password</h1>
          <p className="text-muted-foreground">
            {emailSent
              ? 'Follow the instructions sent to your email address.'
              : 'Enter your email to receive a password reset link.'}
          </p>
        </div>
        
        <div className="relative rounded-2xl p-8 shadow-lg border bg-card">
          {emailSent ? (
            <div className="text-center">
              <p className="mb-6">If you don't see the email within a few minutes, please check your spam folder.</p>
              <Button asChild>
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Login
                </Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handlePasswordReset)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            </Form>
          )}
        </div>
        
        {!emailSent && (
            <div className="text-center text-sm">
                <Link href="/login" className="font-medium text-primary hover:underline inline-flex items-center">
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Login
                </Link>
            </div>
        )}
      </div>
    </div>
  );
}
