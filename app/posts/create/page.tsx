'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ImageIcon, 
  X,
  Send,
  Loader2
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import toast from 'react-hot-toast';

export default function CreatePostPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    content: '',
    category: 'GENERAL',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    const loadingToast = toast.loading('Creating your post...');

    try {
      let imageUrl = '';

      // Upload image if provided
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        uploadFormData.append('bucket', 'posts');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          toast.dismiss(loadingToast);
          toast.error(uploadData.error || 'Failed to upload image');
          setLoading(false);
          return;
        }

        imageUrl = uploadData.url;
      }

      // Create post
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          imageUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.dismiss(loadingToast);
        toast.error(data.error || 'Failed to create post');
        setLoading(false);
        return;
      }

      // Refresh user stats
      const statsRes = await fetch('/api/users/me/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      if (statsData.stats) {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          user.stats = statsData.stats;
          localStorage.setItem('user', JSON.stringify(user));
        }
      }

      toast.dismiss(loadingToast);
      toast.success('Post created successfully!');
      router.push('/feed');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Network error. Please try again.');
      setLoading(false);
    }
  };

  const categories = [
    { value: 'GENERAL', label: 'General', emoji: '💬' },
    { value: 'ANNOUNCEMENT', label: 'Announcement', emoji: '📢' },
    { value: 'QUESTION', label: 'Question', emoji: '❓' },
  ];

  const charCount = formData.content.length;
  const maxChars = 280;
  const charPercentage = (charCount / maxChars) * 100;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                Share Your Thoughts
              </CardTitle>
              <CardDescription>
                Create a post to share with your followers
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Content Input */}
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-base font-semibold">
                    What's on your mind?
                  </Label>
                  <Textarea
                    id="content"
                    required
                    maxLength={maxChars}
                    rows={6}
                    className="resize-none text-base"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Share your thoughts, ideas, or ask a question..."
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {charCount}/{maxChars} characters
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${
                            charPercentage > 90 
                              ? 'bg-red-500' 
                              : charPercentage > 70 
                              ? 'bg-yellow-500' 
                              : 'bg-gradient-to-r from-blue-600 to-purple-600'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${charPercentage}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-base font-semibold">
                    Category
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          <span className="flex items-center gap-2">
                            <span>{cat.emoji}</span>
                            <span>{cat.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {categories.map((cat) => (
                      <Badge
                        key={cat.value}
                        variant={formData.category === cat.value ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          formData.category === cat.value 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0' 
                            : 'hover:border-primary'
                        }`}
                        onClick={() => setFormData({ ...formData, category: cat.value })}
                      >
                        {cat.emoji} {cat.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-base font-semibold">
                    Add Image (Optional)
                  </Label>
                  
                  {!imagePreview ? (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                      <input
                        id="image"
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      <label htmlFor="image" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <p className="font-medium">Click to upload an image</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              JPEG or PNG, max 2MB
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-lg overflow-hidden border-2"
                    >
                      <div className="relative w-full h-64">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 rounded-full shadow-lg"
                        onClick={removeImage}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading || !formData.content.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Post...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Publish Post
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/dashboard')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
