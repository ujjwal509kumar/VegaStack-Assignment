'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Skip auth check for public pages
    const publicPages = ['/', '/login', '/register', '/forgot-password'];
    const publicPaths = ['/auth/reset-password', '/auth/callback', '/verify'];
    
    if (publicPages.includes(pathname) || publicPaths.some(path => pathname.startsWith(path))) {
      return;
    }

    // Check if token exists
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Validate token format (basic check)
    if (token.split('.').length !== 3) {
      console.error('Invalid token format detected - logging out');
      localStorage.clear();
      router.push('/login');
      return;
    }

    // Check if token is expired (client-side check)
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      
      if (decoded.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (decoded.exp < currentTime) {
          console.error('Token expired - logging out');
          localStorage.clear();
          router.push('/login');
          return;
        }
      }
    } catch (error) {
      console.error('Failed to decode token - logging out');
      localStorage.clear();
      router.push('/login');
    }
  }, [pathname, router]);

  // Intercept fetch globally to handle 401 errors
  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      // Clone response to read it without consuming the original
      const clonedResponse = response.clone();
      
      if (response.status === 401) {
        try {
          const data = await clonedResponse.json();
          if (data.shouldLogout || data.error?.includes('Invalid') || data.error?.includes('tampered')) {
            console.error('Token is invalid or tampered - logging out');
            localStorage.clear();
            window.location.href = '/login';
          }
        } catch (e) {
          // If we can't parse JSON, still logout on 401
          console.error('Unauthorized request - logging out');
          localStorage.clear();
          window.location.href = '/login';
        }
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <>{children}</>;
}
