import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { apiClient } from './api/client';
import { NotificationItem, WatchlistItem } from './types';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';

// Pages
import { Overview } from './pages/Overview';
import { Discover } from './pages/Discover';
import { Watchlist } from './pages/Watchlist';
import { Compare } from './pages/Compare';
import { DealIntelligence } from './pages/DealIntelligence';
import { ShoppingPlanner } from './pages/ShoppingPlanner';
import { PriceHistory } from './pages/PriceHistory';
import { Alerts } from './pages/Alerts';
import { SavingsAnalytics } from './pages/SavingsAnalytics';
import { SystemHealth } from './pages/SystemHealth';
import { Settings } from './pages/Settings';
import { LoginModal } from './pages/LoginModal';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Global State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  useEffect(() => {
    loadGlobalData();
  }, [user]);

  const loadGlobalData = async () => {
    try {
      const [notifRes, watchRes] = await Promise.all([
        apiClient.getNotifications(),
        apiClient.getWatchlist(),
      ]);
      setNotifications(notifRes.data);
      setWatchlistItems(watchRes.data.items);
      if (watchRes.data.items.length > 0 && !selectedProductId) {
        setSelectedProductId(watchRes.data.items[0].product_id);
      }
    } catch (err) {
      console.warn('Initial global data load notice:', err);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await apiClient.triggerRefresh();
      await loadGlobalData();
    } catch (err: any) {
      if (err?.response?.status === 429) {
        alert('A refresh scan is already in progress. Please wait.');
      } else {
        console.error('Refresh error', err);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      const res = await apiClient.getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const unreadCount = notifications.filter((n) => n.status === 'UNREAD').length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex">
      {/* Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        unreadCount={unreadCount}
        watchlistCount={watchlistItems.length}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${
          collapsed ? 'pl-16' : 'pl-60'
        }`}
      >
        <Topbar
          collapsed={collapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          notifications={notifications}
          unreadCount={unreadCount}
          onRefreshAll={handleRefreshAll}
          isRefreshing={isRefreshing}
          onOpenLoginModal={() => setShowLoginModal(true)}
          onMarkAllRead={handleMarkAllNotificationsRead}
        />

        <main className="flex-1 mt-14 p-5 max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && (
            <Overview
              setActiveTab={setActiveTab}
              setSelectedProductId={setSelectedProductId}
            />
          )}

          {activeTab === 'discover' && (
            <Discover
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setActiveTab={setActiveTab}
              setSelectedProductId={setSelectedProductId}
              onWatchlistChanged={loadGlobalData}
            />
          )}

          {activeTab === 'watchlist' && (
            <Watchlist
              setActiveTab={setActiveTab}
              setSelectedProductId={setSelectedProductId}
              watchlistItems={watchlistItems}
              onRefreshWatchlist={loadGlobalData}
            />
          )}

          {activeTab === 'compare' && (
            <Compare
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'intelligence' && (
            <DealIntelligence
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'planner' && <ShoppingPlanner />}

          {activeTab === 'history' && (
            <PriceHistory
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'alerts' && (
            <Alerts
              notifications={notifications}
              onRefreshNotifications={loadGlobalData}
              setActiveTab={setActiveTab}
              setSelectedProductId={setSelectedProductId}
            />
          )}

          {activeTab === 'savings' && <SavingsAnalytics />}

          {activeTab === 'sources' && (
            <SystemHealth
              onTriggerRefresh={handleRefreshAll}
              isRefreshing={isRefreshing}
            />
          )}

          {activeTab === 'settings' && <Settings />}
        </main>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
