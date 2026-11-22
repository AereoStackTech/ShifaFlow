import { NextRequest, NextResponse } from 'next/server';
import { and, desc, eq, ne, or } from 'drizzle-orm';
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
import { addMinutesToTime, generateReferenceCode } from '@/src/lib/slots.ts';

const createAppointmentSchema = z.object({
  doctorId: z.number().int().positive(),
  specialtyId: z.number().int().positive(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  patientName: z.string().min(2).max(120),
  patientPhone: z.string().min(6).max(30),
  patientEmail: z.string().email().optional().or(z.literal('')),
  patientNotes: z.string().max(400).optional(),
});

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [allDoctors, allSpecialties] = await Promise.all([
      db.select().from(doctorProfiles),
      db.select().from(specialties),
    ]);

    const docMap = new Map(allDoctors.map((d) => [d.id, d]));
    const specMap = new Map(allSpecialties.map((s) => [s.id, s]));

    let rows;
    if (hasRole(user, ['CLINIC_OWNER', 'RECEPTIONIST', 'DOCTOR'])) {
      const onlyMine = req.nextUrl.searchParams.get('mine') === 'true';
      if (user.role === 'DOCTOR' && onlyMine) {
        const myDoc = allDoctors.find((d) => d.userId === user.id);
        rows = myDoc
          ? await db
              .select()
              .from(appointments)
              .where(eq(appointments.doctorId, myDoc.id))
              .orderBy(desc(appointments.appointmentDate), desc(appointments.startTime))
          : [];
      } else {
        rows = await db
          .select()
          .from(appointments)
          .orderBy(desc(appointments.appointmentDate), desc(appointments.startTime));
      }
    } else {
      // PATIENT can strictly see only their own records
      rows = await db
        .select()
        .from(appointments)
        .where(
          or(
            eq(appointments.patientUserId, user.id),
            eq(appointments.patientEmail, user.email)
          )
        )
        .orderBy(desc(appointments.appointmentDate), desc(appointments.startTime));
    }

    const enriched = rows.map((row) => {
      const doc = docMap.get(row.doctorId);
      const spec = specMap.get(row.specialtyId);
      return {
        ...row,
        doctorNameAr: doc?.nameAr ?? '',
        doctorNameEn: doc?.nameEn ?? '',
        doctorRoom: doc?.roomNumber ?? '',
        specialtyNameAr: spec?.nameAr ?? '',
        specialtyNameEn: spec?.nameEn ?? '',
      };
    });

    return NextResponse.json({ appointments: enriched });
  } catch (error) {
    console.error('Failed to list appointments:', error);
    return NextResponse.json({ error: 'Unable to load appointments.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await authenticateRequest(req);
    const body = await req.json();
    const parsed = createAppointmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Please provide valid booking details (doctor, date, slot, name, phone).' },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const [doctor] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.id, data.doctorId))
      .limit(1);

    if (!doctor) {
      return NextResponse.json({ error: 'Selected doctor not found.' }, { status: 404 });
    }
    if (doctor.status === 'ON_LEAVE') {
      return NextResponse.json(
        { error: 'This doctor is currently on leave and unavailable for booking.' },
        { status: 409 }
      );
    }

    const [specialty] = await db
      .select()
      .from(specialties)
      .where(eq(specialties.id, data.specialtyId))
      .limit(1);

    const [clinic] = await db
      .select()
      .from(clinicWorkspaces)
      .where(eq(clinicWorkspaces.id, doctor.clinicId))
      .limit(1);

    // Real-time conflict check: lock out any existing non-cancelled appointment at the same doctor/date/time
    const conflicting = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, data.doctorId),
          eq(appointments.appointmentDate, data.appointmentDate),
          eq(appointments.startTime, data.startTime),
          ne(appointments.status, 'CANCELLED')
        )
      )
      .limit(1);

    if (conflicting[0]) {
      return NextResponse.json(
        { error: 'This time slot has just been booked. Please select another available time.' },
        { status: 409 }
      );
    }

    const [year, month, day] = data.appointmentDate.split('-').map(Number);
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    const [slotRule] = await db
      .select()
      .from(scheduleSlots)
      .where(and(eq(scheduleSlots.doctorId, data.doctorId), eq(scheduleSlots.dayOfWeek, dayOfWeek)))
      .limit(1);

    const durationMin = slotRule?.slotDurationMin || clinic?.defaultDurationMin || 30;
    const endTime = addMinutesToTime(data.startTime, durationMin);

    let referenceCode = generateReferenceCode();
    const existingRef = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(eq(appointments.referenceCode, referenceCode))
      .limit(1);
    if (existingRef[0]) {
      referenceCode = `${generateReferenceCode()}${Math.floor(Math.random() * 9)}`;
    }

    const [created] = await db
      .insert(appointments)
      .values({
        referenceCode,
        clinicId: doctor.clinicId,
        specialtyId: doctor.specialtyId,
        doctorId: doctor.id,
        patientUserId: user?.role === 'PATIENT' ? user.id : null,
        patientName: data.patientName.trim(),
        patientPhone: data.patientPhone.trim(),
        patientEmail: data.patientEmail?.trim().toLowerCase() || user?.email || null,
        patientNotes: data.patientNotes?.trim() || null,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        endTime,
        status: 'CONFIRMED',
        feeAmount: doctor.consultationFee,
        currency: clinic?.currency || 'SAR',
      })
      .returning();

    return NextResponse.json(
      {
        appointment: {
          ...created,
          clinicNameAr: clinic?.nameAr ?? '',
          clinicNameEn: clinic?.nameEn ?? '',
          clinicCityAr: clinic?.cityAr ?? '',
          clinicCityEn: clinic?.cityEn ?? '',
          clinicPhone: clinic?.phone ?? '',
          doctorNameAr: doctor.nameAr,
          doctorNameEn: doctor.nameEn,
          doctorTitleAr: doctor.titleAr,
          doctorTitleEn: doctor.titleEn,
          doctorRoom: doctor.roomNumber,
          specialtyNameAr: specialty?.nameAr ?? '',
          specialtyNameEn: specialty?.nameEn ?? '',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Appointment creation failed:', error);
    return NextResponse.json(
      { error: 'Unable to confirm booking right now. Please try again.' },
      { status: 500 }
    );
  }
}
