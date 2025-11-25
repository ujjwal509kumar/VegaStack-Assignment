import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { validateEmail, validateUsername, validatePassword } from '@/lib/validators';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password, firstName, lastName } = body;

    // Validation
    if (!email || !username || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!validateUsername(username)) {
      return NextResponse.json(
        { error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.users.findByEmailOrUsername(email);
    const existingUsername = await db.users.findByEmailOrUsername(username);

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user in our database (email_verified = false by default)
    const user = await db.users.create({
      email,
      username,
      password: hashedPassword,
      firstName,
      lastName,
    });

    // Create profile
    await supabaseAdmin.from('profiles').insert({ user_id: user.id });

    // Create user in Supabase Auth to trigger email
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: false,
        user_metadata: {
          user_id: user.id,
          username: username,
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (authError) {
        console.error('Supabase Auth user creation error:', authError);
      } else {
        console.log('Verification email sent to:', email);
      }
    } catch (emailError) {
      console.error('Failed to create auth user:', emailError);
    }
    
    return NextResponse.json(
      {
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          emailVerified: false,
          createdAt: user.created_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
