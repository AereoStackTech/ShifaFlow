import { NextResponse } from 'next/server';
import { asc } from 'drizzle-orm';
import { db } from '@/src/db/index.ts';
import { clinicWorkspaces, doctorProfiles, specialties } from '@/src/db/schema.ts';
import { ensureSeeded } from '@/src/db/seed.ts';

export async function GET() {
  try {
    await ensureSeeded();

    const [clinic] = await db.select().from(clinicWorkspaces).limit(1);
    const specialtyList = await db
      .select()
      .from(specialties)
      .orderBy(asc(specialties.id));

    const doctorList = await db
      .select()
      .from(doctorProfiles)
      .orderBy(asc(doctorProfiles.id));

    const specMap = new Map(specialtyList.map((s) => [s.id, s]));

    const enrichedDoctors = doctorList.map((doc) => {
      const spec = specMap.get(doc.specialtyId);
      return {
        ...doc,
        specialtySlug: spec?.slug ?? '',
        specialtyNameAr: spec?.nameAr ?? '',
        specialtyNameEn: spec?.nameEn ?? '',
      };
    });

    return NextResponse.json({
      clinic: clinic ?? null,
      specialties: specialtyList,
      doctors: enrichedDoctors,
    });
  } catch (error) {
    console.error('Public catalog query failed:', error);
    return NextResponse.json(
      { error: 'Unable to load clinic directory. Please try again.' },
      { status: 500 }
    );
  }
}
