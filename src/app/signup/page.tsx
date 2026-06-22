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
// 🛠️ FIREBASE IMPORTS UPDATED
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// 🛠️ 1. Added contactNumber to the Zod schema
const signupSchema = z.object({
  name: z.string().min(1, { message: 'Full name is required.' }),
  studentId: z.string().min(1, { message: 'Student ID is required.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  contactNumber: z.string().min(1, { message: 'Contact number is required.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      studentId: '',
      email: '',
      contactNumber: '', // 🛠️ Default value for contact number
      password: '',
    },
  });

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    setIsLoading(true);

    try {
      // Create Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;
      const uid = user.uid;

      // 🛠️ 2. Update their Auth profile so their name shows in the top right Avatar
      await updateProfile(user, {
        displayName: values.name
      });

      // Save additional data to Firestore for the Profile page
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        name: values.name,
        studentId: values.studentId,
        email: values.email,
        contactNumber: values.contactNumber, // 🛠️ Saved to Firestore
        role: 'student',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await sendEmailVerification(user, {
        url: `${window.location.origin}/login`,
      });

      toast({
        title: 'Account Created!',
        description: 'Check your email for a verification link.',
      });
      router.push('/verify-email');
    } catch (error: any) {
      let message = 'Something went wrong. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: message,
      });
    } finally {
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
            <h1 className="font-headline text-3xl font-bold">Create an Account</h1>
            <p className="text-muted-foreground">Enter your details to get started</p>
          </div>

          <div className="rounded-2xl p-8 shadow-lg border bg-card">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSignup)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Dela Cruz" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex. ICCT-2026-0001" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* 🛠️ 3. Added Contact Number Field to the UI */}
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+63 900 000 0000" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} disabled={isLoading} />
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
                            placeholder="Enter your password"
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
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>
            </Form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}