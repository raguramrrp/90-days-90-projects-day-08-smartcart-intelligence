import React, { useState, useEffect } from 'react';
import { Product, PriceHistoryResponse } from '../types';
import { apiClient } from '../api/client';
import { formatINR } from '../utils/format';
import { ProvenanceBadge } from '../components/common/ProvenanceBadge';
import {
  LineChart as LineChartIcon, TrendingDown, TrendingUp,
  Clock, ShieldAlert, Sparkles, AlertCircle, Info, Calendar
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, ReferenceLine, Area, ComposedChart
} from 'recharts';

interface Props {
  selectedProductId: number | null;
  setSelectedProductId: (id: number) => void;
  setActiveTab: (tab: string) => void;
}

export const PriceHistory: React.FC<Props> = ({
  selectedProductId,
  setSelectedProductId,
  setActiveTab,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [historyData, setHistoryData] = useState<PriceHistoryResponse | null>(null);
  const [timeframe, setTimeframe] = useState<string>('90d');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      loadHistory(selectedProductId, timeframe);
    } else if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [selectedProductId, timeframe, products]);

  const loadProducts = async () => {
    try {
      const res = await apiClient.getProducts({ limit: 50 });
      setProducts(res.data);
      if (!selectedProductId && res.data.length > 0) {
        setSelectedProductId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load products for history', err);
    }
  };

  const loadHistory = async (id: number, tf: string) => {
    setLoading(true);
    try {
      const res = await apiClient.getProductHistory(id, tf);
      setHistoryData(res.data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  // Build combined chart points including historical and ML forecast points
  const chartPoints: any[] = [];
  if (historyData) {
    historyData.history.forEach((h) => {
      chartPoints.push({
        date: h.date,
        observedPrice: h.price,
        retailer: h.retailer,
        provenance: h.provenance,
        forecastPrice: null,
        lowerBound: null,
        upperBound: null,
        isForecast: false,
      });
    });

    if (historyData.forecast && historyData.forecast.length > 0) {
      const lastReal = historyData.history[historyData.history.length - 1];
      if (lastReal) {
        chartPoints[chartPoints.length - 1].forecastPrice = lastReal.price;
        chartPoints[chartPoints.length - 1].lowerBound = lastReal.price;
        chartPoints[chartPoints.length - 1].upperBound = lastReal.price;
      }

      historyData.forecast.forEach((f) => {
        chartPoints.push({
          date: f.target_date,
          observedPrice: null,
          retailer: 'Statistical ML Trend',
          provenance: 'PREDICTED',
          forecastPrice: f.predicted_price,
          lowerBound: f.lower_bound,
          upperBound: f.upper_bound,
          isForecast: true,
        });
      });
    }
  }

  const stats = historyData?.stats;

  return (
    <div className="space-y-4">
      {/* Top Header & Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <LineChartIcon className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900 tracking-tight">Price History & Predictive Trend</h2>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            Auditable price movement observations with statistical 30-day forward trend projection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 font-medium">Product:</label>
            <select
              value={selectedProductId || ''}
              onChange={(e) => setSelectedProductId(Number(e.target.value))}
              className="bg-slate-50 border border-slate-300 text-xs text-slate-800 rounded-lg px-3 py-1.5 focus:border-blue-500 focus:bg-white focus:outline-none max-w-xs truncate shadow-2xs"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe pill selector */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {['7d', '30d', '90d', 'all'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-xs font-semibold uppercase transition-colors ${
                  timeframe === tf
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs">
          Loading price observations and regression trends...
        </div>
      ) : !historyData || !stats ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 text-xs shadow-xs">
          Select a product to inspect historical observations.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                Current Best
              </span>
              <span className="text-lg font-bold text-blue-700 mt-0.5 block">
                {formatINR(stats.current_price)}
              </span>
              <span className="text-[10px] text-slate-500">Live offer</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                Recorded Lowest
              </span>
              <span className="text-lg font-bold text-emerald-700 mt-0.5 block">
                {formatINR(stats.all_time_low)}
              </span>
              <span className="text-[10px] text-slate-500">All-time minimum</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                Recorded Highest
              </span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                {formatINR(stats.all_time_high)}
              </span>
              <span className="text-[10px] text-slate-500">Peak observed</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                Historical Average
              </span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                {formatINR(stats.historical_avg)}
              </span>
              <span className="text-[10px] text-slate-500">Across {stats.data_points_count} points</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                30-Day Change
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {stats.percent_change_30d <= 0 ? (
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                )}
                <span
                  className={`text-lg font-bold ${
                    stats.percent_change_30d <= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {stats.percent_change_30d}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {formatINR(stats.absolute_change_30d)} difference
              </span>
            </div>
          </div>

          {/* Interactive Recharts Graph */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  Price History Timeline & ML Forecast Projection
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Solid blue line shows recorded observations. Dashed violet line displays statistical linear trend.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 bg-blue-600 inline-block rounded" />
                  <span className="text-slate-600 text-[11px] font-medium">Observed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-1 border-t-2 border-dashed border-purple-600 inline-block" />
                  <span className="text-slate-600 text-[11px] font-medium">Trend Forecast (7-30d)</span>
                </div>
              </div>
            </div>

            <div className="h-68 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartPoints} margin={{ top: 10, right: 15, left: 15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `₹${Number(val).toLocaleString('en-IN')}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-md text-xs space-y-1">
                            <div className="font-semibold text-slate-900">{data.date}</div>
                            {data.observedPrice !== null && (
                              <div className="text-blue-700 font-semibold">
                                Price: {formatINR(data.observedPrice)}
                              </div>
                            )}
                            {data.forecastPrice !== null && (
                              <div className="text-purple-700 font-semibold">
                                Forecast: {formatINR(data.forecastPrice)}
                              </div>
                            )}
                            {data.lowerBound !== null && (
                              <div className="text-[10px] text-slate-600">
                                95% Bound: {formatINR(data.lowerBound)} – {formatINR(data.upperBound)}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-600">Retailer: {data.retailer}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-medium">Provenance: {data.provenance}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine
                    y={stats.historical_avg}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    label={{ value: 'Avg', fill: '#64748b', fontSize: 10, position: 'insideTopLeft' }}
                  />
                  <ReferenceLine
                    y={stats.all_time_low}
                    stroke="#059669"
                    strokeDasharray="4 4"
                    label={{ value: 'Low', fill: '#059669', fontSize: 10, position: 'insideBottomLeft' }}
                  />
                  {/* Historical Line */}
                  <Line
                    type="monotone"
                    dataKey="observedPrice"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#2563eb' }}
                    activeDot={{ r: 4 }}
                  />
                  {/* Forecast Line */}
                  <Line
                    type="monotone"
                    dataKey="forecastPrice"
                    stroke="#7c3aed"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 2.5, fill: '#7c3aed' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3.5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2 shadow-2xs">
              <Info className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed text-[11px]">
                <strong>Statistical Disclaimer:</strong> Price projections represent an ordinary-least-squares regression baseline calculated on chronological observations. Festive promotional shifts (e.g. Diwali sales) are driven by external factors not captured by historical extrapolation.
              </span>
            </div>
          </div>

          {/* Observations Audit Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h4 className="text-xs font-semibold text-slate-900">Recorded Observation Log</h4>
              <span className="text-[11px] text-slate-500 font-medium">{historyData.history.length} auditable points</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[10px] font-semibold">
                    <th className="py-2.5 px-4">Observation Date</th>
                    <th className="py-2.5 px-4">Retailer</th>
                    <th className="py-2.5 px-4">Recorded Price</th>
                    <th className="py-2.5 px-4">Stock Status</th>
                    <th className="py-2.5 px-4">Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {historyData.history.slice().reverse().map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-slate-600 font-mono text-[11px]">{h.date}</td>
                      <td className="py-2.5 px-4 text-slate-900 font-medium">{h.retailer}</td>
                      <td className="py-2.5 px-4 text-blue-700 font-semibold">{formatINR(h.price)}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          h.in_stock
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {h.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <ProvenanceBadge provenance={h.provenance} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
