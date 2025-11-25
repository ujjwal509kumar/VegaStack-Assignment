'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Post {
  id: string;
  content: string;
  category: string;
  is_active: boolean;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: {
    username: string;
    first_name: string;
    last_name: string;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user: {
    username: string;
    first_name: string;
    last_name: string;
  };
}

interface Like {
  created_at: string;
  user: {
    username: string;
    first_name: string;
    last_name: string;
  };
}

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [likes, setLikes] = useState<{ [postId: string]: Like[] }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const [showLikes, setShowLikes] = useState<{ [postId: string]: boolean }>({});

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/admin/posts', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Post deleted successfully');
        setPosts(posts.filter((p) => p.id !== postId));
      } else {
        alert('Failed to delete post');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const toggleComments = async (postId: string) => {
    if (showComments[postId]) {
      setShowComments({ ...showComments, [postId]: false });
      return;
    }

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/admin/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setComments({ ...comments, [postId]: data.comments });
        setShowComments({ ...showComments, [postId]: true });
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const toggleLikes = async (postId: string) => {
    if (showLikes[postId]) {
      setShowLikes({ ...showLikes, [postId]: false });
      return;
    }

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/admin/posts/${postId}/likes`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLikes({ ...likes, [postId]: data.likes });
        setShowLikes({ ...showLikes, [postId]: true });
      }
    } catch (err) {
      console.error('Error fetching likes:', err);
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">Post Management</h1>
            <a href="/admin" className="text-blue-600 hover:text-blue-800">
              ← Back to Admin
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-semibold">
                    {post.author.first_name} {post.author.last_name}
                  </p>
                  <p className="text-sm text-gray-500">@{post.author.username}</p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${post.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {post.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                    {post.category}
                  </span>
                </div>
              </div>
              <p className="text-gray-800 mb-4">{post.content}</p>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4 text-sm text-gray-500">
                  <button
                    onClick={() => toggleLikes(post.id)}
                    className="hover:text-blue-600 cursor-pointer"
                  >
                    ❤️ {post.like_count}
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="hover:text-blue-600 cursor-pointer"
                  >
                    💬 {post.comment_count}
                  </button>
                  <span className="text-xs">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </div>

              {/* Likes Section */}
              {showLikes[post.id] && likes[post.id] && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold mb-2">Likes ({likes[post.id].length})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {likes[post.id].map((like, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-medium">
                            {like.user.first_name} {like.user.last_name}
                          </span>
                          <span className="text-gray-500 ml-2">@{like.user.username}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(like.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Section */}
              {showComments[post.id] && comments[post.id] && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-semibold mb-2">Comments ({comments[post.id].length})</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments[post.id].map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-medium text-sm">
                              {comment.user.first_name} {comment.user.last_name}
                            </span>
                            <span className="text-gray-500 text-sm ml-2">@{comment.user.username}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
