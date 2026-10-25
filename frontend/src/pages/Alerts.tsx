import React, { useState, useEffect } from 'react';
import { PriceAlertRule, NotificationItem, Product } from '../types';
import { apiClient } from '../api/client';
import { formatINR, formatRelativeTime } from '../utils/format';
import {
  Bell, Mail, Plus, Trash2, CheckCircle2, Clock,
  Eye, CheckCheck, AlertTriangle, Send, X, ExternalLink
} from 'lucide-react';

interface Props {
  notifications: NotificationItem[];
  onRefreshNotifications: () => Promise<void>;
  setActiveTab: (tab: string) => void;
  setSelectedProductId: (id: number) => void;
}

export const Alerts: React.FC<Props> = ({
  notifications,
  onRefreshNotifications,
  setActiveTab,
  setSelectedProductId,
}) => {
  const [rules, setRules] = useState<PriceAlertRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTabFilter] = useState<'notifications' | 'rules'>('notifications');
  const [filterUnread, setFilterUnread] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Rule Modal
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [ruleProductId, setRuleProductId] = useState<number | null>(null);
  const [ruleType, setRuleType] = useState<string>('TARGET_PRICE');
  const [thresholdVal, setThresholdVal] = useState<string>('');

  // Email Preview Modal
  const [previewEmailHtml, setPreviewEmailHtml] = useState<string | null>(null);

  useEffect(() => {
    loadAlertData();
  }, []);

  const loadAlertData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        apiClient.getAlertRules(),
        apiClient.getProducts({ limit: 50 }),
      ]);
      setRules(rRes.data);
      setProducts(pRes.data);
      if (pRes.data.length > 0 && !ruleProductId) {
        setRuleProductId(pRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load alert data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleProductId) return;
    try {
      await apiClient.createAlertRule({
        product_id: ruleProductId,
        rule_type: ruleType,
        threshold_value: thresholdVal ? parseFloat(thresholdVal) : undefined,
      });
      setShowRuleModal(false);
      setThresholdVal('');
      await loadAlertData();
    } catch (err) {
      console.error('Failed to create alert rule', err);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('Delete this alert rule?')) return;
    try {
      await apiClient.deleteAlertRule(ruleId);
      await loadAlertData();
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  const handleMarkRead = async (notifId: number) => {
    try {
      await apiClient.markNotificationRead(notifId);
      await onRefreshNotifications();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.markAllNotificationsRead();
      await onRefreshNotifications();
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const displayedNotifications = filterUnread
    ? notifications.filter((n) => n.status === 'UNREAD')
    : notifications;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Alerts & Notification Center</h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Configure threshold rules, review trigger events, and inspect rendered transaction emails.
          </p>
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTabFilter('notifications')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Notification Inbox ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTabFilter('rules')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'rules'
                ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Rules ({rules.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Notification Inbox */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterUnread(false)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  !filterUnread ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterUnread(true)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterUnread ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unread Only
              </button>
            </div>

            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All as Read</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 shadow-xs">
            {displayedNotifications.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                No notifications in this view.
              </div>
            ) : (
              displayedNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    n.status === 'UNREAD' ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="space-y-0.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{n.title}</span>
                      {n.status === 'UNREAD' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-0.5">
                      <span>{formatRelativeTime(n.created_at)}</span>
                      <span>&bull;</span>
                      <span>In-App & Email</span>
                      {n.deliveries && n.deliveries.length > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="text-emerald-700 font-medium">
                            Outbox: {n.deliveries[0].status}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 self-start sm:self-auto">
                    {/* View Email Preview Button */}
                    {n.deliveries && n.deliveries.length > 0 && n.deliveries[0].preview_body && (
                      <button
                        onClick={() => setPreviewEmailHtml(n.deliveries[0].preview_body!)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-blue-700 hover:text-blue-800 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                        title="Preview rendered email HTML message"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Email</span>
                      </button>
                    )}

                    {n.status === 'UNREAD' && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-medium rounded-lg transition-colors shadow-2xs"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Alert Rules */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowRuleModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Alert Rule</span>
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="py-2.5 px-4">Monitored Product</th>
                  <th className="py-2.5 px-4">Trigger Condition</th>
                  <th className="py-2.5 px-4">Threshold</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Last Evaluated</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No active alert rules found. Click "Add Alert Rule" above.
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.product_title}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {r.rule_type.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-700">
                        {r.rule_type === 'PERCENT_DROP'
                          ? `${r.threshold_value}% drop`
                          : r.threshold_value
                          ? formatINR(r.threshold_value)
                          : 'Immediate'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                          ACTIVE
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {r.last_triggered_at ? formatRelativeTime(r.last_triggered_at) : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteRule(r.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-5 shadow-xl relative">
            <button onClick={() => setShowRuleModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-slate-900 mb-3.5">Create Price Alert Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Product</label>
                <select
                  value={ruleProductId || ''}
                  onChange={(e) => setRuleProductId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Rule Type</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="TARGET_PRICE">Price Falls to Target (₹)</option>
                  <option value="PERCENT_DROP">Price Decreases by Percentage (%)</option>
                  <option value="PRICE_INCREASE">Price Increases Beyond Threshold (%)</option>
                  <option value="BACK_IN_STOCK">Product Returns in Stock</option>
                </select>
              </div>

              {ruleType !== 'BACK_IN_STOCK' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Threshold Value {ruleType === 'PERCENT_DROP' || ruleType === 'PRICE_INCREASE' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={thresholdVal}
                    onChange={(e) => setThresholdVal(e.target.value)}
                    placeholder={ruleType === 'PERCENT_DROP' ? 'e.g. 5' : 'e.g. 110000'}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs mt-1"
              >
                Save Alert Rule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rendered Email Preview Modal */}
      {previewEmailHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-xs text-slate-900">
                  Development Outbox &bull; Rendered Transactional HTML Email
                </span>
              </div>
              <button onClick={() => setPreviewEmailHtml(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 overflow-y-auto flex-1">
              <div
                dangerouslySetInnerHTML={{ __html: previewEmailHtml }}
                className="rounded-lg overflow-hidden shadow-xs bg-white"
              />
            </div>

            <div className="p-2.5 border-t border-slate-200 bg-slate-50 text-center text-[11px] text-slate-600 font-medium">
              Mock email preview mode active. To deliver live emails, configure SMTP credentials in .env.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
