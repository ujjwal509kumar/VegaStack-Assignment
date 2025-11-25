'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  stats: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (!userData || !token) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

    // Fetch fresh stats
    fetch('/api/users/me/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) {
          setUser((prev) => prev ? { ...prev, stats: data.stats } : null);
          // Update localStorage with fresh stats
          const updatedUser = { ...parsedUser, stats: data.stats };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      })
      .catch((err) => console.error('Failed to fetch stats:', err));
  }, [router]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const accessToken = localStorage.getItem('accessToken');

    if (refreshToken && accessToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    localStorage.clear();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">SocialConnect</h1>
            </div>
            <div className="flex items-center gap-4">
              {user.role === 'ADMIN' && (
                <a
                  href="/admin"
                  className="px-4 py-2 text-sm font-medium text-purple-700 hover:text-purple-900"
                >
                  Admin Panel
                </a>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {user.firstName} {user.lastName}!
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Username</p>
                <p className="text-lg font-medium text-gray-900">@{user.username}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-lg font-medium text-gray-900">{user.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="text-lg font-medium text-gray-900">{user.role}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{user.stats.postsCount}</p>
                  <p className="text-sm text-gray-600">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{user.stats.followersCount}</p>
                  <p className="text-sm text-gray-600">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{user.stats.followingCount}</p>
                  <p className="text-sm text-gray-600">Following</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <a
              href="/feed"
              className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              <h3 className="font-semibold text-blue-900">📰 Feed</h3>
              <p className="text-sm text-blue-700">View posts from people you follow</p>
            </a>
            <a
              href="/posts/create"
              className="block p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100"
            >
              <h3 className="font-semibold text-green-900">✍️ Create Post</h3>
              <p className="text-sm text-green-700">Share something with your followers</p>
            </a>
            <a
              href="/profile"
              className="block p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100"
            >
              <h3 className="font-semibold text-purple-900">👤 My Profile</h3>
              <p className="text-sm text-purple-700">Edit your profile information</p>
            </a>
            <a
              href="/users"
              className="block p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100"
            >
              <h3 className="font-semibold text-orange-900">👥 Discover Users</h3>
              <p className="text-sm text-orange-700">Find and follow other users</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
