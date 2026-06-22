'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User as UserIcon, Mail, Phone, Hash } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 🛠️ FIREBASE IMPORTS
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setName(user.displayName || '');
        setEmail(user.email || '');

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            if (data.studentId) setStudentId(data.studentId);
            if (data.contactNumber) setContactNumber(data.contactNumber);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
        setIsLoading(false);
      } else {
        // If they somehow get here while logged out, send them to login
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const user = auth.currentUser;
    if (!user) return;

    try {
      if (name !== user.displayName) {
        await updateProfile(user, { displayName: name });
      }

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        name: name,
        studentId: studentId,
        contactNumber: contactNumber,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not save your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <UserIcon className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold font-headline tracking-tight">My Profile</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your contact details and student ID here.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveProfile}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="name" className="pl-9" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" className="pl-9 bg-muted" value={email} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID Number</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="studentId" className="pl-9" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="contactNumber" type="tel" className="pl-9" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                </div>
              </div>

            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving Changes...' : 'Save Profile'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}