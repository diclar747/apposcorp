import type { BillingCycle } from '@/types';
// API Client for Oscorp Platform
const API_URL = '/api';

// Helper to get token
const getToken = () => localStorage.getItem('oscorp-token') || sessionStorage.getItem('oscorp-token');

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

  if (response.status === 401) {
    // Let the calling code handle unauthorized errors
    // Instead of forcing a hard redirect here
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.details || error.error || `HTTP ${response.status}`);
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

  resendVerification: (email: string) =>
    fetchWithAuth('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  addRole: (role: string) =>
    fetchWithAuth('/auth/add-role', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getMe: () => fetchWithAuth('/auth/me'),

  updateMe: (data: any) =>
    fetchWithAuth('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (currentPassword: string, newPassword: string) =>
    fetchWithAuth('/auth/me/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
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
  update: (id: string, data: any) =>
    fetchWithAuth(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateProfile: (data: any) =>
    fetchWithAuth('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updatePassword: (data: any) =>
    fetchWithAuth('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  updateIngenio: (id: string, hasAccess: boolean, installmentsPaid?: number, totalInstallments?: number) =>
    fetchWithAuth(`/users/${id}/ingenio`, {
      method: 'PATCH',
      body: JSON.stringify({ hasAccess, installmentsPaid, totalInstallments }),
    }),
  getPreferences: () => fetchWithAuth('/users/me/preferences'),
  updatePreferences: (data: any) =>
    fetchWithAuth('/users/me/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  assignPlan: (userId: string, data: { planId?: string; billingCycle?: BillingCycle; customCommission?: number }) =>
    fetchWithAuth(`/users/${userId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  assignCourse: (userId: string, courseId: string) =>
    fetchWithAuth(`/users/${userId}/courses/${courseId}`, {
      method: 'POST',
    }),
  removeCourse: (userId: string, courseId: string) =>
    fetchWithAuth(`/users/${userId}/courses/${courseId}`, {
      method: 'DELETE',
    }),
  upgradeToClient: () => fetchWithAuth('/users/upgrade-to-client', { method: 'POST' }),
};

// Plans API
export const plansApi = {
  getAll: () => fetchWithAuth('/plans'),
  getById: (id: string) => fetchWithAuth(`/plans/${id}`),
  create: (data: any) =>
    fetchWithAuth('/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchWithAuth(`/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/plans/${id}`, {
      method: 'DELETE',
    }),
  getPublic: () => fetchWithAuth('/plans/public'),
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
  getAll: (as: 'buyer' | 'seller' | 'admin' = 'buyer') =>
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
  deposit: (amount: number, description?: string, receiptUrl?: string) =>
    fetchWithAuth('/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, description, receiptUrl }),
    }),
  transfer: (toUserId: string, amount: number, description?: string, pin?: string) =>
    fetchWithAuth('/wallet/transfer', {
      method: 'POST',
      body: JSON.stringify({ toUserId, amount, description, pin }),
    }),
  approveDeposit: (id: string) =>
    fetchWithAuth(`/wallet/approve-deposit/${id}`, { method: 'POST' }),
  rejectDeposit: (id: string) =>
    fetchWithAuth(`/wallet/reject-deposit/${id}`, { method: 'POST' }),
  getPinStatus: () => fetchWithAuth('/wallet/pin-status'),
  setPin: (pin: string) =>
    fetchWithAuth('/wallet/pin/set', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),
  verifyPin: (pin: string) =>
    fetchWithAuth('/wallet/pin/verify', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),
  changePin: (currentPin: string, newPin: string) =>
    fetchWithAuth('/wallet/pin/change', {
      method: 'POST',
      body: JSON.stringify({ currentPin, newPin }),
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
  approveWithdrawal: (id: string) =>
    fetchWithAuth(`/wallet/approve-withdrawal/${id}`, { method: 'POST' }),
  rejectWithdrawal: (id: string) =>
    fetchWithAuth(`/wallet/reject-withdrawal/${id}`, { method: 'POST' }),
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
  reject: (id: string, reason?: string) =>
    fetchWithAuth(`/credits/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),
  cancel: (id: string) =>
    fetchWithAuth(`/credits/${id}/cancel`, {
      method: 'PATCH',
    }),
  update: (id: string, data: any) =>
    fetchWithAuth(`/credits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  remove: (id: string) =>
    fetchWithAuth(`/credits/${id}`, {
      method: 'DELETE',
    }),
  payInstallment: (id: string, installmentId: string, paymentMethod: string) =>
    fetchWithAuth(`/credits/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ installmentId, paymentMethod }),
    }),
  uploadDocuments: async (creditId: string, files: { file: File; type: string }[]) => {
    const formData = new FormData();
    files.forEach(({ file, type }) => {
      formData.append('documents', file);
      formData.append('types', type);
    });
    const token = getToken();
    const res = await fetch(`${API_URL}/credits/${creditId}/documents`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
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

// Push Notifications API
export const pushApi = {
  getStats: () => fetchWithAuth('/push/stats'),
  getStatus: () => fetchWithAuth('/push/status'),
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

// Customers API
export const customersApi = {
  getAll: () => fetchWithAuth('/customers'),
  create: (data: any) =>
    fetchWithAuth('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    fetchWithAuth(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/customers/${id}`, {
      method: 'DELETE',
    }),
};

// Seller Management API
export const managementApi = {
  getSummary: () => fetchWithAuth('/seller-management/summary'),
  getCategories: () => fetchWithAuth('/seller-management/categories'),
  createCategory: (data: any) =>
    fetchWithAuth('/seller-management/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: any) =>
    fetchWithAuth(`/seller-management/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    fetchWithAuth(`/seller-management/categories/${id}`, {
      method: 'DELETE',
    }),
  getMovements: (params?: { type?: string; categoryId?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchWithAuth(`/seller-management/movements${query ? `?${query}` : ''}`);
  },
  createMovement: (data: any) =>
    fetchWithAuth('/seller-management/movements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteMovement: (id: string) =>
    fetchWithAuth(`/seller-management/movements/${id}`, {
      method: 'DELETE',
    }),
  seedCategories: () =>
    fetchWithAuth('/seller-management/seed-categories', {
      method: 'POST',
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
  delete: (id: string) =>
    fetchWithAuth(`/purchases/${id}`, {
      method: 'DELETE',
    }),
};

// Courses API
export const coursesApi = {
  getAll: (all?: boolean) => fetchWithAuth(`/courses${all ? '?all=true' : ''}`),
  getById: (id: string) => fetchWithAuth(`/courses/${id}`),
  getMyCourses: () => fetchWithAuth('/courses/my/enrollments'),
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
  requestAccess: (id: string) =>
    fetchWithAuth(`/courses/${id}/request`, {
      method: 'POST',
    }),
  // Modules
  addModule: (courseId: string, data: any) =>
    fetchWithAuth(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateModule: (moduleId: string, data: any) =>
    fetchWithAuth(`/courses/modules/${moduleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteModule: (moduleId: string) =>
    fetchWithAuth(`/courses/modules/${moduleId}`, {
      method: 'DELETE',
    }),
  // Lessons
  addLesson: (moduleId: string, data: any) =>
    fetchWithAuth(`/courses/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLesson: (lessonId: string, data: any) =>
    fetchWithAuth(`/courses/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteLesson: (lessonId: string) =>
    fetchWithAuth(`/courses/lessons/${lessonId}`, {
      method: 'DELETE',
    }),
  // Resources
  addResource: (data: any) =>
    fetchWithAuth('/courses/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteResource: (resourceId: string) =>
    fetchWithAuth(`/courses/resources/${resourceId}`, {
      method: 'DELETE',
    }),
  // Course Access (admin)
  getAccess: (courseId: string) =>
    fetchWithAuth(`/courses/${courseId}/access`),
  assignUser: (courseId: string, userId: string) =>
    fetchWithAuth(`/courses/${courseId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  removeAccess: (courseId: string, accessId: string) =>
    fetchWithAuth(`/courses/${courseId}/access/${accessId}`, {
      method: 'DELETE',
    }),
  updateProgress: (accessId: string, lessonId: string, completed: boolean) =>
    fetchWithAuth(`/courses/access/${accessId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ lessonId, completed }),
    }),
};

// Settings API
export const settingsApi = {
  get: () => fetchWithAuth('/settings'),
  update: (data: any) =>
    fetchWithAuth('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getPublic: () => fetchWithAuth('/settings/public'),
  init: () =>
    fetchWithAuth('/settings/init', {
      method: 'POST',
    }),
};

// Finances API
export const financesApi = {
  getAll: (params?: { month?: number; year?: number; type?: string; startDate?: string; endDate?: string; query?: string }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.set(key, String(value));
      });
    }
    const queryString = searchParams.toString();
    return fetchWithAuth(`/finances${queryString ? `?${queryString}` : ''}`);
  },
  getSummary: () => fetchWithAuth('/finances/summary'),
  create: (data: any) =>
    fetchWithAuth('/finances', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCategories: () => fetchWithAuth('/finances/categories'),
  createCategory: (data: any) =>
    fetchWithAuth('/finances/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getBudget: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month !== undefined) params.set('month', String(month));
    if (year !== undefined) params.set('year', String(year));
    const query = params.toString();
    return fetchWithAuth(`/finances/budget${query ? `?${query}` : ''}`);
  },
  createBudget: (data: any) =>
    fetchWithAuth('/finances/budget', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createBudgetItem: (data: any) =>
    fetchWithAuth('/finances/budget/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getBudgetItems: (month: number, year: number, filters: any = {}) => {
    const params = new URLSearchParams({
      month: month.toString(),
      year: year.toString(),
      ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v != null))
    });
    return fetchWithAuth(`/finances/budget/items?${params.toString()}`);
  },
  deleteBudgetItem: (id: string) =>
    fetchWithAuth(`/finances/budget/items/${id}`, {
      method: 'DELETE',
    }),
  updateBudgetItem: (id: string, data: any) =>
    fetchWithAuth(`/finances/budget/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  logBudgetItemProgress: (id: string, amount: number) =>
    fetchWithAuth(`/finances/budget/items/${id}/log`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),
  reactivateBudgetItem: (id: string, durationMonths: number) =>
    fetchWithAuth(`/finances/budget/items/${id}/reactivate`, {
      method: 'POST',
      body: JSON.stringify({ durationMonths }),
    }),
  update: (id: string, data: any) =>
    fetchWithAuth(`/finances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetchWithAuth(`/finances/${id}`, {
      method: 'DELETE',
    }),
};

// Reports API (superadmin)
export const reportsApi = {
  getFinancial: (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return fetchWithAuth(`/reports/financial${qs ? `?${qs}` : ''}`);
  },
  getSellerStats: () => fetchWithAuth('/reports/seller-stats'),
  getClientStats: () => fetchWithAuth('/reports/client-stats'),
  getAdminStats: () => fetchWithAuth('/reports/admin-stats'),
  exportCSV: (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    status?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.type) query.set('type', params.type);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    const token = getToken();
    return fetch(`${API_URL}/reports/financial/export${qs ? `?${qs}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(async (res) => {
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-financiero-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  },
};

// Stores API (public marketplace)
export const storesApi = {
  getAll: () => fetchWithAuth('/stores'),
  getBySlug: (slug: string) => fetchWithAuth(`/stores/${slug}`),
};

// Ingenio Millonario API
export const ingenioApi = {
  // Setup
  setup: () => fetchWithAuth('/ingenio/setup', { method: 'POST' }),
  
  // Stats
  getStats: () => fetchWithAuth('/ingenio/stats'),
  
  // Stages
  getStages: () => fetchWithAuth('/ingenio/stages'),
  createStage: (data: any) => fetchWithAuth('/ingenio/stages', { method: 'POST', body: JSON.stringify(data) }),
  updateStage: (id: string, data: any) => fetchWithAuth(`/ingenio/stages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStage: (id: string) => fetchWithAuth(`/ingenio/stages/${id}`, { method: 'DELETE' }),
  
  // Segments
  getSegments: (stageId: string) => fetchWithAuth(`/ingenio/segments/${stageId}`),
  createSegment: (data: any) => fetchWithAuth('/ingenio/segments', { method: 'POST', body: JSON.stringify(data) }),
  updateSegment: (id: string, data: any) => fetchWithAuth(`/ingenio/segments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSegment: (id: string) => fetchWithAuth(`/ingenio/segments/${id}`, { method: 'DELETE' }),
  
  // Students
  getStudents: () => fetchWithAuth('/ingenio/students'),
  getMyStudentProfile: () => fetchWithAuth('/ingenio/students/me'),
  registerAsStudent: (data: any) => fetchWithAuth('/ingenio/students/register', { method: 'POST', body: JSON.stringify(data) }),
  updateStudentProfile: (data: any) => fetchWithAuth('/ingenio/students/me', { method: 'PUT', body: JSON.stringify(data) }),
  
  // Public
  getPublicWheel: (stageName: string) => fetch(`/api/ingenio/public/wheel/${stageName}`).then(r => r.json()),

  // Subscription
  getConfig: () => fetchWithAuth('/ingenio/config'),
  subscribe: (data: { installments: number; paymentMethod: 'WALLET' | 'BANK_TRANSFER', receiptUrl?: string }) => 
    fetchWithAuth('/ingenio/subscribe', { method: 'POST', body: JSON.stringify(data) }),
  getMySubscription: () => fetchWithAuth('/ingenio/me'),
  
  // Admin Subscriptions
  getAllSubscriptions: () => fetchWithAuth('/ingenio/admin/subscriptions'),
  approveSubscription: (id: string, amountPaid: number) => fetchWithAuth(`/ingenio/admin/subscriptions/${id}/approve`, { method: 'PUT', body: JSON.stringify({ amountPaid }) }),
  revokeSubscription: (id: string) => fetchWithAuth(`/ingenio/admin/subscriptions/${id}/revoke`, { method: 'PUT' }),
  deleteSubscription: (id: string) => fetchWithAuth(`/ingenio/admin/subscriptions/${id}`, { method: 'DELETE' }),

  // Materials
  getMaterials: () => fetchWithAuth('/ingenio/materials'),
  createMaterial: (data: any) => fetchWithAuth('/ingenio/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id: string, data: any) => fetchWithAuth(`/ingenio/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id: string) => fetchWithAuth(`/ingenio/materials/${id}`, { method: 'DELETE' }),
};

// General API for uploads etc
// Reviews API
export const reviewsApi = {
  getByStore: (storeId: string) => fetchWithAuth(`/reviews/store/${storeId}`),
  create: (data: { storeId?: string; productId?: string; rating: number; comment: string }) =>
    fetchWithAuth('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.details || error.error || 'Error al subir el archivo');
    }

    return response.json();
  }
};

export const sellerSubscriptionsApi = {
  getMySubscription: () => fetchWithAuth('/seller-subscriptions/my-subscription'),
  subscribe: (data: { planId: string, paymentMethod: string, receiptUrl?: string, billingCycle: string }) =>
    fetchWithAuth('/seller-subscriptions/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAll: () => fetchWithAuth('/seller-subscriptions/all'),
  approve: (id: string, amountPaid: number) =>
    fetchWithAuth(`/seller-subscriptions/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ amountPaid }),
    }),
  revoke: (id: string) =>
    fetchWithAuth(`/seller-subscriptions/${id}/revoke`, {
      method: 'POST',
    }),
  delete: (id: string) =>
    fetchWithAuth(`/seller-subscriptions/${id}`, {
      method: 'DELETE',
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
  customers: customersApi,
  purchases: purchasesApi,
  courses: coursesApi,
  settings: settingsApi,
  finances: financesApi,
  management: managementApi,
  reports: reportsApi,
  plans: plansApi,
  sellerSubscriptions: sellerSubscriptionsApi,
};
