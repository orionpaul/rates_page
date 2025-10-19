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
        const { count: currenciesCount } = await supabase
          .from('currencies')
          .select('*', { count: 'exact', head: true });

        // Get active media count
        const { count: mediaCount } = await supabase
          .from('media')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // Get total users
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalCurrencies: currenciesCount || 0,
          activeMedia: mediaCount || 0,
          totalUsers: usersCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-2 md:p-0">
      <h2 className="text-xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-6">Dashboard Overview</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-8">
        <div className="bg-white shadow p-4 md:p-6">
          <h3 className="text-gray-600 text-xs md:text-sm font-medium mb-2">
            Total Currencies
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-primary">{stats.totalCurrencies}</p>
        </div>

        <div className="bg-white shadow p-4 md:p-6">
          <h3 className="text-gray-600 text-xs md:text-sm font-medium mb-2">
            Active Media
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-primary">{stats.activeMedia}</p>
        </div>

        <div className="bg-white shadow p-4 md:p-6">
          <h3 className="text-gray-600 text-xs md:text-sm font-medium mb-2">
            Total Users
          </h3>
          <p className="text-2xl md:text-3xl font-bold text-primary">{stats.totalUsers}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow p-3 md:p-6">
        <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <Link
            href="/admin/dashboard/rates"
            className="p-3 md:p-4 border-2 border-gray-200 hover:border-primary hover:bg-blue-50 transition"
          >
            <h4 className="font-semibold text-sm md:text-base text-gray-800 mb-1 md:mb-2">Update Rates</h4>
            <p className="text-xs md:text-sm text-gray-600">
              Modify currency exchange rates
            </p>
          </Link>

          <Link
            href="/admin/dashboard/media"
            className="p-3 md:p-4 border-2 border-gray-200 hover:border-primary hover:bg-blue-50 transition"
          >
            <h4 className="font-semibold text-sm md:text-base text-gray-800 mb-1 md:mb-2">Manage Media</h4>
            <p className="text-xs md:text-sm text-gray-600">
              Upload images or add YouTube videos
            </p>
          </Link>

          <Link
            href="/admin/dashboard/users"
            className="p-3 md:p-4 border-2 border-gray-200 hover:border-primary hover:bg-blue-50 transition"
          >
            <h4 className="font-semibold text-sm md:text-base text-gray-800 mb-1 md:mb-2">Manage Users</h4>
            <p className="text-xs md:text-sm text-gray-600">
              Add or remove admin users
            </p>
          </Link>
        </div>
      </div>

      {/* View Rate Board */}
      <div className="mt-4 md:mt-6">
        <Link
          href="/"
          target="_blank"
          className="inline-block bg-primary text-white px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold hover:bg-primary-dark transition"
        >
          View Public Rate Board
        </Link>
      </div>
    </div>
  );
}
