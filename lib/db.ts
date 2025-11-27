import { supabaseAdmin } from './supabase';

export const db = {
  users: {
    async create(data: {
      email: string;
      username: string;
      password: string;
      firstName: string;
      lastName: string;
    }) {
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: data.email,
          username: data.username,
          password: data.password,
          first_name: data.firstName,
          last_name: data.lastName,
        })
        .select()
        .single();

      if (error) throw error;
      return user;
    },

    async findByEmailOrUsername(emailOrUsername: string) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async findByEmail(email: string) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async findByUsername(username: string) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async findById(id: string) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },

    async updateLastLogin(id: string) {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
  },

  refreshTokens: {
    async create(data: { token: string; userId: string; expiresAt: Date }) {
      const { error } = await supabaseAdmin
        .from('refresh_tokens')
        .insert({
          token: data.token,
          user_id: data.userId,
          expires_at: data.expiresAt.toISOString(),
        });

      if (error) throw error;
    },

    async findByToken(token: string) {
      const { data, error } = await supabaseAdmin
        .from('refresh_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async revoke(token: string, userId: string) {
      const { error } = await supabaseAdmin
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('token', token)
        .eq('user_id', userId);

      if (error) throw error;
    },

    async revokeById(id: string) {
      const { error } = await supabaseAdmin
        .from('refresh_tokens')
        .update({ is_revoked: true })
        .eq('id', id);

      if (error) throw error;
    },
  },

  stats: {
    async getUserStats(userId: string) {
      const [followers, following, posts] = await Promise.all([
        supabaseAdmin.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabaseAdmin.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
        supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('author_id', userId).eq('is_active', true),
      ]);

      return {
        followersCount: followers.count || 0,
        followingCount: following.count || 0,
        postsCount: posts.count || 0,
      };
    },
  },

  profiles: {
    async getByUserId(userId: string) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async update(userId: string, data: {
      bio?: string;
      avatar_url?: string;
      website?: string;
      location?: string;
      visibility?: string;
    }) {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .update(data)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return profile;
    },
  },

  posts: {
    async create(data: {
      content: string;
      authorId: string;
      imageUrl?: string;
      category?: string;
    }) {
      const { data: post, error } = await supabaseAdmin
        .from('posts')
        .insert({
          content: data.content,
          author_id: data.authorId,
          image_url: data.imageUrl,
          category: data.category || 'GENERAL',
        })
        .select()
        .single();

      if (error) throw error;
      return post;
    },

    async getById(postId: string) {
      const { data, error } = await supabaseAdmin
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey(id, username, first_name, last_name)
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      return data;
    },

    async update(postId: string, authorId: string, data: {
      content?: string;
      imageUrl?: string;
      category?: string;
    }) {
      const updateData: any = {};
      if (data.content !== undefined) updateData.content = data.content;
      if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
      if (data.category !== undefined) updateData.category = data.category;

      const { data: post, error } = await supabaseAdmin
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .eq('author_id', authorId)
        .select()
        .single();

      if (error) throw error;
      return post;
    },

    async delete(postId: string, authorId: string) {
      const { error } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', authorId);

      if (error) throw error;
    },

    async list(page: number = 1, limit: number = 20) {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabaseAdmin
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey(id, username, first_name, last_name)
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { posts: data, total: count || 0 };
    },

    async getFeed(userId: string, page: number = 1, limit: number = 20) {
      const offset = (page - 1) * limit;

      // Get users that the current user follows
      const { data: following } = await supabaseAdmin
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = following?.map(f => f.following_id) || [];
      
      // Include user's own posts
      followingIds.push(userId);

      const { data, error, count } = await supabaseAdmin
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey(id, username, first_name, last_name)
        `, { count: 'exact' })
        .in('author_id', followingIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { posts: data, total: count || 0 };
    },
  },

  follows: {
    async follow(followerId: string, followingId: string) {
      const { error } = await supabaseAdmin
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId,
        });

      if (error) throw error;
    },

    async unfollow(followerId: string, followingId: string) {
      const { error } = await supabaseAdmin
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;
    },

    async isFollowing(followerId: string, followingId: string) {
      const { data, error } = await supabaseAdmin
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },

    async getFollowers(userId: string, page: number = 1, limit: number = 20) {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from('follows')
        .select(`
          follower:users!follows_follower_id_fkey(id, username, first_name, last_name),
          created_at
        `, { count: 'exact' })
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { followers: data, total: count || 0 };
    },

    async getFollowing(userId: string, page: number = 1, limit: number = 20) {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from('follows')
        .select(`
          following:users!follows_following_id_fkey(id, username, first_name, last_name),
          created_at
        `, { count: 'exact' })
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { following: data, total: count || 0 };
    },
  },

  likes: {
    async like(userId: string, postId: string) {
      const { error } = await supabaseAdmin
        .from('likes')
        .insert({
          user_id: userId,
          post_id: postId,
        });

      if (error) throw error;

      // Increment like count
      await supabaseAdmin.rpc('increment_like_count', { post_id: postId });
    },

    async unlike(userId: string, postId: string) {
      const { error } = await supabaseAdmin
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (error) throw error;

      // Decrement like count
      await supabaseAdmin.rpc('decrement_like_count', { post_id: postId });
    },

    async isLiked(userId: string, postId: string) {
      const { data, error } = await supabaseAdmin
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    },

    async getPostLikes(postId: string, page: number = 1, limit: number = 20) {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from('likes')
        .select(`
          user:users!likes_user_id_fkey(id, username, first_name, last_name),
          created_at
        `, { count: 'exact' })
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { likes: data, total: count || 0 };
    },
  },

  comments: {
    async create(data: { content: string; userId: string; postId: string }) {
      const { data: comment, error } = await supabaseAdmin
        .from('comments')
        .insert({
          content: data.content,
          user_id: data.userId,
          post_id: data.postId,
        })
        .select(`
          *,
          user:users!comments_user_id_fkey(id, username, first_name, last_name)
        `)
        .single();

      if (error) throw error;

      // Increment comment count
      await supabaseAdmin.rpc('increment_comment_count', { post_id: data.postId });

      return comment;
    },

    async getPostComments(postId: string, page: number = 1, limit: number = 20) {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from('comments')
        .select(`
          *,
          user:users!comments_user_id_fkey(id, username, first_name, last_name)
        `, { count: 'exact' })
        .eq('post_id', postId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { comments: data, total: count || 0 };
    },

    async delete(commentId: string, userId: string) {
      // Get comment to get post_id
      const { data: comment } = await supabaseAdmin
        .from('comments')
        .select('post_id')
        .eq('id', commentId)
        .eq('user_id', userId)
        .single();

      const { error } = await supabaseAdmin
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', userId);

      if (error) throw error;

      // Decrement comment count
      if (comment) {
        await supabaseAdmin.rpc('decrement_comment_count', { post_id: comment.post_id });
      }
    },
  },

  admin: {
    async listUsers(page: number = 1, limit: number = 20) {
      const offset = (page - 1) * limit;

      // First get users
      const { data: usersData, error: usersError, count } = await supabaseAdmin
        .from('users')
        .select('id, email, username, first_name, last_name, role, is_active, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (usersError) throw usersError;

      // Then get profiles for these users
      const userIds = usersData?.map(u => u.id) || [];
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, bio, avatar_url, website, location, visibility')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to users
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      const users = usersData?.map(user => ({
        ...user,
        profile: profilesMap.get(user.id) || null
      })) || [];
      
      return { users, total: count || 0 };
    },

    async getUserDetails(userId: string) {
      const user = await db.users.findById(userId);
      if (!user) return null;

      const profile = await db.profiles.getByUserId(userId);
      const stats = await db.stats.getUserStats(userId);

      return { ...user, profile, stats };
    },

    async deactivateUser(userId: string) {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;
    },

    async listAllPosts(page: number = 1, limit: number = 20) {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabaseAdmin
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey(id, username, first_name, last_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { posts: data, total: count || 0 };
    },

    async deletePost(postId: string) {
      const { error } = await supabaseAdmin
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },

    async getStats() {
      const [usersResult, postsResult, activeToday] = await Promise.all([
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).gte('last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      return {
        totalUsers: usersResult.count || 0,
        totalPosts: postsResult.count || 0,
        activeToday: activeToday.count || 0,
      };
    },
  },

  notifications: {
    async create(data: {
      userId: string;
      type: 'LIKE' | 'COMMENT' | 'FOLLOW';
      message: string;
      relatedId?: string;
    }) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: data.userId,
          type: data.type,
          message: data.message,
          related_id: data.relatedId,
        });

      if (error) throw error;
    },
  },
};
