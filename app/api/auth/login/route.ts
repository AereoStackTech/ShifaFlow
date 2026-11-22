import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db/index.ts';
import { users } from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { createSessionToken, verifyPassword, type UserRole } from '@/src/lib/auth-server.ts';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please provide a valid email and password (min 6 characters).' },
        { status: 400 }
      );
    }

    const emailNormalized = parsed.data.email.trim().toLowerCase();
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, emailNormalized))
      .limit(1);

    const user = rows[0];
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const token = createSessionToken(user.uid, user.role as UserRole);
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        fullNameAr: user.fullNameAr,
        fullNameEn: user.fullNameEn,
        phone: user.phone,
        role: user.role,
        clinicId: user.clinicId,
        isDemo: user.isDemo,
      },
    });
  } catch (error) {
    console.error('Login route failed:', error);
    return NextResponse.json(
      { error: 'Unable to sign in right now. Please try again.' },
      { status: 500 }
    );
  }
}
