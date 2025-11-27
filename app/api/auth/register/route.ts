import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { validateEmail, validateUsername, validatePassword } from '@/lib/validators';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail, getVerificationEmailTemplate } from '@/lib/email';

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

    // Check if email already exists
    const existingEmail = await db.users.findByEmail(email);
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already exists. Please use a different email.' },
        { status: 409 }
      );
    }

    // Check if username already exists
    const existingUsername = await db.users.findByUsername(username);
    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username already exists. Please choose a different one.' },
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

    // Generate custom verification token
    const verificationToken = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;

    // Store verification token in database (you can add a verification_tokens table or use existing)
    // For now, we'll just send the email
    
    // Send verification email
    try {
      const emailTemplate = getVerificationEmailTemplate(firstName, verificationLink);
      await sendEmail({
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue anyway - user is created, they just won't get the email
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
