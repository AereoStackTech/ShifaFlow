export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: 'BOOKED' | 'DOCTOR_ON_LEAVE';
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateConflictFreeSlots(params: {
  startTime: string;
  endTime: string;
  slotDurationMin: number;
  bookedStartTimes: Set<string>;
  isDoctorOnLeave?: boolean;
}): TimeSlot[] {
  const startMin = toMinutes(params.startTime);
  const endMin = toMinutes(params.endTime);
  const duration = Math.max(15, params.slotDurationMin || 30);

  const slots: TimeSlot[] = [];
  for (let current = startMin; current + duration <= endMin; current += duration) {
    const startStr = toHHMM(current);
    const endStr = toHHMM(current + duration);

    if (params.isDoctorOnLeave) {
      slots.push({
        startTime: startStr,
        endTime: endStr,
        available: false,
        reason: 'DOCTOR_ON_LEAVE',
      });
    } else if (params.bookedStartTimes.has(startStr)) {
      slots.push({
        startTime: startStr,
        endTime: endStr,
        available: false,
        reason: 'BOOKED',
      });
    } else {
      slots.push({
        startTime: startStr,
        endTime: endStr,
        available: true,
      });
    }
  }
  return slots;
}

export function addMinutesToTime(startTime: string, minutes: number): string {
  return toHHMM(toMinutes(startTime) + minutes);
}

export function generateReferenceCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SHF-${year}-${rand}`;
}
