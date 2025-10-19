'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Media } from '@/types';
import Image from 'next/image';

export default function MediaManagementPage() {
  const [mediaItems, setMediaItems] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchMedia();
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
          type: row.type as 'youtube' | 'image',
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Media</h2>

      {/* Add Media Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* YouTube URL Form */}
        <div className="bg-white shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Add YouTube Video</h3>
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
        <div className="bg-white shadow p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Upload Image</h3>
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
