import axios from 'axios';
import {
  User, Product, PriceHistoryResponse, WatchlistResponse,
  WatchlistItem, PriceAlertRule, NotificationItem, ShoppingList,
  ShoppingListItem, Budget, RecurringPurchase, PurchaseRecord,
  SavingsSummary, DealScoreResponse, SystemStatus, ProviderHealth, RefreshJob
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartcart_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiClient = {
  // Auth
  register: (data: any) => api.post<{ access_token: string; token_type: string; user: User }>('/auth/register', data),
  login: (data: any) => api.post<{ access_token: string; token_type: string; user: User }>('/auth/login', data),
  getMe: () => api.get<User>('/auth/me'),
  updateProfile: (data: any) => api.put<User>('/auth/profile', data),

  // Products
  getProducts: (params?: { search?: string; category?: string; sort_by?: string; limit?: number }) =>
    api.get<Product[]>('/products', { params }),
  getProductDetail: (id: number) => api.get<any>(`/products/${id}`),
  getProductHistory: (id: number, timeframe?: string) =>
    api.get<PriceHistoryResponse>(`/products/${id}/history`, { params: { timeframe } }),
  getCategories: () => api.get<{ category: string; count: number }[]>('/products/categories'),
  getRetailers: () => api.get<any[]>('/products/retailers'),

  // Watchlist
  getWatchlist: () => api.get<{ id: number; items: WatchlistItem[] }>('/watchlist'),
  addToWatchlist: (data: { product_id: number; target_price?: number; note?: string; priority?: string }) =>
    api.post<WatchlistItem>('/watchlist', data),
  removeFromWatchlist: (itemId: number) => api.delete(`/watchlist/${itemId}`),

  // Alerts & Notifications
  getAlertRules: () => api.get<PriceAlertRule[]>('/alerts/rules'),
  createAlertRule: (data: { product_id: number; rule_type: string; threshold_value?: number }) =>
    api.post<PriceAlertRule>('/alerts/rules', data),
  deleteAlertRule: (id: number) => api.delete(`/alerts/rules/${id}`),
  getNotifications: () => api.get<NotificationItem[]>('/alerts/notifications'),
  markNotificationRead: (id: number) => api.put(`/alerts/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/alerts/notifications/read-all'),

  // Comparison
  compareProduct: (id: number) => api.get<any>(`/compare/${id}`),

  // Planner
  getShoppingLists: () => api.get<ShoppingList[]>('/planner/lists'),
  createShoppingList: (data: { title: string; description?: string; color?: string }) =>
    api.post<ShoppingList>('/planner/lists', data),
  deleteShoppingList: (id: number) => api.delete(`/planner/lists/${id}`),
  addItemToList: (listId: number, data: { item_title: string; desired_quantity?: number; estimated_unit_price?: number; priority?: string; product_id?: number }) =>
    api.post<ShoppingListItem>(`/planner/lists/${listId}/items`, data),
  updateListItem: (itemId: number, data: any) => api.put<ShoppingListItem>(`/planner/lists/items/${itemId}`, data),
  deleteListItem: (itemId: number) => api.delete(`/planner/lists/items/${itemId}`),

  // Budgets
  getBudgets: (monthYear?: string) => api.get<Budget[]>('/planner/budgets', { params: { month_year: monthYear } }),
  setBudget: (data: { month_year: string; category?: string; budget_limit: number }) =>
    api.post<Budget>('/planner/budgets', data),

  // Recurring
  getRecurring: () => api.get<RecurringPurchase[]>('/planner/recurring'),
  createRecurring: (data: { custom_title: string; replenishment_interval_days?: number; product_id?: number }) =>
    api.post<RecurringPurchase>('/planner/recurring', data),
  replenishRecurring: (id: number) => api.post<RecurringPurchase>(`/planner/recurring/${id}/replenish`),

  // Purchases
  getPurchases: () => api.get<PurchaseRecord[]>('/planner/purchases'),
  logPurchase: (data: { purchase_price: number; original_baseline_price?: number; product_id?: number; retailer_id?: number; notes?: string }) =>
    api.post<PurchaseRecord>('/planner/purchases', data),

  // Analytics
  getSavingsSummary: () => api.get<SavingsSummary>('/analytics/savings-summary'),
  getDealIntelligence: (productId: number, targetPrice?: number) =>
    api.get<DealScoreResponse>(`/analytics/deal-intelligence/${productId}`, { params: { target_price: targetPrice } }),

  // System
  getSystemStatus: () => api.get<SystemStatus>('/system/status'),
  getProviderHealth: () => api.get<ProviderHealth[]>('/system/providers'),
  triggerRefresh: () => api.post<RefreshJob>('/system/refresh'),
  getJobs: () => api.get<RefreshJob[]>('/system/jobs'),
};

export default api;
