import { NextRequest, NextResponse } from 'next/server';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/src/db/index.ts';
import { appointments, doctorProfiles, scheduleSlots } from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { generateConflictFreeSlots } from '@/src/lib/slots.ts';

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const doctorIdParam = req.nextUrl.searchParams.get('doctorId');
    const dateParam = req.nextUrl.searchParams.get('date');

    const doctorId = Number(doctorIdParam);
    if (!doctorId || Number.isNaN(doctorId) || !dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return NextResponse.json(
        { error: 'Valid doctorId and date (YYYY-MM-DD) are required.' },
        { status: 400 }
      );
    }

    const [doctor] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.id, doctorId))
      .limit(1);

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });
    }

    const [year, month, day] = dateParam.split('-').map(Number);
    const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

    const [schedule] = await db
      .select()
      .from(scheduleSlots)
      .where(and(eq(scheduleSlots.doctorId, doctorId), eq(scheduleSlots.dayOfWeek, dayOfWeek)))
      .limit(1);

    if (!schedule || !schedule.isActive) {
      return NextResponse.json({
        doctorId,
        date: dateParam,
        doctorStatus: doctor.status,
        leaveReason: doctor.leaveReason,
        slots: [],
      });
    }

    const bookedRows = await db
      .select({ startTime: appointments.startTime })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, doctorId),
          eq(appointments.appointmentDate, dateParam),
          ne(appointments.status, 'CANCELLED')
        )
      );

    const bookedSet = new Set(bookedRows.map((r) => r.startTime));
    const slots = generateConflictFreeSlots({
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDurationMin: schedule.slotDurationMin,
      bookedStartTimes: bookedSet,
      isDoctorOnLeave: doctor.status === 'ON_LEAVE',
    });

    return NextResponse.json({
      doctorId,
      date: dateParam,
      doctorStatus: doctor.status,
      leaveReason: doctor.leaveReason,
      slotDurationMin: schedule.slotDurationMin,
      slots,
    });
  } catch (error) {
    console.error('Slots calculation failed:', error);
    return NextResponse.json(
      { error: 'Unable to calculate available appointment slots.' },
      { status: 500 }
    );
  }
}
