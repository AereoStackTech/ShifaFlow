import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/src/db/index.ts';
import { clinicWorkspaces, subscriptions } from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { authenticateRequest } from '@/src/lib/auth-server.ts';

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let clinic = null;
    let subscription = null;

    if (user.clinicId) {
      const clinicRows = await db
        .select()
        .from(clinicWorkspaces)
        .where(eq(clinicWorkspaces.id, user.clinicId))
        .limit(1);
      clinic = clinicRows[0] ?? null;

      if (clinic) {
        const subRows = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.clinicId, clinic.id))
          .limit(1);
        subscription = subRows[0] ?? null;
      }
    }

    return NextResponse.json({ user, clinic, subscription });
  } catch (error) {
    console.error('Auth me route failed:', error);
    return NextResponse.json({ error: 'Failed to load profile.' }, { status: 500 });
  }
}
