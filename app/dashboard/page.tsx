'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Shield,
  MessageCircle,
  Heart,
  Home,
  PenSquare,
  Users,
  UserCircle
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  profile?: {
    avatar_url?: string;
    bio?: string;
    website?: string;
    location?: string;
    visibility?: string;
  };
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
      .then(async (res) => {
        if (res.status === 401) {
          const data = await res.json().catch(() => ({}));
          if (data.shouldLogout || data.error?.includes('Invalid') || data.error?.includes('tampered')) {
            localStorage.clear();
            router.push('/login');
            return;
          }
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.stats) {
          setUser((prev) => prev ? { ...prev, stats: data.stats } : null);
          const updatedUser = { ...parsedUser, stats: data.stats };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      })
      .catch((err) => console.error('Failed to fetch stats:', err));
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Feed',
      description: 'View posts from people you follow',
      icon: Home,
      href: '/feed',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Create Post',
      description: 'Share something with your followers',
      icon: PenSquare,
      href: '/posts/create',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: 'My Profile',
      description: 'Edit your profile information',
      icon: UserCircle,
      href: '/profile',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Discover',
      description: 'Find and follow other users',
      icon: Users,
      href: '/users',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  const stats = [
    { label: 'Posts', value: user.stats.postsCount, icon: MessageCircle, color: 'text-blue-600' },
    { label: 'Followers', value: user.stats.followersCount, icon: Users, color: 'text-purple-600' },
    { label: 'Following', value: user.stats.followingCount, icon: Heart, color: 'text-pink-600' },
  ];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Welcome Section */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your account today
            </p>
          </div>

          {/* Profile Card */}
          <Card className="border shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 flex-shrink-0">
                  <AvatarImage src={user.profile?.avatar_url} alt={user.firstName} />
                  <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                    {user.firstName[0]}{user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold">
                      {user.firstName} {user.lastName}
                    </h2>
                    {user.role === 'ADMIN' && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">@{user.username}</p>
                  {user.profile?.bio && (
                    <p className="text-sm text-foreground/80 mt-2">{user.profile.bio}</p>
                  )}
                </div>
              </div>

              <Separator className="my-4 sm:my-6" />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="text-center p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                      <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
                      <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={action.href}>
                    <Card className="h-full hover:shadow-lg transition-all duration-300 border cursor-pointer group">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col items-center text-center gap-2 sm:gap-3">
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 ${action.bgColor} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                            <action.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${action.color}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm sm:text-base">{action.title}</h3>
                            <p className="text-xs text-muted-foreground hidden sm:block mt-1">{action.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

        </motion.div>
      </div>
    </AppLayout>
  );
}
