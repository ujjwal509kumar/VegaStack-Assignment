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

    // Generate email verification link and send email
    try {
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: email,
        password: password,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/auth/callback`,
          data: {
            user_id: user.id,
            username: username,
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (linkError) {
        console.error('Failed to generate verification link:', linkError);
      } else if (linkData?.properties?.action_link) {
        const verificationLink = linkData.properties.action_link;
        
        // Send verification email
        const emailTemplate = getVerificationEmailTemplate(firstName, verificationLink);
        await sendEmail({
          to: email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    } catch (emailError) {
      console.error('Email generation error:', emailError);
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
