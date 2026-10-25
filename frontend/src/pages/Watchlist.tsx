import React, { useState } from 'react';
import { WatchlistItem } from '../types';
import { apiClient } from '../api/client';
import { formatINR } from '../utils/format';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import {
  BookmarkCheck, Trash2, ArrowLeftRight, LineChart,
  CheckCircle2, Clock, AlertCircle, ShoppingBag, Plus, RefreshCw, ExternalLink
} from 'lucide-react';

interface Props {
  setActiveTab: (tab: string) => void;
  setSelectedProductId: (id: number) => void;
  watchlistItems: WatchlistItem[];
  onRefreshWatchlist: () => Promise<void>;
}

export const Watchlist: React.FC<Props> = ({
  setActiveTab,
  setSelectedProductId,
  watchlistItems,
  onRefreshWatchlist,
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleRemove = async (itemId: number) => {
    if (!confirm('Remove this product from your personal watchlist?')) return;
    setDeletingId(itemId);
    try {
      await apiClient.removeFromWatchlist(itemId);
      await onRefreshWatchlist();
    } catch (err) {
      console.error('Failed to remove item', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGoTo = (id: number, tab: string) => {
    setSelectedProductId(id);
    setActiveTab(tab);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Tracked Watchlist</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring {watchlistItems.length} products. Background workers scan for price drops and trigger notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshWatchlist}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Products</span>
          </button>
        </div>
      </div>

      {/* Watchlist Items Grid */}
      {watchlistItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <BookmarkCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">Your watchlist is currently empty</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            Search our catalog of smartphones, laptops, electronics, appliances and groceries to set target price alerts.
          </p>
          <button
            onClick={() => setActiveTab('discover')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors shadow-xs"
          >
            Explore Product Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {watchlistItems.map((item) => {
            const product = item.product;
            const currentPrice = item.current_price || product.current_lowest_price || 0;
            const targetPrice = item.target_price || 0;
            const targetReached = item.target_reached;
            const diff = item.price_diff_target;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 flex flex-col justify-between transition-colors shadow-2xs"
              >
                <div>
                  {/* Top Bar inside card */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <ProvenanceBadge provenance={product.provenance} size="sm" />
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border uppercase ${
                          item.priority === 'HIGH'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.priority === 'MEDIUM'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {item.priority} Priority
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={deletingId === item.id}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-50 transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="flex gap-3 mb-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded-lg border border-slate-200 flex-shrink-0 bg-slate-50"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0 text-xs">
                        Item
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                        {product.brand} &bull; {product.category}
                      </span>
                      <h3 className="text-xs font-medium text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                        {product.title}
                      </h3>
                      {item.note && (
                        <p className="text-[11px] text-slate-500 italic mt-1 line-clamp-1">
                          "{item.note}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Target Status Banner */}
                  {targetReached && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center justify-between text-xs mb-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Target price reached! Good time to purchase.</span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        Drop: {formatINR(Math.abs(diff || 0))}
                      </span>
                    </div>
                  )}

                  {/* Price Comparison Container */}
                  <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Current Market Low</span>
                        <span className="text-base font-semibold text-blue-600 block mt-0.5">
                          {formatINR(currentPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Lowest across stores
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Your Target Price</span>
                        <span className="text-base font-semibold text-slate-800 block mt-0.5">
                          {targetPrice > 0 ? formatINR(targetPrice) : 'Not specified'}
                        </span>
                        {targetPrice > 0 && !targetReached && (
                          <span className="text-[10px] text-amber-700">
                            ₹{(currentPrice - targetPrice).toFixed(0)} away from target
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Target Progress Bar */}
                    {targetPrice > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Target Progress</span>
                          <span>{targetReached ? '100% (Met)' : `${Math.min(99, Math.round((targetPrice / currentPrice) * 100))}%`}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              targetReached ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(100, Math.round((targetPrice / currentPrice) * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleGoTo(product.id, 'compare')}
                    className="py-1 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-medium rounded transition-colors text-center truncate"
                  >
                    Compare Stores
                  </button>
                  <button
                    onClick={() => handleGoTo(product.id, 'history')}
                    className="py-1 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-medium rounded transition-colors text-center truncate"
                  >
                    Price History
                  </button>
                  <button
                    onClick={() => handleGoTo(product.id, 'intelligence')}
                    className="py-1 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-medium rounded transition-colors text-center truncate"
                  >
                    Deal Advice
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
