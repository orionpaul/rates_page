'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Media } from '@/types';
import Image from 'next/image';

interface TickerMessage {
  id: string;
  message: string;
  icon: string;
  is_active: boolean;
  display_order: number;
}

export default function MediaManagementPage() {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tickerMessages, setTickerMessages] = useState<TickerMessage[]>([]);
  const [showTickerForm, setShowTickerForm] = useState(false);
  const [tickerForm, setTickerForm] = useState({ message: '', icon: 'info', is_active: true, display_order: 0 });
  const { user } = useAuth();

  useEffect(() => {
    fetchMedia();
    fetchTickerMessages();

    // Subscribe to real-time updates for media table
    const mediaSubscription = supabase
      .channel('public:media')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'media'
      }, (payload) => {
        console.log('Media change detected:', payload);
        fetchMedia(); // Instant refresh on any change
      })
      .subscribe((status) => {
        console.log('Media subscription status:', status);
      });

    // Subscribe to real-time updates for ticker_messages table
    const tickerSubscription = supabase
      .channel('public:ticker_messages_admin')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ticker_messages'
      }, (payload) => {
        console.log('Ticker message change detected:', payload);
        fetchTickerMessages(); // Instant refresh on any change
      })
      .subscribe((status) => {
        console.log('Ticker subscription status:', status);
      });

    // Cleanup subscriptions on unmount
    return () => {
      mediaSubscription.unsubscribe();
      tickerSubscription.unsubscribe();
    };
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        const mediaData = data.map(row => ({
          id: row.id,
          type: row.type as 'youtube' | 'image' | 'video',
          url: row.url,
          isActive: row.is_active,
          createdAt: new Date(row.created_at),
          updatedBy: row.updated_by,
        }));
        setMediaItems(mediaData);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleYoutubeSubmit = async () => {
    if (!youtubeUrl.trim()) return;

    try {
      // Deactivate all other media
      await supabase
        .from('media')
        .update({ is_active: false })
        .eq('is_active', true);

      // Add new YouTube media
      const { error } = await supabase
        .from('media')
        .insert([{
          type: 'youtube',
          url: youtubeUrl,
          is_active: true,
          updated_by: user?.email || 'unknown',
        }]);

      if (!error) {
        setYoutubeUrl('');
        fetchMedia();
      }
    } catch (error) {
      console.error('Error adding YouTube URL:', error);
      alert('Failed to add YouTube URL');
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Upload image to Supabase Storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase
        .storage
        .from('ads')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('ads')
        .getPublicUrl(fileName);

      // Deactivate all other media
      await supabase
        .from('media')
        .update({ is_active: false })
        .eq('is_active', true);

      // Add new image media
      const { error } = await supabase
        .from('media')
        .insert([{
          type: 'image',
          url: publicUrl,
          is_active: true,
          updated_by: user?.email || 'unknown',
        }]);

      if (!error) {
        setSelectedFile(null);
        fetchMedia();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      // Deactivate all media
      await supabase
        .from('media')
        .update({ is_active: false })
        .eq('is_active', true);

      // Activate selected media
      const { error } = await supabase
        .from('media')
        .update({ is_active: true })
        .eq('id', id);

      if (!error) {
        fetchMedia();
      }
    } catch (error) {
      console.error('Error setting active media:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this media?')) {
      try {
        const { error } = await supabase
          .from('media')
          .delete()
          .eq('id', id);

        if (!error) {
          fetchMedia();
        }
      } catch (error) {
        console.error('Error deleting media:', error);
      }
    }
  };

  const fetchTickerMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('ticker_messages')
        .select('*')
        .order('display_order', { ascending: true });

      if (data && !error) {
        setTickerMessages(data);
      }
    } catch (error) {
      console.error('Error fetching ticker messages:', error);
    }
  };

  const handleAddTickerMessage = async () => {
    if (!tickerForm.message.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      const { error } = await supabase
        .from('ticker_messages')
        .insert([{
          message: tickerForm.message,
          icon: tickerForm.icon,
          is_active: tickerForm.is_active,
          display_order: tickerForm.display_order,
          updated_by: user?.email || 'unknown',
        }]);

      if (!error) {
        setTickerForm({ message: '', icon: 'info', is_active: true, display_order: 0 });
        setShowTickerForm(false);
        fetchTickerMessages();
        alert('✅ Ticker message added!');
      }
    } catch (error) {
      console.error('Error adding ticker message:', error);
      alert('❌ Failed to add ticker message');
    }
  };

  const handleUpdateTickerMessage = async (id: string, updates: Partial<TickerMessage>) => {
    try {
      const { error } = await supabase
        .from('ticker_messages')
        .update({ ...updates, updated_by: user?.email })
        .eq('id', id);

      if (!error) {
        fetchTickerMessages();
      }
    } catch (error) {
      console.error('Error updating ticker message:', error);
    }
  };

  const handleDeleteTickerMessage = async (id: string) => {
    if (confirm('Delete this ticker message?')) {
      try {
        const { error } = await supabase
          .from('ticker_messages')
          .delete()
          .eq('id', id);

        if (!error) {
          fetchTickerMessages();
        }
      } catch (error) {
        console.error('Error deleting ticker message:', error);
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-2 md:p-0">
      <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">Manage Media</h2>

      {/* Add Media Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-8">
        {/* YouTube URL Form */}
        <div className="bg-white shadow p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">Add YouTube Video</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <button
              onClick={handleYoutubeSubmit}
              className="w-full bg-primary text-white px-4 py-2 hover:bg-primary-dark transition"
            >
              Add YouTube Video
            </button>
          </div>
        </div>

        {/* Image Upload Form */}
        <div className="bg-white shadow p-4 md:p-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">Upload Image</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <button
              onClick={handleImageUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-primary text-white px-4 py-2 hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
        </div>
      </div>

      {/* News Ticker Management */}
      <div className="bg-white shadow p-3 md:p-6 mb-4 md:mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-4 gap-2">
          <h3 className="text-lg md:text-xl font-bold text-gray-800">News Ticker Messages</h3>
          <button
            onClick={() => setShowTickerForm(!showTickerForm)}
            className="bg-secondary text-white px-3 md:px-4 py-2 hover:bg-secondary/90 transition text-xs md:text-sm whitespace-nowrap"
          >
            {showTickerForm ? 'Cancel' : '+ Add Message'}
          </button>
        </div>

        {showTickerForm && (
          <div className="bg-blue-50 border-2 border-secondary p-4 mb-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <input
                  type="text"
                  value={tickerForm.message}
                  onChange={(e) => setTickerForm({ ...tickerForm, message: e.target.value })}
                  placeholder="Enter ticker message..."
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-secondary outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <select
                    value={tickerForm.icon}
                    onChange={(e) => setTickerForm({ ...tickerForm, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-secondary outline-none text-sm"
                  >
                    <option value="info">⚠️ Info</option>
                    <option value="clock">🕐 Clock</option>
                    <option value="mail">✉️ Mail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={tickerForm.display_order}
                    onChange={(e) => setTickerForm({ ...tickerForm, display_order: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-secondary outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={tickerForm.is_active.toString()}
                    onChange={(e) => setTickerForm({ ...tickerForm, is_active: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-secondary outline-none text-sm"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddTickerMessage}
                className="bg-secondary text-white px-4 py-2 hover:bg-secondary/90 transition text-sm"
              >
                Add Ticker Message
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {tickerMessages.length === 0 ? (
            <p className="text-gray-500 text-sm">No ticker messages yet. Add one to get started.</p>
          ) : (
            tickerMessages.map((msg) => (
              <div key={msg.id} className="flex items-center justify-between border border-gray-200 p-3 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="text-sm text-gray-900">{msg.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Order: {msg.display_order} • {msg.is_active ? '✓ Active' : '✗ Inactive'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={msg.is_active.toString()}
                    onChange={(e) => handleUpdateTickerMessage(msg.id, { is_active: e.target.value === 'true' })}
                    className="px-2 py-1 text-xs border border-gray-300 focus:ring-2 focus:ring-secondary outline-none"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                  <button
                    onClick={() => handleDeleteTickerMessage(msg.id)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Media List */}
      <div className="bg-white shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">All Media</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {mediaItems.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No media items yet. Add a YouTube video or upload an image.
            </div>
          ) : (
            mediaItems.map((media) => (
              <div key={media.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {media.type === 'image' && (
                    <div className="relative w-24 h-16">
                      <Image
                        src={media.url}
                        alt="Media thumbnail"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {media.type === 'youtube' ? 'YouTube Video' : 'Image'}
                      {media.isActive && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 truncate max-w-md">
                      {media.url}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!media.isActive && (
                    <button
                      onClick={() => handleSetActive(media.id)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 hover:bg-green-200 transition"
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(media.id)}
                    className="px-3 py-1 text-sm bg-blue-100 text-primary-dark hover:bg-blue-200 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
