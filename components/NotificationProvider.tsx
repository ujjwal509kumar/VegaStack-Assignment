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
        
        toast.custom(
          (t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <span className="text-2xl">{icon}</span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {getNotificationTitle(notification.type)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-gray-200">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                >
                  Close
                </button>
              </div>
            </div>
          ),
          {
            duration: 5000,
            position: 'top-right',
          }
        );

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
      <Toaster position="top-right" />
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
