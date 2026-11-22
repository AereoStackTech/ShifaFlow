import { NextRequest, NextResponse } from 'next/server';
import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db/index.ts';
import { appointments, scheduleSlots } from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { authenticateRequest, hasRole } from '@/src/lib/auth-server.ts';
import { addMinutesToTime } from '@/src/lib/slots.ts';

const patchAppointmentSchema = z.object({
  status: z
    .enum(['CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .optional(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeeded();
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const appointmentId = Number(rawId);
    if (!appointmentId || Number.isNaN(appointmentId)) {
      return NextResponse.json({ error: 'Invalid appointment ID.' }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Appointment not found.' }, { status: 404 });
    }

    const isStaff = hasRole(user, ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST']);
    const isOwnerPatient =
      existing.patientUserId === user.id ||
      (existing.patientEmail && existing.patientEmail.toLowerCase() === user.email.toLowerCase());

    if (!isStaff && !isOwnerPatient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = patchAppointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload.' }, { status: 400 });
    }

    const updates: Partial<typeof appointments.$inferInsert> = {};

    // Patients can only cancel or reschedule their own visit
    if (parsed.data.status) {
      if (!isStaff && parsed.data.status !== 'CANCELLED') {
        return NextResponse.json(
          { error: 'Patients may only cancel or reschedule their appointment.' },
          { status: 403 }
        );
      }
      updates.status = parsed.data.status;
    }

    // Rescheduling with conflict prevention
    if (parsed.data.appointmentDate && parsed.data.startTime) {
      const targetDate = parsed.data.appointmentDate;
      const targetStart = parsed.data.startTime;

      const conflict = await db
        .select({ id: appointments.id })
        .from(appointments)
        .where(
          and(
            eq(appointments.doctorId, existing.doctorId),
            eq(appointments.appointmentDate, targetDate),
            eq(appointments.startTime, targetStart),
            ne(appointments.status, 'CANCELLED'),
            ne(appointments.id, existing.id)
          )
        )
        .limit(1);

      if (conflict[0]) {
        return NextResponse.json(
          { error: 'The requested reschedule slot is already booked.' },
          { status: 409 }
        );
      }

      const [year, month, day] = targetDate.split('-').map(Number);
      const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
      const [slotRule] = await db
        .select()
        .from(scheduleSlots)
        .where(
          and(
            eq(scheduleSlots.doctorId, existing.doctorId),
            eq(scheduleSlots.dayOfWeek, dayOfWeek)
          )
        )
        .limit(1);

      const durationMin = slotRule?.slotDurationMin || 30;
      updates.appointmentDate = targetDate;
      updates.startTime = targetStart;
      updates.endTime = addMinutesToTime(targetStart, durationMin);
      updates.status = 'CONFIRMED';
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ appointment: existing });
    }

    const [updated] = await db
      .update(appointments)
      .set(updates)
      .where(eq(appointments.id, appointmentId))
      .returning();

    return NextResponse.json({ appointment: updated });
  } catch (error) {
    console.error('Failed to update appointment:', error);
    return NextResponse.json({ error: 'Unable to update appointment.' }, { status: 500 });
  }
}
