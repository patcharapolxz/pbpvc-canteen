import { supabase } from './supabase';

// Generic wrapper to match the old PHP API format
async function wrap<T>(promise: Promise<{ data: any; error: any }>, successMsg = 'Success', defaultData: any = null): Promise<{ success: boolean; data: T; msg: string }> {
  try {
    const { data, error } = await promise;
    if (error) throw error;
    return { success: true, data: data ?? defaultData, msg: successMsg };
  } catch (err: any) {
    return { success: false, data: defaultData, msg: err.message || 'Error' };
  }
}

// ─── AUTH ────────────────────────────────────────────────────
export const authApi = {
  login: (id: string, pwd: string) => 
    wrap(supabase.from('users').select('*').eq('id', id).eq('password', pwd).single()),
  
  register: (form: any) => 
    wrap(supabase.from('users').insert([{ ...form, role: 'Student' }])),
  
  forgotPassword: (id: string, phone: string) => 
    wrap(supabase.from('users').select('password').eq('id', id).eq('phone', phone).single()),
};

// ─── SHOPS ───────────────────────────────────────────────────
export const shopsApi = {
  list: () => 
    wrap(supabase.from('users').select('*').in('role', ['Merchant', 'Admin']).eq('shop_status', 'Open')),
  
  profile: (uid: string) => 
    wrap(supabase.from('users').select('*').eq('id', uid).single()),
  
  toggleStatus: (uid: string, isOpen: boolean) => 
    wrap(supabase.from('users').update({ shop_status: isOpen ? 'Open' : 'Closed' }).eq('id', uid)),
  
  saveConfig: (uid: string, open: string, close: string) => 
    wrap(supabase.from('users').update({ open_time: open, close_time: close }).eq('id', uid)),
  
  saveProfile: (form: any) => 
    wrap(supabase.from('users').update(form).eq('id', form.id)),
};

// ─── MENU ────────────────────────────────────────────────────
export const menuApi = {
  get: (shop: string) => 
    wrap(supabase.from('menu').select('*').eq('shop_name', shop)),
  
  save: (item: any) => {
    if (item.id) {
       return wrap(supabase.from('menu').update(item).eq('id', item.id));
    } else {
       item.id = 'M' + Date.now();
       return wrap(supabase.from('menu').insert([item]));
    }
  },
  
  delete: (id: string) => 
    wrap(supabase.from('menu').delete().eq('id', id)),
};

// ─── ORDERS ──────────────────────────────────────────────────
export const ordersApi = {
  get: async (role: string, userId: string) => {
    if (role === 'Student') {
      return wrap(supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }));
    } else {
      // Find merchant's shop name first
      const { data: user } = await supabase.from('users').select('shop_name').eq('id', userId).single();
      if (!user?.shop_name) return { success: false, data: [], msg: 'No shop name found' };
      return wrap(supabase.from('orders').select('*').eq('shop_name', user.shop_name).order('created_at', { ascending: false }));
    }
  },
  
  place: (data: any) => {
    data.id = 'ORD' + Date.now();
    return wrap(supabase.from('orders').insert([data]));
  },
  
  updateStatus: (orderId: string, status: string) => 
    wrap(supabase.from('orders').update({ status }).eq('id', orderId)),
  
  cancel: (orderId: string) => 
    wrap(supabase.from('orders').update({ status: 'Cancelled' }).eq('id', orderId)),
};

// ─── NOTIFICATIONS ───────────────────────────────────────────
export const notifApi = {
  get: (userId: string) => 
    wrap(supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })),
  
  markRead: (userId: string) => 
    wrap(supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)),
};

// ─── NEWS ────────────────────────────────────────────────────
export const newsApi = {
  get: () => 
    wrap(supabase.from('news').select('*').order('created_at', { ascending: false })),
  
  post: (msg: string) => 
    wrap(supabase.from('news').insert([{ id: 'N' + Date.now(), message: msg }])),
  
  clear: () => 
    wrap(supabase.from('news').delete().neq('id', '0')), // Delete all
};

// ─── REVIEWS ─────────────────────────────────────────────────
export const reviewsApi = {
  submit: (data: any) => {
    data.id = 'R' + Date.now();
    return wrap(supabase.from('reviews').insert([data]));
  },
  
  get: (shop: string) => 
    wrap(supabase.from('reviews').select('*').eq('shop_name', shop).order('created_at', { ascending: false })),
};

// ─── ADMIN ───────────────────────────────────────────────────
export const adminApi = {
  getUsers: () => 
    wrap(supabase.from('users').select('*')),
  
  saveUser: (user: any) => 
    wrap(supabase.from('users').upsert([user])),
  
  deleteUser: (id: string) => 
    wrap(supabase.from('users').delete().eq('id', id)),
  
  getStats: async () => {
    try {
      const [uRes, oRes, mRes] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('orders').select('id', { count: 'exact' }),
        supabase.from('menu').select('id', { count: 'exact' })
      ]);
      return {
        success: true,
        data: { users: uRes.count || 0, orders: oRes.count || 0, menu: mRes.count || 0 },
        msg: 'Success'
      };
    } catch (e) {
      return { success: false, data: { users: 0, orders: 0, menu: 0 }, msg: 'Error' };
    }
  },
};

// ─── UTILS ───────────────────────────────────────────────────
export const utilsApi = {
  uploadImage: async (file: File, type: 'food' | 'slip' | 'shop'): Promise<string> => {
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${type}_${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage.from('images').upload(fileName, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
      return publicUrl;
    } catch (err) {
      console.error('Upload failed:', err);
      return '';
    }
  },
  
  getFavorites: async (uid: string) => {
    const res = await wrap(supabase.from('users').select('favorites').eq('id', uid).single());
    return { ...res, data: (res.data as any)?.favorites || [] };
  },
  
  saveFavorites: (uid: string, favs: string[]) => 
    wrap(supabase.from('users').update({ favorites: favs }).eq('id', uid)),
  
  saveStudentProfile: (form: any) => 
    wrap(supabase.from('users').update(form).eq('id', form.id)),
  
  reportIssue: (data: any) => {
    data.id = 'REP' + Date.now();
    return wrap(supabase.from('reports').insert([data]));
  }
};
