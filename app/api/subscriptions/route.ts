import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db/index.ts';
import { clinicWorkspaces, subscriptions } from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { authenticateRequest } from '@/src/lib/auth-server.ts';

const subSchema = z.object({
  planTier: z.enum(['SOLO_CLINIC', 'MULTI_DOCTOR', 'HOSPITAL_ENTERPRISE']),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']),
});

const PRICES: Record<string, { monthly: number; annual: number }> = {
  SOLO_CLINIC: { monthly: 59, annual: 49 },
  MULTI_DOCTOR: { monthly: 179, annual: 149 },
  HOSPITAL_ENTERPRISE: { monthly: 449, annual: 369 },
};

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await authenticateRequest(req);
    if (!user || user.role !== 'CLINIC_OWNER') {
      return NextResponse.json(
        { error: 'Please sign in as a Clinic Owner to update your plan.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = subSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid subscription plan selection.' }, { status: 400 });
    }

    const [clinic] = user.clinicId
      ? await db.select().from(clinicWorkspaces).where(eq(clinicWorkspaces.id, user.clinicId)).limit(1)
      : await db.select().from(clinicWorkspaces).limit(1);

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic workspace not found.' }, { status: 404 });
    }

    const { planTier, billingCycle } = parsed.data;
    const priceAmount =
      billingCycle === 'ANNUAL' ? PRICES[planTier].annual : PRICES[planTier].monthly;
    const renew = new Date();
    renew.setDate(renew.getDate() + (billingCycle === 'ANNUAL' ? 365 : 30));

    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.clinicId, clinic.id))
      .limit(1);

    let saved;
    if (existing[0]) {
      const [updated] = await db
        .update(subscriptions)
        .set({
          planTier,
          billingCycle,
          priceAmount,
          status: 'ACTIVE',
          renewDate: renew.toISOString().slice(0, 10),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existing[0].id))
        .returning();
      saved = updated;
    } else {
      const [created] = await db
        .insert(subscriptions)
        .values({
          clinicId: clinic.id,
          planTier,
          billingCycle,
          priceAmount,
          status: 'ACTIVE',
          currency: 'USD',
          renewDate: renew.toISOString().slice(0, 10),
        })
        .returning();
      saved = created;
    }

    return NextResponse.json({ subscription: saved });
  } catch (error) {
    console.error('Subscription update failed:', error);
    return NextResponse.json({ error: 'Unable to update subscription plan.' }, { status: 500 });
  }
}
