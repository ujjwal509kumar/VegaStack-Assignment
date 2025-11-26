'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search,
  Trash2,
  Heart,
  MessageCircle,
  Calendar,
  ImageIcon,
  Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/components/AppLayout';
import toast from 'react-hot-toast';

interface Post {
  id: string;
  content: string;
  image_url?: string;
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
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<Like[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);


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
        setFilteredPosts(data.posts || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(posts);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = posts.filter(
        (post) =>
          post.content.toLowerCase().includes(query) ||
          post.author.username.toLowerCase().includes(query) ||
          post.author.first_name.toLowerCase().includes(query) ||
          post.author.last_name.toLowerCase().includes(query) ||
          post.category.toLowerCase().includes(query)
      );
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  const handleDelete = async (postId: string) => {
    const token = localStorage.getItem('accessToken');
    const loadingToast = toast.loading('Deleting post...');
    
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.dismiss(loadingToast);
        toast.success('Post deleted successfully');
        setPosts(posts.filter((p) => p.id !== postId));
        setFilteredPosts(filteredPosts.filter((p) => p.id !== postId));
      } else {
        toast.dismiss(loadingToast);
        toast.error('Failed to delete post');
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Network error');
    }
  };

  const viewPostDetails = async (post: Post) => {
    setSelectedPost(post);
    setLoadingDetails(true);
    
    const token = localStorage.getItem('accessToken');
    
    try {
      // Fetch comments and likes
      const [commentsRes, likesRes] = await Promise.all([
        fetch(`/api/admin/posts/${post.id}/comments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/admin/posts/${post.id}/likes`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ]);

      const commentsData = await commentsRes.json();
      const likesData = await likesRes.json();

      setComments(commentsData.comments || []);
      setLikes(likesData.likes || []);
    } catch (err) {
      console.error('Error fetching post details:', err);
      toast.error('Failed to load post details');
    }
    
    setLoadingDetails(false);
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading posts...</div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Header with Search */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Post Management</h1>
              <p className="text-muted-foreground">
                Manage {posts.length} posts across the platform
              </p>
            </div>
            
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <Card className="border-2">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-2">
                  {searchQuery ? 'No posts found matching your search' : 'No posts found'}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="border-2 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    {/* Image Section */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                      {post.image_url ? (
                        <Image
                          src={post.image_url}
                          alt="Post image"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <Badge className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-lg font-medium">
                        {post.category.toUpperCase()}
                      </Badge>
                    </div>

                    <CardContent className="p-4 flex-1 flex flex-col">
                      {/* Author */}
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs">
                            {post.author.first_name[0]}{post.author.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {post.author.first_name} {post.author.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{post.author.username}
                          </p>
                        </div>
                        <Badge variant={post.is_active ? "default" : "destructive"} className="text-xs">
                          {post.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Content */}
                      <p className="text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                        {post.content}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 pb-4 border-b">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.like_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.comment_count}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <Calendar className="w-4 h-4" />
                          <span className="text-xs">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => viewPostDetails(post)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Post Details Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                      {selectedPost.author.first_name[0]}{selectedPost.author.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {selectedPost.author.first_name} {selectedPost.author.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground font-normal">
                      @{selectedPost.author.username}
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                    {selectedPost.category.toUpperCase()}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Post Content */}
                <div>
                  <p className="text-base leading-relaxed">{selectedPost.content}</p>
                  {selectedPost.image_url && (
                    <div className="relative w-full h-64 mt-4 rounded-lg overflow-hidden border-2">
                      <Image
                        src={selectedPost.image_url}
                        alt="Post image"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 py-3 border-y">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-600" />
                    <span className="font-semibold">{selectedPost.like_count} Likes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">{selectedPost.comment_count} Comments</span>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedPost.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Likes Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Likes ({likes.length})</h3>
                  {loadingDetails ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                  ) : likes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No likes yet</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {likes.map((like, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs">
                                {like.user.first_name[0]}{like.user.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-semibold">
                                {like.user.first_name} {like.user.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground">@{like.user.username}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(like.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Comments ({comments.length})</h3>
                  {loadingDetails ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                  ) : comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {comments.map((comment) => (
                        <div key={comment.id} className="p-4 bg-muted/30 rounded-lg border">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white text-xs">
                                {comment.user.first_name[0]}{comment.user.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-sm">
                                  {comment.user.first_name} {comment.user.last_name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  @{comment.user.username}
                                </p>
                                <span className="text-xs text-muted-foreground">·</span>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <p className="text-sm leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
