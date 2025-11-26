'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle,
  Send,
  ImageIcon,
  Trash2,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import toast from 'react-hot-toast';
import AppLayout from '@/components/AppLayout';

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
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; firstName: string; lastName: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser({ id: user.id, firstName: user.firstName || 'U', lastName: user.lastName || 'U' });
    }
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/feed', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPosts(data.posts || []);

      // Check liked posts
      const postIds = data.posts?.map((p: Post) => p.id) || [];
      const likedSet = new Set<string>();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      for (const postId of postIds) {
        const likeRes = await fetch(`/api/posts/${postId}/likes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const likeData = await likeRes.json();
        const hasLiked = likeData.likes?.some((like: any) => like.user.id === user.id);
        if (hasLiked) likedSet.add(postId);
      }
      
      setLikedPosts(likedSet);
      setLoading(false);
    } catch (err) {
      console.error('Load posts error:', err);
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const isLiked = likedPosts.has(postId);

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const newLikedPosts = new Set(likedPosts);
        if (isLiked) {
          newLikedPosts.delete(postId);
        } else {
          newLikedPosts.add(postId);
        }
        setLikedPosts(newLikedPosts);

        setPosts(posts.map(p => 
          p.id === postId 
            ? { ...p, like_count: p.like_count + (isLiked ? -1 : 1) }
            : p
        ));

        if (selectedPost?.id === postId) {
          setSelectedPost({
            ...selectedPost,
            like_count: selectedPost.like_count + (isLiked ? -1 : 1)
          });
        }
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const openPostDialog = async (post: Post) => {
    setSelectedPost(post);
    setLoadingComments(true);
    
    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error('Load comments error:', err);
    }
    setLoadingComments(false);
  };

  const handleComment = async () => {
    if (!selectedPost || !newComment.trim()) return;

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/posts/${selectedPost.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments([data.comment, ...comments]);
        setNewComment('');
        
        setPosts(posts.map(p => 
          p.id === selectedPost.id 
            ? { ...p, comment_count: p.comment_count + 1 }
            : p
        ));
        
        setSelectedPost({
          ...selectedPost,
          comment_count: selectedPost.comment_count + 1
        });
      }
    } catch (err) {
      console.error('Comment error:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    const token = localStorage.getItem('accessToken');
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Post deleted successfully');
        setPosts(posts.filter(p => p.id !== postId));
        setSelectedPost(null);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete post');
      }
    } catch (err) {
      toast.error('Failed to delete post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading feed...</div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {posts.length === 0 ? (
          <Card className="border-2 max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No posts yet. Follow some users to see their posts!</p>
              <Link href="/users">
                <Button>Discover Users</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="h-full"
              >
                <Card 
                  className="border-2 hover:shadow-2xl hover:border-primary/50 transition-all duration-300 cursor-pointer h-full flex flex-col overflow-hidden group"
                  onClick={() => openPostDialog(post)}
                >
                  {/* Image Section - Fixed Height */}
                  <div className="relative w-full h-56 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 overflow-hidden">
                    {post.image_url ? (
                      <Image
                        src={post.image_url}
                        alt="Post image"
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg font-medium">
                      {post.category.toUpperCase()}
                    </Badge>
                    {currentUser?.id === post.author.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-3 left-3 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Post
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Content Section */}
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-background shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold text-sm">
                          {post.author.first_name[0]}{post.author.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {post.author.first_name} {post.author.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{post.author.username}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col pt-0">
                    {/* Post Content - Fixed Height with Ellipsis */}
                    <p className="text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                      {post.content}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 pt-3 border-t">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(post.id);
                        }}
                        className={`flex items-center gap-1.5 transition-colors ${
                          likedPosts.has(post.id)
                            ? 'text-pink-600 dark:text-pink-400'
                            : 'text-muted-foreground hover:text-pink-600'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                        <span className="text-sm font-medium">{post.like_count}</span>
                      </motion.button>

                      <button className="flex items-center gap-1.5 text-muted-foreground hover:text-blue-600 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">{post.comment_count}</span>
                      </button>

                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(post.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          {selectedPost && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b">
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                      {selectedPost.author.first_name[0]}{selectedPost.author.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {selectedPost.author.first_name} {selectedPost.author.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground font-normal">
                      @{selectedPost.author.username} · {new Date(selectedPost.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-md">
                    {selectedPost.category.toUpperCase()}
                  </Badge>
                  {currentUser?.id === selectedPost.author.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 cursor-pointer"
                          onClick={() => handleDeletePost(selectedPost.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                <div className="px-6 py-4 space-y-4">
                  {/* Post Content */}
                  <p className="text-base leading-relaxed">{selectedPost.content}</p>

                  {/* Image */}
                  {selectedPost.image_url && (
                    <div className="relative w-full h-[400px] rounded-xl overflow-hidden bg-muted border-2">
                      <Image
                        src={selectedPost.image_url}
                        alt="Post image"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 800px"
                        priority
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-8 py-3 border-y">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleLike(selectedPost.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        likedPosts.has(selectedPost.id)
                          ? 'text-pink-600 dark:text-pink-400'
                          : 'text-muted-foreground hover:text-pink-600'
                      }`}
                    >
                      <Heart className={`w-6 h-6 ${likedPosts.has(selectedPost.id) ? 'fill-current' : ''}`} />
                      <span className="font-semibold">{selectedPost.like_count}</span>
                    </motion.button>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageCircle className="w-6 h-6" />
                      <span className="font-semibold">{selectedPost.comment_count}</span>
                    </div>
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-4 pb-4">
                    <h3 className="font-semibold text-lg">Comments</h3>

                    {/* Add Comment */}
                    <div className="flex gap-3">
                      {currentUser && (
                        <Avatar className="w-10 h-10 mt-1">
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-sm">
                            {currentUser.firstName[0]}{currentUser.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 flex gap-2">
                        <Textarea
                          placeholder="Write a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="resize-none min-h-[80px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleComment();
                            }
                          }}
                        />
                        <Button 
                          onClick={handleComment} 
                          disabled={!newComment.trim()}
                          size="icon"
                          className="h-10 w-10"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Comments List */}
                    {loadingComments ? (
                      <div className="text-center py-8">
                        <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <motion.div 
                            key={comment.id} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <Avatar className="w-10 h-10 border-2 border-background">
                              <AvatarFallback className="text-xs bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                                {comment.user.first_name[0]}{comment.user.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="font-semibold text-sm">
                                  {comment.user.first_name} {comment.user.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  @{comment.user.username}
                                </p>
                                <span className="text-xs text-muted-foreground">·</span>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <p className="text-sm leading-relaxed break-words">{comment.content}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
