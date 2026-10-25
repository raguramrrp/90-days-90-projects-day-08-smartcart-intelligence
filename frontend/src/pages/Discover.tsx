import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { apiClient } from '../api/client';
import { formatINR } from '../utils/format';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import {
  Search, Filter, Bookmark, ArrowLeftRight, LineChart,
  Tag, Check, Plus, AlertCircle, ShoppingBag, X, Sparkles
} from 'lucide-react';

interface Props {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  setActiveTab: (tab: string) => void;
  setSelectedProductId: (id: number) => void;
  onWatchlistChanged: () => void;
}

export const Discover: React.FC<Props> = ({
  searchQuery,
  setSearchQuery,
  setActiveTab,
  setSelectedProductId,
  onWatchlistChanged,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('deal_score_desc');
  const [loading, setLoading] = useState(true);

  // Modal State for Tracking / Adding to Watchlist
  const [trackingProduct, setTrackingProduct] = useState<Product | null>(null);
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [note, setNote] = useState<string>('');
  const [submittingTrack, setSubmittingTrack] = useState(false);
  const [trackSuccess, setTrackSuccess] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.getCategories();
      setCategories([{ category: 'All', count: 0 }, ...res.data]);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getProducts({
        search: searchQuery || undefined,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        sort_by: sortBy,
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTrackModal = (prod: Product) => {
    setTrackingProduct(prod);
    const suggestedTarget = prod.current_lowest_price
      ? Math.round(prod.current_lowest_price * 0.95)
      : '';
    setTargetPrice(suggestedTarget.toString());
    setPriority('MEDIUM');
    setNote('');
    setTrackSuccess(false);
  };

  const handleConfirmTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingProduct) return;
    setSubmittingTrack(true);
    try {
      await apiClient.addToWatchlist({
        product_id: trackingProduct.id,
        target_price: targetPrice ? parseFloat(targetPrice) : undefined,
        priority: priority,
        note: note || undefined,
      });
      setTrackSuccess(true);
      onWatchlistChanged();
      setTimeout(() => {
        setTrackingProduct(null);
        setTrackSuccess(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to add to watchlist', err);
      alert('Could not add to watchlist.');
    } finally {
      setSubmittingTrack(false);
    }
  };

  const handleGoTo = (id: number, tab: string) => {
    setSelectedProductId(id);
    setActiveTab(tab);
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
        {/* Search input in Discover page */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, brand, or model..."
            className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 text-xs rounded-lg pl-9 pr-3.5 py-2 border border-slate-200 focus:outline-none focus:bg-white focus:border-blue-500 transition-all"
          />
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs text-slate-700 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="deal_score_desc">Highest Deal Score</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Recently Added</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((c) => {
          const isSelected = selectedCategory === c.category;
          return (
            <button
              key={c.category}
              onClick={() => setSelectedCategory(c.category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {c.category}
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          Scanning product catalog across connected Indian retailers...
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <ShoppingBag className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No products found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or selected category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const hasDiscount = p.original_mrp && p.original_mrp > (p.current_lowest_price || 0);
            const discountPct = hasDiscount
              ? Math.round(((p.original_mrp! - p.current_lowest_price!) / p.original_mrp!) * 100)
              : 0;

            return (
              <div
                key={p.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 flex flex-col justify-between transition-colors shadow-2xs group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <ProvenanceBadge provenance={p.provenance} size="sm" />
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 border border-blue-200 text-blue-700">
                      Score: {p.deal_score || 70}/100
                    </span>
                  </div>

                  <div className="relative mb-2.5 rounded-lg overflow-hidden bg-slate-50 border border-slate-200 aspect-video flex items-center justify-center">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                      />
                    ) : (
                      <ShoppingBag className="w-8 h-8 text-slate-400" />
                    )}
                    {discountPct > 0 && (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white font-semibold text-[10px] px-2 py-0.5 rounded shadow-xs">
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>

                  <div className="mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {p.brand} &bull; {p.category}
                    </span>
                    <h3 className="text-xs font-medium text-slate-900 line-clamp-2 mt-0.5 leading-snug">
                      {p.title}
                    </h3>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-2.5 mb-3 border border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Lowest verified:</span>
                      <div className="text-right">
                        <span className="text-base font-semibold text-blue-600">
                          {formatINR(p.current_lowest_price)}
                        </span>
                        {hasDiscount && (
                          <span className="text-[11px] text-slate-400 line-through ml-2">
                            {formatINR(p.original_mrp)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>Available at:</span>
                      <span className="text-slate-700 font-medium">{p.retailer_count} verified stores</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => handleOpenTrackModal(p)}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Track Price & Set Target</span>
                  </button>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleGoTo(p.id, 'compare')}
                      className="py-1 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-medium rounded transition-colors text-center truncate"
                    >
                      Compare
                    </button>
                    <button
                      onClick={() => handleGoTo(p.id, 'history')}
                      className="py-1 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-medium rounded transition-colors text-center truncate"
                    >
                      History
                    </button>
                    <button
                      onClick={() => handleGoTo(p.id, 'intelligence')}
                      className="py-1 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-medium rounded transition-colors text-center truncate"
                    >
                      Advice
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Track Product Target Price Modal */}
      {trackingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-xl relative">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-sm text-slate-900">Track Product Price</h3>
              </div>
              <button
                onClick={() => setTrackingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTrack} className="p-5 space-y-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {trackingProduct.brand} &bull; {trackingProduct.category}
                </span>
                <h4 className="text-xs font-semibold text-slate-900 mt-0.5">{trackingProduct.title}</h4>
                <div className="mt-2 text-xs text-slate-600">
                  Current lowest price: <span className="text-blue-600 font-semibold">{formatINR(trackingProduct.current_lowest_price)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Price (₹ INR)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="e.g. 24999"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  You'll be alerted when prices drop to or below this target amount.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tracking Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="HIGH">High Priority (Urgent Buy)</option>
                  <option value="MEDIUM">Medium Priority (Standard Watch)</option>
                  <option value="LOW">Low Priority (Casual Interest)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Personal Note (Optional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Waiting for Diwali festive discount"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {trackSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center gap-1.5 font-medium">
                  <Check className="w-3.5 h-3.5" /> Added to your personal watchlist!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTrackingProduct(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTrack || trackSuccess}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{submittingTrack ? 'Saving...' : 'Save to Watchlist'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
