import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import {
  Settings as SettingsIcon, User, Bell, Mail, Shield,
  Key, Check, Save, Info, RefreshCw
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferred_currency || 'INR');
  const [emailNotifs, setEmailNotifs] = useState(user?.email_notifications_enabled ?? true);
  const [inAppNotifs, setInAppNotifs] = useState(user?.in_app_notifications_enabled ?? true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.updateProfile({
        full_name: fullName,
        preferred_currency: preferredCurrency,
        email_notifications_enabled: emailNotifs,
        in_app_notifications_enabled: inAppNotifs,
      });
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-4 h-4 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-900 tracking-tight">Account Preferences & System Settings</h2>
        </div>
        <p className="text-xs text-slate-600 mt-0.5">
          Configure notification dispatch channels, preferred currency defaults, and review API integration keys.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 font-semibold shadow-2xs">
          <Check className="w-4 h-4 text-emerald-600" /> Preferences updated successfully!
        </div>
      )}

      {/* User Profile Form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3.5 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" /> User Profile & Display
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ragu Ram"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || 'demo@smartcart.ai'}
                className="w-full bg-slate-100 border border-slate-200 text-slate-400 text-xs rounded-lg px-3 py-2 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
              <input
                type="text"
                disabled
                value={user?.username || 'demo_user'}
                className="w-full bg-slate-100 border border-slate-200 text-slate-400 text-xs rounded-lg px-3 py-2 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Currency</label>
              <select
                value={preferredCurrency}
                onChange={(e) => setPreferredCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
              >
                <option value="INR">INR (₹) - Indian Rupee (Default)</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>
          </div>

          {/* Notification Toggles */}
          <div className="pt-3.5 border-t border-slate-200 space-y-2.5">
            <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Alert Notification Channels
            </h4>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-blue-600" />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">In-App Notification Center</span>
                  <span className="text-[11px] text-slate-500">Receive in-app popups and inbox alerts for price drops.</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={inAppNotifs}
                onChange={(e) => setInAppNotifs(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-purple-600" />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">Email Dispatch</span>
                  <span className="text-[11px] text-slate-500">
                    Send rendered email alerts (preview in development outbox; live delivery when SMTP configured).
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Integration Credentials Guide */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-600" /> Commercial API Keys & Production Configuration
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          SmartCart is pre-configured with certified sandbox providers for instant local testing. To connect live retailer API keys, add the following variables to your local <code className="text-blue-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">.env</code> file:
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-100 space-y-1 overflow-x-auto shadow-xs">
          <div className="text-slate-400"># Amazon India PA-API v5</div>
          <div>AMAZON_PAAPI_ACCESS_KEY="your_aws_access_key"</div>
          <div>AMAZON_PAAPI_SECRET_KEY="your_aws_secret_key"</div>
          <div>AMAZON_PAAPI_PARTNER_TAG="your_associate_tag-21"</div>
          <div className="text-slate-400 pt-2"># Flipkart Affiliate API</div>
          <div>FLIPKART_AFFILIATE_ID="your_affiliate_id"</div>
          <div>FLIPKART_AFFILIATE_TOKEN="your_affiliate_token"</div>
          <div className="text-slate-400 pt-2"># Real SMTP Email Delivery</div>
          <div>EMAIL_DELIVERY_MODE="SMTP"</div>
          <div>SMTP_HOST="smtp.gmail.com"</div>
          <div>SMTP_PORT=587</div>
          <div>SMTP_USER="alerts@yourdomain.com"</div>
          <div>SMTP_PASSWORD="your_app_password"</div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2 shadow-2xs">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed text-[11px]">
            <strong>Zero Hardcoded Secrets:</strong> No real API keys or passwords are ever checked into Git. When keys are omitted, the engine runs in verifiable sandbox mode and transparently tags observations as <strong className="text-blue-800">CERTIFIED SAMPLE</strong>.
          </span>
        </div>
      </div>
    </div>
  );
};
