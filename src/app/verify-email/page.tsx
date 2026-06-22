'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons/logo';
import { Loader2, MailCheck } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, sendEmailVerification, reload } from 'firebase/auth';

export default function VerifyEmailPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setEmail(user.email || '');

      // If already verified (e.g. they verified then came back), send them onward
      if (user.emailVerified) {
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;
    setIsChecking(true);

    try {
      await reload(auth.currentUser); // refresh user data from Firebase
      if (auth.currentUser.emailVerified) {
        toast({
          title: 'Email Verified!',
          description: 'You can now log in.',
        });
        router.push('/login');
      } else {
        toast({
          variant: 'destructive',
          title: 'Not Verified Yet',
          description: 'Please click the link in your email first.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not check verification status.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    if (!auth.currentUser) return;
    setIsResending(true);

    try {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/login`,
      });
      toast({
        title: 'Email Sent',
        description: 'A new verification link has been sent.',
      });
    } catch (error: any) {
      let message = 'Could not resend email. Please try again later.';
      if (error.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please wait a bit before trying again.';
      }
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background p-4">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <Logo className="mx-auto h-8 w-auto text-primary" />
          <MailCheck className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold font-headline">Verify Your Email</h1>
          <p className="text-muted-foreground">
            We've sent a verification link to{' '}
            <span className="font-medium text-foreground">{email}</span>.
            Click the link, then come back here.
          </p>
        </div>

        <div className="rounded-2xl p-8 shadow-lg border bg-card space-y-4">
          <Button onClick={handleCheckVerification} className="w-full" disabled={isChecking}>
            {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            I've Verified My Email
          </Button>
          <Button
            onClick={handleResend}
            variant="outline"
            className="w-full"
            disabled={isResending}
          >
            {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Resend Verification Email
          </Button>
        </div>
      </div>
    </div>
  );
}