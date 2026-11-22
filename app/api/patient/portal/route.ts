import { NextRequest, NextResponse } from 'next/server';
import { desc, eq, or } from 'drizzle-orm';
import { db } from '@/src/db/index.ts';
import {
  appointments,
  clinicWorkspaces,
  doctorProfiles,
  medicalPrescriptions,
  specialties,
} from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';
import { authenticateRequest } from '@/src/lib/auth-server.ts';

export async function GET(req: NextRequest) {
  try {
    await ensureSeeded();
    const user = await authenticateRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [clinic] = await db.select().from(clinicWorkspaces).limit(1);
    const [allDoctors, allSpecialties] = await Promise.all([
      db.select().from(doctorProfiles),
      db.select().from(specialties),
    ]);

    const docMap = new Map(allDoctors.map((d) => [d.id, d]));
    const specMap = new Map(allSpecialties.map((s) => [s.id, s]));

    const myAppointments = await db
      .select()
      .from(appointments)
      .where(
        or(
          eq(appointments.patientUserId, user.id),
          eq(appointments.patientEmail, user.email)
        )
      )
      .orderBy(desc(appointments.appointmentDate), desc(appointments.startTime));

    const myPrescriptions = await db
      .select()
      .from(medicalPrescriptions)
      .where(eq(medicalPrescriptions.patientUserId, user.id))
      .orderBy(desc(medicalPrescriptions.issuedDate));

    const enrichedAppointments = myAppointments.map((a) => {
      const doc = docMap.get(a.doctorId);
      const spec = specMap.get(a.specialtyId);
      return {
        ...a,
        doctorNameAr: doc?.nameAr ?? '',
        doctorNameEn: doc?.nameEn ?? '',
        doctorTitleAr: doc?.titleAr ?? '',
        doctorTitleEn: doc?.titleEn ?? '',
        doctorRoom: doc?.roomNumber ?? '',
        specialtyNameAr: spec?.nameAr ?? '',
        specialtyNameEn: spec?.nameEn ?? '',
      };
    });

    const enrichedPrescriptions = myPrescriptions.map((rx) => {
      const doc = docMap.get(rx.doctorId);
      const spec = doc ? specMap.get(doc.specialtyId) : undefined;
      let medications: Array<{
        name: string;
        dosage: string;
        frequencyAr: string;
        frequencyEn: string;
        durationAr: string;
        durationEn: string;
        instructionsAr: string;
        instructionsEn: string;
      }> = [];
      try {
        medications = JSON.parse(rx.medicationsJson);
      } catch {
        medications = [];
      }
      return {
        ...rx,
        medications,
        doctorNameAr: doc?.nameAr ?? '',
        doctorNameEn: doc?.nameEn ?? '',
        doctorTitleAr: doc?.titleAr ?? '',
        doctorTitleEn: doc?.titleEn ?? '',
        specialtyNameAr: spec?.nameAr ?? '',
        specialtyNameEn: spec?.nameEn ?? '',
        clinicNameAr: clinic?.nameAr ?? '',
        clinicNameEn: clinic?.nameEn ?? '',
        clinicCityAr: clinic?.cityAr ?? '',
        clinicCityEn: clinic?.cityEn ?? '',
        clinicPhone: clinic?.phone ?? '',
      };
    });

    return NextResponse.json({
      clinic: clinic ?? null,
      appointments: enrichedAppointments,
      prescriptions: enrichedPrescriptions,
    });
  } catch (error) {
    console.error('Patient portal load failed:', error);
    return NextResponse.json({ error: 'Unable to load patient records.' }, { status: 500 });
  }
}
