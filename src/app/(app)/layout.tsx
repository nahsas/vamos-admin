
'use client';

import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { OrderNotifier } from '@/components/layout/order-notifier';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
     return <div className="flex items-center justify-center h-screen">Loading...</div>; // Or a proper loading spinner
  }
  
  return (
    <SidebarProvider>
      <OrderNotifier />
      <SidebarNav />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6 md:hidden">
           <SidebarTrigger />
           <div className="flex items-center gap-2">
             <Image src="https://sejadikopi-api-v2.sejadikopi.com/storage/Logo/vamos.png" alt="Sejadi Kopi Logo" width={32} height={32} className="rounded-md" unoptimized/>
           </div>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
