import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/src/db/index.ts';
import {
  appointments,
  clinicWorkspaces,
  doctorProfiles,
  specialties,
  subscriptions,
} from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { authenticateRequest, hasRole } from '@/src/lib/auth-server.ts';

function getOffsetDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await authenticateRequest(req);
    if (!user || !hasRole(user, ['CLINIC_OWNER', 'DOCTOR', 'RECEPTIONIST'])) {
      return NextResponse.json({ error: 'Staff authorization required.' }, { status: 403 });
    }

    const [clinic] = await db.select().from(clinicWorkspaces).limit(1);
    const [allAppointments, allDoctors, allSpecialties, subRows] = await Promise.all([
      db.select().from(appointments),
      db.select().from(doctorProfiles),
      db.select().from(specialties),
      clinic
        ? db.select().from(subscriptions).where(eq(subscriptions.clinicId, clinic.id)).limit(1)
        : Promise.resolve([]),
    ]);

    const today = getOffsetDateStr(0);
    const todayAppts = allAppointments.filter((a) => a.appointmentDate === today);
    const todayActive = todayAppts.filter((a) => a.status !== 'CANCELLED');

    const todaysBookings = todayActive.length;
    const waitingPatients = todayAppts.filter(
      (a) => a.status === 'CONFIRMED' || a.status === 'CHECKED_IN'
    ).length;
    const dailyRevenue = todayActive.reduce((sum, a) => sum + a.feeAmount, 0);

    const activeDoctors = allDoctors.filter((d) => d.status === 'ACTIVE').length;
    const estimatedDailyCapacity = Math.max(1, activeDoctors * 12);
    const occupancyRate = Math.min(100, Math.round((todaysBookings / estimatedDailyCapacity) * 100));

    // Build 7-day trend series (past 5 days, today, tomorrow)
    const dailySeries = [-5, -4, -3, -2, -1, 0, 1].map((offset) => {
      const dateStr = getOffsetDateStr(offset);
      const dayItems = allAppointments.filter(
        (a) => a.appointmentDate === dateStr && a.status !== 'CANCELLED'
      );
      return {
        date: dateStr,
        label: dateStr.slice(5),
        bookings: dayItems.length,
        revenue: dayItems.reduce((sum, a) => sum + a.feeAmount, 0),
      };
    });

    // Specialty distribution
    const specMap = new Map(allSpecialties.map((s) => [s.id, s]));
    const specCounts = new Map<number, { count: number; revenue: number }>();
    for (const a of allAppointments) {
      if (a.status === 'CANCELLED') continue;
      const prev = specCounts.get(a.specialtyId) || { count: 0, revenue: 0 };
      specCounts.set(a.specialtyId, {
        count: prev.count + 1,
        revenue: prev.revenue + a.feeAmount,
      });
    }

    const specialtyBreakdown = Array.from(specCounts.entries()).map(([specId, stats]) => {
      const spec = specMap.get(specId);
      return {
        specialtyId: specId,
        nameAr: spec?.nameAr ?? '',
        nameEn: spec?.nameEn ?? '',
        bookings: stats.count,
        revenue: stats.revenue,
      };
    });

    const docMap = new Map(allDoctors.map((d) => [d.id, d]));
    const upcomingQueue = todayAppts
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 6)
      .map((a) => ({
        ...a,
        doctorNameAr: docMap.get(a.doctorId)?.nameAr ?? '',
        doctorNameEn: docMap.get(a.doctorId)?.nameEn ?? '',
        doctorRoom: docMap.get(a.doctorId)?.roomNumber ?? '',
        specialtyNameAr: specMap.get(a.specialtyId)?.nameAr ?? '',
        specialtyNameEn: specMap.get(a.specialtyId)?.nameEn ?? '',
      }));

    return NextResponse.json({
      clinic: clinic ?? null,
      subscription: subRows[0] ?? null,
      kpis: {
        todaysBookings,
        waitingPatients,
        dailyRevenue,
        occupancyRate,
        activeDoctors,
        totalDoctors: allDoctors.length,
        currency: clinic?.currency ?? 'SAR',
      },
      dailySeries,
      specialtyBreakdown,
      upcomingQueue,
    });
  } catch (error) {
    console.error('Dashboard overview failed:', error);
    return NextResponse.json({ error: 'Unable to load dashboard KPIs.' }, { status: 500 });
  }
}
