# SocialConnect API Documentation

## Authentication APIs

### 1. Register User
**Endpoint:** `POST /api/auth/register`

**What it does:** Creates a new user account and sends verification email

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "john123",
  "password": "Password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**How it works:**
1. Validates all fields (email format, username 3-30 chars, password strength)
2. Checks if email already exists using `db.users.findByEmail()`
3. Checks if username already exists using `db.users.findByUsername()`
4. Hashes password with bcrypt
5. Creates user in `users` table with `email_verified = false`
6. Creates empty profile in `profiles` table
7. Generates verification token: `base64(userId:timestamp)`
8. Sends verification email with link: `/verify?token=xxx`

**Response:**
```json
{
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": { "id": "...", "email": "...", "username": "..." }
}
```

**Used in:** `app/register/page.tsx`

---

### 2. Verify Email
**Endpoint:** `GET /verify?token=xxx`

**What it does:** Verifies user's email address

**How it works:**
1. Decodes token to get `userId` and `timestamp`
2. Checks if token expired (24 hours)
3. Checks if email already verified
4. Updates `users.email_verified = true`
5. Redirects to login with success message

**Used in:** Email verification link

---

### 3. Login
**Endpoint:** `POST /api/auth/login`

**What it does:** Authenticates user and returns JWT tokens

**Request Body:**
```json
{
  "emailOrUsername": "john123",
  "password": "Password123"
}
```

**How it works:**
1. Finds user by email OR username using `db.users.findByEmailOrUsername()`
2. Checks if account is active (`is_active = true`)
3. Checks if email is verified (`email_verified = true`)
4. Compares password with bcrypt
5. Generates JWT access token (expires in 15 min)
6. Generates JWT refresh token (expires in 7 days)
7. Stores refresh token in `refresh_tokens` table
8. Updates `last_login` timestamp
9. Returns tokens + user data + profile + stats

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { "id": "...", "email": "...", "profile": {...}, "stats": {...} }
}
```

**Used in:** `app/login/page.tsx`

---

### 4. Logout
**Endpoint:** `POST /api/auth/logout`

**What it does:** Revokes refresh token

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**How it works:**
1. Verifies access token
2. Marks refresh token as revoked in database (`is_revoked = true`)

**Used in:** `components/AppLayout.tsx`

---

### 5. Refresh Token
**Endpoint:** `POST /api/auth/token/refresh`

**What it does:** Gets new access token using refresh token

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**How it works:**
1. Verifies refresh token signature
2. Checks if token exists in database and not revoked
3. Checks if token expired
4. Generates new access token
5. Returns new access token

**Used in:** `lib/api-client.ts` (automatic token refresh)

---

### 6. Forgot Password
**Endpoint:** `POST /api/auth/password-reset`

**What it does:** Sends password reset email

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**How it works:**
1. Finds user by email using `db.users.findByEmail()`
2. Generates reset token: `base64(userId:timestamp)`
3. Sends email with link: `/auth/reset-password?token=xxx`
4. Token valid for 1 hour

**Response:**
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

**Used in:** `app/forgot-password/page.tsx`

---

### 7. Check Reset Token
**Endpoint:** `POST /api/auth/check-reset-token`

**What it does:** Checks if reset token has been used

**Request Body:**
```json
{
  "token": "base64string"
}
```

**How it works:**
1. Queries `used_tokens` table for token
2. Returns `used: true` if found, `used: false` if not

**Used in:** `app/auth/reset-password/page.tsx` (validates token before showing form)

---

### 8. Reset Password Confirm
**Endpoint:** `POST /api/auth/password-reset-confirm`

**What it does:** Resets user password

**Request Body:**
```json
{
  "token": "base64string",
  "newPassword": "NewPassword123"
}
```

**How it works:**
1. Decodes token to get `userId` and `timestamp`
2. Checks if token expired (1 hour)
3. Checks if token already used in `used_tokens` table
4. Validates new password strength
5. Marks token as used (inserts into `used_tokens`)
6. Hashes new password
7. Updates password in `users` table

**Used in:** `app/auth/reset-password/page.tsx`

---

### 9. Change Password
**Endpoint:** `POST /api/auth/change-password`

**What it does:** Changes password for logged-in user

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**How it works:**
1. Verifies access token
2. Gets user from database
3. Verifies current password with bcrypt
4. Validates new password strength
5. Hashes new password
6. Updates password in database

**Used in:** `app/change-password/page.tsx`

---

## User APIs

### 10. Get User Profile
**Endpoint:** `GET /api/users/:user_id`

**What it does:** Gets user profile with privacy checks

**Headers:** `Authorization: Bearer <accessToken>` (optional)

**How it works:**
1. Gets user from database
2. Gets profile from database
3. Checks profile visibility:
   - **PUBLIC**: Anyone can view
   - **PRIVATE**: Only owner and admins can view
   - **FOLLOWERS_ONLY**: Only followers and owner can view
4. Returns 403 if not allowed
5. Returns user + profile + stats

**Used in:** User profile pages

---

### 11. Update Own Profile
**Endpoint:** `PUT /api/users/me`

**What it does:** Updates logged-in user's profile

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "bio": "Software developer",
  "website": "https://example.com",
  "location": "New York",
  "visibility": "PUBLIC",
  "avatarUrl": "https://..."
}
```

