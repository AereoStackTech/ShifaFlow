import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db/index.ts';
import { clinicWorkspaces, users } from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { createSessionToken, hashPassword, type UserRole } from '@/src/lib/auth-server.ts';

const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().max(30).optional(),
  role: z.enum(['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']).default('PATIENT'),
});

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please complete all fields (password must be at least 8 characters).' },
        { status: 400 }
      );
    }

    const emailNormalized = parsed.data.email.trim().toLowerCase();
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, emailNormalized))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const [defaultClinic] = await db.select().from(clinicWorkspaces).limit(1);
    const passwordHash = await hashPassword(parsed.data.password);
    const uid = `local_${crypto.randomUUID()}`;

    const [created] = await db
      .insert(users)
      .values({
        uid,
        email: emailNormalized,
        passwordHash,
        fullNameAr: parsed.data.fullName.trim(),
        fullNameEn: parsed.data.fullName.trim(),
        phone: parsed.data.phone?.trim() || null,
        role: parsed.data.role,
        clinicId: defaultClinic?.id ?? null,
        isDemo: false,
      })
      .returning();

    const token = createSessionToken(created.uid, created.role as UserRole);
    return NextResponse.json(
      {
        token,
        user: {
          id: created.id,
          uid: created.uid,
          email: created.email,
          fullNameAr: created.fullNameAr,
          fullNameEn: created.fullNameEn,
          phone: created.phone,
          role: created.role,
          clinicId: created.clinicId,
          isDemo: created.isDemo,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register route failed:', error);
    return NextResponse.json(
      { error: 'Unable to create account right now. Please try again.' },
      { status: 500 }
    );
  }
}
