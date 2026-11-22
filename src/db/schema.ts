import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const clinicWorkspaces = pgTable('clinic_workspaces', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  cityAr: text('city_ar').notNull(),
  cityEn: text('city_en').notNull(),
  phone: text('phone').notNull(),
  currency: text('currency').notNull().default('SAR'),
  defaultDurationMin: integer('default_duration_min').notNull().default(30),
  workStart: text('work_start').notNull().default('09:00'),
  workEnd: text('work_end').notNull().default('17:00'),
  workingDays: text('working_days').notNull().default('0,1,2,3,4'),
  onboardingCompleted: boolean('onboarding_completed').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  fullNameAr: text('full_name_ar').notNull(),
  fullNameEn: text('full_name_en').notNull(),
  phone: text('phone'),
  role: text('role').notNull().default('PATIENT'), // CLINIC_OWNER | DOCTOR | RECEPTIONIST | PATIENT
  clinicId: integer('clinic_id').references(() => clinicWorkspaces.id),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const specialties = pgTable('specialties', {
  id: serial('id').primaryKey(),
  clinicId: integer('clinic_id')
    .references(() => clinicWorkspaces.id)
    .notNull(),
  slug: text('slug').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  descriptionAr: text('description_ar').notNull(),
  descriptionEn: text('description_en').notNull(),
  iconName: text('icon_name').notNull().default('Stethoscope'),
  consultationFee: integer('consultation_fee').notNull().default(250),
  durationMin: integer('duration_min').notNull().default(30),
});

export const doctorProfiles = pgTable('doctor_profiles', {
  id: serial('id').primaryKey(),
  clinicId: integer('clinic_id')
    .references(() => clinicWorkspaces.id)
    .notNull(),
  userId: integer('user_id').references(() => users.id),
  specialtyId: integer('specialty_id')
    .references(() => specialties.id)
    .notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en').notNull(),
  bioAr: text('bio_ar').notNull(),
  bioEn: text('bio_en').notNull(),
  roomNumber: text('room_number').notNull().default('Suite 101'),
  consultationFee: integer('consultation_fee').notNull().default(300),
  yearsExperience: integer('years_experience').notNull().default(10),
  languages: text('languages').notNull().default('AR, EN'),
  status: text('status').notNull().default('ACTIVE'), // ACTIVE | ON_LEAVE
  leaveReason: text('leave_reason'),
  rating: text('rating').notNull().default('4.9'),
});

export const scheduleSlots = pgTable('schedule_slots', {
  id: serial('id').primaryKey(),
  doctorId: integer('doctor_id')
    .references(() => doctorProfiles.id)
    .notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0 (Sun) - 6 (Sat)
  startTime: text('start_time').notNull(), // HH:mm
  endTime: text('end_time').notNull(), // HH:mm
  slotDurationMin: integer('slot_duration_min').notNull().default(30),
  isActive: boolean('is_active').notNull().default(true),
});

export const appointments = pgTable('appointments', {
  id: serial('id').primaryKey(),
  referenceCode: text('reference_code').notNull().unique(),
  clinicId: integer('clinic_id')
    .references(() => clinicWorkspaces.id)
    .notNull(),
  specialtyId: integer('specialty_id')
    .references(() => specialties.id)
    .notNull(),
  doctorId: integer('doctor_id')
    .references(() => doctorProfiles.id)
    .notNull(),
  patientUserId: integer('patient_user_id').references(() => users.id),
  patientName: text('patient_name').notNull(),
  patientPhone: text('patient_phone').notNull(),
  patientEmail: text('patient_email'),
  patientNotes: text('patient_notes'),
  appointmentDate: text('appointment_date').notNull(), // YYYY-MM-DD
  startTime: text('start_time').notNull(), // HH:mm
  endTime: text('end_time').notNull(), // HH:mm
  status: text('status').notNull().default('CONFIRMED'), // CONFIRMED | CHECKED_IN | IN_CONSULTATION | COMPLETED | CANCELLED | NO_SHOW
  feeAmount: integer('fee_amount').notNull().default(250),
  currency: text('currency').notNull().default('SAR'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const medicalPrescriptions = pgTable('medical_prescriptions', {
  id: serial('id').primaryKey(),
  prescriptionCode: text('prescription_code').notNull().unique(),
  appointmentId: integer('appointment_id')
    .references(() => appointments.id)
    .notNull(),
  doctorId: integer('doctor_id')
    .references(() => doctorProfiles.id)
    .notNull(),
  patientUserId: integer('patient_user_id').references(() => users.id),
  patientName: text('patient_name').notNull(),
  diagnosisAr: text('diagnosis_ar').notNull(),
  diagnosisEn: text('diagnosis_en').notNull(),
  medicationsJson: text('medications_json').notNull(),
  notesAr: text('notes_ar'),
  notesEn: text('notes_en'),
  issuedDate: text('issued_date').notNull(), // YYYY-MM-DD
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  clinicId: integer('clinic_id')
    .references(() => clinicWorkspaces.id)
    .notNull(),
  planTier: text('plan_tier').notNull().default('MULTI_DOCTOR'), // SOLO_CLINIC | MULTI_DOCTOR | HOSPITAL_ENTERPRISE
  billingCycle: text('billing_cycle').notNull().default('ANNUAL'), // MONTHLY | ANNUAL
  status: text('status').notNull().default('ACTIVE'), // ACTIVE | TRIALING | PAST_DUE
  priceAmount: integer('price_amount').notNull().default(149),
  currency: text('currency').notNull().default('USD'),
  renewDate: text('renew_date').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const clinicWorkspacesRelations = relations(clinicWorkspaces, ({ many }) => ({
  users: many(users),
  specialties: many(specialties),
  doctors: many(doctorProfiles),
  appointments: many(appointments),
  subscriptions: many(subscriptions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  clinic: one(clinicWorkspaces, {
    fields: [users.clinicId],
    references: [clinicWorkspaces.id],
  }),
  appointments: many(appointments),
  prescriptions: many(medicalPrescriptions),
}));

export const specialtiesRelations = relations(specialties, ({ one, many }) => ({
  clinic: one(clinicWorkspaces, {
    fields: [specialties.clinicId],
    references: [clinicWorkspaces.id],
  }),
  doctors: many(doctorProfiles),
  appointments: many(appointments),
}));

export const doctorProfilesRelations = relations(doctorProfiles, ({ one, many }) => ({
  clinic: one(clinicWorkspaces, {
    fields: [doctorProfiles.clinicId],
    references: [clinicWorkspaces.id],
  }),
  user: one(users, {
    fields: [doctorProfiles.userId],
    references: [users.id],
  }),
  specialty: one(specialties, {
    fields: [doctorProfiles.specialtyId],
    references: [specialties.id],
  }),
  scheduleSlots: many(scheduleSlots),
  appointments: many(appointments),
  prescriptions: many(medicalPrescriptions),
}));

export const scheduleSlotsRelations = relations(scheduleSlots, ({ one }) => ({
  doctor: one(doctorProfiles, {
    fields: [scheduleSlots.doctorId],
    references: [doctorProfiles.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  clinic: one(clinicWorkspaces, {
    fields: [appointments.clinicId],
    references: [clinicWorkspaces.id],
  }),
  specialty: one(specialties, {
    fields: [appointments.specialtyId],
    references: [specialties.id],
  }),
  doctor: one(doctorProfiles, {
    fields: [appointments.doctorId],
    references: [doctorProfiles.id],
  }),
  patient: one(users, {
    fields: [appointments.patientUserId],
    references: [users.id],
  }),
  prescriptions: many(medicalPrescriptions),
}));

export const medicalPrescriptionsRelations = relations(medicalPrescriptions, ({ one }) => ({
  appointment: one(appointments, {
    fields: [medicalPrescriptions.appointmentId],
    references: [appointments.id],
  }),
  doctor: one(doctorProfiles, {
    fields: [medicalPrescriptions.doctorId],
    references: [doctorProfiles.id],
  }),
  patient: one(users, {
    fields: [medicalPrescriptions.patientUserId],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  clinic: one(clinicWorkspaces, {
    fields: [subscriptions.clinicId],
    references: [clinicWorkspaces.id],
  }),
}));