**How it works:**
1. Verifies access token
2. Validates bio (max 160 chars)
3. Updates profile in `profiles` table
4. Returns updated profile

**Used in:** `app/profile/page.tsx`

---

### 12. List Users
**Endpoint:** `GET /api/users?page=1&limit=20`

**What it does:** Lists users with visibility filtering

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Verifies access token
2. If admin: returns all users
3. If regular user:
   - Filters out PRIVATE profiles
   - For FOLLOWERS_ONLY: checks if current user follows them
   - Returns only visible users
4. Returns paginated list

**Used in:** `app/users/page.tsx`

---

### 13. Follow User
**Endpoint:** `POST /api/users/:user_id/follow`

**What it does:** Follows a user

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Verifies access token
2. Checks target user exists
3. Checks not already following
4. Creates follow relationship in `follows` table
5. Creates notification: "John Doe started following you"
6. Notification sent via Supabase Realtime

**Used in:** `app/users/page.tsx`

---

### 14. Unfollow User
**Endpoint:** `DELETE /api/users/:user_id/follow`

**What it does:** Unfollows a user

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Verifies access token
2. Deletes follow relationship from `follows` table

**Used in:** `app/users/page.tsx`

---

### 15. Get Followers
**Endpoint:** `GET /api/users/:user_id/followers?page=1&limit=20`

**What it does:** Gets list of user's followers

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Queries `follows` table where `following_id = user_id`
2. Returns paginated list with user details

**Used in:** User profile pages

---

### 16. Get Following
**Endpoint:** `GET /api/users/:user_id/following?page=1&limit=20`

**What it does:** Gets list of users that user follows

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Queries `follows` table where `follower_id = user_id`
2. Returns paginated list with user details

**Used in:** User profile pages

---

## Post APIs

### 17. Create Post
**Endpoint:** `POST /api/posts`

**What it does:** Creates a new post

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "content": "Hello world!",
  "imageUrl": "https://...",
  "category": "GENERAL"
}
```

**How it works:**
1. Verifies access token
2. Validates content (max 280 chars)
3. Validates category (GENERAL, ANNOUNCEMENT, QUESTION)
4. Creates post in `posts` table
5. Returns created post

**Used in:** `app/posts/create/page.tsx`

---

### 18. Get Post
**Endpoint:** `GET /api/posts/:post_id`

**What it does:** Gets single post details

**How it works:**
1. Queries `posts` table with author details
2. Returns post with author info

**Used in:** Post detail pages

---

### 19. Update Post
**Endpoint:** `PUT /api/posts/:post_id`

**What it does:** Updates own post

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "content": "Updated content",
  "imageUrl": "https://...",
  "category": "ANNOUNCEMENT"
}
```

