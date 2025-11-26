'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';


import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, MessageCircle, Heart, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

// Animated heading component
function AnimatedHeading() {
  const words = ["Connect", "Share", "Discover"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedLetters, setDisplayedLetters] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isAnimating) {
      // Show letters one by one
      if (displayedLetters < words[currentWordIndex].length) {
        timeout = setTimeout(() => {
          setDisplayedLetters(prev => prev + 1);
        }, 80); // Smooth letter reveal
      } else {
        // Word complete, wait then start disappearing
        timeout = setTimeout(() => {
          setIsAnimating(false);
          setDisplayedLetters(words[currentWordIndex].length);
        }, 1500); // Perfect timing for reading
      }
    } else {
      // Disappearing animation
      if (displayedLetters > 0) {
        timeout = setTimeout(() => {
          setDisplayedLetters(prev => prev - 1);
        }, 50); // Quick disappear
      } else {
        // Move to next word
        timeout = setTimeout(() => {
          setCurrentWordIndex(prev => (prev + 1) % words.length);
          setIsAnimating(true);
        }, 300); // Smooth transition delay
      }
    }
    
    return () => clearTimeout(timeout);
  }, [displayedLetters, isAnimating, currentWordIndex, words]);
  
  const currentWord = words[currentWordIndex];
  const visibleText = currentWord.slice(0, displayedLetters);
  
  return (
    <div className="relative">
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
        <motion.span
          className={`inline-block ${currentWordIndex === 2 ? "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent" : ""}`}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {visibleText}
          {displayedLetters < currentWord.length && (
            <motion.span
              className="inline-block w-1 h-12 sm:h-14 lg:h-16 bg-current ml-1 animate-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </motion.span>
      </h1>
      
      {/* Subtle background glow effect */}
      <motion.div
        key={`glow-${currentWordIndex}`}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.2, scale: 1 }}
        exit={{ opacity: 0, scale: 1.5 }}
        transition={{ duration: 0.5 }}
        className={`absolute -inset-4 ${currentWordIndex === 2 ? "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" : "bg-gradient-to-r from-blue-500/5 to-purple-500/5"} rounded-full blur-3xl -z-10`}
      />
    </div>
  );
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const features = [
    {
      icon: Users,
      title: 'Connect',
      description: 'Build your network with people worldwide',
    },
    {
      icon: MessageCircle,
      title: 'Share',
      description: 'Post content and express yourself',
    },
    {
      icon: Heart,
      title: 'Engage',
      description: 'Like and comment on posts',
    },
    {
      icon: TrendingUp,
      title: 'Discover',
      description: 'Explore personalized content',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold">SocialConnect</span>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 -z-10" />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center lg:text-left space-y-8"
            >
              <div className="space-y-8">
                <div className="relative min-h-[100px] sm:min-h-[120px] lg:min-h-[140px]">
                  <AnimatedHeading />
                </div>
                
                <motion.p 
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              Use Social Connect to <span className="font-semibold text-foreground">create</span> meaningful relationships, <span className="font-semibold text-foreground">share</span> your ideas with the world, and <span className="font-semibold text-foreground bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">discover</span> inspiring content from a global community of creators and innovators.
            </motion.p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-purple-500/25">
                    Create Account
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2">
                    Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right Column - Demo Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <Card className="shadow-2xl border-2 relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
                {/* Gradient overlay */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
                
                <CardContent className="p-8 relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                      UK
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Ujjwal Kumar</p>
                      <p className="text-sm text-muted-foreground">@ujjwal509kumar</p>
                    </div>
                  </div>
                  
                  <p className="mb-6 leading-relaxed text-base">
                    Just joined SocialConnect! Excited to connect with everyone 🎉
                  </p>
                  
                  <div className="flex gap-8 text-sm text-muted-foreground">
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                    >
                      <Heart className="w-5 h-5" /> 
                      <span className="font-semibold">24</span>
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" /> 
                      <span className="font-semibold">8</span>
                    </motion.button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple, powerful features for your social experience
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const colors = [
                'from-blue-500 to-cyan-500',
                'from-purple-500 to-pink-500',
                'from-pink-500 to-rose-500',
                'from-green-500 to-emerald-500',
              ];
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <Card className="h-full hover:shadow-2xl transition-all duration-300 border-2 group">
                    <CardContent className="p-8 space-y-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${colors[index]} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <feature.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">{feature.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
              <CardContent className="p-16 text-center space-y-6">
                <h2 className="text-4xl sm:text-5xl font-bold">
                  Ready to Get Started?
                </h2>
                <p className="text-xl text-blue-50 max-w-2xl mx-auto">
                  Join our community and start connecting today
                </p>
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100 shadow-xl">
                    Create Your Account
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">SocialConnect</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 SocialConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
