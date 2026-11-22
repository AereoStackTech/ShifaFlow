import { count, eq } from 'drizzle-orm';
import { db } from './index.ts';
import {
  appointments,
  clinicWorkspaces,
  doctorProfiles,
  medicalPrescriptions,
  scheduleSlots,
  specialties,
  subscriptions,
  users,
} from './schema.ts';
import { hashPassword } from '../lib/auth-server.ts';

function formatDateOffset(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().slice(0, 10);
}

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = runSeed().catch((err) => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

async function runSeed(): Promise<void> {
  const [{ value: clinicCount }] = await db.select({ value: count() }).from(clinicWorkspaces);
  if (clinicCount > 0) return;

  // 1. Clinic Workspace
  const [clinic] = await db
    .insert(clinicWorkspaces)
    .values({
      slug: 'al-shifa-specialty',
      nameAr: 'عيادة الشفاء التخصصية',
      nameEn: 'Al-Shifa Specialty Clinic',
      cityAr: 'الرياض، المملكة العربية السعودية',
      cityEn: 'Riyadh, Saudi Arabia',
      phone: '+966 11 555 0140',
      currency: 'SAR',
      defaultDurationMin: 30,
      workStart: '09:00',
      workEnd: '17:00',
      workingDays: '0,1,2,3,4,6',
      onboardingCompleted: true,
    })
    .returning();

  // 2. Demo Users across all 4 RBAC roles
  const demoPasswordHash = await hashPassword('ShifaDemo2026!');

  const insertedUsers = await db
    .insert(users)
    .values([
      {
        uid: 'demo_owner_01',
        email: 'owner@shifaflow.demo',
        passwordHash: demoPasswordHash,
        fullNameAr: 'د. طارق المنصور',
        fullNameEn: 'Dr. Tariq Al-Mansour',
        phone: '+966 50 555 0101',
        role: 'CLINIC_OWNER',
        clinicId: clinic.id,
        isDemo: true,
      },
      {
        uid: 'demo_doctor_01',
        email: 'dr.layla@shifaflow.demo',
        passwordHash: demoPasswordHash,
        fullNameAr: 'د. ليلى الحربي',
        fullNameEn: 'Dr. Layla Al-Harbi',
        phone: '+966 50 555 0102',
        role: 'DOCTOR',
        clinicId: clinic.id,
        isDemo: true,
      },
      {
        uid: 'demo_reception_01',
        email: 'reception@shifaflow.demo',
        passwordHash: demoPasswordHash,
        fullNameAr: 'سارة العتيبي',
        fullNameEn: 'Sara Al-Otaibi',
        phone: '+966 50 555 0103',
        role: 'RECEPTIONIST',
        clinicId: clinic.id,
        isDemo: true,
      },
      {
        uid: 'demo_patient_01',
        email: 'patient@shifaflow.demo',
        passwordHash: demoPasswordHash,
        fullNameAr: 'خالد الشمري',
        fullNameEn: 'Khalid Al-Shammari',
        phone: '+966 55 555 0199',
        role: 'PATIENT',
        clinicId: clinic.id,
        isDemo: true,
      },
    ])
    .returning();

  const doctorUser = insertedUsers.find((u) => u.uid === 'demo_doctor_01')!;
  const patientUser = insertedUsers.find((u) => u.uid === 'demo_patient_01')!;

  // 3. Subscription
  await db.insert(subscriptions).values({
    clinicId: clinic.id,
    planTier: 'MULTI_DOCTOR',
    billingCycle: 'ANNUAL',
    status: 'ACTIVE',
    priceAmount: 149,
    currency: 'USD',
    renewDate: formatDateOffset(180),
  });

  // 4. Specialties
  const insertedSpecialties = await db
    .insert(specialties)
    .values([
      {
        clinicId: clinic.id,
        slug: 'cardiology',
        nameAr: 'أمراض القلب والأوعية',
        nameEn: 'Cardiology',
        descriptionAr: 'تقييم صحة القلب، تخطيط القلب الكهربائي، ومتابعة ضغط الدم المزمن.',
        descriptionEn: 'Preventive cardiac screening, ECG diagnostics, and hypertension care.',
        iconName: 'HeartPulse',
        consultationFee: 350,
        durationMin: 30,
      },
      {
        clinicId: clinic.id,
        slug: 'dermatology',
        nameAr: 'الأمراض الجلدية',
        nameEn: 'Dermatology',
        descriptionAr: 'علاج الأمراض الجلدية السريرية، الحساسية المزمنة، والعناية الطبية بالبشرة.',
        descriptionEn: 'Clinical dermatology, chronic allergy management, and skin diagnostics.',
        iconName: 'Sparkles',
        consultationFee: 280,
        durationMin: 30,
      },
      {
        clinicId: clinic.id,
        slug: 'pediatrics',
        nameAr: 'طب الأطفال',
        nameEn: 'Pediatrics',
        descriptionAr: 'متابعة نمو الأطفال، التطعيمات الدورية، والاستشارات الطبية للأسرة.',
        descriptionEn: 'Child growth monitoring, routine immunizations, and pediatric consults.',
        iconName: 'Baby',
        consultationFee: 220,
        durationMin: 30,
      },
      {
        clinicId: clinic.id,
        slug: 'orthopedics',
        nameAr: 'جراحة العظام والمفاصل',
        nameEn: 'Orthopedics',
        descriptionAr: 'تشخيص إصابات المفاصل والعمود الفقري وبرامج التأهيل الحركي.',
        descriptionEn: 'Joint and spine evaluation, sports injuries, and mobility care plans.',
        iconName: 'Bone',
        consultationFee: 320,
        durationMin: 30,
      },
      {
        clinicId: clinic.id,
        slug: 'internal-medicine',
        nameAr: 'الطب الباطني',
        nameEn: 'Internal Medicine',
        descriptionAr: 'الفحص الشامل، إدارة السكري والغدد، والطب الوقائي للبالغين.',
        descriptionEn: 'Comprehensive adult checkups, metabolic care, and preventive medicine.',
        iconName: 'Stethoscope',
        consultationFee: 240,
        durationMin: 30,
      },
      {
        clinicId: clinic.id,
        slug: 'dental',
        nameAr: 'طب وجراحة الأسنان',
        nameEn: 'Dental Care',
        descriptionAr: 'طب الأسنان التحفظي، التقويم الرقمي، والعناية الوقائية باللثة.',
        descriptionEn: 'Restorative dentistry, digital orthodontics, and periodontal care.',
        iconName: 'Smile',
        consultationFee: 260,
        durationMin: 30,
      },
    ])
    .returning();

  const specBySlug = Object.fromEntries(insertedSpecialties.map((s) => [s.slug, s]));

  // 5. Doctors
  const insertedDoctors = await db
    .insert(doctorProfiles)
    .values([
      {
        clinicId: clinic.id,
        userId: doctorUser.id,
        specialtyId: specBySlug['cardiology'].id,
        nameAr: 'د. ليلى الحربي',
        nameEn: 'Dr. Layla Al-Harbi',
        titleAr: 'استشارية أمراض القلب والطب الوقائي',
        titleEn: 'Consultant Cardiologist',
        bioAr: 'خبرة ١٤ عاماً في تشخيص أمراض القلب الوقائية ومتابعة مرضى ارتفاع ضغط الدم.',
        bioEn: '14 years of clinical experience in preventive cardiology and hypertension management.',
        roomNumber: 'Suite 101',
        consultationFee: 350,
        yearsExperience: 14,
        languages: 'AR, EN',
        status: 'ACTIVE',
        rating: '4.9',
      },
      {
        clinicId: clinic.id,
        specialtyId: specBySlug['dermatology'].id,
        nameAr: 'د. عمر الدوسري',
        nameEn: 'Dr. Omar Al-Dosari',
        titleAr: 'استشاري الأمراض الجلدية السريرية',
        titleEn: 'Consultant Dermatologist',
        bioAr: 'متخصص في تشخيص الأكزيما والصدفية والأمراض الجلدية المزمنة بأحدث البروتوكولات.',
        bioEn: 'Specialist in clinical dermatology, chronic eczema, and diagnostic skin protocols.',
        roomNumber: 'Suite 104',
        consultationFee: 280,
        yearsExperience: 11,
        languages: 'AR, EN',
        status: 'ACTIVE',
        rating: '4.8',
      },
      {
        clinicId: clinic.id,
        specialtyId: specBySlug['pediatrics'].id,
        nameAr: 'د. نورة القحطاني',
        nameEn: 'Dr. Noura Al-Qahtani',
        titleAr: 'أخصائية أولى طب الأطفال وحديثي الولادة',
        titleEn: 'Senior Pediatric Specialist',
        bioAr: 'متابعة شاملة لصحة الرضع والأطفال وتغذيتهم وبرنامج التطعيمات الوقائية.',
        bioEn: 'Dedicated infant and child wellness, developmental tracking, and pediatric nutrition.',
        roomNumber: 'Suite 108',
        consultationFee: 220,
        yearsExperience: 9,
        languages: 'AR, EN',
        status: 'ACTIVE',
        rating: '4.9',
      },
      {
        clinicId: clinic.id,
        specialtyId: specBySlug['orthopedics'].id,
        nameAr: 'د. فيصل الغامدي',
        nameEn: 'Dr. Faisal Al-Ghamdi',
        titleAr: 'استشاري جراحة العظام وإصابات الملاعب',
        titleEn: 'Orthopedic & Sports Medicine Consultant',
        bioAr: 'تقييم وعلاج إصابات الركبة والكتف وآلام العمود الفقري غير الجراحية.',
        bioEn: 'Non-surgical and surgical evaluation for knee, shoulder, and spine conditions.',
        roomNumber: 'Suite 202',
        consultationFee: 320,
        yearsExperience: 16,
        languages: 'AR, EN',
        status: 'ACTIVE',
        rating: '4.9',
      },
      {
        clinicId: clinic.id,
        specialtyId: specBySlug['internal-medicine'].id,
        nameAr: 'د. ريم الشهري',
        nameEn: 'Dr. Reem Al-Shehri',
        titleAr: 'استشارية الطب الباطني والسكري',
        titleEn: 'Internal Medicine Consultant',
        bioAr: 'إدارة الأمراض المزمنة، اضطرابات الغدة الدرقية، والفحوصات الدورية الشاملة.',
        bioEn: 'Chronic disease management, endocrine care, and executive preventive checkups.',
        roomNumber: 'Suite 205',
        consultationFee: 240,
        yearsExperience: 12,
        languages: 'AR, EN',
        status: 'ACTIVE',
        rating: '4.8',
      },
      {
        clinicId: clinic.id,
        specialtyId: specBySlug['dental'].id,
        nameAr: 'د. مازن الزهراني',
        nameEn: 'Dr. Mazen Al-Zahrani',
        titleAr: 'أخصائي طب الأسنان التحفظي والتركيبات',
        titleEn: 'Restorative Dental Specialist',
        bioAr: 'علاجات الأسنان الرقمية الدقيقة والعناية الوقائية المتقدمة لصحة الفم.',
        bioEn: 'Precision restorative dentistry and digital preventive oral healthcare.',
        roomNumber: 'Suite 210',
        consultationFee: 260,
        yearsExperience: 8,
        languages: 'AR, EN',
        status: 'ON_LEAVE',
        leaveReason: 'Medical Conference (Nov 20–24)',
        rating: '4.7',
      },
    ])
    .returning();

  // 6. Schedule Slots (all 7 days configured for active doctors so testing works on any day of the week)
  const slotRows: Array<{
    doctorId: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDurationMin: number;
    isActive: boolean;
  }> = [];

  for (const doc of insertedDoctors) {
    for (let day = 0; day <= 6; day++) {
      // Friday (5) is shorter afternoon shift or off for some doctors; keep Sun-Thu & Sat active
      const isFriday = day === 5;
      slotRows.push({
        doctorId: doc.id,
        dayOfWeek: day,
        startTime: isFriday ? '14:00' : '09:00',
        endTime: isFriday ? '18:00' : '16:30',
        slotDurationMin: 30,
        isActive: !isFriday || doc.id === insertedDoctors[0].id || doc.id === insertedDoctors[4].id,
      });
    }
  }
  await db.insert(scheduleSlots).values(slotRows);

  // 7. Seeded Appointments (past 5 days, today, next 3 days)
  const today = formatDateOffset(0);
  const tomorrow = formatDateOffset(1);
  const dayAfter = formatDateOffset(2);

  const apptSeedData = [
    // Today's appointments (populates live KPIs + slot locking on today!)
    {
      referenceCode: 'SHF-2026-1001',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[0].specialtyId,
      doctorId: insertedDoctors[0].id,
      patientUserId: patientUser.id,
      patientName: 'خالد الشمري / Khalid Al-Shammari',
      patientPhone: '+966 55 555 0199',
      patientEmail: 'patient@shifaflow.demo',
      patientNotes: 'متابعة ضغط الدم الدورية / Routine blood pressure follow-up',
      appointmentDate: today,
      startTime: '09:30',
      endTime: '10:00',
      status: 'CHECKED_IN',
      feeAmount: 350,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-1002',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[0].specialtyId,
      doctorId: insertedDoctors[0].id,
      patientName: 'منيرة السبيعي / Munira Al-Subaie',
      patientPhone: '+966 54 555 0211',
      patientEmail: 'munira.s@example.test',
      patientNotes: 'فحص تخطيط القلب / Routine ECG check',
      appointmentDate: today,
      startTime: '10:30',
      endTime: '11:00',
      status: 'IN_CONSULTATION',
      feeAmount: 350,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-1003',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[1].specialtyId,
      doctorId: insertedDoctors[1].id,
      patientName: 'عبدالله السالم / Abdullah Al-Salem',
      patientPhone: '+966 50 555 0344',
      patientEmail: 'abdullah@example.test',
      patientNotes: 'استشارة حساسية جلدية موسمية / Seasonal skin allergy',
      appointmentDate: today,
      startTime: '11:00',
      endTime: '11:30',
      status: 'CHECKED_IN',
      feeAmount: 280,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-1004',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[2].specialtyId,
      doctorId: insertedDoctors[2].id,
      patientName: 'لينا الحازمي / Lina Al-Hazmi',
      patientPhone: '+966 56 555 0412',
      patientEmail: 'lina.h@example.test',
      patientNotes: 'فحص دوري للأطفال / Pediatric wellness check',
      appointmentDate: today,
      startTime: '11:30',
      endTime: '12:00',
      status: 'CONFIRMED',
      feeAmount: 220,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-1005',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[3].specialtyId,
      doctorId: insertedDoctors[3].id,
      patientName: 'سلمان الدخيل / Salman Al-Dakhil',
      patientPhone: '+966 53 555 0521',
      patientEmail: 'salman@example.test',
      patientNotes: 'ألم في الركبة اليمنى / Right knee evaluation',
      appointmentDate: today,
      startTime: '13:00',
      endTime: '13:30',
      status: 'COMPLETED',
      feeAmount: 320,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-1006',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[4].specialtyId,
      doctorId: insertedDoctors[4].id,
      patientName: 'هند المالكي / Hind Al-Malki',
      patientPhone: '+966 59 555 0610',
      patientEmail: 'hind@example.test',
      patientNotes: 'مراجعة تحاليل الغدة الدرقية / Thyroid lab review',
      appointmentDate: today,
      startTime: '14:00',
      endTime: '14:30',
      status: 'CONFIRMED',
      feeAmount: 240,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-1007',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[1].specialtyId,
      doctorId: insertedDoctors[1].id,
      patientName: 'يوسف الراشد / Yousef Al-Rashid',
      patientPhone: '+966 55 555 0712',
      patientEmail: 'yousef@example.test',
      patientNotes: 'متابعة علاج البشرة / Skin follow-up',
      appointmentDate: today,
      startTime: '14:30',
      endTime: '15:00',
      status: 'COMPLETED',
      feeAmount: 280,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-1008',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[0].specialtyId,
      doctorId: insertedDoctors[0].id,
      patientName: 'أمل العجلان / Amal Al-Ajlan',
      patientPhone: '+966 50 555 0823',
      patientEmail: 'amal@example.test',
      patientNotes: 'استشارة أولية / Initial cardiology consult',
      appointmentDate: today,
      startTime: '15:00',
      endTime: '15:30',
      status: 'CANCELLED',
      feeAmount: 350,
      currency: 'SAR',
    },
    // Upcoming appointments for Demo Patient (can reschedule in /patient)
    {
      referenceCode: 'SHF-2026-1009',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[4].specialtyId,
      doctorId: insertedDoctors[4].id,
      patientUserId: patientUser.id,
      patientName: 'خالد الشمري / Khalid Al-Shammari',
      patientPhone: '+966 55 555 0199',
      patientEmail: 'patient@shifaflow.demo',
      patientNotes: 'فحص باطني شامل سنوي / Annual internal medicine checkup',
      appointmentDate: tomorrow,
      startTime: '10:00',
      endTime: '10:30',
      status: 'CONFIRMED',
      feeAmount: 240,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-1010',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[3].specialtyId,
      doctorId: insertedDoctors[3].id,
      patientUserId: patientUser.id,
      patientName: 'خالد الشمري / Khalid Al-Shammari',
      patientPhone: '+966 55 555 0199',
      patientEmail: 'patient@shifaflow.demo',
      patientNotes: 'تقييم آلام أسفل الظهر / Lower back assessment',
      appointmentDate: dayAfter,
      startTime: '11:30',
      endTime: '12:00',
      status: 'CONFIRMED',
      feeAmount: 320,
      currency: 'SAR',
    },
    // Past completed appointments (for 7-day charts & patient prescriptions)
    {
      referenceCode: 'SHF-2026-0988',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[0].specialtyId,
      doctorId: insertedDoctors[0].id,
      patientUserId: patientUser.id,
      patientName: 'خالد الشمري / Khalid Al-Shammari',
      patientPhone: '+966 55 555 0199',
      patientEmail: 'patient@shifaflow.demo',
      patientNotes: 'تقييم أولي لضغط الدم / Initial hypertension evaluation',
      appointmentDate: formatDateOffset(-5),
      startTime: '10:00',
      endTime: '10:30',
      status: 'COMPLETED',
      feeAmount: 350,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-0991',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[4].specialtyId,
      doctorId: insertedDoctors[4].id,
      patientUserId: patientUser.id,
      patientName: 'خالد الشمري / Khalid Al-Shammari',
      patientPhone: '+966 55 555 0199',
      patientEmail: 'patient@shifaflow.demo',
      patientNotes: 'نقص فيتامين د ومراجعة الفحوصات / Vitamin D lab follow-up',
      appointmentDate: formatDateOffset(-3),
      startTime: '11:00',
      endTime: '11:30',
      status: 'COMPLETED',
      feeAmount: 240,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-0994',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[1].specialtyId,
      doctorId: insertedDoctors[1].id,
      patientUserId: patientUser.id,
      patientName: 'خالد الشمري / Khalid Al-Shammari',
      patientPhone: '+966 55 555 0199',
      patientEmail: 'patient@shifaflow.demo',
      patientNotes: 'جفاف موسمي بالبشرة / Seasonal skin dryness',
      appointmentDate: formatDateOffset(-1),
      startTime: '13:30',
      endTime: '14:00',
      status: 'COMPLETED',
      feeAmount: 280,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-0995',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[2].specialtyId,
      doctorId: insertedDoctors[2].id,
      patientName: 'راكان الجهني / Rakan Al-Juhani',
      patientPhone: '+966 54 555 0901',
      appointmentDate: formatDateOffset(-4),
      startTime: '09:30',
      endTime: '10:00',
      status: 'COMPLETED',
      feeAmount: 220,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-0996',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[3].specialtyId,
      doctorId: insertedDoctors[3].id,
      patientName: 'نواف البقمي / Nawaf Al-Buqami',
      patientPhone: '+966 55 555 0912',
      appointmentDate: formatDateOffset(-2),
      startTime: '15:00',
      endTime: '15:30',
      status: 'COMPLETED',
      feeAmount: 320,
      currency: 'SAR',
    },
    {
      referenceCode: 'SHF-2026-0997',
      clinicId: clinic.id,
      specialtyId: insertedDoctors[0].specialtyId,
      doctorId: insertedDoctors[0].id,
      patientName: 'سلمى الحيدر / Salma Al-Haidar',
      patientPhone: '+966 56 555 0945',
      appointmentDate: formatDateOffset(-1),
      startTime: '10:30',
      endTime: '11:00',
      status: 'COMPLETED',
      feeAmount: 350,
      currency: 'SAR',
    },
  ];

  const insertedAppointments = await db
    .insert(appointments)
    .values(apptSeedData)
    .returning();

  const completedCardio = insertedAppointments.find((a) => a.referenceCode === 'SHF-2026-0988')!;
  const completedInternal = insertedAppointments.find((a) => a.referenceCode === 'SHF-2026-0991')!;
  const completedDerm = insertedAppointments.find((a) => a.referenceCode === 'SHF-2026-0994')!;

  // 8. Medical Prescriptions (fictional demo prescriptions for PDF download)
  await db.insert(medicalPrescriptions).values([
    {
      prescriptionCode: 'RX-2026-4081',
      appointmentId: completedCardio.id,
      doctorId: insertedDoctors[0].id,
      patientUserId: patientUser.id,
      patientName: 'خالد الشمري / Khalid Al-Shammari',
      diagnosisAr: 'ارتفاع طفيف في ضغط الدم الأساسي — متابعة وقائية',
      diagnosisEn: 'Mild Essential Hypertension — Preventive Monitoring',
      medicationsJson: JSON.stringify([
        {
          name: 'Amlodipine 5mg (Fictional Demo Rx)',
          dosage: '5 mg',
          frequencyAr: 'قرص واحد صباحاً يومياً',
          frequencyEn: '1 tablet once daily in the morning',
          durationAr: '٣٠ يوماً',
          durationEn: '30 days',
          instructionsAr: 'يؤخذ مع كوب ماء مع تسجيل قراءات الضغط المنزلية.',
          instructionsEn: 'Take with water and log home blood pressure readings.',
        },
        {
          name: 'Omega-3 Support 1000mg',
          dosage: '1000 mg',
          frequencyAr: 'كبسولة واحدة بعد الغداء',
          frequencyEn: '1 softgel after lunch',
          durationAr: '٦٠ يوماً',
          durationEn: '60 days',
          instructionsAr: 'تقليل الصوديوم والمشي ٣٠ دقيقة يومياً.',
          instructionsEn: 'Reduce dietary sodium and walk 30 minutes daily.',
        },
      ]),
      notesAr: 'مراجعة العيادة بعد ٤ أسابيع مع سجل قياس الضغط. (وصفة تجريبية وهمية للعرض فقط)',
      notesEn: 'Follow up in 4 weeks with blood pressure log. (Fictional demonstration prescription)',
      issuedDate: formatDateOffset(-5),
    },
    {
      prescriptionCode: 'RX-2026-4119',
      appointmentId: completedInternal.id,
      doctorId: insertedDoctors[4].id,
      patientUserId: patientUser.id,
      patientName: 'خالد الشمري / Khalid Al-Shammari',
      diagnosisAr: 'نقص فيتامين د المعتدل',
      diagnosisEn: 'Moderate Vitamin D Insufficiency',
      medicationsJson: JSON.stringify([
        {
          name: 'Cholecalciferol (Vitamin D3) 50,000 IU',
          dosage: '50,000 IU',
          frequencyAr: 'كبسولة واحدة أسبوعياً بعد وجبة رئيسية',
          frequencyEn: '1 capsule weekly after a main meal',
          durationAr: '٨ أسابيع',
          durationEn: '8 weeks',
          instructionsAr: 'إعادة فحص مستوى فيتامين د بعد شهرين.',
          instructionsEn: 'Repeat serum Vitamin D test after 8 weeks.',
        },
      ]),
      notesAr: 'يوصى بالتعرض المعتدل لأشعة الشمس الصباحية. (بيانات افتراضية)',
      notesEn: 'Moderate morning sunlight exposure recommended. (Fictional demo record)',
      issuedDate: formatDateOffset(-3),
    },
    {
      prescriptionCode: 'RX-2026-4152',
      appointmentId: completedDerm.id,
      doctorId: insertedDoctors[1].id,
      patientUserId: patientUser.id,
      patientName: 'خالد الشمري / Khalid Al-Shammari',
      diagnosisAr: 'التهاب وجفاف جلدي موسمي خفيف',
      diagnosisEn: 'Mild Seasonal Xerosis & Contact Irritation',
      medicationsJson: JSON.stringify([
        {
          name: 'Ceramide Barrier Repair Cream',
          dosage: 'Topical',
          frequencyAr: 'مرتان يومياً على المنطقة المصابة',
          frequencyEn: 'Apply twice daily to affected areas',
          durationAr: '١٤ يوماً',
          durationEn: '14 days',
          instructionsAr: 'تجنب الصابون المعطر واستخدام غسول لطيف.',
          instructionsEn: 'Avoid fragranced cleansers and use lukewarm water.',
        },
      ]),
      notesAr: 'المراجعة عند اللزوم إذا استمر الاحمرار. (بيانات افتراضية للعرض)',
      notesEn: 'Return if irritation persists beyond two weeks. (Fictional demo data)',
      issuedDate: formatDateOffset(-1),
    },
  ]);

  // Confirm primary clinic exists
  await db.select().from(clinicWorkspaces).where(eq(clinicWorkspaces.id, clinic.id)).limit(1);
}
