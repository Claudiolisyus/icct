'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged, updatePassword, updateProfile } from "firebase/auth"
import { doc, getDoc, updateDoc } from "firebase/firestore"

export default function SettingsPage() {
  const { toast } = useToast();

  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      setEmail(user.email || '');

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setName(userDoc.data().name || '');
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateProfile = async () => {
    if (!uid) return;
    setIsSavingProfile(true);

    try {
      await updateDoc(doc(db, 'users', uid), { name });

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile changes have been saved.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!auth.currentUser) return;

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'New password must be at least 6 characters.',
      });
      return;
    }

    setIsSavingPassword(true);

    try {
      // Firebase requires recent re-authentication to change password.
      // If this throws auth/requires-recent-login, the user must sign in again first.
      await updatePassword(auth.currentUser, newPassword);

      toast({
        title: 'Password Updated',
        description: 'Your password has been changed.',
      });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      let message = 'Could not update password.';
      if (error.code === 'auth/requires-recent-login') {
        message = 'Please log out and log back in, then try again.';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak.';
      }
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: message,
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium font-headline">Profile</h3>
        <p className="text-sm text-muted-foreground">
          This is how others will see you on the site.
        </p>
      </div>
      <Separator />
      <div className="space-y-4 max-w-lg">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoadingProfile}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} disabled />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed here. Contact support if you need to update it.
          </p>
        </div>
        <Button onClick={handleUpdateProfile} disabled={isSavingProfile || isLoadingProfile}>
          {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update profile
        </Button>
      </div>
      <div>
        <h3 className="text-lg font-medium font-headline">Password</h3>
        <p className="text-sm text-muted-foreground">
          Update your password here.
        </p>
      </div>
      <Separator />
      <div className="space-y-4 max-w-lg">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <Button onClick={handleUpdatePassword} disabled={isSavingPassword}>
          {isSavingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update Password
        </Button>
      </div>
    </div>
  )
}