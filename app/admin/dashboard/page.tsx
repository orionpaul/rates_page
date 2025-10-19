'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCurrencies: 0,
    activeMedia: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get total currencies
        const { data: currencies } = await supabase
          .from('currencies')
          .select('id', { count: 'exact', head: true });

        // Get active media count
        const { data: media } = await supabase
          .from('media')
          .select('id', { count: 'exact', head: true })
          .eq('is_active', true);

        // Get total users
        const { data: users } = await supabase
          .from('users')
          .select('uid', { count: 'exact', head: true });

        setStats({
          totalCurrencies: currencies?.length || 0,
          activeMedia: media?.length || 0,
          totalUsers: users?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">
            Total Currencies
          </h3>
          <p className="text-3xl font-bold text-primary">{stats.totalCurrencies}</p>
        </div>

        <div className="bg-white shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">
            Active Media
          </h3>
          <p className="text-3xl font-bold text-primary">{stats.activeMedia}</p>
        </div>

        <div className="bg-white shadow p-6">
          <h3 className="text-gray-600 text-sm font-medium mb-2">
            Total Users
          </h3>
          <p className="text-3xl font-bold text-primary">{stats.totalUsers}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/dashboard/rates"
            className="p-4 border-2 border-gray-200 hover:border-primary hover:bg-blue-50 transition"
          >
            <h4 className="font-semibold text-gray-800 mb-2">Update Rates</h4>
            <p className="text-sm text-gray-600">
              Modify currency exchange rates
            </p>
          </Link>

          <Link
            href="/admin/dashboard/media"
            className="p-4 border-2 border-gray-200 hover:border-primary hover:bg-blue-50 transition"
          >
            <h4 className="font-semibold text-gray-800 mb-2">Manage Media</h4>
            <p className="text-sm text-gray-600">
              Upload images or add YouTube videos
            </p>
          </Link>

          <Link
            href="/admin/dashboard/users"
            className="p-4 border-2 border-gray-200 hover:border-primary hover:bg-blue-50 transition"
          >
            <h4 className="font-semibold text-gray-800 mb-2">Manage Users</h4>
            <p className="text-sm text-gray-600">
              Add or remove admin users
            </p>
          </Link>
        </div>
      </div>

      {/* View Rate Board */}
      <div className="mt-6">
        <Link
          href="/"
          target="_blank"
          className="inline-block bg-primary text-white px-6 py-3 font-semibold hover:bg-primary-dark transition"
        >
          View Public Rate Board
        </Link>
      </div>
    </div>
  );
}
