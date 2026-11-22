'use client';

import React from 'react';
import { LegalPolicyLayout } from '@/src/components/LegalPolicyLayout';

export default function RefundPage() {
  return (
    <LegalPolicyLayout
      titleAr="سياسة الاسترداد والاشتراكات"
      titleEn="Subscription & Refund Policy"
      updatedDate="2026-11-01"
      sections={[
        {
          headingAr: 'الاشتراكات الافتراضية دون معالجة مالية',
          headingEn: 'Simulated Subscriptions Without Live Billing',
          bodyAr:
            'جميع باقات الاشتراك المعروضة في صفحة التسعير (عيادة فردية، مركز متعدد الأطباء، مؤسسة طبية) هي باقات توضيحية لا تتضمن تحصيل بطاقات ائتمان أو عمليات دفع فعلية.',
          bodyEn:
            'All clinic subscription tiers displayed on the Pricing page (Solo Clinic, Multi-Doctor Center, Hospital Enterprise) are illustrative portfolio tiers with simulated plan activation and no live card processing.',
        },
        {
          headingAr: 'سياسة الإلغاء النموذجية لمنصات العيادات',
          headingEn: 'Illustrative SaaS Cancellation Policy',
          bodyAr:
            'في بيئة التشغيل التجارية النموذجية، تتيح الباقات الشهرية الإلغاء قبل موعد التجديد دون رسوم إضافية، وتُمنح فترة استرداد لمدة ١٤ يوماً للباقات السنوية مع إمكانية تصدير بيانات المواعيد بصيغة CSV في أي وقت.',
          bodyEn:
            'In a standard commercial rollout, monthly clinic plans cancel before the next cycle without penalty, annual plans carry a 14-day review window, and clinic owners retain full CSV export access.',
        },
      ]}
    />
  );
}
