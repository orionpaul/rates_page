'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface TickerMessage {
  id: string;
  message: string;
  icon: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_by: string | null;
}

export default function TickerManagementPage() {
  const [messages, setMessages] = useState<TickerMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { userData } = useAuth();

  const [formData, setFormData] = useState({
    message: '',
    icon: 'info',
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    if (userData?.role !== 'admin') {
      alert('Access denied. Admin only.');
      return;
    }
    fetchMessages();

    // Subscribe to real-time updates for ticker_messages table
    const tickerSubscription = supabase
      .channel('public:ticker_messages_page')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ticker_messages'
      }, (payload) => {
        console.log('Ticker message change detected:', payload);
        fetchMessages(); // Instant refresh on any change
      })
      .subscribe((status) => {
        console.log('Ticker subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      tickerSubscription.unsubscribe();
    };
  }, [userData]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ticker_messages')
        .select('*')
        .order('display_order', { ascending: true });

      if (data && !error) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching ticker messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMessage = async () => {
    if (!formData.message.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      const { error } = await supabase
        .from('ticker_messages')
        .insert([{
          message: formData.message,
          icon: formData.icon,
          is_active: formData.is_active,
          display_order: formData.display_order,
          updated_by: userData?.email || 'unknown',
        }]);

      if (!error) {
        setFormData({ message: '', icon: 'info', is_active: true, display_order: 0 });
        setShowAddForm(false);
        fetchMessages();
        alert('✅ Ticker message added successfully!');
      }
    } catch (error) {
      console.error('Error adding ticker message:', error);
      alert('❌ Failed to add ticker message');
    }
  };

  const handleUpdateMessage = async (id: string, updates: Partial<TickerMessage>) => {
    try {
      const { error } = await supabase
        .from('ticker_messages')
        .update({ ...updates, updated_by: userData?.email })
        .eq('id', id);

      if (!error) {
        fetchMessages();
        alert('✅ Ticker message updated successfully!');
      }
    } catch (error) {
      console.error('Error updating ticker message:', error);
      alert('❌ Failed to update ticker message');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (confirm('Are you sure you want to delete this ticker message?')) {
      try {
        const { error } = await supabase
          .from('ticker_messages')
          .delete()
          .eq('id', id);

        if (!error) {
          fetchMessages();
          alert('✅ Ticker message deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting ticker message:', error);
        alert('❌ Failed to delete ticker message');
      }
    }
  };

  if (userData?.role !== 'admin') {
    return (
      <div className="bg-blue-50 border border-blue-200 p-6">
        <h3 className="text-red-800 font-semibold">Access Denied</h3>
        <p className="text-red-600 mt-2">Only administrators can manage ticker messages.</p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  const iconOptions = [
    { value: 'info', label: '⚠️ Info', svg: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' },
    { value: 'clock', label: '🕐 Clock', svg: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' },
    { value: 'mail', label: '✉️ Mail', svg: 'M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Manage News Ticker</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-primary text-white px-4 py-2 hover:bg-primary-dark transition"
        >
          {showAddForm ? 'Cancel' : 'Add New Message'}
        </button>
      </div>

      {/* Add Message Form */}
      {showAddForm && (
        <div className="bg-white shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Add New Ticker Message</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Text
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                placeholder="Enter ticker message..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                >
                  {iconOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.is_active.toString()}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                  className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddMessage}
                className="bg-primary text-white px-6 py-2 hover:bg-primary-dark transition"
              >
                Add Message
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ message: '', icon: 'info', is_active: true, display_order: 0 });
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Table */}
      <div className="bg-white shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Message
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Icon
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {messages.map((msg) => (
              <tr key={msg.id}>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{msg.message}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {iconOptions.find((opt) => opt.value === msg.icon)?.label || msg.icon}
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={msg.display_order}
                    onChange={(e) => handleUpdateMessage(msg.id, { display_order: parseInt(e.target.value) })}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    value={msg.is_active.toString()}
                    onChange={(e) => handleUpdateMessage(msg.id, { is_active: e.target.value === 'true' })}
                    className="px-2 py-1 text-xs border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
