'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const { user } = useAppStore();

  useEffect(() => {
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) { router.replace('/login'); return; }
    if (loggedInUser.role === 'Admin') router.replace('/admin');
    else if (loggedInUser.role === 'Merchant') router.replace('/merchant');
    else router.replace('/shops');
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9]">
      <div className="w-12 h-12 border-4 border-[#006837] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
