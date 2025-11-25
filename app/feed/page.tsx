'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Post {
  id: string;
  content: string;
  image_url?: string;
  category: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: {
    id: string;
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
    id: string;
    username: string;
    first_name: string;
    last_name: string;
  };
}

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});

  const loadPosts = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/feed', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, [router]);

  const handleLike = async (postId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        loadPosts(); // Refresh posts to show updated count
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to like post');
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const loadComments = async (postId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (res.ok) {
        setComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
      }
    } catch (err) {
      console.error('Load comments error:', err);
    }
  };

  const toggleComments = (postId: string) => {
    const isShowing = showComments[postId];
    setShowComments((prev) => ({ ...prev, [postId]: !isShowing }));
    
    if (!isShowing && !comments[postId]) {
      loadComments(postId);
    }
  };

  const handleComment = async (postId: string, content: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    if (!content.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        loadPosts(); // Refresh posts to show updated count
        loadComments(postId); // Reload comments to show new one
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add comment');
      }
    } catch (err) {
      console.error('Comment error:', err);
      alert('Network error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading feed...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">My Feed</h1>
            <a href="/dashboard" className="text-blue-600 hover:text-blue-800">
              ← Back
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4">
        {posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No posts yet. Follow some users to see their posts!</p>
            <a href="/users" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
              Discover Users →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {post.author.first_name[0]}
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">
                      {post.author.first_name} {post.author.last_name}
                    </p>
                    <p className="text-sm text-gray-500">@{post.author.username}</p>
                  </div>
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-800 mb-2">{post.content}</p>
                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="rounded-lg max-w-full h-auto"
                  />
                )}
                <div className="mt-4 space-y-3">
                  <div className="flex gap-4 text-sm">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      ❤️ {post.like_count || 0}
                    </button>
                    <button 
                      onClick={() => toggleComments(post.id)}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      💬 {post.comment_count || 0}
                    </button>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">{post.category}</span>
                  </div>
                  
                  
                  {/* Comments section */}
                  {showComments[post.id] && (
                    <div className="border-t pt-3 space-y-3">
                      {/* Existing comments */}
                      {comments[post.id] && comments[post.id].length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {comments[post.id].map((comment) => (
                            <div key={comment.id} className="bg-gray-50 rounded p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">
                                  {comment.user.first_name} {comment.user.last_name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  @{comment.user.username}
                                </span>
                                <span className="text-xs text-gray-400 ml-auto">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-2">No comments yet</p>
                      )}
                      
                      {/* Comment input */}
                      <div className="flex gap-2">
                        <input
                          id={`comment-${post.id}`}
                          type="text"
                          placeholder="Add a comment..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleComment(post.id, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const input = document.getElementById(`comment-${post.id}`) as HTMLInputElement;
                            if (input && input.value.trim()) {
                              handleComment(post.id, input.value);
                              input.value = '';
                            }
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
