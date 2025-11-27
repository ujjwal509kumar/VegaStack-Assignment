'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      toast.error('Invalid reset link. Please request a new one.');
      setTimeout(() => router.push('/forgot-password'), 2000);
      setTokenValid(false);
      return;
    }

    // Validate token before showing form
    validateToken(token);
  }, [searchParams, router]);

  const validateToken = async (token: string) => {
    try {
      // Decode token to check expiry and if it's been used
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId, timestamp] = decoded.split(':');

      if (!userId || !timestamp) {
        toast.error('Invalid reset link.');
        setTokenValid(false);
        setTimeout(() => router.push('/forgot-password'), 2000);
        return;
      }

      // Check if expired (1 hour)
      const tokenAge = Date.now() - parseInt(timestamp);
      const maxAge = 60 * 60 * 1000;

      if (tokenAge > maxAge) {
        toast.error('This reset link has expired. Please request a new one.');
        setTokenValid(false);
        setTimeout(() => router.push('/forgot-password'), 2000);
        return;
      }

      // Check if token has been used
      const res = await fetch('/api/auth/check-reset-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok || data.used) {
        toast.error('This reset link has already been used. Please request a new one.');
        setTokenValid(false);
        setTimeout(() => router.push('/forgot-password'), 2000);
        return;
      }

      setTokenValid(true);
    } catch (error) {
      toast.error('Invalid reset link.');
      setTokenValid(false);
      setTimeout(() => router.push('/forgot-password'), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Get the token from URL
      const token = searchParams.get('token');

      const res = await fetch('/api/auth/password-reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      toast.success('Password reset successfully! Redirecting to login...', {
        duration: 3000,
        icon: '✅',
      });
      
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      toast.error('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SocialConnect
              </span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 text-center space-y-2">
            <h1 className="text-4xl font-bold">Create New Password</h1>
            <p className="text-muted-foreground">Enter your new password below</p>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>Choose a strong password for your account</CardDescription>
            </CardHeader>
            <CardContent>
              {tokenValid === null ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Validating reset link...</p>
                </div>
              ) : tokenValid === false ? (
                <div className="text-center py-8">
                  <p className="text-red-600 font-semibold">Invalid or expired reset link</p>
                  <p className="text-muted-foreground mt-2">Redirecting...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Min 8 characters, 1 uppercase, 1 lowercase, 1 number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      className="pl-10 pr-10"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  size="lg"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </Button>

                <div className="text-center text-sm">
                  <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
                    Back to sign in
                  </Link>
                </div>
              </form>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