**How it works:**
1. Verifies access token
2. Validates content and category
3. Updates post only if `author_id = current_user_id`
4. Returns updated post

**Used in:** Post edit pages

---

### 20. Delete Post
**Endpoint:** `DELETE /api/posts/:post_id`

**What it does:** Deletes own post

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Verifies access token
2. Deletes post only if `author_id = current_user_id`

**Used in:** `app/feed/page.tsx` (delete button)

---

### 21. List Posts
**Endpoint:** `GET /api/posts?page=1&limit=20`

**What it does:** Lists all active posts

**How it works:**
1. Queries `posts` table where `is_active = true`
2. Orders by `created_at DESC`
3. Returns paginated list with author details

**Used in:** Public post listings

---

### 22. Get Feed
**Endpoint:** `GET /api/feed?page=1&limit=20`

**What it does:** Gets personalized feed

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Verifies access token
2. Gets list of users current user follows
3. Queries posts where `author_id IN (following_ids + own_id)`
4. Orders by `created_at DESC`
5. Returns paginated feed

**Used in:** `app/feed/page.tsx`

---

### 23. Like Post
**Endpoint:** `POST /api/posts/:post_id/like`

**What it does:** Likes or unlikes a post (toggle)

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Verifies access token
2. Checks if already liked
3. If liked: removes like, decrements count
4. If not liked: adds like, increments count, creates notification
5. Notification: "John Doe liked your post"
6. Returns action (liked/unliked)

**Used in:** `app/feed/page.tsx`

---

### 24. Get Post Likes
**Endpoint:** `GET /api/posts/:post_id/likes?page=1&limit=20`

**What it does:** Gets list of users who liked the post

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Queries `likes` table for post
2. Returns paginated list with user details

**Used in:** Post detail pages

---

### 25. Add Comment
**Endpoint:** `POST /api/posts/:post_id/comments`

