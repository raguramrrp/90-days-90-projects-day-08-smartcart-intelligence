import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { apiClient } from '../api/client';
import { formatINR } from '../utils/format';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import {
  ArrowLeftRight, ExternalLink, ShieldCheck, CheckCircle2,
  Clock, AlertTriangle, Truck, Tag, Sparkles
} from 'lucide-react';

interface Props {
  selectedProductId: number | null;
  setSelectedProductId: (id: number) => void;
  setActiveTab: (tab: string) => void;
}

export const Compare: React.FC<Props> = ({
  selectedProductId,
  setSelectedProductId,
  setActiveTab,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [comparison, setComparison] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadComparison(selectedProductId);
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
      console.error('Failed to load products for comparison', err);
    }
  };

  const loadComparison = async (id: number) => {
    setLoading(true);
    try {
      const res = await apiClient.compareProduct(id);
      setComparison(res.data);
    } catch (err) {
      console.error('Failed to load comparison', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Product Selector Dropdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Cross-Retailer Price Comparison</h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Verified checkout totals across Amazon India, Flipkart, Croma, Reliance Digital, and Tata CLiQ.
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
          Comparing live offers across retailer networks...
        </div>
      ) : !comparison ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs shadow-xs">
          Select a product to view multi-store price comparison.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Header Card for Chosen Product */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              {comparison.image_url ? (
                <img
                  src={comparison.image_url}
                  alt={comparison.product_title}
                  className="w-16 h-16 object-cover rounded-lg border border-slate-200 flex-shrink-0 bg-slate-50"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-500 flex-shrink-0 text-xs font-medium">
                  Item
                </div>
              )}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {comparison.brand} &bull; Model: {comparison.model_number || 'Standard'}
                </span>
                <h3 className="text-sm font-semibold text-slate-900 mt-0.5">{comparison.product_title}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-slate-500">Verified Stores:</span>
                  <span className="text-xs font-semibold text-blue-600">{comparison.offers_count} Retailers</span>
                </div>
              </div>
            </div>

            {/* Savings Potential Callout */}
            {comparison.max_savings_potential > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center sm:text-right flex-shrink-0 shadow-2xs">
                <span className="text-[11px] text-emerald-800 block font-medium">Cross-Store Price Spread</span>
                <span className="text-xl font-bold text-emerald-700 block">
                  {formatINR(comparison.max_savings_potential)}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">
                  Maximum savings by choosing lowest verified offer
                </span>
              </div>
            )}
          </div>

          {/* Comparison Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-semibold">
                    <th className="py-2.5 px-4">Retailer</th>
                    <th className="py-2.5 px-4">Base Price</th>
                    <th className="py-2.5 px-4">Shipping & Fees</th>
                    <th className="py-2.5 px-4">Total Cost</th>
                    <th className="py-2.5 px-4">Data Provenance</th>
                    <th className="py-2.5 px-4">Freshness</th>
                    <th className="py-2.5 px-4 text-right">Offer Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {comparison.offers.map((offer: any, idx: number) => {
                    const isLowest = idx === 0 && offer.in_stock;
                    return (
                      <tr
                        key={offer.listing_id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isLowest ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        {/* Retailer Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 text-xs">
                              {offer.retailer_name}
                            </span>
                            {isLowest && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1 shadow-2xs">
                                <Sparkles className="w-3 h-3 text-emerald-600" /> Lowest Offer
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block">
                            {offer.in_stock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>

                        {/* Base Price */}
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {formatINR(offer.price)}
                          {offer.original_price && offer.original_price > offer.price && (
                            <span className="text-[10px] text-slate-400 line-through block font-normal">
                              MRP {formatINR(offer.original_price)}
                            </span>
                          )}
                        </td>

                        {/* Shipping */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Truck className="w-3.5 h-3.5 text-slate-400" />
                            <span>{offer.shipping_cost === 0 ? 'FREE' : formatINR(offer.shipping_cost)}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{offer.uncertainty_note}</span>
                        </td>

                        {/* Estimated Total */}
                        <td className="py-3 px-4">
                          <span className={`text-xs font-bold ${isLowest ? 'text-blue-700' : 'text-slate-800'}`}>
                            {formatINR(offer.estimated_total)}
                          </span>
                        </td>

                        {/* Provenance */}
                        <td className="py-3 px-4">
                          <ProvenanceBadge provenance={offer.provenance} size="sm" />
                        </td>

                        {/* Freshness */}
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{offer.data_age_hours}h ago</span>
                          </div>
                        </td>

                        {/* Store Link */}
                        <td className="py-3 px-4 text-right">
                          <a
                            href={offer.listing_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-medium transition-colors shadow-2xs"
                          >
                            <span>Open Store</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
