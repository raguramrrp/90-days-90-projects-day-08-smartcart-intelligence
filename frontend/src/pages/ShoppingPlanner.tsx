import React, { useState, useEffect } from 'react';
import { ShoppingList, Budget, RecurringPurchase } from '../types';
import { apiClient } from '../api/client';
import { formatINR } from '../utils/format';
import {
  CalendarCheck, Plus, CheckSquare, Square, Trash2,
  DollarSign, RefreshCw, AlertTriangle, Calendar, Tag, Check, X
} from 'lucide-react';

export const ShoppingPlanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lists' | 'budgets' | 'recurring'>('lists');
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurring, setRecurring] = useState<RecurringPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  // New list modal
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  // New item modal
  const [showAddItemModal, setShowAddItemModal] = useState<number | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemPriority, setNewItemPriority] = useState('MEDIUM');

  // Budget modal
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('All Categories');
  const [budgetLimit, setBudgetLimit] = useState('');

  // Recurring modal
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recDays, setRecDays] = useState('30');

  useEffect(() => {
    loadPlannerData();
  }, []);

  const loadPlannerData = async () => {
    setLoading(true);
    try {
      const [lRes, bRes, rRes] = await Promise.all([
        apiClient.getShoppingLists(),
        apiClient.getBudgets(),
        apiClient.getRecurring(),
      ]);
      setLists(lRes.data);
      setBudgets(bRes.data);
      setRecurring(rRes.data);
    } catch (err) {
      console.error('Failed to load planner data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle) return;
    try {
      await apiClient.createShoppingList({
        title: newListTitle,
        description: newListDesc,
        color: 'cyan',
      });
      setNewListTitle('');
      setNewListDesc('');
      setShowNewListModal(false);
      await loadPlannerData();
    } catch (err) {
      console.error('Failed to create list', err);
    }
  };

  const handleAddItem = async (listId: number) => {
    if (!newItemTitle) return;
    try {
      await apiClient.addItemToList(listId, {
        item_title: newItemTitle,
        desired_quantity: parseInt(newItemQty) || 1,
        estimated_unit_price: parseFloat(newItemPrice) || 0.0,
        priority: newItemPriority,
      });
      setNewItemTitle('');
      setNewItemQty('1');
      setNewItemPrice('');
      setShowAddItemModal(null);
      await loadPlannerData();
    } catch (err) {
      console.error('Failed to add item', err);
    }
  };

  const handleToggleItemPurchased = async (itemId: number, currentStatus: boolean) => {
    try {
      await apiClient.updateListItem(itemId, { is_purchased: !currentStatus });
      await loadPlannerData();
    } catch (err) {
      console.error('Failed to update item', err);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    try {
      await apiClient.deleteListItem(itemId);
      await loadPlannerData();
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  const handleDeleteList = async (listId: number) => {
    if (!confirm('Delete this shopping list?')) return;
    try {
      await apiClient.deleteShoppingList(listId);
      await loadPlannerData();
    } catch (err) {
      console.error('Failed to delete list', err);
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentMY = new Date().toISOString().slice(0, 7);
    try {
      await apiClient.setBudget({
        month_year: currentMY,
        category: budgetCategory,
        budget_limit: parseFloat(budgetLimit) || 10000.0,
      });
      setShowBudgetModal(false);
      setBudgetLimit('');
      await loadPlannerData();
    } catch (err) {
      console.error('Failed to set budget', err);
    }
  };

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle) return;
    try {
      await apiClient.createRecurring({
        custom_title: recTitle,
        replenishment_interval_days: parseInt(recDays) || 30,
      });
      setRecTitle('');
      setShowRecurringModal(false);
      await loadPlannerData();
    } catch (err) {
      console.error('Failed to create recurring', err);
    }
  };

  const handleReplenish = async (id: number) => {
    try {
      await apiClient.replenishRecurring(id);
      await loadPlannerData();
    } catch (err) {
      console.error('Failed to replenish item', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Navigation Pill Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h2 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            <span>Shopping Planner & Budget Intelligence</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Organize purchasing lists, track monthly category allowances, and schedule consumable replenishments.
          </p>
        </div>

        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('lists')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'lists'
                ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shopping Lists ({lists.length})
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'budgets'
                ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Budgets ({budgets.length})
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeTab === 'recurring'
                ? 'bg-white text-blue-700 font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Recurring Items ({recurring.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Shopping Lists */}
      {activeTab === 'lists' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowNewListModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Shopping List</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {lists.map((l) => (
              <div
                key={l.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2 pb-2.5 border-b border-slate-200">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{l.title}</h3>
                      {l.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{l.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200 shadow-2xs">
                        {formatINR(l.total_estimated_cost)}
                      </span>
                      <button
                        onClick={() => handleDeleteList(l.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition-colors"
                        title="Delete list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5 my-3">
                    {l.items.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No items added to this list yet.
                      </div>
                    ) : (
                      l.items.map((it) => (
                        <div
                          key={it.id}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                            it.is_purchased
                              ? 'bg-slate-100/60 border-slate-200 text-slate-400 line-through'
                              : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleItemPurchased(it.id, it.is_purchased)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {it.is_purchased ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                            <div>
                              <span className="text-xs font-semibold block text-slate-800">
                                {it.item_title} (x{it.desired_quantity})
                              </span>
                              {it.estimated_unit_price > 0 && (
                                <span className="text-[10px] text-slate-500 block font-normal">
                                  {formatINR(it.estimated_unit_price * it.desired_quantity)} (₹{it.estimated_unit_price} each)
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteItem(it.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Item Trigger */}
                <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Purchased: <strong className="text-slate-800">{l.completed_items_count}</strong> of {l.total_items_count}
                  </div>
                  <button
                    onClick={() => {
                      setShowAddItemModal(l.id);
                      setNewItemTitle('');
                      setNewItemPrice('');
                    }}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-blue-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Monthly Budgets */}
      {activeTab === 'budgets' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowBudgetModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Configure Category Budget</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                      Month: {b.month_year}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{b.category}</h3>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      b.is_exceeded
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {b.utilization_percentage}% Utilized
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Monthly Limit:</span>
                    <span className="font-semibold text-slate-900">{formatINR(b.budget_limit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Spent to Date:</span>
                    <span className="font-semibold text-blue-700">{formatINR(b.spent_amount)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-200">
                    <span className="text-slate-600">Remaining:</span>
                    <span className={`font-semibold ${b.is_exceeded ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {formatINR(b.remaining_amount)}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      b.is_exceeded
                        ? 'bg-rose-600'
                        : b.utilization_percentage > 80
                        ? 'bg-amber-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, b.utilization_percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Recurring Purchases */}
      {activeTab === 'recurring' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowRecurringModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recurring Cycle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recurring.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      Interval: Every {r.replenishment_interval_days} Days
                    </span>
                    {r.needs_replenishment_soon && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        Review Soon
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{r.custom_title}</h3>

                  <div className="bg-slate-50 rounded-lg p-2.5 my-3 border border-slate-200 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Next Review:</span>
                      <span className="text-blue-700 font-semibold">
                        in {r.days_until_next_review} days
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleReplenish(r.id)}
                  className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mark Replenished</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-5 shadow-xl relative">
            <button onClick={() => setShowNewListModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-slate-900 mb-3.5">Create New Shopping List</h3>
            <form onSubmit={handleCreateList} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">List Title</label>
                <input
                  type="text"
                  required
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  placeholder="e.g. Festive Sale Wishlist"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newListDesc}
                  onChange={(e) => setNewListDesc(e.target.value)}
                  placeholder="e.g. Products to purchase when prices drop"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
              >
                Create List
              </button>
            </form>
          </div>
        </div>
      )}

      {showAddItemModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-5 shadow-xl relative">
            <button onClick={() => setShowAddItemModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-slate-900 mb-3.5">Add Item to List</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddItem(showAddItemModal); }} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="e.g. Sony WH-1000XM5 or Tata Tea Gold"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Est. Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="e.g. 450"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs mt-1"
              >
                Save Item
              </button>
            </form>
          </div>
        </div>
      )}

      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-5 shadow-xl relative">
            <button onClick={() => setShowBudgetModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-slate-900 mb-3.5">Set Monthly Category Budget</h3>
            <form onSubmit={handleSaveBudget} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="All Categories">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Computers">Computers</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Books">Books</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Budget Limit (₹)</label>
                <input
                  type="number"
                  required
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
              >
                Save Budget
              </button>
            </form>
          </div>
        </div>
      )}

      {showRecurringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-5 shadow-xl relative">
            <button onClick={() => setShowRecurringModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-semibold text-slate-900 mb-3.5">Add Recurring Replenishment</h3>
            <form onSubmit={handleCreateRecurring} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  placeholder="e.g. Tata Tea Gold 1kg or Coffee Beans"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Replenishment Interval (Days)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={recDays}
                  onChange={(e) => setRecDays(e.target.value)}
                  placeholder="30"
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg px-3 py-2 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
              >
                Add Reminder
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
