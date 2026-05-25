'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { adminApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import PremiumLoading from '@/components/PremiumLoading';
import { Users, User, Plus, Pencil, Trash2, X, Search, Shield, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['Student', 'Merchant', 'Admin'];

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [users,  setUsers]  = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [userModal, setUserModal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser || loggedInUser.role !== 'Admin') {
      router.replace('/login');
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const r: any = await adminApi.getUsers();
    if (r.success) setUsers(r.data);
    setLoading(false);
  };

  const handleSaveUser = async () => {
    if (!userModal?.id?.trim() || !userModal?.name?.trim()) {
      toast.error('กรุณากรอกรหัสประจำตัวและชื่อผู้ใช้');
      return;
    }
    if (userModal.role === 'Merchant' && !userModal.shop?.trim()) {
      toast.error('กรุณาระบุชื่อร้านค้าของแม่ค้า');
      return;
    }
    const res: any = await adminApi.saveUser(userModal);
    if (res.success) {
      toast.success('บันทึกข้อมูลผู้ใช้งานสำเร็จ');
      setUserModal(null);
      loadUsers();
    } else {
      toast.error(res.msg);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm(`ยืนยันลบผู้ใช้งานรหัส ${id} ออกจากระบบถาวรหรือไม่?`)) return;
    const res: any = await adminApi.deleteUser(id);
    if (res.success) {
      toast.success('ลบข้อมูลผู้ใช้สำเร็จ');
      setUsers(users.filter(u => u.id !== id));
    } else {
      toast.error(res.msg);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.id || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.shop_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const roleColor: Record<string, string> = {
    Admin: 'bg-red-50 text-red-600 border border-red-200/50 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50',
    Merchant: 'bg-green-50 text-green-700 border border-green-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50',
    Student: 'bg-blue-50 text-blue-600 border border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50',
  };

  const roleLabel: Record<string, string> = {
    Admin: 'ผู้ดูแลระบบ',
    Merchant: 'ร้านค้า',
    Student: 'นักเรียน/ครู',
  };

  const currentUser = user || (mounted ? getPersistedUser() : null);

  if (!mounted || !currentUser) {
    return <PremiumLoading text="กำลังโหลดรายชื่อผู้ใช้..." subtext="กรุณารอสักครู่..." />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7f9] dark:bg-[#121212] pb-nav">
      
      {/* Curved Header */}
      <div className="bg-gradient-to-br from-[#1e3c72] to-[#2a5298] text-white px-5 pt-8 pb-[60px] rounded-b-[24px] shadow-[0_4px_15px_rgba(30,60,114,0.2)]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin')} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white cursor-pointer hover:bg-white/20 active:scale-90 transition-all">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-extrabold tracking-wide leading-tight">จัดการผู้ใช้งานระบบ</h1>
            <p className="text-white/70 text-[10px] font-bold mt-0.5 uppercase tracking-wider">แก้ไขสิทธิ์ ค้นหาบัญชีสมาชิก</p>
          </div>
        </div>
      </div>

      {/* Action Bar Search & Create */}
      <div className="px-4 -mt-8 relative z-10 mb-4 max-w-2xl mx-auto">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-2 px-3 shadow-xs flex gap-2 items-center border border-gray-150/40 dark:border-gray-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหา ID, ชื่อ หรือชื่อร้านค้า..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-55 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-[#1e3c72]/30 dark:text-gray-250 font-bold"
            />
          </div>
          <button
            onClick={() => setUserModal({ id: '', pwd: '', name: '', nick: '', phone: '', role: 'Student', shop: '', email: '' })}
            className="h-11 px-4.5 bg-[#1e3c72] hover:bg-[#2a5298] text-white rounded-xl flex items-center gap-1 text-xs font-extrabold shadow-md active:scale-95 transition-transform shrink-0 cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} /> เพิ่มผู้ใช้
          </button>
        </div>
      </div>

      {/* Users List Container */}
      <div className="px-4 space-y-3.5 max-w-2xl mx-auto">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-5 flex gap-3 animate-pulse border border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#1e1e1e] rounded-3xl border border-gray-150/40 dark:border-gray-800 shadow-sm">
            <Users size={48} className="mx-auto mb-3 opacity-20 text-gray-400" />
            <p className="font-extrabold text-gray-400 text-xs uppercase tracking-wide">ไม่พบข้อมูลบัญชีผู้ใช้งานที่ค้นหา</p>
          </div>
        ) : (
          filteredUsers.map(u => (
            <div
              key={u.id}
              className={`bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xs p-4 flex items-center justify-between gap-3 border border-gray-100/50 dark:border-gray-800 border-l-4 ${
                u.role === 'Admin' ? 'border-l-red-500' : u.role === 'Merchant' ? 'border-l-green-500' : 'border-l-blue-500'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                  u.role === 'Admin' ? 'bg-red-50 text-red-600 dark:bg-red-950/20' : u.role === 'Merchant' ? 'bg-green-50 text-green-600 dark:bg-emerald-950/20' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20'
                }`}>
                  <User size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-xs text-gray-800 dark:text-gray-200 truncate leading-none">{u.name}</p>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${roleColor[u.role]}`}>
                      {roleLabel[u.role]}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1.5 leading-normal">
                    รหัส ID: <span className="text-gray-650 dark:text-gray-300 font-extrabold">{u.id}</span>
                    {u.nickname && ` • ชื่อเล่น: ${u.nickname}`}
                    {u.phone && ` • โทร: ${u.phone}`}
                    {u.shop_name && ` • ร้าน: ${u.shop_name}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 ml-1">
                <button
                  onClick={() => setUserModal({ id: u.id, pwd: u.password, name: u.name, nick: u.nickname, phone: u.phone, role: u.role, shop: u.shop_name, email: u.email })}
                  className="w-8.5 h-8.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 duration-100 transition-all shadow-xs"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDeleteUser(u.id)}
                  className="w-8.5 h-8.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 duration-100 transition-all shadow-xs"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal Sheet */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setUserModal(null)} />
          <div className="relative bg-white dark:bg-[#1e1e1e] rounded-t-[28px] max-h-[85vh] flex flex-col shadow-2xl animate-slide-up border-t border-white/10">
            
            <div className="sticky top-0 bg-white dark:bg-[#1e1e1e] px-5 py-4 flex items-center justify-between border-b border-gray-150 dark:border-gray-800 shrink-0 rounded-t-[28px]">
              <h3 className="font-extrabold text-base text-gray-850 dark:text-gray-150">
                {users.some(u => u.id === userModal.id) ? '✏️ แก้ไขสิทธิ์/ข้อมูลผู้ใช้งาน' : '➕ เพิ่มบัญชีผู้ใช้ระบบใหม่'}
              </h3>
              <button onClick={() => setUserModal(null)} className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-8">
              {[
                { k: 'id', label: 'รหัสประจำตัว (ID) *', type: 'text', ph: 'เช่น 66001 หรือ admin001', disabled: users.some(u => u.id === userModal.id) },
                { k: 'pwd', label: 'รหัสผ่านในการเข้าใช้งาน *', type: 'password', ph: 'ความยาวรหัสผ่านไม่จำกัด' },
                { k: 'name', label: 'ชื่อ-นามสกุลสมาชิก *', type: 'text', ph: 'ชื่อเต็มสำหรับใช้ในการแสดงผลและออกใบเสร็จ' },
                { k: 'nick', label: 'ชื่อเล่น', type: 'text', ph: 'ชื่อเล่นลูกค้าหรือร้านค้า' },
                { k: 'phone', label: 'หมายเลขเบอร์โทรศัพท์ติดต่อ', type: 'tel', ph: 'ใช้ในการติดต่อกรณีสินค้าหมด/ส่งสินค้า' },
                { k: 'email', label: 'ที่อยู่อีเมลสมาชิก', type: 'email', ph: 'อีเมล' },
              ].map(({ k, label, type, ph, disabled }) => (
                <div key={k}>
                  <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 mb-1 block">{label}</label>
                  <input
                    type={type}
                    value={userModal[k] || ''}
                    disabled={disabled}
                    onChange={e => setUserModal({ ...userModal, [k]: e.target.value })}
                    placeholder={ph}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-[#1e3c72]/30 disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-950 dark:text-gray-200"
                  />
                </div>
              ))}

              <div>
                <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 mb-1.5 block">ประเภทสิทธิ์ผู้ใช้งาน (Role) *</label>
                <select
                  value={userModal.role}
                  onChange={e => setUserModal({ ...userModal, role: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-55 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-[#1e3c72]/30 dark:text-gray-250 font-bold"
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{roleLabel[r]}</option>
                  ))}
                </select>
              </div>

              {userModal.role === 'Merchant' && (
                <div className="animate-slide-up">
                  <label className="text-[11px] font-bold text-gray-550 dark:text-gray-400 mb-1 block">ชื่อร้านค้าแผงสั่งซื้ออาหาร *</label>
                  <input
                    type="text"
                    value={userModal.shop || ''}
                    onChange={e => setUserModal({ ...userModal, shop: e.target.value })}
                    placeholder="ระบุชื่อร้านค้าของแม่ค้าอย่างเป็นทางการ"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-850 bg-gray-50 dark:bg-gray-900 text-xs outline-none focus:ring-2 focus:ring-[#1e3c72]/30 dark:text-gray-200 font-bold"
                  />
                </div>
              )}

              <button
                onClick={handleSaveUser}
                className="w-full bg-gradient-to-r from-[#1e3c72] to-[#2a5298] hover:opacity-95 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                บันทึกการตั้งค่าผู้ใช้
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
