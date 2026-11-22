'use client';

import React from 'react';
import { LegalPolicyLayout } from '@/src/components/LegalPolicyLayout';

export default function TermsPage() {
  return (
    <LegalPolicyLayout
      titleAr="شروط الاستخدام"
      titleEn="Terms of Service"
      updatedDate="2026-11-01"
      sections={[
        {
          headingAr: 'طبيعة الخدمة (مفهوم عرض مستقل)',
          headingEn: 'Nature of the Platform (Portfolio Concept)',
          bodyAr:
            'شفاء فلو نموذج تفاعلي لمنصة إدارة عيادات سحابية، ولا يقدم استشارات طبية فعلية ولا يرتبط بأي مستشفى أو مركز صحي قائم.',
          bodyEn:
            'ShifaFlow is an interactive SaaS portfolio demonstration and does not provide medical advice, clinical diagnosis, or live hospital appointment booking.',
        },
        {
          headingAr: 'أدوار المستخدمين والصلاحيات',
          headingEn: 'User Roles & Access Controls',
          bodyAr:
            'تُقيّد واجهات لوحة التحكم (إدارة المواعيد وجداول الأطباء) بحسابات فريق العيادة (CLINIC_OWNER، DOCTOR، RECEPTIONIST)، بينما تقتصر بوابة المريض على عرض مواعيده ووصفاته الخاصة فقط.',
          bodyEn:
            'Operational Clinic ERP screens (appointments table and doctor scheduling) are restricted to authorized clinic staff roles, while Patient Portal views strictly scope records to the authenticated patient.',
        },
        {
          headingAr: 'إلغاء وإعادة جدولة المواعيد',
          headingEn: 'Cancellations & Rescheduling',
          bodyAr:
            'يحق للمريض إعادة جدولة مواعيده القادمة أو إلغائها عبر بوابة المريض، وبمجرد الإلغاء يُعاد فتح الفترة الزمنية تلقائياً في جدول الطبيب.',
          bodyEn:
            'Patients may reschedule or cancel upcoming bookings through the Patient Portal. Cancelled intervals automatically reopen in the conflict-free slot engine.',
        },
      ]}
    />
  );
}
