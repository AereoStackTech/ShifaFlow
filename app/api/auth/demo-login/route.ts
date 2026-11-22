import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db/index.ts';
import { users } from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { createSessionToken, type UserRole } from '@/src/lib/auth-server.ts';

const demoSchema = z.object({
  role: z.enum(['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']),
});

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const parsed = demoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid demo role requested.' }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.role, parsed.data.role), eq(users.isDemo, true)))
      .limit(1);

    const user = rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Demo profile not found.' }, { status: 404 });
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
    console.error('Demo login failed:', error);
    return NextResponse.json({ error: 'Unable to start demo session.' }, { status: 500 });
  }
}
