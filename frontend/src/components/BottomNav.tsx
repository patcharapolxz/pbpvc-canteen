'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Home, ShoppingBag, Bell, User, ChefHat, LayoutDashboard } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user } = useAppStore();

  if (!user) return null;

  const studentNav = [
    { icon: Home,        label: 'หน้าแรก',    href: '/shops' },
    { icon: ShoppingBag, label: 'ออเดอร์',     href: '/orders' },
    { icon: Bell,        label: 'แจ้งเตือน',  href: '/notifications' },
    { icon: User,        label: 'โปรไฟล์',    href: '/profile' },
  ];

  const merchantNav = [
    { icon: ChefHat,     label: 'ร้านของฉัน', href: '/merchant' },
    { icon: ShoppingBag, label: 'ออเดอร์',     href: '/merchant/orders' },
    { icon: Bell,        label: 'แจ้งเตือน',  href: '/notifications' },
    { icon: User,        label: 'โปรไฟล์',    href: '/merchant/profile' },
  ];

  const adminNav = [
    { icon: LayoutDashboard, label: 'แดชบอร์ด', href: '/admin' },
    { icon: User,            label: 'ผู้ใช้',    href: '/admin/users' },
    { icon: ShoppingBag,     label: 'ออเดอร์',   href: '/admin/orders' },
    { icon: Bell,            label: 'แจ้งเตือน', href: '/notifications' },
  ];

  const navItems = user.role === 'Admin' ? adminNav : user.role === 'Merchant' ? merchantNav : studentNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-t-2xl">
      <div className="flex justify-around items-center py-2 px-2 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                active ? 'text-[#006837]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className={`transition-transform ${active ? 'scale-110' : ''}`}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              </span>
              <span className={`text-[10px] font-medium ${active ? 'font-semibold' : ''}`}>{label}</span>
              {active && <span className="w-1 h-1 bg-[#006837] rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
