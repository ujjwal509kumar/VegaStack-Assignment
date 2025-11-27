# SocialConnect

A full-stack social media platform built with Next.js, enabling users to share posts, connect with others, and discover content through a personalized feed experience.

## Features

### Authentication & Security
- JWT-based authentication with access and refresh tokens
- Email verification for new accounts
- Password reset functionality via email
- Secure password change for authenticated users
- Token refresh and logout with token blacklisting

### User Management
- Comprehensive user profiles with bio, avatar, website, and location
- Privacy controls: Public, Private, or Followers-only visibility
- User statistics: followers, following, and post counts
- Avatar upload with validation (JPEG/PNG, max 2MB)

### Content & Social Features
- Create, edit, and delete posts with text (280 chars) and images
- Post categories: General, Announcement, Question
- Like and comment on posts
- Follow/unfollow users
- Personalized feed showing posts from followed users

### Admin Dashboard
- User management and deactivation
- Content moderation and post deletion
- Platform statistics and analytics

## Technology Stack

**Frontend**
- Next.js 16 with App Router
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui components
- Framer Motion for animations
- React Hot Toast for notifications

**Backend**
- Next.js API Routes
- JWT for authentication
- bcryptjs for password hashing
- Nodemailer for email services

**Database & Storage**
- PostgreSQL via Supabase
- Supabase Storage for images

**Deployment**
- Vercel/Netlify compatible

## Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- SMTP credentials for email

### Setup

1. Clone the repository
```bash
git clone https://github.com/ujjwal509kumar/VegaStack-Assignment.git
cd socialconnect
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# JWT Configuration
JWT_SECRET=
JWT_ACCESS_TOKEN_EXPIRY=
JWT_REFRESH_TOKEN_EXPIRY=

# Email Configuration (SMTP)
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

# Application URL
NEXT_PUBLIC_APP_URL=
```

4. Set up Supabase database

Create the SQL schema in your Supabase SQL Editor:
```bash
# Create the tables in SQL Editor
```

5. Configure Supabase Storage

Create two public buckets in Supabase Storage:
- `avatars` (public, 2MB limit)
- `posts` (public, 2MB limit)

Set up storage policies for authenticated uploads and public reads.

6. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### User Registration
1. Navigate to `/register`
2. Fill in email, username, password, first name, and last name
3. Verify email via the link sent to your inbox
4. Login at `/login`

### Creating Posts
1. Navigate to `/posts/create`
2. Write content (max 280 characters)
3. Optionally upload an image (JPEG/PNG, max 2MB)
4. Select a category and publish

### Social Interactions
- **Follow users**: Browse `/users` and click Follow
- **Like posts**: Click the heart icon on any post
- **Comment**: Click on a post to view details and add comments
- **View feed**: Access `/feed` to see posts from followed users

### Profile Management
1. Go to `/profile`
2. Edit bio, avatar, website, location
3. Set profile visibility (Public/Private/Followers-only)

### Admin Access
Admins can access `/admin` for:
- User management and deactivation
- Content moderation
- Platform statistics like Total Users, Total Posts, Active today

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout and revoke tokens
- `POST /api/auth/password-reset` - Request password reset
- `POST /api/auth/password-reset-confirm` - Confirm password reset
- `POST /api/auth/change-password` - Change password (authenticated)
- `POST /api/auth/token/refresh` - Refresh access token

### Users
- `GET /api/users` - List users (with visibility filtering)
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/me` - Update own profile
- `POST /api/users/:id/follow` - Follow/unfollow user
- `GET /api/users/:id/followers` - Get followers
- `GET /api/users/:id/following` - Get following

### Posts
- `GET /api/posts` - List all posts
- `POST /api/posts` - Create post
- `GET /api/posts/:id` - Get post details
- `PUT /api/posts/:id` - Update own post
- `DELETE /api/posts/:id` - Delete own post
- `POST /api/posts/:id/like` - Like/unlike post
- `GET /api/posts/:id/likes` - Get post likes
- `POST /api/posts/:id/comments` - Add comment
- `GET /api/posts/:id/comments` - Get comments

### Feed & Admin
- `GET /api/feed` - Get personalized feed
- `GET /api/admin/users` - List all users (admin)
- `GET /api/admin/posts` - List all posts (admin)
- `POST /api/admin/users/:id/deactivate` - Deactivate user (admin)
- `DELETE /api/admin/posts/:id` - Delete any post (admin)
- `GET /api/admin/stats` - Platform statistics (admin)

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── admin/             # Admin dashboard
│   ├── feed/              # User feed
│   ├── posts/             # Post management
│   ├── profile/           # User profile
│   └── users/             # User discovery
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility libraries
│   ├── auth.ts           # JWT utilities
│   ├── db.ts             # Database queries
│   ├── email.ts          # Email service
│   └── storage.ts        # File upload
└── supabase-schema.sql   # Database schema
```

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Ensure all environment variables from `.env` are configured in your deployment platform, especially:
- `SUPABASE_SERVICE_ROLE_KEY` (critical for storage uploads)
- `JWT_SECRET` (use a strong random string)
- Email SMTP credentials
