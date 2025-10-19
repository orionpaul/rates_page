'use client';

import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword, signOut, getAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { auth } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExistingUserForm, setShowExistingUserForm] = useState(false);
  const { userData, user } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'editor' as 'admin' | 'editor',
  });

  const [existingUserData, setExistingUserData] = useState({
    email: '',
    role: 'editor' as 'admin' | 'editor',
  });

  useEffect(() => {
    if (userData?.role !== 'admin') {
      alert('Access denied. Admin only.');
      return;
    }
    fetchUsers();

    // Subscribe to real-time updates for users table
    const usersSubscription = supabase
      .channel('public:users')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users'
      }, (payload) => {
        console.log('User change detected:', payload);
        fetchUsers(); // Instant refresh on any change
      })
      .subscribe((status) => {
        console.log('Users subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      usersSubscription.unsubscribe();
    };
  }, [userData]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        const usersData = data.map(row => ({
          uid: row.uid,
          email: row.email,
          role: row.role as 'admin' | 'editor',
          createdAt: new Date(row.created_at),
          createdBy: row.created_by,
        }));
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    // Validate inputs
    if (!formData.email.trim()) {
      alert('Please enter an email address');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      // Check if user already exists in Supabase first
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('email', formData.email);

      if (existingUsers && existingUsers.length > 0) {
        alert(
          `User already exists!\n\n` +
          `Email: ${formData.email}\n` +
          `Current Role: ${existingUsers[0].role}\n\n` +
          `Use the "Update Existing User" button instead to change their role.`
        );
        return;
      }

      // Create a secondary Firebase app instance to prevent auto-login
      // This ensures the admin stays logged in
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      };

      // Check if secondary app already exists, if not create it
      let secondaryApp;
      const existingApps = getApps();
      const secondaryAppExists = existingApps.find(app => app.name === 'Secondary');

      if (secondaryAppExists) {
        secondaryApp = secondaryAppExists;
      } else {
        secondaryApp = initializeApp(firebaseConfig, 'Secondary');
      }

      const secondaryAuth = getAuth(secondaryApp);

      // Create Firebase Auth user using secondary app
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password
      );

      // Immediately sign out from secondary app to prevent any session conflicts
      await signOut(secondaryAuth);

      // Add user document to Supabase
      const { error } = await supabase
        .from('users')
        .insert([{
          uid: userCredential.user.uid,
          email: formData.email,
          role: formData.role,
          created_by: userData?.email || 'unknown',
        }]);

      if (!error) {
        setFormData({ email: '', password: '', role: 'editor' });
        setShowAddForm(false);
        fetchUsers();
        alert(`✅ User created successfully!\n\nEmail: ${formData.email}\nRole: ${formData.role}`);
      }
    } catch (error: unknown) {
      console.error('Error adding user:', error);

      // Handle specific Firebase errors
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/email-already-in-use') {
        alert(
          `❌ Email Already Exists in Firebase!\n\n` +
          `The email "${formData.email}" already has a Firebase Auth account.\n\n` +
          `Options:\n` +
          `1. Use "Update Existing User" button to set their role\n` +
          `2. Or use a different email address`
        );
      } else if (firebaseError.code === 'auth/invalid-email') {
        alert('❌ Invalid email address format');
      } else if (firebaseError.code === 'auth/weak-password') {
        alert('❌ Password is too weak. Use at least 6 characters.');
      } else {
        alert(`❌ Failed to create user:\n\n${firebaseError.message || 'Unknown error'}`);
      }
    }
  };

  const handleAddExistingUser = async () => {
    if (!existingUserData.email.trim()) {
      alert('Please enter an email address');
      return;
    }

    try {
      // Check if user already exists in Supabase
      const { data: existingUsers } = await supabase
        .from('users')
        .select('*')
        .eq('email', existingUserData.email);

      if (existingUsers && existingUsers.length > 0) {
        // Update existing user's role
        const { error } = await supabase
          .from('users')
          .update({ role: existingUserData.role })
          .eq('email', existingUserData.email);

        if (!error) {
          setExistingUserData({ email: '', role: 'editor' });
          setShowExistingUserForm(false);
          fetchUsers();
          alert(
            `✅ User role updated successfully!\n\n` +
            `Email: ${existingUserData.email}\n` +
            `New Role: ${existingUserData.role}\n\n` +
            `They will need to log out and log back in for the role change to take effect.`
          );
        } else {
          alert(`❌ Failed to update role: ${error.message}`);
        }
      } else {
        // User doesn't exist in Supabase yet
        alert(
          `⚠️ User Not Found in Supabase!\n\n` +
          `Email: ${existingUserData.email}\n\n` +
          `This user must log in via Firebase Auth at least once before you can update their role.\n\n` +
          `Steps:\n` +
          `1. Verify they have a Firebase Auth account\n` +
          `2. Ask them to login at /admin/login\n` +
          `3. After they login once, their account will be created in Supabase\n` +
          `4. Then you can set their role here\n\n` +
          `Or use "Create New User" to make a brand new account.`
        );
      }
    } catch (error) {
      console.error('Error adding existing user:', error);
      alert(`❌ Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUpdateRole = async (uid: string, newRole: 'admin' | 'editor') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('uid', uid);

      if (!error) {
        fetchUsers();
        alert('User role updated successfully');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('uid', userId);

        if (!error) {
          fetchUsers();
          alert('User deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  if (userData?.role !== 'admin') {
    return (
      <div className="bg-blue-50 border border-blue-200 p-6">
        <h3 className="text-red-800 font-semibold">Access Denied</h3>
        <p className="text-red-600 mt-2">Only administrators can manage users.</p>
      </div>
    );
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-2 md:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
        <h2 className="text-xl md:text-3xl font-bold text-gray-800">Manage Users</h2>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setShowExistingUserForm(!showExistingUserForm);
              setShowAddForm(false);
            }}
            className="bg-secondary text-white px-3 py-2 md:px-4 md:py-2 hover:bg-secondary/90 transition text-sm md:text-base whitespace-nowrap"
          >
            {showExistingUserForm ? 'Cancel' : 'Update Existing User'}
          </button>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowExistingUserForm(false);
            }}
            className="bg-primary text-white px-3 py-2 md:px-4 md:py-2 hover:bg-primary-dark transition text-sm md:text-base whitespace-nowrap"
          >
            {showAddForm ? 'Cancel' : 'Create New User'}
          </button>
        </div>
      </div>

      {/* Update Existing User Form */}
      {showExistingUserForm && (
        <div className="bg-blue-50 border-2 border-secondary shadow p-3 md:p-6 mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Update Existing Firebase User</h3>
          <p className="text-xs md:text-sm text-gray-600 mb-4">
            ✅ Use this for users who already have a Firebase Auth account and have logged in at least once.<br/>
            💡 Example: orionpaul@gmail.com (your account)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={existingUserData.email}
                onChange={(e) => setExistingUserData({ ...existingUserData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-secondary outline-none"
                placeholder="existing@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={existingUserData.role}
                onChange={(e) =>
                  setExistingUserData({ ...existingUserData, role: e.target.value as 'admin' | 'editor' })
                }
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-secondary outline-none"
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddExistingUser}
              className="bg-secondary text-white px-6 py-2 hover:bg-secondary/90 transition"
            >
              Update User Role
            </button>
            <button
              onClick={() => {
                setShowExistingUserForm(false);
                setExistingUserData({ email: '', role: 'editor' });
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Create New User Form */}
      {showAddForm && (
        <div className="bg-white shadow p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Create New User</h3>
          <p className="text-sm text-gray-600 mb-4">
            ⚠️ Use this ONLY for creating brand new users who don&apos;t have a Firebase account yet.<br/>
            🚫 Will fail if the email already exists in Firebase.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                placeholder="newuser@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                placeholder="Min 6 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as 'admin' | 'editor' })
                }
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddUser}
              className="bg-primary text-white px-6 py-2 hover:bg-primary-dark transition"
            >
              Create User
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setFormData({ email: '', password: '', role: 'editor' });
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-3 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-3 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((currentUser) => (
              <tr key={currentUser.uid}>
                <td className="px-3 md:px-6 py-2 md:py-4">
                  <div className="text-xs md:text-sm font-medium text-gray-900">{currentUser.email}</div>
                  {user?.email === currentUser.email && (
                    <span className="text-xs text-secondary font-semibold">(You)</span>
                  )}
                </td>
                <td className="px-3 md:px-6 py-2 md:py-4">
                  <select
                    value={currentUser.role}
                    onChange={(e) => handleUpdateRole(currentUser.uid, e.target.value as 'admin' | 'editor')}
                    className="px-2 py-1 text-xs border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                    disabled={user?.email === currentUser.email}
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-3 md:px-6 py-2 md:py-4 text-xs md:text-sm text-gray-500">
                  {currentUser.createdAt
                    ? new Date(currentUser.createdAt).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td className="px-3 md:px-6 py-2 md:py-4 text-right text-xs md:text-sm">
                  {user?.email !== currentUser.email && (
                    <button
                      onClick={() => handleDeleteUser(currentUser.uid)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
