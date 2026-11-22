import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/src/db/index.ts';
import { doctorProfiles, scheduleSlots } from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { authenticateRequest, hasRole } from '@/src/lib/auth-server.ts';

const patchDoctorSchema = z.object({
  status: z.enum(['ACTIVE', 'ON_LEAVE']).optional(),
  leaveReason: z.string().max(200).nullable().optional(),
  roomNumber: z.string().min(2).max(40).optional(),
  consultationFee: z.number().int().min(50).max(5000).optional(),
  shiftUpdate: z
    .object({
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      slotDurationMin: z.number().int().min(15).max(90),
      activeDays: z.array(z.number().int().min(0).max(6)),
    })
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeeded();
    const user = await authenticateRequest(req);
    if (!user || !hasRole(user, ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'])) {
      return NextResponse.json({ error: 'Staff authorization required.' }, { status: 403 });
    }

    const { id: rawId } = await context.params;
    const doctorId = Number(rawId);
    if (!doctorId || Number.isNaN(doctorId)) {
      return NextResponse.json({ error: 'Invalid doctor ID.' }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(doctorProfiles)
      .where(eq(doctorProfiles.id, doctorId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Doctor not found.' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = patchDoctorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid doctor update payload.' }, { status: 400 });
    }

    const data = parsed.data;
    const profileUpdates: Partial<typeof doctorProfiles.$inferInsert> = {};
    if (data.status !== undefined) profileUpdates.status = data.status;
    if (data.leaveReason !== undefined) profileUpdates.leaveReason = data.leaveReason;
    if (data.roomNumber !== undefined) profileUpdates.roomNumber = data.roomNumber;
    if (data.consultationFee !== undefined) profileUpdates.consultationFee = data.consultationFee;

    let updatedDoc = existing;
    if (Object.keys(profileUpdates).length > 0) {
      const [row] = await db
        .update(doctorProfiles)
        .set(profileUpdates)
        .where(eq(doctorProfiles.id, doctorId))
        .returning();
      updatedDoc = row;
    }

    if (data.shiftUpdate) {
      const { startTime, endTime, slotDurationMin, activeDays } = data.shiftUpdate;
      const activeSet = new Set(activeDays);
      for (let day = 0; day <= 6; day++) {
        const existingSlot = await db
          .select()
          .from(scheduleSlots)
          .where(and(eq(scheduleSlots.doctorId, doctorId), eq(scheduleSlots.dayOfWeek, day)))
          .limit(1);

        if (existingSlot[0]) {
          await db
            .update(scheduleSlots)
            .set({
              startTime,
              endTime,
              slotDurationMin,
              isActive: activeSet.has(day),
            })
            .where(eq(scheduleSlots.id, existingSlot[0].id));
        } else {
          await db.insert(scheduleSlots).values({
            doctorId,
            dayOfWeek: day,
            startTime,
            endTime,
            slotDurationMin,
            isActive: activeSet.has(day),
          });
        }
      }
    }

    const updatedSlots = await db
      .select()
      .from(scheduleSlots)
      .where(eq(scheduleSlots.doctorId, doctorId));

    return NextResponse.json({ doctor: updatedDoc, scheduleSlots: updatedSlots });
  } catch (error) {
    console.error('Failed to update doctor schedule:', error);
    return NextResponse.json({ error: 'Unable to update doctor schedule.' }, { status: 500 });
  }
}