**What it does:** Adds comment to post

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "content": "Great post!"
}
```

**How it works:**
1. Verifies access token
2. Validates content (max 500 chars)
3. Creates comment in `comments` table
4. Increments post's `comment_count`
5. Creates notification: "John Doe commented on your post"
6. Returns created comment

**Used in:** `app/feed/page.tsx` (comment dialog)

---

### 26. Get Comments
**Endpoint:** `GET /api/posts/:post_id/comments?page=1&limit=20`

**What it does:** Gets post comments

**How it works:**
1. Queries `comments` table for post
2. Orders by `created_at DESC`
3. Returns paginated list with user details

**Used in:** `app/feed/page.tsx` (comment dialog)

---

## Upload API

### 27. Upload Image
**Endpoint:** `POST /api/upload`

**What it does:** Uploads image to Supabase Storage

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:** `FormData`
```
file: <File>
bucket: "avatars" | "posts"
```

**How it works:**
1. Verifies access token
2. Validates file size (max 2MB)
3. Validates file type (JPEG, PNG)
4. Generates unique filename: `userId-timestamp.ext`
5. Uploads to Supabase Storage bucket in `public/` folder
6. Returns public URL

**Used in:** 
- `app/profile/page.tsx` (avatar upload)
- `app/posts/create/page.tsx` (post image upload)

---

## Admin APIs

### 28. List All Users (Admin)
**Endpoint:** `GET /api/admin/users?page=1&limit=20`

**What it does:** Lists all users (admin only)

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Verifies access token
2. Checks if user role is ADMIN
3. Returns all users with profiles (no filtering)

**Used in:** `app/admin/page.tsx`

---

### 29. Deactivate User (Admin)
**Endpoint:** `POST /api/admin/users/:user_id/deactivate`

**What it does:** Deactivates user account

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Verifies access token
2. Checks if user role is ADMIN
3. Updates `users.is_active = false`
4. User can't login anymore

**Used in:** `app/admin/page.tsx`

---

### 30. List All Posts (Admin)
**Endpoint:** `GET /api/admin/posts?page=1&limit=20`

**What it does:** Lists all posts including inactive

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Verifies access token
2. Checks if user role is ADMIN
3. Returns all posts (including `is_active = false`)

**Used in:** `app/admin/page.tsx`

---

### 31. Delete Any Post (Admin)
**Endpoint:** `DELETE /api/admin/posts/:post_id`

**What it does:** Deletes any post

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Verifies access token
2. Checks if user role is ADMIN
3. Deletes post (no author check)

**Used in:** `app/admin/page.tsx`

---

### 32. Get Stats (Admin)
**Endpoint:** `GET /api/admin/stats`

**What it does:** Gets platform statistics

**Headers:** `Authorization: Bearer <accessToken>`

**How it works:**
1. Verifies access token
2. Checks if user role is ADMIN
3. Counts total users, total posts, active today
4. Returns stats

**Response:**
```json
{
  "totalUsers": 150,
  "totalPosts": 1200,
  "activeToday": 45
}
```

**Used in:** `app/admin/page.tsx`

---

## Real-Time Notifications

**How it works:**

1. **Frontend Setup** (`components/NotificationProvider.tsx`):
   - Subscribes to Supabase Realtime channel: `notifications:userId`
   - Listens for INSERT events on `notifications` table
   - Shows toast notification when event received

2. **Backend Creation** (in like/comment/follow APIs):
   - Creates notification record in `notifications` table
   - Supabase Realtime automatically broadcasts to subscribed clients

3. **Database Setup**:
   - `notifications` table has `REPLICA IDENTITY FULL`
   - Realtime enabled in Supabase Dashboard

4. **Notification Types**:
   - LIKE: "John Doe liked your post"
   - COMMENT: "Jane Smith commented on your post"
   - FOLLOW: "Bob Johnson started following you"

---

## Authentication Flow

### Registration Flow:
1. User submits form → `POST /api/auth/register`
2. User created with `email_verified = false`
3. Verification email sent with token
4. User clicks link → `GET /verify?token=xxx`
5. Email verified → `email_verified = true`
6. User can now login

### Login Flow:
1. User submits credentials → `POST /api/auth/login`
2. Password verified with bcrypt
3. JWT tokens generated (access + refresh)
4. Tokens stored in localStorage
5. User redirected to dashboard

### Token Refresh Flow:
1. Access token expires (15 min)
2. API call fails with 401
3. `lib/api-client.ts` automatically calls `POST /api/auth/token/refresh`
4. New access token received
5. Original API call retried

### Password Reset Flow:
1. User requests reset → `POST /api/auth/password-reset`
2. Reset email sent with token (valid 1 hour)
3. User clicks link → `/auth/reset-password?token=xxx`
4. Page validates token → `POST /api/auth/check-reset-token`
5. User submits new password → `POST /api/auth/password-reset-confirm`
6. Token marked as used, password updated

---

## Database Tables

### users
- Stores user accounts
- Fields: email, username, password (hashed), first_name, last_name, role, is_active, email_verified

### profiles
- Stores user profiles
- Fields: user_id, bio, avatar_url, website, location, visibility

### posts
- Stores posts
- Fields: author_id, content, image_url, category, like_count, comment_count, is_active

### follows
- Stores follow relationships
- Fields: follower_id, following_id

### likes
- Stores post likes
- Fields: user_id, post_id

### comments
- Stores post comments
- Fields: user_id, post_id, content

### notifications
- Stores notifications
- Fields: user_id, type, message, related_id, is_read

### refresh_tokens
- Stores JWT refresh tokens
- Fields: token, user_id, expires_at, is_revoked

### used_tokens
- Stores used reset tokens
- Fields: token_hash, user_email

---

## Key Libraries

- **Next.js 16**: Framework
- **Supabase**: Database + Storage + Realtime
- **JWT (jsonwebtoken)**: Authentication tokens
- **bcryptjs**: Password hashing
- **Nodemailer**: Email sending
- **React Hot Toast**: Toast notifications
- **Framer Motion**: Animations
- **shadcn/ui**: UI components
