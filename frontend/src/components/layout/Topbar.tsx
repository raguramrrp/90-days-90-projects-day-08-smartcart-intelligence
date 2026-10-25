import React, { useState } from 'react';
import { Search, Bell, RefreshCw, User, LogOut, CheckCheck, Server, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../types';
import { formatRelativeTime } from '../../utils/format';

interface Props {
  collapsed: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  onRefreshAll: () => Promise<void>;
  isRefreshing: boolean;
  onOpenLoginModal: () => void;
  onMarkAllRead: () => Promise<void>;
}

export const Topbar: React.FC<Props> = ({
  collapsed,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  notifications,
  unreadCount,
  onRefreshAll,
  isRefreshing,
  onOpenLoginModal,
  onMarkAllRead,
}) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'overview': return 'Executive Overview';
      case 'discover': return 'Product Catalog & Discovery';
      case 'watchlist': return 'Tracked Products';
      case 'compare': return 'Cross-Retailer Comparison';
      case 'intelligence': return 'Deal Intelligence & Buying Guidance';
      case 'planner': return 'Shopping Planner & Budgets';
      case 'history': return 'Price History & Statistical Forecast';
      case 'alerts': return 'Alert Rules & Notification Center';
      case 'savings': return 'Savings Analytics & Verified Purchases';
      case 'sources': return 'Connected Sources & System Health';
      case 'settings': return 'Account Settings';
      default: return 'SmartCart Intelligence';
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setActiveTab('discover');
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b border-slate-200 z-30 flex items-center justify-between px-5 transition-all duration-200 ${
        collapsed ? 'left-16' : 'left-60'
      }`}
    >
      {/* Title & Path */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-900 hidden sm:block tracking-tight">
          {getPageTitle(activeTab)}
        </h1>
      </div>

      {/* Center Search Bar */}
      <div className="relative flex-1 max-w-sm mx-4 hidden md:block">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search Amazon, Flipkart, Croma, Reliance..."
          className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs rounded-lg pl-9 pr-3.5 py-1.5 border border-slate-200 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
        />
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2.5">
        {/* Trigger Price Refresh */}
        <button
          onClick={onRefreshAll}
          disabled={isRefreshing}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            isRefreshing
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-2xs'
          }`}
          title="Scan latest prices across connected retailer listings"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Scanning...' : 'Sync Prices'}</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors relative shadow-2xs"
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">Alert Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3 h-3" /> Mark read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-500">
                    No notifications yet. Set a price alert on any product to get notified.
                  </div>
                ) : (
                  notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setShowNotifications(false);
                        setActiveTab('alerts');
                      }}
                      className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors ${
                        n.status === 'UNREAD' ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-xs text-slate-900 line-clamp-1">{n.title}</span>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {formatRelativeTime(n.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    setActiveTab('alerts');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Alerts &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Account / Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs transition-colors shadow-2xs"
          >
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
              {user ? user.username.charAt(0).toUpperCase() : 'G'}
            </div>
            <span className="text-slate-800 font-medium hidden sm:inline text-xs">
              {user ? user.full_name || user.username : 'Sign In'}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
              <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50">
                <div className="text-xs font-semibold text-slate-900">{user?.full_name || 'Demo User'}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email || 'demo@smartcart.ai'}</div>
              </div>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setActiveTab('settings');
                }}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-slate-400" /> Account Preferences
              </button>

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  setActiveTab('sources');
                }}
                className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Server className="w-3.5 h-3.5 text-slate-400" /> Data Sources & Health
              </button>

              {user ? (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" /> Sign Out
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenLoginModal();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2 border-t border-slate-100 mt-1"
                >
                  <User className="w-3.5 h-3.5 text-blue-500" /> Sign In / Switch User
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
