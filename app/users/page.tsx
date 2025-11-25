'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    setCurrentUserId(user.id);

    // Fetch all users
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // Filter out current user
        const otherUsers = data.users?.filter((u: User) => u.id !== user.id) || [];
        setUsers(otherUsers);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Fetch following list
    fetch(`/api/users/${user.id}/following`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const followingSet = new Set<string>(
          data.following?.map((f: any) => f.following.id) || []
        );
        setFollowingIds(followingSet);
      })
      .catch((err) => console.error('Failed to fetch following:', err));
  }, [router]);

  const handleFollow = async (userId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const isFollowing = followingIds.has(userId);

    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Update local state
        setFollowingIds((prev) => {
          const newSet = new Set(prev);
          if (isFollowing) {
            newSet.delete(userId);
          } else {
            newSet.add(userId);
          }
          return newSet;
        });
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update follow status');
      }
    } catch (err) {
      alert('Network error');
    }
  };

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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Discover Users</h1>
            <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
              ← Back
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4">
        {users.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No users found. Create some posts to discover users!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow p-6 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user.first_name[0]}
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleFollow(user.id)}
                  className={`px-4 py-2 rounded-md ${
                    followingIds.has(user.id)
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {followingIds.has(user.id) ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
