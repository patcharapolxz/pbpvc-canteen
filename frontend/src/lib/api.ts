// ====================================
// API Base URL — points to PHP backend
// ====================================
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/pbpvccanteen/backend/api';

// Generic fetch wrapper
async function apiFetch<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data: T; msg: string }> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── AUTH ────────────────────────────────────────────────────
export const authApi = {
  login: (id: string, pwd: string) =>
    apiFetch(`${API_BASE}/auth.php?action=login`, { method: 'POST', body: JSON.stringify({ id, pwd }) }),

  register: (form: { id: string; pwd: string; name: string; nick: string; phone: string; email: string }) =>
    apiFetch(`${API_BASE}/auth.php?action=register`, { method: 'POST', body: JSON.stringify(form) }),

  forgotPassword: (id: string, phone: string) =>
    apiFetch(`${API_BASE}/auth.php?action=forgot-password`, { method: 'POST', body: JSON.stringify({ id, phone }) }),
};

// ─── SHOPS ───────────────────────────────────────────────────
export const shopsApi = {
  list: () => apiFetch(`${API_BASE}/shops.php?action=list`),
  profile: (uid: string) => apiFetch(`${API_BASE}/shops.php?action=profile&uid=${uid}`),
  toggleStatus: (uid: string, isOpen: boolean) =>
    apiFetch(`${API_BASE}/shops.php?action=toggle-status`, { method: 'PUT', body: JSON.stringify({ uid, isOpen }) }),
  saveConfig: (uid: string, open: string, close: string) =>
    apiFetch(`${API_BASE}/shops.php?action=save-config`, { method: 'PUT', body: JSON.stringify({ uid, open, close }) }),
  saveProfile: (form: Record<string, unknown>) =>
    apiFetch(`${API_BASE}/shops.php?action=save-profile`, { method: 'PUT', body: JSON.stringify(form) }),
};

// ─── MENU ────────────────────────────────────────────────────
export const menuApi = {
  get: (shop: string) => apiFetch(`${API_BASE}/menu.php?action=get&shop=${encodeURIComponent(shop)}`),
  save: (item: Record<string, unknown>) =>
    apiFetch(`${API_BASE}/menu.php?action=save`, { method: 'POST', body: JSON.stringify(item) }),
  delete: (id: string) => apiFetch(`${API_BASE}/menu.php?action=delete&id=${id}`, { method: 'DELETE' }),
};

// ─── ORDERS ──────────────────────────────────────────────────
export const ordersApi = {
  get: (role: string, userId: string) =>
    apiFetch(`${API_BASE}/orders.php?action=get&role=${role}&userId=${userId}`),
  place: (data: Record<string, unknown>) =>
    apiFetch(`${API_BASE}/orders.php?action=place`, { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (orderId: string, status: string) =>
    apiFetch(`${API_BASE}/orders.php?action=update-status`, { method: 'PUT', body: JSON.stringify({ orderId, status }) }),
  cancel: (orderId: string) =>
    apiFetch(`${API_BASE}/orders.php?action=cancel&orderId=${orderId}`, { method: 'DELETE' }),
};

// ─── NOTIFICATIONS ───────────────────────────────────────────
export const notifApi = {
  get: (userId: string) => apiFetch(`${API_BASE}/notifications.php?action=get&userId=${userId}`),
  markRead: (userId: string) =>
    apiFetch(`${API_BASE}/notifications.php?action=mark-read`, { method: 'PUT', body: JSON.stringify({ userId }) }),
};

// ─── NEWS ────────────────────────────────────────────────────
export const newsApi = {
  get: () => apiFetch(`${API_BASE}/news.php?action=get`),
  post: (msg: string) => apiFetch(`${API_BASE}/news.php?action=post`, { method: 'POST', body: JSON.stringify({ msg }) }),
  clear: () => apiFetch(`${API_BASE}/news.php?action=clear`, { method: 'DELETE' }),
};

// ─── REVIEWS ─────────────────────────────────────────────────
export const reviewsApi = {
  submit: (data: Record<string, unknown>) =>
    apiFetch(`${API_BASE}/reviews.php?action=submit`, { method: 'POST', body: JSON.stringify(data) }),
  get: (shop: string) => apiFetch(`${API_BASE}/reviews.php?action=get&shop=${encodeURIComponent(shop)}`),
};

// ─── ADMIN ───────────────────────────────────────────────────
export const adminApi = {
  getUsers: () => apiFetch(`${API_BASE}/admin.php?action=users`),
  saveUser: (user: Record<string, unknown>) =>
    apiFetch(`${API_BASE}/admin.php?action=save-user`, { method: 'POST', body: JSON.stringify(user) }),
  deleteUser: (id: string) => apiFetch(`${API_BASE}/admin.php?action=delete-user&id=${id}`, { method: 'DELETE' }),
  getStats: () => apiFetch(`${API_BASE}/admin.php?action=stats`),
};

// ─── UTILS ───────────────────────────────────────────────────
export const utilsApi = {
  uploadImage: async (file: File, type: 'food' | 'slip' | 'shop'): Promise<string> => {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${API_BASE}/utils.php?action=image&type=${type}`, { method: 'POST', body: form });
    const json = await res.json();
    return json.data?.url || '';
  },
  getFavorites: (uid: string) => apiFetch(`${API_BASE}/utils.php?action=get-favorites&uid=${uid}`),
  saveFavorites: (uid: string, favs: string[]) =>
    apiFetch(`${API_BASE}/utils.php?action=save-favorites`, { method: 'PUT', body: JSON.stringify({ uid, favs }) }),
  saveStudentProfile: (form: Record<string, unknown>) =>
    apiFetch(`${API_BASE}/utils.php?action=save-student-profile`, { method: 'POST', body: JSON.stringify(form) }),
  reportIssue: (data: Record<string, unknown>) =>
    apiFetch(`${API_BASE}/utils.php?action=report-issue`, { method: 'POST', body: JSON.stringify(data) }),
};
