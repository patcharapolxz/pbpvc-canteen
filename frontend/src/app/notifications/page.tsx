'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { notifApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { Bell, BellOff, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [notifs,  setNotifs]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) { router.replace('/login'); return; }
    notifApi.get(loggedInUser.id).then((r: any) => {
      if (r.success) setNotifs(r.data);
      setLoading(false);
    });
  }, []);

  const handleMarkRead = async () => {
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    await notifApi.markRead(loggedInUser.id);
    setNotifs(notifs.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  const currentUser = user || (mounted ? getPersistedUser() : null);

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9]">
        <div className="w-12 h-12 border-4 border-[#006837] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] pb-nav">
      <div className="bg-linear-to-r from-[#006837] to-[#006837] text-white px-5 pt-10 pb-8 rounded-b-[25px] shadow-[0_4px_15px_rgba(0,104,55,0.15)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">การแจ้งเตือน</h1>
            {unreadCount > 0 && <p className="text-white/70 text-sm">{unreadCount} รายการที่ยังไม่ได้อ่าน</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkRead}
              className="flex items-center gap-1.5 bg-white/20 text-white text-sm px-3 py-2 rounded-xl border border-white/30">
              <CheckCheck size={16} /> อ่านทั้งหมด
            </button>
          )}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          Array.from({length:4}).map((_,i) => (
            <div key={i} className="bg-white rounded-2xl p-4 space-y-2">
              <div className="skeleton h-5 w-1/2" /><div className="skeleton h-4 w-full" />
            </div>
          ))
        ) : notifs.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <BellOff size={48} className="mx-auto mb-3 opacity-40" />
            <p className="font-medium">ยังไม่มีการแจ้งเตือน</p>
          </div>
        ) : notifs.map(n => (
          <div key={n.id}
            onClick={() => setExpanded(expanded === n.id ? null : n.id)}
            className={`bg-white rounded-2xl shadow-(--card-shadow) p-4 cursor-pointer transition-all ${
              !n.read ? 'border-l-4 border-[#006837]' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                !n.read ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                <Bell size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold leading-snug ${!n.read ? 'text-gray-800' : 'text-gray-500'}`}>
                    {n.title}
                  </p>
                  {!n.read && <span className="w-2 h-2 bg-[#006837] rounded-full shrink-0 mt-1" />}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                {expanded === n.id && (
                  <div className="mt-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3"
                    dangerouslySetInnerHTML={{ __html: n.message }} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  );
}
