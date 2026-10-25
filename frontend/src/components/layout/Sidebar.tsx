import React from 'react';
import {
  LayoutDashboard, Compass, BookmarkCheck, ArrowLeftRight,
  Sparkles, CalendarCheck, LineChart, Bell, PiggyBank,
  ChevronLeft, ChevronRight, ShoppingBag
} from 'lucide-react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  unreadCount: number;
  watchlistCount: number;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  unreadCount,
  watchlistCount,
}) => {
  // Navigation list without the red-circled items (Data Sources & Health, Account Settings)
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'discover', label: 'Discover Products', icon: Compass },
    { id: 'watchlist', label: 'My Watchlist', icon: BookmarkCheck, badge: watchlistCount > 0 ? watchlistCount : undefined },
    { id: 'compare', label: 'Compare Prices', icon: ArrowLeftRight },
    { id: 'intelligence', label: 'Deal Intelligence', icon: Sparkles },
    { id: 'planner', label: 'Shopping Planner', icon: CalendarCheck },
    { id: 'history', label: 'Price History', icon: LineChart },
    { id: 'alerts', label: 'Alerts & Notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined, badgeColor: 'bg-blue-100 text-blue-700 border border-blue-200' },
    { id: 'savings', label: 'Savings Analytics', icon: PiggyBank },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-white border-r border-slate-200 z-40 transition-all duration-200 flex flex-col ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-200">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-semibold text-sm tracking-tight text-slate-900 block">SmartCart</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-blue-600 block">
                Intelligence
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ${
            collapsed ? 'hidden' : 'block'
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
              {!collapsed && item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] font-semibold rounded ${
                    item.badgeColor ? item.badgeColor : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Subtle Collapse / Expand Control at Bottom */}
      {collapsed && (
        <div className="p-2 border-t border-slate-100">
          <button
            onClick={() => setCollapsed(false)}
            className="w-full py-1.5 flex justify-center text-slate-400 hover:text-slate-600"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
