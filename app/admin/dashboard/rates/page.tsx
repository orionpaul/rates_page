'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Currency } from '@/types';

export default function RatesManagementPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    flagUrl: '',
    buyRate: 0,
    midRate: 0,
    sellRate: 0,
    order: 0,
  });

  useEffect(() => {
    fetchCurrencies();

    // Subscribe to real-time updates for currencies table
    const currenciesSubscription = supabase
      .channel('public:currencies_admin')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'currencies'
      }, (payload) => {
        console.log('Currency change detected:', payload);
        fetchCurrencies(); // Instant refresh on any change
      })
      .subscribe((status) => {
        console.log('Currencies subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      currenciesSubscription.unsubscribe();
    };
  }, []);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .order('order', { ascending: true });

      if (data && !error) {
        const currencyData = data.map(row => ({
          id: row.id,
          code: row.code,
          name: row.name,
          flagUrl: row.flag_url,
          buyRate: parseFloat(row.buy_rate),
          midRate: parseFloat(row.mid_rate),
          sellRate: parseFloat(row.sell_rate),
          order: row.order,
          updatedAt: new Date(row.updated_at),
        }));
        setCurrencies(currencyData);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const { error } = await supabase
        .from('currencies')
        .insert([{
          code: formData.code,
          name: formData.name,
          flag_url: formData.flagUrl,
          buy_rate: formData.buyRate,
          mid_rate: formData.midRate,
          sell_rate: formData.sellRate,
          order: formData.order,
        }]);

      if (!error) {
        resetForm();
        fetchCurrencies();
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding currency:', error);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('currencies')
        .update({
          code: formData.code,
          name: formData.name,
          flag_url: formData.flagUrl,
          buy_rate: formData.buyRate,
          mid_rate: formData.midRate,
          sell_rate: formData.sellRate,
          order: formData.order,
        })
        .eq('id', id);

      if (!error) {
        resetForm();
        setEditingId(null);
        fetchCurrencies();
      }
    } catch (error) {
      console.error('Error updating currency:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this currency?')) {
      try {
        const { error } = await supabase
          .from('currencies')
          .delete()
          .eq('id', id);

        if (!error) {
          fetchCurrencies();
        }
      } catch (error) {
        console.error('Error deleting currency:', error);
      }
    }
  };

  const startEdit = (currency: Currency) => {
    setEditingId(currency.id);
    setFormData({
      code: currency.code,
      name: currency.name,
      flagUrl: currency.flagUrl,
      buyRate: currency.buyRate,
      midRate: currency.midRate,
      sellRate: currency.sellRate,
      order: currency.order,
    });
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      flagUrl: '',
      buyRate: 0,
      midRate: 0,
      sellRate: 0,
      order: 0,
    });
    setEditingId(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-2 md:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-2">
        <h2 className="text-xl md:text-3xl font-bold text-gray-800">Manage Exchange Rates</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-white px-3 md:px-4 py-2 hover:bg-primary-dark transition text-sm md:text-base whitespace-nowrap"
        >
          {showAddForm ? 'Cancel' : 'Add Currency'}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white shadow p-3 md:p-6 mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">Add New Currency</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency Code (e.g., USD)
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flag URL
              </label>
              <input
                type="text"
                value={formData.flagUrl}
                onChange={(e) => setFormData({ ...formData, flagUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buy Rate
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.buyRate}
                onChange={(e) => setFormData({ ...formData, buyRate: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mid Rate
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.midRate}
                onChange={(e) => setFormData({ ...formData, midRate: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sell Rate
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.sellRate}
                onChange={(e) => setFormData({ ...formData, sellRate: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAdd}
              className="bg-primary text-white px-6 py-2 hover:bg-primary-dark transition"
            >
              Add Currency
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                resetForm();
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Currencies Table */}
      <div className="bg-white shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Currency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Buy Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Mid Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Sell Rate
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currencies.map((currency) => (
              <tr key={currency.id}>
                {editingId === currency.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) =>
                          setFormData({ ...formData, order: Number(e.target.value) })
                        }
                        className="w-20 px-2 py-1 border"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {currency.code}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.001"
                        value={formData.buyRate}
                        onChange={(e) =>
                          setFormData({ ...formData, buyRate: Number(e.target.value) })
                        }
                        className="w-32 px-2 py-1 border"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.001"
                        value={formData.midRate}
                        onChange={(e) =>
                          setFormData({ ...formData, midRate: Number(e.target.value) })
                        }
                        className="w-32 px-2 py-1 border"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        step="0.001"
                        value={formData.sellRate}
                        onChange={(e) =>
                          setFormData({ ...formData, sellRate: Number(e.target.value) })
                        }
                        className="w-32 px-2 py-1 border"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleUpdate(currency.id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          resetForm();
                          setEditingId(null);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {currency.order}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {currency.code}
                      </div>
                      <div className="text-sm text-gray-500">{currency.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {currency.buyRate.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {currency.midRate.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {currency.sellRate.toFixed(3)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => startEdit(currency)}
                        className="text-primary hover:text-primary-dark mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(currency.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
