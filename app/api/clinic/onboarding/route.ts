import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db/index.ts';
import { clinicWorkspaces, subscriptions, users } from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { authenticateRequest } from '@/src/lib/auth-server.ts';

const onboardingSchema = z.object({
  nameAr: z.string().min(2).max(120),
  nameEn: z.string().min(2).max(120),
  cityAr: z.string().min(2).max(100),
  cityEn: z.string().min(2).max(100),
  phone: z.string().min(6).max(30),
  currency: z.enum(['SAR', 'AED', 'USD', 'EGP']),
  workStart: z.string().regex(/^\d{2}:\d{2}$/),
  workEnd: z.string().regex(/^\d{2}:\d{2}$/),
  workingDays: z.string().min(1).max(20),
  defaultDurationMin: z.number().int().min(15).max(90),
  planTier: z.enum(['SOLO_CLINIC', 'MULTI_DOCTOR', 'HOSPITAL_ENTERPRISE']).optional(),
  billingCycle: z.enum(['MONTHLY', 'ANNUAL']).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const [clinic] = user.clinicId
      ? await db.select().from(clinicWorkspaces).where(eq(clinicWorkspaces.id, user.clinicId)).limit(1)
      : await db.select().from(clinicWorkspaces).limit(1);

    return NextResponse.json({ clinic: clinic ?? null });
  } catch (error) {
    console.error('Get onboarding clinic failed:', error);
    return NextResponse.json({ error: 'Failed to load clinic settings.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'CLINIC_OWNER') {
      return NextResponse.json({ error: 'Only clinic owners can configure workspace settings.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please complete all required clinic setup fields.' }, { status: 400 });
    }

    const data = parsed.data;
    const [targetClinic] = user.clinicId
      ? await db.select().from(clinicWorkspaces).where(eq(clinicWorkspaces.id, user.clinicId)).limit(1)
      : await db.select().from(clinicWorkspaces).limit(1);

    let savedClinic;
    if (targetClinic) {
      const [updated] = await db
        .update(clinicWorkspaces)
        .set({
          nameAr: data.nameAr.trim(),
          nameEn: data.nameEn.trim(),
          cityAr: data.cityAr.trim(),
          cityEn: data.cityEn.trim(),
          phone: data.phone.trim(),
          currency: data.currency,
          workStart: data.workStart,
          workEnd: data.workEnd,
          workingDays: data.workingDays,
          defaultDurationMin: data.defaultDurationMin,
          onboardingCompleted: true,
        })
        .where(eq(clinicWorkspaces.id, targetClinic.id))
        .returning();
      savedClinic = updated;
    } else {
      const slug = `clinic-${Date.now()}`;
      const [created] = await db
        .insert(clinicWorkspaces)
        .values({
          slug,
          nameAr: data.nameAr.trim(),
          nameEn: data.nameEn.trim(),
          cityAr: data.cityAr.trim(),
          cityEn: data.cityEn.trim(),
          phone: data.phone.trim(),
          currency: data.currency,
          workStart: data.workStart,
          workEnd: data.workEnd,
          workingDays: data.workingDays,
          defaultDurationMin: data.defaultDurationMin,
          onboardingCompleted: true,
        })
        .returning();
      savedClinic = created;

      await db
        .update(users)
        .set({ clinicId: savedClinic.id })
        .where(eq(users.id, user.id));
    }

    if (data.planTier && savedClinic) {
      const priceMap: Record<string, { monthly: number; annual: number }> = {
        SOLO_CLINIC: { monthly: 59, annual: 49 },
        MULTI_DOCTOR: { monthly: 179, annual: 149 },
        HOSPITAL_ENTERPRISE: { monthly: 449, annual: 369 },
      };
      const cycle = data.billingCycle || 'ANNUAL';
      const price = cycle === 'ANNUAL' ? priceMap[data.planTier].annual : priceMap[data.planTier].monthly;
      const existingSub = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.clinicId, savedClinic.id))
        .limit(1);

      if (existingSub[0]) {
        await db
          .update(subscriptions)
          .set({
            planTier: data.planTier,
            billingCycle: cycle,
            priceAmount: price,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, existingSub[0].id));
      } else {
        const renew = new Date();
        renew.setDate(renew.getDate() + (cycle === 'ANNUAL' ? 365 : 30));
        await db.insert(subscriptions).values({
          clinicId: savedClinic.id,
          planTier: data.planTier,
          billingCycle: cycle,
          status: 'ACTIVE',
          priceAmount: price,
          currency: 'USD',
          renewDate: renew.toISOString().slice(0, 10),
        });
      }
    }

    return NextResponse.json({ clinic: savedClinic });
  } catch (error) {
    console.error('Clinic onboarding update failed:', error);
    return NextResponse.json({ error: 'Failed to save clinic configuration.' }, { status: 500 });
  }
}
