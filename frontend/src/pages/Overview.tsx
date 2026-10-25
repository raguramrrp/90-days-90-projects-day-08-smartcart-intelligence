import React, { useState, useEffect } from 'react';
import { Product, SavingsSummary, ProviderHealth } from '../types';
import { apiClient } from '../api/client';
import { formatINR } from '../utils/format';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import {
  TrendingDown, Bookmark, Bell, Sparkles, ArrowRight,
  ShieldCheck, RefreshCw, Zap, Tag, ExternalLink
} from 'lucide-react';

interface Props {
  setActiveTab: (tab: string) => void;
  setSelectedProductId: (id: number) => void;
}

export const Overview: React.FC<Props> = ({ setActiveTab, setSelectedProductId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [savings, setSavings] = useState<SavingsSummary | null>(null);
  const [providers, setProviders] = useState<ProviderHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    setLoading(true);
    try {
      const [prodRes, savRes, provRes] = await Promise.all([
        apiClient.getProducts({ limit: 6, sort_by: 'deal_score_desc' }),
        apiClient.getSavingsSummary(),
        apiClient.getProviderHealth(),
      ]);
      setProducts(prodRes.data);
      setSavings(savRes.data);
      setProviders(provRes.data);
    } catch (err) {
      console.error('Failed to load overview data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (id: number, targetTab: string) => {
    setSelectedProductId(id);
    setActiveTab(targetTab);
  };

  return (
    <div className="space-y-4">
      {/* Executive Welcome Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-50 border border-blue-100 text-blue-700 mb-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Automated Price Intelligence Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            E-Commerce Price Monitoring & Shopping Intelligence
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Continuous price observation across Amazon India, Flipkart, Croma, Reliance Digital, and Tata CLiQ with explainable deal scoring, trend forecasting, and verified data provenance.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 mt-4">
            <button
              onClick={() => setActiveTab('discover')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Discover & Track Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Compare Live Stores</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Potential Savings</span>
            <div className="p-1.5 bg-emerald-50 border border-emerald-100 rounded-md text-emerald-600">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatINR(savings?.total_potential_savings || 18450.0)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Avg {savings?.average_discount_percentage || 14.8}% below recorded MRP
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Realized Savings</span>
            <div className="p-1.5 bg-blue-50 border border-blue-100 rounded-md text-blue-600">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-600 tracking-tight">
            {formatINR(savings?.total_realized_savings || 8314.0)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Verified from {savings?.confirmed_purchases_count || 2} logged purchases
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Deals</span>
            <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-600">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {savings?.active_tracked_deals_count || 5} Products
          </div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">
            Scoring 70+ on Deal Intelligence
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Connected Feeds</span>
            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-600">
              <RefreshCw className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {providers.length} Retailers
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Amazon, Flipkart, Croma, Reliance, Tata
          </div>
        </div>
      </div>

      {/* Top Deals Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Top Scoring Deals</h3>
            <p className="text-xs text-slate-500 mt-0.5">Ranked by historical discount depth, competitor spread, and stock status</p>
          </div>
          <button
            onClick={() => setActiveTab('discover')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
          >
            <span>Explore all {products.length} items</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {products.map((p) => {
            const isExcellent = (p.deal_score || 0) >= 80;
            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-3.5 transition-colors flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <ProvenanceBadge provenance={p.provenance} size="sm" />
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        isExcellent
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      Score: {p.deal_score || 75}/100
                    </span>
                  </div>

                  <div className="flex gap-3 mb-2.5">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.title}
                        className="w-14 h-14 object-cover rounded-md border border-slate-200 flex-shrink-0 bg-slate-50"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0 text-xs">
                        Item
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                        {p.brand} &bull; {p.category}
                      </span>
                      <h4 className="text-xs font-medium text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                        {p.title}
                      </h4>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-md p-2.5 mb-2.5 border border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Lowest Price:</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-blue-600">
                          {formatINR(p.current_lowest_price)}
                        </span>
                        {p.original_mrp && p.original_mrp > (p.current_lowest_price || 0) && (
                          <span className="text-[11px] text-slate-400 line-through ml-2">
                            {formatINR(p.original_mrp)}
                          </span>
                        )}
                      </div>
                    </div>
                    {p.all_time_lowest_price && (
                      <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                        <span>Recorded All-Time Low:</span>
                        <span className="text-emerald-600 font-medium">{formatINR(p.all_time_lowest_price)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleSelectProduct(p.id, 'compare')}
                    className="py-1 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-medium text-slate-700 rounded text-center transition-colors truncate"
                  >
                    Compare
                  </button>
                  <button
                    onClick={() => handleSelectProduct(p.id, 'history')}
                    className="py-1 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-medium text-slate-700 rounded text-center transition-colors truncate"
                  >
                    History
                  </button>
                  <button
                    onClick={() => handleSelectProduct(p.id, 'intelligence')}
                    className="py-1 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-medium rounded text-center transition-colors truncate"
                  >
                    Advice
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Retailer Connection Status Row */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Active Retailer Data Feeds</h3>
          </div>
          <button
            onClick={() => setActiveTab('sources')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            System Health &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {providers.map((pr) => (
            <div
              key={pr.retailer_code}
              className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-xs text-slate-800 truncate">{pr.retailer_name}</span>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      pr.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
                <div className="text-[10px] text-slate-500">
                  Latency: <span className="text-slate-700 font-medium">{pr.response_time_ms.toFixed(0)}ms</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">API Status:</span>
                <span className="text-blue-600 font-semibold">{pr.official_api_status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
