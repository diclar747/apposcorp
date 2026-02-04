// API Client for Oscorp Platform
// Detect if running on localhost or production
const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const API_URL = isLocalhost 
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
  : '/api';

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
};

// Courses API
export const coursesApi = {
  getAll: (params?: { category?: string; level?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchWithAuth(`/courses${query ? `?${query}` : ''}`);
  },
  getBySlug: (slug: string) => fetchWithAuth(`/courses/slug/${slug}`),
  getById: (id: string) => fetchWithAuth(`/courses/${id}`),
  create: (data: any) =>
    fetchWithAuth('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchWithAuth(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/courses/${id}`, {
      method: 'DELETE',
    }),
  enroll: (id: string) =>
    fetchWithAuth(`/courses/${id}/enroll`, {
      method: 'POST',
    }),
  getMyEnrollments: () => fetchWithAuth('/courses/my/enrollments'),
  updateProgress: (enrollmentId: string, lessonId: string, completed: boolean) =>
    fetchWithAuth(`/courses/enrollment/${enrollmentId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ lessonId, completed }),
    }),
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

export default {
  auth: authApi,
  users: usersApi,
  products: productsApi,
  orders: ordersApi,
  wallet: walletApi,
  courses: coursesApi,
  credits: creditsApi,
};
