// API Client for Oscorp Platform
const API_URL = '/api';

// Helper to get token
const getToken = () => localStorage.getItem('oscorp-token');

// Generic fetch with auth
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: any) =>
    fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => fetchWithAuth('/auth/me'),

  updateMe: (data: any) =>
    fetchWithAuth('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Users API
export const usersApi = {
  getAll: () => fetchWithAuth('/users'),
  getById: (id: string) => fetchWithAuth(`/users/${id}`),
  updateStatus: (id: string, isActive: boolean) =>
    fetchWithAuth(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/users/${id}`, {
      method: 'DELETE',
    }),
  updateSellerProfile: (data: any) =>
    fetchWithAuth('/users/seller-profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateSellerProfileById: (userId: string, data: any) =>
    fetchWithAuth(`/users/${userId}/seller-profile`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateBankData: (data: any) =>
    fetchWithAuth('/users/me/bank-data', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  search: (query: string) => fetchWithAuth(`/users/search?query=${query}`),
};

// Products API
export const productsApi = {
  getAll: (params?: { category?: string; search?: string; sellerId?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchWithAuth(`/products${query ? `?${query}` : ''}`);
  },
  getFeatured: () => fetchWithAuth('/products/featured'),
  getById: (id: string) => fetchWithAuth(`/products/${id}`),
  create: (data: any) =>
    fetchWithAuth('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchWithAuth(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/products/${id}`, {
      method: 'DELETE',
    }),
};

// Orders API
export const ordersApi = {
  getAll: (as: 'buyer' | 'seller' = 'buyer') =>
    fetchWithAuth(`/orders?as=${as}`),
  getById: (id: string) => fetchWithAuth(`/orders/${id}`),
  create: (data: any) =>
    fetchWithAuth('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateStatus: (id: string, status: string, description?: string) =>
    fetchWithAuth(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, description }),
    }),
};

// Wallet API
export const walletApi = {
  getWallet: () => fetchWithAuth('/wallet'),
  getTransactions: (params?: { limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchWithAuth(`/wallet/transactions${query ? `?${query}` : ''}`);
  },
  deposit: (amount: number, description?: string) =>
    fetchWithAuth('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    }),
  transfer: (toUserId: string, amount: number, description?: string) =>
    fetchWithAuth('/wallet/transfer', {
      method: 'POST',
      body: JSON.stringify({ toUserId, amount, description }),
    }),
  getCard: () => fetchWithAuth('/wallet/card'),
  updateCardDesign: (design: string) =>
    fetchWithAuth('/wallet/card/design', {
      method: 'PATCH',
      body: JSON.stringify({ design }),
    }),
  withdraw: (amount: number, description?: string) =>
    fetchWithAuth('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, description }),
    }),
  getAllTransactions: () => fetchWithAuth('/wallet/all-transactions'),
};


// Credits API
export const creditsApi = {
  getAll: () => fetchWithAuth('/credits'),
  getById: (id: string) => fetchWithAuth(`/credits/${id}`),
  create: (data: any) =>
    fetchWithAuth('/credits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approve: (id: string) =>
    fetchWithAuth(`/credits/${id}/approve`, {
      method: 'PATCH',
    }),
  reject: (id: string) =>
    fetchWithAuth(`/credits/${id}/reject`, {
      method: 'PATCH',
    }),
  payInstallment: (id: string, installmentId: string, paymentMethod: string) =>
    fetchWithAuth(`/credits/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ installmentId, paymentMethod }),
    }),
  getAllAdmin: () => fetchWithAuth('/credits/admin/all'),
};

// Notifications API
export const notificationsApi = {
  getAll: () => fetchWithAuth('/notifications'),
  markAsRead: (id: string) =>
    fetchWithAuth(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
  markAllAsRead: () =>
    fetchWithAuth('/notifications/read-all', {
      method: 'PATCH',
    }),
  sendBroadcast: (data: { title: string; message: string; targetRole: string; actionUrl?: string; imageUrl?: string }) =>
    fetchWithAuth('/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  trackClick: (id: string) =>
    fetchWithAuth(`/notifications/${id}/click`, {
      method: 'PATCH',
    }),
};

export const campaignsApi = {
  getAll: () => fetchWithAuth('/campaigns'),
  create: (data: any) =>
    fetchWithAuth('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchWithAuth(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/campaigns/${id}`, {
      method: 'DELETE',
    }),
  send: (id: string) =>
    fetchWithAuth(`/campaigns/${id}/send`, {
      method: 'POST',
    }),
};

// Suppliers API
export const suppliersApi = {
  getAll: () => fetchWithAuth('/suppliers'),
  create: (data: any) =>
    fetchWithAuth('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchWithAuth(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/suppliers/${id}`, {
      method: 'DELETE',
    }),
};

// Purchases API
export const purchasesApi = {
  getAll: () => fetchWithAuth('/purchases'),
  create: (data: any) =>
    fetchWithAuth('/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export default {
  auth: authApi,
  users: usersApi,
  products: productsApi,
  orders: ordersApi,
  wallet: walletApi,
  credits: creditsApi,
  notifications: notificationsApi,
  suppliers: suppliersApi,
  purchases: purchasesApi,
};
