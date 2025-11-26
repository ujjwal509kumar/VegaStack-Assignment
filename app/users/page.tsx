'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  UserPlus,
  UserMinus,
  Search,
  Users as UsersIcon,
  Shield
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/components/AppLayout';
import toast from 'react-hot-toast';

interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
  profile?: {
    bio?: string;
    avatar_url?: string;
  };
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);

    // Fetch all users
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // Filter out current user
        const otherUsers = data.users?.filter((u: User) => u.id !== user.id) || [];
        setUsers(otherUsers);
        setFilteredUsers(otherUsers);
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

  useEffect(() => {
    let filtered = users;

    // Apply tab filter
    if (filterTab === 'following') {
      filtered = users.filter(user => followingIds.has(user.id));
    } else if (filterTab === 'notFollowing') {
      filtered = users.filter(user => !followingIds.has(user.id));
    }

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(query) ||
          user.first_name.toLowerCase().includes(query) ||
          user.last_name.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [searchQuery, users, filterTab, followingIds]);

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
            toast.success('Unfollowed successfully');
          } else {
            newSet.add(userId);
            toast.success('Following successfully');
          }
          return newSet;
        });
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update follow status');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 sm:space-y-6"
        >
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Discover People</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Find and connect with amazing people
            </p>
          </div>

          {/* Filters and Search */}
          <Card className="border-2">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                {/* Tabs Filter */}
                <Tabs value={filterTab} onValueChange={setFilterTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-auto">
                    <TabsTrigger value="all" className="text-xs sm:text-sm px-2 py-2">
                      <span className="hidden sm:inline">All Users</span>
                      <span className="sm:hidden">All</span>
                      <span className="ml-1">({users.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="following" className="text-xs sm:text-sm px-2 py-2">
                      <span className="hidden sm:inline">Following</span>
                      <span className="sm:hidden">Follow</span>
                      <span className="ml-1">({followingIds.size})</span>
                    </TabsTrigger>
                    <TabsTrigger value="notFollowing" className="text-xs sm:text-sm px-2 py-2">
                      <span className="hidden sm:inline">Not Following</span>
                      <span className="sm:hidden">Not</span>
                      <span className="ml-1">({users.length - followingIds.size})</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Search */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Grid */}
          {filteredUsers.length === 0 ? (
            <Card className="border-2">
              <CardContent className="p-12 text-center">
                <UsersIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-2">
                  {searchQuery ? 'No users found matching your search' : 'No users found'}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-2 hover:shadow-2xl hover:border-primary/50 transition-all duration-300 flex flex-col">
                    <CardContent className="p-4 sm:p-6 flex flex-col flex-1">
                      <div className="flex flex-col items-center text-center flex-1">
                        {/* Avatar */}
                        <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-background shadow-lg mb-3 sm:mb-4 flex-shrink-0">
                          {user.profile?.avatar_url && (
                            <AvatarImage src={user.profile.avatar_url} alt={`${user.first_name} ${user.last_name}`} />
                          )}
                          <AvatarFallback className="text-xl sm:text-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                            {user.first_name[0]}{user.last_name[0]}
                          </AvatarFallback>
                        </Avatar>

                        {/* User Info */}
                        <div className="mb-4 w-full flex-1 flex flex-col">
                          <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-base sm:text-lg">
                              {user.first_name} {user.last_name}
                            </h3>
                            {user.role === 'ADMIN' && (
                              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-0 flex-shrink-0">
                                <Shield className="w-3 h-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                            @{user.username}
                          </p>
                          
                          <div className="min-h-[2.5rem] sm:min-h-[3rem] flex items-start justify-center">
                            {user.profile?.bio && (
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                {user.profile.bio}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Follow Button */}
                        <Button
                          onClick={() => handleFollow(user.id)}
                          variant={followingIds.has(user.id) ? "outline" : "default"}
                          size="sm"
                          className={
                            followingIds.has(user.id)
                              ? 'w-full border-2 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive mt-auto'
                              : 'w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg mt-auto'
                          }
                        >
                          {followingIds.has(user.id) ? (
                            <>
                              <UserMinus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Unfollow
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Follow
                            </>
                          )}
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
    </AppLayout>
  );
}
