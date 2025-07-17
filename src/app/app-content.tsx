
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { NotificationModal } from '@/components/notification-modal';
import { AdminNavbar } from '@/components/admin-navbar';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export function AppContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminSection = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin';
  
  const showAdminNavbar = isAdminSection && !isLoginPage;
  const showPublicNavbar = !isAdminSection;

  return (
    <>
      {showPublicNavbar && <NotificationModal />}
      <div className="relative flex min-h-screen flex-col">
        {showAdminNavbar && <AdminNavbar />}
        {showPublicNavbar && <Navbar />}
        <main className="flex-1">{children}</main>
        {showPublicNavbar && <Footer />}
      </div>
    </>
  );
}
