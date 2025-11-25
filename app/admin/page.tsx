'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Stats {
  totalUsers: number;
  totalPosts: number;
  activeToday: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== 'ADMIN') {
      alert('Access denied. Admin only.');
      router.push('/dashboard');
      return;
    }

    fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats(data.stats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalUsers || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Posts</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalPosts || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Active Today</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.activeToday || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <a
            href="/admin/users"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">👥 User Management</h3>
            <p className="text-gray-600">View and manage all users</p>
          </a>
          <a
            href="/admin/posts"
            className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📝 Post Management</h3>
            <p className="text-gray-600">View and moderate all posts</p>
          </a>
        </div>
      </main>
    </div>
  );
}
