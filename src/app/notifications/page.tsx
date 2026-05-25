'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { notifApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { Bell, BellOff, CheckCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

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
    loadNotifications(loggedInUser.id);
  }, []);

  const loadNotifications = async (userId: string) => {
    try {
      const r: any = await notifApi.get(userId);
      if (r.success) setNotifs(r.data || []);
    } catch {}
    setLoading(false);
  };

  const handleMarkRead = async () => {
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    const res: any = await notifApi.markRead(loggedInUser.id);
    if (res.success) {
      setNotifs(notifs.map(n => ({ ...n, is_read: true })));
      toast.success('ทำเครื่องหมายอ่านการแจ้งเตือนทั้งหมดแล้ว');
    }
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

  const currentUser = user || (mounted ? getPersistedUser() : null);

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9] dark:bg-[#121212]">
        <div className="w-12 h-12 border-4 border-[#006837] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] dark:bg-[#121212] pb-nav">
      
      {/* Curved Emerald Header */}
      <div className="bg-gradient-to-b from-[#36c990] to-[#006837] text-white px-5 pt-8 pb-[50px] rounded-b-[24px] shadow-[0_4px_15px_rgba(0,104,55,0.15)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold tracking-wide leading-tight">กล่องข้อความแจ้งเตือน</h1>
            {unreadCount > 0 ? (
              <p className="text-white/80 text-[10px] font-bold mt-0.5 tracking-wider uppercase">มีข้อความใหม่ยังไม่ได้อ่าน {unreadCount} รายการ</p>
            ) : (
              <p className="text-white/70 text-[10px] font-bold mt-0.5 tracking-wider uppercase">คุณได้อ่านข้อความแจ้งเตือนทั้งหมดแล้ว</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkRead}
              className="flex items-center gap-1 bg-white/10 text-white text-xs font-extrabold px-3 py-2 rounded-xl border border-white/20 hover:bg-white/20 active:scale-95 duration-100 transition-all cursor-pointer shrink-0"
            >
              <CheckCheck size={14} /> อ่านทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Notifications List container */}
      <div className="px-4 -mt-6 relative z-10 space-y-3 max-w-2xl mx-auto">
        {loading ? (
          Array.from({length:4}).map((_,i) => (
            <div key={i} className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-4 space-y-2.5 animate-pulse border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
            </div>
          ))
        ) : notifs.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-150/40 dark:border-gray-800 shadow-sm">
            <BellOff size={48} className="mx-auto mb-3 opacity-20 text-gray-400" />
            <p className="font-extrabold text-gray-400 text-xs uppercase tracking-wide">ยังไม่มีการแจ้งเตือนใดๆ ในขณะนี้</p>
          </div>
        ) : notifs.map(n => {
          const timeText = n.created_at ? new Date(n.created_at).toLocaleString('th-TH') : '';
          
          return (
            <div key={n.id}
              onClick={() => setExpanded(expanded === n.id ? null : n.id)}
              className={`bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xs p-4 cursor-pointer hover:shadow-sm transition-all border border-gray-100/50 dark:border-gray-800/80 ${
                !n.is_read 
                  ? 'border-l-4 border-l-[#006837] dark:border-l-[#00a568]' 
                  : 'border-l-4 border-l-gray-200 dark:border-l-gray-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center shrink-0 ${
                  !n.is_read 
                    ? 'bg-green-50 text-green-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                    : 'bg-gray-50 text-gray-400 dark:bg-gray-900/60 dark:text-gray-600'
                }`}>
                  <Bell size={16} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs font-extrabold leading-snug truncate ${
                      !n.is_read ? 'text-gray-850 dark:text-gray-200' : 'text-gray-500 dark:text-gray-450'
                    }`}>
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-gradient-to-r from-[#006837] to-[#00a568] rounded-full shrink-0 mt-1 shadow-xs" />
                    )}
                  </div>
                  
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1 tracking-wide">{timeText}</p>
                  
                  {expanded === n.id && (
                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-3 animate-fade-in font-medium"
                      dangerouslySetInnerHTML={{ __html: n.message }} 
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
