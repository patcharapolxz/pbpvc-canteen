'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import PremiumLoading from '@/components/PremiumLoading';

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

  return <PremiumLoading text="กำลังเข้าสู่ระบบ..." subtext="กรุณารอสักครู่..." />;
}
