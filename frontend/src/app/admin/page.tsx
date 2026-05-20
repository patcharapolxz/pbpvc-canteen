'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { adminApi, newsApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { Users, ShoppingBag, TrendingUp, Banknote, Plus, Pencil, Trash2, X, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['Student', 'Merchant', 'Admin'];

export default function AdminPage() {
  const router = useRouter();
  const { user, logout } = useAppStore();
  const [tab,    setTab]    = useState<'dashboard'|'users'|'news'>('dashboard');
  const [stats,  setStats]  = useState<any>(null);
  const [users,  setUsers]  = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [userModal, setUserModal] = useState<any>(null);
  const [newsMsg,   setNewsMsg]   = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser || loggedInUser.role !== 'Admin') { router.replace('/login'); return; }
    adminApi.getStats().then((r: any) => { if (r.success) setStats(r.data); });
    adminApi.getUsers().then((r: any) => { if (r.success) setUsers(r.data); });
  }, []);

  const handleSaveUser = async () => {
    if (!userModal?.id || !userModal?.name) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
    const res: any = await adminApi.saveUser(userModal);
    if (res.success) { toast.success('บันทึกแล้ว'); setUserModal(null); adminApi.getUsers().then((r: any) => { if (r.success) setUsers(r.data); }); }
    else toast.error(res.msg);
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm(`ลบผู้ใช้ ${id}?`)) return;
    const res: any = await adminApi.deleteUser(id);
    if (res.success) { toast.success('ลบแล้ว'); setUsers(users.filter(u => u.id !== id)); }
  };

  const handlePostNews = async () => {
    if (!newsMsg.trim()) return;
    const res: any = await newsApi.post(newsMsg);
    if (res.success) { toast.success('โพสต์ข่าวแล้ว'); setNewsMsg(''); }
  };

  const handleClearNews = async () => {
    const res: any = await newsApi.clear();
    if (res.success) toast.success('ลบข่าวแล้ว');
  };

  const filteredUsers = users.filter(u =>
    u.id?.includes(search) || u.name?.includes(search) || u.shop?.includes(search));

  const roleColor: Record<string, string> = {
    Admin: 'bg-red-100 text-red-600', Merchant: 'bg-green-100 text-green-700', Student: 'bg-gray-100 text-gray-500',
  };

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
      {/* Header */}
      <div className="bg-linear-to-br from-[#1e3c72] to-[#2a5298] text-white px-5 pt-10 pb-[70px] rounded-b-[30px] shadow-[0_4px_15px_rgba(30,60,114,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-white/70 text-sm">{currentUser.name}</p>
          </div>
          <button onClick={() => { logout(); router.replace('/login'); }}
            className="bg-white/20 text-white text-xs px-3 py-1.5 rounded-full border border-white/30">
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Floating Tabs */}
      <div className="px-4 -mt-10 relative z-10 mb-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {[['dashboard','📊 สถิติ'],['users','👥 ผู้ใช้'],['news','📢 ข่าว']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k as any)}
              className={`px-5 py-2.5 rounded-[50px] text-sm font-medium transition-all whitespace-nowrap shadow-sm border ${
                tab === k ? 'bg-[#1e3c72] text-white border-[#1e3c72]' : 'bg-white text-gray-500 border-gray-100'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">

        {/* DASHBOARD TAB */}
        {tab === 'dashboard' && (
          <div className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Banknote,    color: 'bg-green-50 text-green-600', label: 'ยอดขายรวม',    value: `${Number(stats?.total || 0).toLocaleString()} ฿` },
                { icon: ShoppingBag, color: 'bg-blue-50 text-blue-600',   label: 'ออเดอร์ทั้งหมด', value: stats?.orders || 0 },
                { icon: Users,       color: 'bg-purple-50 text-purple-600', label: 'นักเรียน',   value: stats?.users || 0 },
                { icon: TrendingUp,  color: 'bg-orange-50 text-orange-600', label: 'ร้านค้า',    value: stats?.shops?.length || 0 },
              ].map(({ icon: Icon, color, label, value }) => (
                <div key={label} className="bg-white rounded-2xl p-5 shadow-(--card-shadow)">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} mb-3`}>
                    <Icon size={22} />
                  </div>
                  <p className="text-gray-500 text-xs">{label}</p>
                  <p className="font-bold text-xl mt-0.5 text-gray-800">{value}</p>
                </div>
              ))}
            </div>

            {/* Shop ranking */}
            <div className="bg-white rounded-2xl shadow-(--card-shadow) p-5">
              <h3 className="font-bold text-gray-800 mb-4">🏆 อันดับร้านค้า</h3>
              {stats?.shops?.map((s: any, i: number) => (
                <div key={s.shop} className="flex items-center gap-3 py-3 border-b border-dashed border-gray-100 last:border-0">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    i===0?'bg-amber-400':i===1?'bg-gray-400':i===2?'bg-amber-600':'bg-gray-200 text-gray-500!'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">{s.shop}</p>
                    <p className="text-xs text-gray-400">{s.orders} ออเดอร์</p>
                  </div>
                  <span className="font-bold text-[#006837]">{s.revenue.toLocaleString()} ฿</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="space-y-3 animate-slide-up">
            <div className="flex gap-2">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ค้นหา ID, ชื่อ, ร้าน..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-[#1e3c72]/30" />
              <button onClick={() => setUserModal({ id:'', pwd:'', name:'', nick:'', phone:'', role:'Student', shop:'', email:'' })}
                className="w-12 h-12 bg-[#1e3c72] text-white rounded-xl flex items-center justify-center shrink-0">
                <Plus size={20} />
              </button>
            </div>
            {filteredUsers.map(u => (
              <div key={u.id} className={`bg-white rounded-2xl shadow-(--card-shadow) p-4 flex items-center gap-3 border-l-4 ${
                u.role==='Admin'?'border-red-400':u.role==='Merchant'?'border-green-500':'border-gray-300'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{u.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[u.role]}`}>{u.role}</span>
                  </div>
                  <p className="text-xs text-gray-400">ID: {u.id} {u.shop && `• ${u.shop}`}</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setUserModal({ ...u })}
                    className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDeleteUser(u.id)}
                    className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NEWS TAB */}
        {tab === 'news' && (
          <div className="space-y-4 animate-slide-up">
            <div className="bg-white rounded-2xl shadow-(--card-shadow) p-5">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Megaphone size={18} />โพสต์ข่าว</h3>
              <textarea value={newsMsg} onChange={e => setNewsMsg(e.target.value)}
                placeholder="พิมพ์ข่าวประชาสัมพันธ์..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none resize-none mb-3" rows={4} />
              <div className="flex gap-2">
                <button onClick={handlePostNews} className="flex-1 bg-[#1e3c72] text-white py-3 rounded-xl font-semibold text-sm">
                  📢 โพสต์ข่าว
                </button>
                <button onClick={handleClearNews} className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl font-semibold text-sm border border-red-200">
                  🗑️ ลบข่าว
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {userModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setUserModal(null)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 py-4 flex items-center justify-between border-b z-10">
              <h3 className="font-bold text-lg">{userModal.id && users.find(u=>u.id===userModal.id) ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'}</h3>
              <button onClick={() => setUserModal(null)}><X size={22} className="text-gray-400" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { k:'id',    label:'รหัส ID *',    type:'text',     ph:'66001' },
                { k:'pwd',   label:'รหัสผ่าน *',   type:'password', ph:'••••' },
                { k:'name',  label:'ชื่อ-นามสกุล *', type:'text', ph:'' },
                { k:'nick',  label:'ชื่อเล่น',       type:'text', ph:'' },
                { k:'phone', label:'เบอร์โทร',       type:'tel',  ph:'' },
                { k:'email', label:'อีเมล',          type:'email', ph:'' },
                { k:'shop',  label:'ชื่อร้าน (Merchant)', type:'text', ph:'' },
              ].map(({ k, label, type, ph }) => (
                <div key={k}>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
                  <input type={type} value={userModal[k] || ''} onChange={e => setUserModal({...userModal, [k]: e.target.value})}
                    placeholder={ph}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#1e3c72]/30" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Role</label>
                <select value={userModal.role} onChange={e => setUserModal({...userModal, role: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none">
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={handleSaveUser} className="btn-primary">บันทึก</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
