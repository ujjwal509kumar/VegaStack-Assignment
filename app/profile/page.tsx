'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import { 
  User, 
  Globe, 
  MapPin, 
  Eye,
  Camera,
  Save,
  Loader2,
  Edit,
  X,
  Mail,
  Shield
} from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    website: '',
    location: '',
    visibility: 'PUBLIC',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [currentAvatar, setCurrentAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(user);
    setUserData(parsedUser);
    if (parsedUser.profile) {
      setFormData({
        bio: parsedUser.profile.bio || '',
        website: parsedUser.profile.website || '',
        location: parsedUser.profile.location || '',
        visibility: parsedUser.profile.visibility || 'PUBLIC',
      });
      setCurrentAvatar(parsedUser.profile.avatar_url || '');
    }
  }, [router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    const loadingToast = toast.loading('Updating profile...');

    try {
      let avatarUrl = currentAvatar;

      // Upload avatar if provided
      if (avatarFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', avatarFile);
        uploadFormData.append('bucket', 'avatars');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: uploadFormData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          toast.dismiss(loadingToast);
          toast.error(uploadData.error || 'Failed to upload avatar');
          setLoading(false);
          return;
        }

        avatarUrl = uploadData.url;
      }

      // Update profile
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          avatarUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.dismiss(loadingToast);
        toast.error(data.error || 'Failed to update profile');
        setLoading(false);
        return;
      }

      // Update current avatar display
      setCurrentAvatar(avatarUrl);
      setAvatarFile(null);
      setAvatarPreview('');

      // Update localStorage and userData with new profile data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const updatedUser = JSON.parse(storedUser);
        updatedUser.profile = {
          ...updatedUser.profile,
          ...formData,
          avatar_url: avatarUrl,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUserData(updatedUser);
      }

      toast.dismiss(loadingToast);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setLoading(false);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Network error. Please try again.');
      setLoading(false);
    }
  };

  const getVisibilityDisplay = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC':
        return { icon: '🌍', text: 'Public' };
      case 'PRIVATE':
        return { icon: '🔒', text: 'Private' };
      case 'FOLLOWERS_ONLY':
        return { icon: '👥', text: 'Followers Only' };
      default:
        return { icon: '🌍', text: 'Public' };
    }
  };

  const bioCount = formData.bio.length;
  const maxBioChars = 160;
  const bioPercentage = (bioCount / maxBioChars) * 100;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {!isEditing ? (
              /* View Mode - Profile Display */
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {userData && (
                  <Card className="border shadow-lg">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 flex-shrink-0">
                            <AvatarImage src={currentAvatar} />
                            <AvatarFallback className="text-xl sm:text-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                              {userData.firstName[0]}{userData.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <CardTitle className="text-xl sm:text-2xl truncate">{userData.firstName} {userData.lastName}</CardTitle>
                              {userData.role === 'ADMIN' && (
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 flex-shrink-0">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-base truncate">@{userData.username}</CardDescription>
                          </div>
                        </div>
                        <Button
                          onClick={() => setIsEditing(true)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto flex-shrink-0"
                          size="sm"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      <div className="grid gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-medium truncate">{userData.email}</p>
                          </div>
                        </div>

                        {formData.bio && (
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Bio</p>
                              <p className="break-words">{formData.bio}</p>
                            </div>
                          </div>
                        )}

                        {formData.website && (
                          <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Website</p>
                              <a 
                                href={formData.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate block"
                              >
                                {formData.website}
                              </a>
                            </div>
                          </div>
                        )}

                        {formData.location && (
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-muted-foreground">Location</p>
                              <p className="truncate">{formData.location}</p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          <Eye className="w-5 h-5 text-pink-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-muted-foreground">Visibility</p>
                            <p>
                              {getVisibilityDisplay(formData.visibility).icon} {getVisibilityDisplay(formData.visibility).text}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            ) : (
              /* Edit Mode - Form */
              <motion.div
                key="edit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg sm:text-xl">Edit Profile</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setAvatarFile(null);
                          setAvatarPreview('');
                        }}
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 flex-shrink-0">
                          <AvatarImage src={avatarPreview || currentAvatar} />
                          <AvatarFallback className="text-lg sm:text-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                            {userData?.firstName[0]}{userData?.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <input
                            id="avatar"
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                          <label htmlFor="avatar">
                            <Button type="button" variant="outline" size="sm" asChild className="w-full sm:w-auto">
                              <span className="cursor-pointer">
                                <Camera className="w-3 h-3 mr-2" />
                                Change Avatar
                              </span>
                            </Button>
                          </label>
                          <p className="text-xs text-muted-foreground mt-1">Max 2MB</p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="bio" className="text-sm">Bio</Label>
                        <Textarea
                          id="bio"
                          maxLength={maxBioChars}
                          rows={3}
                          className="resize-none text-sm"
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          placeholder="Tell us about yourself..."
                        />
                        <p className="text-xs text-muted-foreground">{bioCount}/{maxBioChars}</p>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="website" className="text-sm">Website</Label>
                        <Input
                          id="website"
                          type="url"
                          className="text-sm"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://yourwebsite.com"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="location" className="text-sm">Location</Label>
                        <Input
                          id="location"
                          type="text"
                          className="text-sm"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="City, Country"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="visibility" className="text-sm">Visibility</Label>
                        <Select value={formData.visibility} onValueChange={(value) => setFormData({ ...formData, visibility: value })}>
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PUBLIC">🌍 Public</SelectItem>
                            <SelectItem value="PRIVATE">🔒 Private</SelectItem>
                            <SelectItem value="FOLLOWERS_ONLY">👥 Followers Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="sm:w-auto"
                          onClick={() => {
                            setIsEditing(false);
                            setAvatarFile(null);
                            setAvatarPreview('');
                          }}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AppLayout>
  );
}
