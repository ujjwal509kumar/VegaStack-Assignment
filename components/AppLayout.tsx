'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  Home, 
  PenSquare, 
  Users, 
  UserCircle,
  Shield,
  LogOut,
  Sparkles,
  Menu,
  X,
  LayoutDashboard
} from 'lucide-react';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  role: string;
  profile?: {
    avatar_url?: string;
  };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

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

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Feed', href: '/feed', icon: Home },
    { name: 'Create Post', href: '/posts/create', icon: PenSquare },
    { name: 'My Profile', href: '/profile', icon: UserCircle },
    { name: 'Discover', href: '/users', icon: Users },
  ];

  const adminItems = [
    { name: 'Dashboard', href: '/admin', icon: Shield },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
    { name: 'Manage Posts', href: '/admin/posts', icon: PenSquare },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${isCollapsed ? 'w-16' : 'w-64'} border-r bg-background flex flex-col transition-all duration-300`}>
        {/* Logo & Toggle */}
        <div className="p-4 border-b flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold">SocialConnect</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={isCollapsed ? 'mx-auto' : ''}
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        </div>

        {/* User Profile */}
        {user && !isCollapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.profile?.avatar_url} />
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{user.username}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed User Avatar */}
        {user && isCollapsed && (
          <div className="p-2 border-b flex justify-center">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.profile?.avatar_url} />
              <AvatarFallback className="bg-blue-600 text-white text-sm">
                {user.firstName[0]}{user.lastName[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/');
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${isActive ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : ''}`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && item.name}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Admin Section */}
          {user?.role === 'ADMIN' && (
            <>
              {!isCollapsed && (
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Admin
                  </p>
                </div>
              )}
              {isCollapsed && <div className="border-t my-2" />}
              <div className="space-y-1">
                {adminItems.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin');
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} ${isActive ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' : ''}`}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                        {!isCollapsed && item.name}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-2 border-t space-y-1">
          {!isCollapsed && <ThemeToggle />}
          <Button
            variant="ghost"
            className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20`}
            onClick={handleLogout}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && 'Logout'}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
