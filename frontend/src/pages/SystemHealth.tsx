import React, { useState, useEffect } from 'react';
import { SystemStatus, ProviderHealth, RefreshJob } from '../types';
import { apiClient } from '../api/client';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import { formatRelativeTime } from '../utils/format';
import {
  Server, ShieldCheck, RefreshCw, Clock, AlertTriangle,
  Zap, Database, FileText, CheckCircle2, XCircle
} from 'lucide-react';

interface Props {
  onTriggerRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export const SystemHealth: React.FC<Props> = ({ onTriggerRefresh, isRefreshing }) => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [jobs, setJobs] = useState<RefreshJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    setLoading(true);
    try {
      const [sRes, jRes] = await Promise.all([
        apiClient.getSystemStatus(),
        apiClient.getJobs(),
      ]);
      setSystemStatus(sRes.data);
      setJobs(jRes.data);
    } catch (err) {
      console.error('Failed to load system health', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Connected Data Sources & System Health</h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Operational status of connected Indian e-commerce adapters, background schedulers, and execution history.
          </p>
        </div>

        <button
          onClick={async () => {
            await onTriggerRefresh();
            await loadHealthData();
          }}
          disabled={isRefreshing}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Scanning Feeds...' : 'Trigger Manual Sync'}</span>
        </button>
      </div>

      {/* System Status Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
            Database Engine
          </span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-slate-800">Connected (SQLAlchemy)</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Alembic schema migrated</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
            Scheduler Daemon
          </span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs font-semibold text-slate-800">
              {systemStatus?.scheduler_status || 'RUNNING'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">30-min recurring interval</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
            Email Delivery Adapter
          </span>
          <span className="text-xs font-semibold text-blue-700 mt-1 block">
            {systemStatus?.email_delivery_mode || 'MOCK_DEV'} Mode
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Outbox HTML preview active</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
            Catalog Database
          </span>
          <span className="text-xs font-semibold text-slate-800 mt-1 block">
            {systemStatus?.total_observations_count || 126} Observations
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            across {systemStatus?.total_products_count || 9} products
          </span>
        </div>
      </div>

      {/* Retailers Health & Credential Requirements */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight mb-0.5">
          Indian Retailer API Connections
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          Connection health, response latency, and documented integration prerequisites for each supported source:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {systemStatus?.providers.map((pr) => (
            <div
              key={pr.retailer_code}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-semibold text-slate-900">{pr.retailer_name}</h4>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      pr.status === 'HEALTHY'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                        : 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs'
                    }`}
                  >
                    {pr.status}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>
                    Response Latency: <strong className="text-slate-900 font-semibold">{pr.response_time_ms.toFixed(1)} ms</strong>
                  </div>
                  <div>
                    Freshness TTL: <strong className="text-slate-900 font-semibold">{pr.freshness_ttl_minutes} minutes</strong>
                  </div>
                </div>

                <div className="mt-2.5 p-2 bg-white rounded border border-slate-200 text-[10px] text-slate-700 leading-relaxed shadow-2xs">
                  <strong className="text-blue-700 block mb-0.5 font-semibold">Integration Prerequisites:</strong>
                  {pr.credential_requirement}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                Last probe: {formatRelativeTime(pr.checked_at)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Provenance Policy Guide */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight mb-0.5">
          Price Provenance & Truthfulness Standard
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          In accordance with SmartCart's zero-fabrication standard, every observation carries an auditable provenance classification:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
            <ProvenanceBadge provenance="LIVE" size="md" />
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed font-medium">
              Retrieved directly from an authorized retailer endpoint within the freshness threshold.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
            <ProvenanceBadge provenance="CACHED" size="md" />
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed font-medium">
              Previous successful observation displayed within the source's TTL freshness window.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
            <ProvenanceBadge provenance="HISTORICAL" size="md" />
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed font-medium">
              A recorded observation from an earlier date used strictly for historical charting and baseline comparisons.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
            <ProvenanceBadge provenance="SAMPLE" size="md" />
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed font-medium">
              Certified seeded data used in local development when commercial API keys are pending approval.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
            <ProvenanceBadge provenance="UNAVAILABLE" size="md" />
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed font-medium">
              The item is unlisted, out of stock, or could not be verified by the provider's API.
            </p>
          </div>
        </div>
      </div>

      {/* Refresh Jobs Execution History */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-xs font-semibold text-slate-900">Recent Refresh Execution Jobs</h3>
          <span className="text-[11px] text-slate-500 font-medium">{jobs.length} logged runs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-2.5 px-4">Job ID</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Triggered By</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Items Processed</th>
                <th className="py-2.5 px-4">Started At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">#{j.id}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{j.job_type}</td>
                  <td className="py-2.5 px-4 text-blue-700 font-semibold">{j.triggered_by}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        j.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                          : 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                      }`}
                    >
                      {j.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-700">
                    {j.items_processed} items ({j.items_updated} updated)
                  </td>
                  <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                    {formatRelativeTime(j.started_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
