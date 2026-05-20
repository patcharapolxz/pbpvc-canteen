'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore, getPersistedUser } from '@/lib/store';
import { menuApi, shopsApi, utilsApi } from '@/lib/api';
import BottomNav from '@/components/BottomNav';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface MenuItem { id: string; name: string; price: number; cat: string; img: string; status: string; options: any[]; recommend: boolean; }

const CATS = ['Food','Noodle','Drink','Snack','Dessert','Fruit','Other'];

export default function MerchantPage() {
  const router = useRouter();
  const { user } = useAppStore();
  const [menu,    setMenu]    = useState<MenuItem[]>([]);
  const [isOpen,  setIsOpen]  = useState(true);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<Partial<MenuItem> | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState('');
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => {
    setMounted(true);
    const loggedInUser = getPersistedUser();
    if (!loggedInUser || loggedInUser.role !== 'Merchant') { router.replace('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    setLoading(true);
    try {
      const [menuRes, statusRes]: any[] = await Promise.all([
        menuApi.get(loggedInUser.shop),
        shopsApi.profile(loggedInUser.id),
      ]);
      if (menuRes.success) setMenu(menuRes.data);
      if (statusRes.success) setIsOpen(statusRes.data.status !== 'Closed');
    } catch {}
    setLoading(false);
  };

  const toggleOpen = async () => {
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    const next = !isOpen;
    const res: any = await shopsApi.toggleStatus(loggedInUser.id, next);
    if (res.success) { setIsOpen(next); toast.success(next ? 'ร้านเปิดแล้ว' : 'ร้านปิดแล้ว'); }
  };

  const openNew = () => {
    setModal({ name:'', price: 0, cat:'Food', status:'Available', options:[], recommend:false, img:'' });
    setImgFile(null); setImgPreview('');
  };

  const openEdit = (item: MenuItem) => {
    setModal({ ...item });
    setImgPreview(item.img || '');
    setImgFile(null);
  };

  const handleImgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!modal?.name) { toast.error('กรุณากรอกชื่อเมนู'); return; }
    const loggedInUser = getPersistedUser();
    if (!loggedInUser) return;
    setSaving(true);
    try {
      let imgUrl = modal.img || '';
      if (imgFile) imgUrl = await utilsApi.uploadImage(imgFile, 'food');
      const res: any = await menuApi.save({ ...modal, img: imgUrl, shop: loggedInUser.shop });
      if (res.success) { toast.success('บันทึกแล้ว'); setModal(null); loadData(); }
      else toast.error(res.msg);
    } catch { toast.error('เกิดข้อผิดพลาด'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ลบเมนูนี้?')) return;
    const res: any = await menuApi.delete(id);
    if (res.success) { toast.success('ลบแล้ว'); loadData(); }
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
      {/* Header LINE MAN Style */}
      <div className="bg-[#006837] text-white px-5 pt-10 pb-[60px] rounded-b-[25px] shadow-[0_4px_15px_rgba(0,104,55,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{currentUser.shop}</h1>
            <p className="text-white/70 text-sm">จัดการเมนูอาหาร</p>
          </div>
          <button onClick={toggleOpen}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm border-2 ${
              isOpen ? 'border-white/50 bg-white/20' : 'border-red-300 bg-red-500/30'}`}>
            {isOpen ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            {isOpen ? 'ร้านเปิด' : 'ร้านปิด'}
          </button>
        </div>
      </div>

      {/* Floating Action */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl p-2 shadow-[0_8px_25px_rgba(0,0,0,0.08)] flex justify-between items-center px-4">
          <div className="font-bold text-gray-600 text-sm">จัดการเมนูอาหาร</div>
          <button onClick={openNew}
            className="bg-[#00a568] text-white py-2 px-4 rounded-xl font-bold flex items-center gap-1 shadow-md active:scale-95 transition-transform">
            <Plus size={16} /> เพิ่มเมนู
          </button>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {loading ? (
          Array.from({length:4}).map((_,i) => (
            <div key={i} className="bg-white rounded-2xl p-4 flex gap-3">
              <div className="skeleton w-16 h-16 rounded-xl" />
              <div className="flex-1 space-y-2"><div className="skeleton h-5 w-2/3" /><div className="skeleton h-4 w-1/3" /></div>
            </div>
          ))
        ) : menu.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">🍽️</p>
            <p>ยังไม่มีเมนู กด "เพิ่มเมนูใหม่" เพื่อเริ่มต้น</p>
          </div>
        ) : menu.map(item => (
          <div key={item.id}
            className={`bg-white rounded-2xl shadow-(--card-shadow) flex items-center gap-3 p-4 ${item.status==='Hidden'?'opacity-50':''}`}>
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              {item.img
                ? <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                {item.recommend && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">⭐แนะนำ</span>}
              </div>
              <p className="text-[#006837] font-bold">{item.price.toLocaleString()} ฿</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                item.status==='Available'?'bg-green-100 text-green-700':item.status==='Soldout'?'bg-red-100 text-red-600':'bg-gray-100 text-gray-500'}`}>
                {item.status==='Available'?'มีจำหน่าย':item.status==='Soldout'?'หมด':'ซ่อน'}
              </span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => openEdit(item)} className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Menu Modal */}
      {modal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setModal(null)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 py-4 flex items-center justify-between border-b">
              <h3 className="font-bold text-lg">{modal.id ? 'แก้ไขเมนู' : 'เพิ่มเมนู'}</h3>
              <button onClick={() => setModal(null)}><X size={22} className="text-gray-400" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Image */}
              <label className="block cursor-pointer">
                <div className="w-full h-40 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center relative">
                  {imgPreview
                    ? <img src={imgPreview} alt="" className="w-full h-full object-cover" />
                    : <div className="text-center text-gray-400"><Camera size={32} className="mx-auto mb-1" /><p className="text-sm">แตะเพื่อเลือกรูป</p></div>
                  }
                </div>
                <input type="file" accept="image/*" onChange={handleImgChange} className="hidden" />
              </label>
              {[
                { key:'name',  label:'ชื่อเมนู *', type:'text',   ph:'เช่น ข้าวผัดกระเพรา' },
                { key:'price', label:'ราคา (฿) *',  type:'number', ph:'40' },
              ].map(({key, label, type, ph}) => (
                <div key={key}>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
                  <input type={type} value={(modal as any)[key]} onChange={e => setModal({...modal, [key]: type==='number'?Number(e.target.value):e.target.value})}
                    placeholder={ph}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-[#006837]/30 focus:border-[#006837]" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">หมวดหมู่</label>
                <select value={modal.cat} onChange={e => setModal({...modal, cat: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none">
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">สถานะ</label>
                <select value={modal.status} onChange={e => setModal({...modal, status: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none">
                  <option value="Available">มีจำหน่าย</option>
                  <option value="Soldout">หมด</option>
                  <option value="Hidden">ซ่อน</option>
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={modal.recommend} onChange={e => setModal({...modal, recommend: e.target.checked})}
                  className="w-5 h-5 accent-[#006837]" />
                <span className="text-sm font-medium">⭐ เมนูแนะนำ</span>
              </label>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
