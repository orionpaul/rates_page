'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, userData, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="Talk&Pay" width={150} height={60} className="object-contain" />
              <h1 className="text-2xl font-bold text-primary">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{userData?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-primary text-white px-4 py-2 hover:bg-primary-dark transition"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <Link
                href="/admin/dashboard"
                className="border-b-2 border-transparent hover:border-primary px-1 py-4 text-sm font-medium text-gray-700 hover:text-primary transition"
              >
                Overview
              </Link>
              <Link
                href="/admin/dashboard/rates"
                className="border-b-2 border-transparent hover:border-primary px-1 py-4 text-sm font-medium text-gray-700 hover:text-primary transition"
              >
                Manage Rates
              </Link>
              <Link
                href="/admin/dashboard/media"
                className="border-b-2 border-transparent hover:border-primary px-1 py-4 text-sm font-medium text-gray-700 hover:text-primary transition"
              >
                Media
              </Link>
              {userData?.role === 'admin' && (
                <Link
                  href="/admin/dashboard/users"
                  className="border-b-2 border-transparent hover:border-primary px-1 py-4 text-sm font-medium text-gray-700 hover:text-primary transition"
                >
                  Users
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          {children}
        </main>

        {/* News Ticker / Announcement Banner - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-primary via-primary-dark to-primary shadow-lg border-t-2 border-primary-light">
          {/* Animated stripes background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
          </div>

          <div className="relative py-3 px-4">
            {/* Admin Badge */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 bg-secondary px-3 py-1.5 shadow-lg">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
              <span className="text-white font-bold text-xs uppercase tracking-wider">Admin Panel</span>
            </div>

            {/* Scrolling Text Container */}
            <div className="overflow-hidden ml-32">
              <div className="flex animate-scroll-left whitespace-nowrap">
                {/* Duplicate text for seamless loop */}
                <div className="flex items-center gap-8 pr-8">
                  <span className="text-white text-base font-semibold flex items-center gap-3">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>Changes are saved instantly and updated in real-time on the public board</span>
                  </span>
                  <span className="text-secondary-light text-base">•</span>
                  <span className="text-white text-base font-semibold flex items-center gap-3">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Remember to verify all rate changes before saving</span>
                  </span>
                  <span className="text-secondary-light text-base">•</span>
                  <span className="text-white text-base font-semibold flex items-center gap-3">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    <span>Preview changes on the public board: http://localhost:3000</span>
                  </span>
                  <span className="text-secondary-light text-base">•</span>
                </div>
                {/* Duplicate for seamless loop */}
                <div className="flex items-center gap-8 pr-8">
                  <span className="text-white text-base font-semibold flex items-center gap-3">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>Changes are saved instantly and updated in real-time on the public board</span>
                  </span>
                  <span className="text-secondary-light text-base">•</span>
                  <span className="text-white text-base font-semibold flex items-center gap-3">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Remember to verify all rate changes before saving</span>
                  </span>
                  <span className="text-secondary-light text-base">•</span>
                  <span className="text-white text-base font-semibold flex items-center gap-3">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    <span>Preview changes on the public board: http://localhost:3000</span>
                  </span>
                  <span className="text-secondary-light text-base">•</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
