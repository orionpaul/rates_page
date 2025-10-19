'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      console.error(err);
      const firebaseError = err as { code?: string; message?: string };

      if (firebaseError.code === 'auth/invalid-credential') {
        setError(
          'Account not found or password is incorrect.\n\n' +
          'First time logging in?\n' +
          '1. Create your account in Firebase Console\n' +
          '2. Get your UID from Firebase Console\n' +
          '3. Run: node scripts/bootstrapFirstAdmin.js <YOUR_UID>'
        );
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Invalid email format. Please check your email address.');
      } else if (firebaseError.code === 'auth/user-disabled') {
        setError('This account has been disabled. Contact your administrator.');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later.');
      } else {
        setError('Login failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
      <div className="bg-white shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="Talk&Pay"
            width={250}
            height={100}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-primary">Admin Login</h1>
          <p className="text-gray-600 mt-2">Sign in to manage exchange rates</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 whitespace-pre-line text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
              placeholder="admin@talkandpay.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-transparent outline-none transition"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
