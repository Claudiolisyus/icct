'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/icons/logo';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const loginSchema = z.object({
  studentNumber: z.string().optional(),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isStudent, setIsStudent] = useState(true);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      studentNumber: '',
      email: '',
      password: '',
    },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const uid = userCredential.user.uid;

      // Block unverified accounts
      if (!userCredential.user.emailVerified) {
        toast({
          variant: 'destructive',
          title: 'Email Not Verified',
          description: 'Please verify your email before logging in.',
        });
        router.push('/verify-email');
        setIsLoading(false);
        return;
      }

      // Force-refresh the ID token so Firestore rules see request.auth immediately.
      // Without this, the very first Firestore read right after sign-in can
      // intermittently fail with "Missing or insufficient permissions."
      await userCredential.user.getIdToken(true);

      const userDoc = await getDoc(doc(db, 'users', uid));

      if (!userDoc.exists()) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'No profile found for this account.',
        });
        setIsLoading(false);
        return;
      }

      const userData = userDoc.data();
      const expectedRole = isStudent ? 'student' : 'admin';

      if (userData.role !== expectedRole) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: `This account is not registered as a${isStudent ? ' student' : 'n admin'}.`,
        });
        setIsLoading(false);
        return;
      }

      if (isStudent && values.studentNumber && userData.studentId !== values.studentNumber) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Student ID does not match this account.',
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: 'Login Successful',
        description: 'Welcome back!',
      });

      router.push(userData.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (error: any) {
      let message = 'Invalid email or password.';
      if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Please try again later.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: message,
      });
      setIsLoading(false);
    }
  };

  const backgroundUrl = PlaceHolderImages.find(p => p.id === 'login-background')?.imageUrl || '';

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-5">
      <div className="hidden lg:block lg:col-span-2 py-32">
        <div 
          className="w-full h-full bg-cover bg-center rounded-r-2xl"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
        />
      </div>
      <div className="flex items-center justify-center py-12 lg:col-span-3">
        <div className="mx-auto w-[450px] space-y-6">
          <div className="space-y-2 text-center">
            <Logo className="mx-auto h-8 w-auto text-primary" />
            <h1 className="text-3xl font-bold font-headline">{isStudent ? 'Student Login' : 'Admin Login'}</h1>
            <p className="text-muted-foreground">
                Enter your credentials to access your account
            </p>
          </div>
          
          <div className="relative rounded-2xl p-8 shadow-lg border bg-card">
            <Button 
                variant="outline"
                size="sm"
                className="absolute top-4 right-4 h-8 text-xs"
                onClick={() => {
                  setIsStudent(!isStudent);
                  form.reset();
                }}
            >
                {isStudent ? 'Switch to Admin' : 'Switch to Student'}
            </Button>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4 pt-6">

                {isStudent && (
                    <FormField
                        control={form.control}
                        name="studentNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Student ID</FormLabel>
                            <FormControl>
                            <Input
                                placeholder="UA20237847"
                                {...field}
                                disabled={isLoading}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                )}

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                        <Input
                            placeholder="Email address"
                            {...field}
                            disabled={isLoading}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                        <div className="relative">
                            <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            {...field}
                            disabled={isLoading}
                            />
                            <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                            >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </Button>
                        </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                
                <div className="flex items-center justify-between text-sm">
                    <Link href="/help-center" className="text-primary hover:underline">
                        Help Center
                    </Link>
                    <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                        Forgot Password?
                    </Link>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>

                {isStudent && (
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link href="/signup" className="font-medium text-primary hover:underline">
                            Sign up
                        </Link>
                    </p>
                )}
                </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}