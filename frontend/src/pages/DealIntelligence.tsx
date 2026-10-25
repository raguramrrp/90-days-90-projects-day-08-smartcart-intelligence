import React, { useState, useEffect } from 'react';
import { Product, DealScoreResponse } from '../types';
import { apiClient } from '../api/client';
import { formatINR } from '../utils/format';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import {
  Sparkles, CheckCircle2, Clock, AlertTriangle, Info,
  TrendingDown, ShieldCheck, ArrowRight, ArrowLeftRight
} from 'lucide-react';

interface Props {
  selectedProductId: number | null;
  setSelectedProductId: (id: number) => void;
  setActiveTab: (tab: string) => void;
}

export const DealIntelligence: React.FC<Props> = ({
  selectedProductId,
  setSelectedProductId,
  setActiveTab,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [intelligence, setIntelligence] = useState<DealScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadDealIntelligence(selectedProductId);
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [selectedProductId, products]);

  const loadProducts = async () => {
    try {
      const res = await apiClient.getProducts({ limit: 50 });
      setProducts(res.data);
      if (!selectedProductId && res.data.length > 0) {
        setSelectedProductId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load products for deal intelligence', err);
    }
  };

  const loadDealIntelligence = async (id: number) => {
    setLoading(true);
    try {
      const res = await apiClient.getDealIntelligence(id);
      setIntelligence(res.data);
    } catch (err) {
      console.error('Failed to load deal intelligence', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 border-emerald-300 bg-emerald-50';
    if (score >= 60) return 'text-blue-700 border-blue-300 bg-blue-50';
    if (score >= 40) return 'text-amber-800 border-amber-300 bg-amber-50';
    return 'text-rose-700 border-rose-300 bg-rose-50';
  };

  const getGuidanceBadge = (guidance: string) => {
    switch (guidance) {
      case 'BUY NOW':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          desc: 'Price meets strict discount criteria and is at or near the 90-day historical low.',
          icon: CheckCircle2,
        };
      case 'WAIT':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          desc: 'Price is currently elevated above historical promotion baselines; waiting is advised.',
          icon: Clock,
        };
      case 'COMPARE FIRST':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-900',
          desc: 'A verified competitor store has an alternative active offer worth reviewing.',
          icon: ArrowLeftRight,
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
          desc: 'Limited chronological records to formulate a recommendation.',
          icon: AlertTriangle,
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Deal Intelligence & Evidence Scoring</h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Objective 0–100 score derived from historical low proximity, competitor dispersion, and documented MRP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-600 font-medium">Select Product:</label>
          <select
            value={selectedProductId || ''}
            onChange={(e) => setSelectedProductId(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none max-w-xs truncate shadow-2xs"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          Computing explainable deal factors & historical baselines...
        </div>
      ) : !intelligence ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs shadow-xs">
          Select a product to view deal intelligence.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column: Big Score Card & Buying Guidance */}
          <div className="lg:col-span-1 space-y-4">
            {/* Score Box */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 text-center shadow-xs relative">
              <div className="absolute top-3.5 right-3.5">
                <ProvenanceBadge provenance={intelligence.provenance} size="sm" />
              </div>

              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                Calculated Deal Score
              </span>

              <div
                className={`w-24 h-24 rounded-full border-2 mx-auto flex flex-col items-center justify-center my-3.5 shadow-2xs ${getScoreColor(
                  intelligence.deal_score
                )}`}
              >
                <span className="text-3xl font-bold tracking-tight">{intelligence.deal_score}</span>
                <span className="text-[9px] uppercase tracking-wider opacity-75 font-semibold">/ 100</span>
              </div>

              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {intelligence.deal_label.replace('_', ' ')}
              </div>

              <div className="mt-2.5 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Confidence: </span>
                <strong className="text-slate-800 font-semibold">{intelligence.confidence}</strong>
              </div>
            </div>

            {/* Buying Guidance Box */}
            {(() => {
              const guide = getGuidanceBadge(intelligence.guidance);
              const GuideIcon = guide.icon;
              return (
                <div className={`rounded-xl border p-4 shadow-xs ${guide.bg}`}>
                  <div className="flex items-center gap-2 mb-1.5 font-bold text-xs">
                    <GuideIcon className="w-4 h-4 flex-shrink-0" />
                    <span>Guidance: {intelligence.guidance}</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90 font-medium">{intelligence.explanation}</p>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2 shadow-xs">
              <button
                onClick={() => setActiveTab('compare')}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                <span>Compare Live Offers</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className="w-full py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>View Price History Chart &rarr;</span>
              </button>
            </div>
          </div>

          {/* Right Column: Factor Breakdown List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight mb-0.5">
                Scoring Factor Breakdown
              </h3>
              <p className="text-xs text-slate-600 mb-4">
                Transparent breakdown of dimensions contributing to the {intelligence.deal_score}/100 score for{' '}
                <strong className="text-slate-900">{intelligence.product_title}</strong>:
              </p>

              <div className="space-y-2.5">
                {intelligence.factors.map((f, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-800">{f.name}</span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{f.description}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
                        +{f.score_impact} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Transparency Footer */}
              <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Observation recorded {intelligence.data_freshness_hours}h ago</span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Strictly auditable observations &bull; Zero fabricated discounts
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
