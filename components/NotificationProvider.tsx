'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { subscribeToNotifications, Notification } from '@/lib/notifications';

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Skip for public pages
    const publicPages = ['/', '/login', '/register', '/forgot-password'];
    if (publicPages.includes(pathname)) {
      return;
    }

    // Get user ID from localStorage
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('❌ No user in localStorage');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const userId = user.id;

      if (!userId) {
        console.log('❌ No user ID found');
        return;
      }

      console.log('🔔 Setting up notifications for user:', userId);

      // Subscribe to notifications
      const unsubscribe = subscribeToNotifications(userId, (notification: Notification) => {
        console.log('🎉 New notification received:', notification);
        
        // Show toast notification
        const icon = getNotificationIcon(notification.type);
        
        toast(notification.message, {
          icon: icon,
          duration: 5000,
        });

        // Play notification sound (optional)
        playNotificationSound();
      });

      return () => {
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  }, [pathname]);

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          className: '',
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '2px solid #e2e8f0',
            padding: '16px 20px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
            maxWidth: '500px',
            minWidth: '300px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '2px solid #10b981',
              boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.25), 0 10px 10px -5px rgba(16, 185, 129, 0.15)',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '2px solid #ef4444',
              boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.25), 0 10px 10px -5px rgba(239, 68, 68, 0.15)',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#ffffff',
            },
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '2px solid #3b82f6',
              boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.25), 0 10px 10px -5px rgba(59, 130, 246, 0.15)',
            },
          },
        }}
      />
      {children}
    </>
  );
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'LIKE':
      return '👍';
    case 'COMMENT':
      return '💬';
    case 'FOLLOW':
      return '👤';
    default:
      return '🔔';
  }
}

function getNotificationTitle(type: string): string {
  switch (type) {
    case 'LIKE':
      return 'New Like';
    case 'COMMENT':
      return 'New Comment';
    case 'FOLLOW':
      return 'New Follower';
    default:
      return 'Notification';
  }
}

function playNotificationSound() {
  // Create a simple beep sound
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    // Silently fail if audio context is not supported
  }
}
