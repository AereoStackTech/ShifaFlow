'use client';

import React from 'react';
import { LegalPolicyLayout } from '@/src/components/LegalPolicyLayout';

export default function PrivacyPage() {
  return (
    <LegalPolicyLayout
      titleAr="سياسة الخصوصية وحماية البيانات"
      titleEn="Privacy Policy & Data Protection"
      updatedDate="2026-11-01"
      sections={[
        {
          headingAr: 'نطاق البيانات التجريبية',
          headingEn: 'Scope of Demonstration Data',
          bodyAr:
            'منصة شفاء فلو هي تطبيق عرض مستقل. يُنصح بعدم إدخال معلومات صحية حقيقية أو أرقام هوية وطنية أثناء اختبار نماذج الحجز أو الحسابات التجريبية.',
          bodyEn:
            'ShifaFlow operates as an independent portfolio demonstration platform. Visitors should avoid submitting real personal health information or sensitive medical identifiers during testing.',
        },
        {
          headingAr: 'المعلومات المخزنة في قاعدة البيانات',
          headingEn: 'Information Stored in PostgreSQL',
          bodyAr:
            'عند إنشاء حساب أو حجز موعد تجريبي، تُحفظ بيانات الموعد (الاسم، رقم الهاتف، الطبيب المختار، الوقت) في قاعدة بيانات PostgreSQL لعرض وظائف قفل المواعيد ولوحة العيادة وبوابة المريض.',
          bodyEn:
            'When you create a test account or book a demonstration appointment, booking metadata (name, phone, selected clinician, and time slot) is persisted in PostgreSQL to demonstrate conflict-free slot locking and role-based portals.',
        },
        {
          headingAr: 'المصادقة وأمن الجلسات',
          headingEn: 'Authentication & Session Security',
          bodyAr:
            'تُشفّر كلمات المرور على الخادم باستخدام خوارزمية bcrypt، وتتحقق نقاط النهاية المحمية من رموز الجلسة الموقّعة أو رموز Firebase ID Tokens مع فصل تام للصلاحيات حسب الدور الوظيفي.',
          bodyEn:
            'Passwords are hashed server-side using bcrypt, and protected API routes verify signed session tokens or Firebase ID Tokens with strict role-based access enforcement.',
        },
      ]}
    />
  );
}
