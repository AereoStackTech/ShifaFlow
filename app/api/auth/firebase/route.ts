import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/db/index.ts';
import { clinicWorkspaces } from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { adminAuth } from '@/src/lib/firebase-admin.ts';
import { upsertFirebaseUser, type UserRole } from '@/src/lib/auth-server.ts';

const firebaseBodySchema = z.object({
  preferredRole: z.enum(['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST', 'PATIENT']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing Firebase token.' }, { status: 401 });
    }
    const idToken = authHeader.slice('Bearer '.length).trim();
    const decoded = await adminAuth.verifyIdToken(idToken);

    let preferredRole: UserRole = 'CLINIC_OWNER';
    try {
      const body = await req.json();
      const parsed = firebaseBodySchema.safeParse(body);
      if (parsed.success && parsed.data.preferredRole) {
        preferredRole = parsed.data.preferredRole;
      }
    } catch {
      // optional body
    }

    const [defaultClinic] = await db.select().from(clinicWorkspaces).limit(1);
    const user = await upsertFirebaseUser({
      uid: decoded.uid,
      email: decoded.email || `${decoded.uid}@shifaflow.app`,
      displayName: decoded.name || null,
      preferredRole,
      defaultClinicId: defaultClinic?.id ?? null,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Firebase auth verification failed:', error);
    return NextResponse.json({ error: 'Invalid or expired Google sign-in token.' }, { status: 401 });
  }
}
