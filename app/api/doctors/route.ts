import { NextRequest, NextResponse } from 'next/server';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db/index.ts';
import {
  appointments,
  clinicWorkspaces,
  doctorProfiles,
  scheduleSlots,
  specialties,
} from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { authenticateRequest, hasRole } from '@/src/lib/auth-server.ts';

const createDoctorSchema = z.object({
  specialtyId: z.number().int().positive(),
  nameAr: z.string().min(2).max(120),
  nameEn: z.string().min(2).max(120),
  titleAr: z.string().min(2).max(150),
  titleEn: z.string().min(2).max(150),
  bioAr: z.string().max(400).optional(),
  bioEn: z.string().max(400).optional(),
  roomNumber: z.string().min(2).max(40),
  consultationFee: z.number().int().min(50).max(5000),
  yearsExperience: z.number().int().min(1).max(60).default(8),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).default('09:00'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).default('17:00'),
  slotDurationMin: z.number().int().min(15).max(90).default(30),
});

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await authenticateRequest(req);
    if (!user || !hasRole(user, ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'])) {
      return NextResponse.json({ error: 'Staff authorization required.' }, { status: 403 });
    }

    const [docs, specs, slots, appts] = await Promise.all([
      db.select().from(doctorProfiles).orderBy(asc(doctorProfiles.id)),
      db.select().from(specialties).orderBy(asc(specialties.id)),
      db.select().from(scheduleSlots).orderBy(asc(scheduleSlots.dayOfWeek)),
      db.select().from(appointments),
    ]);

    const specMap = new Map(specs.map((s) => [s.id, s]));
    const today = new Date().toISOString().slice(0, 10);

    const enriched = docs.map((doc) => {
      const spec = specMap.get(doc.specialtyId);
      const docSlots = slots.filter((s) => s.doctorId === doc.id);
      const todayBookings = appts.filter(
        (a) => a.doctorId === doc.id && a.appointmentDate === today && a.status !== 'CANCELLED'
      ).length;
      const totalBookings = appts.filter(
        (a) => a.doctorId === doc.id && a.status !== 'CANCELLED'
      ).length;

      return {
        ...doc,
        specialtyNameAr: spec?.nameAr ?? '',
        specialtyNameEn: spec?.nameEn ?? '',
        scheduleSlots: docSlots,
        todayBookings,
        totalBookings,
      };
    });

    return NextResponse.json({ doctors: enriched, specialties: specs });
  } catch (error) {
    console.error('Failed to load doctors:', error);
    return NextResponse.json({ error: 'Unable to load doctor roster.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await authenticateRequest(req);
    if (!user || !hasRole(user, ['CLINIC_OWNER'])) {
      return NextResponse.json({ error: 'Only clinic owners can add new doctors.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createDoctorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide complete doctor details.' }, { status: 400 });
    }

    const [clinic] = user.clinicId
      ? await db.select().from(clinicWorkspaces).where(eq(clinicWorkspaces.id, user.clinicId)).limit(1)
      : await db.select().from(clinicWorkspaces).limit(1);

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic workspace not configured.' }, { status: 400 });
    }

    const data = parsed.data;
    const [created] = await db
      .insert(doctorProfiles)
      .values({
        clinicId: clinic.id,
        specialtyId: data.specialtyId,
        nameAr: data.nameAr.trim(),
        nameEn: data.nameEn.trim(),
        titleAr: data.titleAr.trim(),
        titleEn: data.titleEn.trim(),
        bioAr: data.bioAr?.trim() || 'طبيب متخصص ضمن فريق عيادة الشفاء التخصصية.',
        bioEn: data.bioEn?.trim() || 'Specialist physician at Al-Shifa Specialty Clinic.',
        roomNumber: data.roomNumber.trim(),
        consultationFee: data.consultationFee,
        yearsExperience: data.yearsExperience,
        status: 'ACTIVE',
      })
      .returning();

    const defaultSlots = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      doctorId: created.id,
      dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      slotDurationMin: data.slotDurationMin,
      isActive: dayOfWeek !== 5,
    }));

    await db.insert(scheduleSlots).values(defaultSlots);

    return NextResponse.json({ doctor: created }, { status: 201 });
  } catch (error) {
    console.error('Failed to add doctor:', error);
    return NextResponse.json({ error: 'Unable to add doctor right now.' }, { status: 500 });
  }
}
