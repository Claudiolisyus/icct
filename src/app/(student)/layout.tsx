'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Logo } from '@/components/icons/logo';
import { LayoutDashboard, CalendarPlus, LogOut, HelpCircle, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// 🛠️ FIREBASE IMPORTS
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string>('Student');

useEffect(() => {
  setIsClient(true);

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setIsLoggedIn(true);
      setUserName(user.displayName || "Student");
    } else {
      setIsLoggedIn(false);
      setUserName("Student");

      // Redirect after logout
      if (
        pathname !== "/login" &&
        pathname !== "/signup"
      ) {
        router.replace("/login");
      }
    }
  });

  return () => unsubscribe();
}, [router, pathname]);

const handleLogout = async () => {
  try {
    await signOut(auth);

    setIsLoggedIn(false);
    setUserName("Student");

    router.replace("/login");
  } catch (error) {
    console.error("Error signing out:", error);
  }
};
  
  if (!isClient) return null;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 z-50">
        {isLoggedIn ? (
          <>
            <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                <Logo className="h-6 w-auto text-primary" />
                <span className="sr-only">Schedule System</span>
              </Link>
              <Link href="/dashboard" className={`transition-colors hover:text-foreground ${pathname === '/dashboard' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Dashboard
              </Link>
              <Link href="/book-appointment" className={`transition-colors hover:text-foreground ${pathname === '/book-appointment' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Book Appointment
              </Link>
              <Link href="/help-center" className={`transition-colors hover:text-foreground ${pathname === '/help-center' ? 'text-foreground' : 'text-muted-foreground'}`}>
                Help Center
              </Link>
            </nav>
            <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                <div className='md:hidden'>
                    <Logo className="h-6 w-auto text-primary" />
                </div>
              <div className="ml-auto flex-1 sm:flex-initial" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <Avatar>
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} />
                      <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{userName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem asChild><Link href="/profile"><User className="mr-2 h-4 w-4" />My Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/book-appointment"><CalendarPlus className="mr-2 h-4 w-4" />Book Appointment</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/help-center"><HelpCircle className="mr-2 h-4 w-4" />Help Center</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500"><LogOut className="mr-2 h-4 w-4" />Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        ) : (
          <>
            <nav className="flex-1">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                <Logo className="h-6 w-auto text-primary" />
                <span className="sr-only">Schedule System</span>
              </Link>
            </nav>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline"><Link href="/login">Login</Link></Button>
              <Button asChild><Link href="/signup">Sign Up</Link></Button>
            </div>
          </>
        )}
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}