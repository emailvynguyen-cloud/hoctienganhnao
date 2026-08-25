import { Class, Session } from '../types';
import { StorageEngine } from './storage';

export interface TeacherPenaltyItem {
  id: string; // e.g. `penalty_${classId}_${dateISO}`
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  dateISO: string; // YYYY-MM-DD
  scheduleTimeStr: string;
  dueDeadlineStr: string; // e.g. "21/08/2026 20:30"
  recordedTimeStr?: string; // e.g. "23/08/2026 09:00" or "Chưa nhập"
  overdueDays: number;
  penaltyAmount: number;
  status: 'ongoing' | 'completed' | 'waived'; // 🔴 Đang phát sinh | 🟢 Đã hoàn tất | ⚪ Đã miễn
  isRecorded: boolean;
  sessionId?: string;
}

export interface TeacherRevenueSummary {
  teacherId: string;
  teacherName: string;
  totalSessionsCount: number; // 📚 Tổng số buổi
  grossRevenue: number; // 💰 Tổng doanh thu
  totalPenalty: number; // ⚠️ Tiền phạt
  netRevenue: number; // 💵 Thực nhận = grossRevenue - totalPenalty
  penalties: TeacherPenaltyItem[]; // ⚠️ Chi tiết tiền phạt
}

export function normalizeDateStr(dStr?: string): string {
  if (!dStr) return '';
  const clean = dStr.split('T')[0].trim();
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    } else if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return clean;
}

function parseScheduleTime(scheduleStr: string = '') {
  const rangeMatch = scheduleStr.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
  const startTimeStr = rangeMatch ? rangeMatch[1].padStart(5, '0') : '18:00';
  const endTimeStr = rangeMatch ? rangeMatch[2].padStart(5, '0') : '19:30';
  return { startTimeStr, endTimeStr };
}

function formatDisplayDate(dateISO: string): string {
  if (!dateISO) return '';
  const parts = dateISO.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateISO;
}

export function calculateTeacherPenaltiesAndRevenue(
  teacherIdOrName: string,
  classes: Class[],
  sessions: Session[],
  startDateISO?: string,
  endDateISO?: string
): TeacherRevenueSummary {
  const waivedKeys = new Set(StorageEngine.getWaivedPenaltyKeys() || []);
  const dismissedTaskIds = new Set(StorageEngine.getDismissedPendingTaskIds() || []);
  const now = new Date();

  // 1. Filter classes assigned to teacher
  const teacherClasses = (classes || []).filter((cls) => {
    if (!cls || cls.status === 'archived') return false;
    const nameLower = (cls.teacherName || '').toLowerCase();
    const targetLower = teacherIdOrName.toLowerCase();
    return (
      cls.teacherId === teacherIdOrName ||
      nameLower.includes(targetLower) ||
      (cls.coTeacherIds && cls.coTeacherIds.includes(teacherIdOrName))
    );
  });

  const teacherClassIds = new Set(teacherClasses.map((c) => c.id));
  const classMap = new Map<string, Class>(teacherClasses.map((c) => [c.id, c]));

  // 2. Filter completed/recorded sessions in date range
  const monthTeacherSessions = (sessions || []).filter((s) => {
    if (!s || !s.date || !teacherClassIds.has(s.classId)) return false;
    if (s.isExcusedAbsenceSession) return false; // Excused absence sessions do not count towards teacher pay
    if (startDateISO && s.date < startDateISO) return false;
    if (endDateISO && s.date > endDateISO) return false;
    return true;
  });

  // Gross Revenue calculation from recorded billable sessions
  let grossRevenue = 0;
  monthTeacherSessions.forEach((ses) => {
    const cls = classMap.get(ses.classId);
    const rate = typeof cls?.teacherPayRatePerSession === 'number' ? cls.teacherPayRatePerSession : 150000;
    grossRevenue += rate;
  });

  // 3. Penalty Calculation
  const penalties: TeacherPenaltyItem[] = [];

  const dayPatterns = [
    { idx: 1, pattern: /T2|THỨ 2|THỨ HAI/i },
    { idx: 2, pattern: /T3|THỨ 3|THỨ BA/i },
    { idx: 3, pattern: /T4|THỨ 4|THỨ TƯ/i },
    { idx: 4, pattern: /T5|THỨ 5|THỨ NĂM/i },
    { idx: 5, pattern: /T6|THỨ 6|THỨ SÁU/i },
    { idx: 6, pattern: /T7|THỨ 7|THỨ BẢY/i },
    { idx: 0, pattern: /CN|CHỦ NHẬT/i },
  ];

  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  teacherClasses.forEach((cls) => {
    const scheduleStr = cls.schedule || '';
    const { startTimeStr, endTimeStr } = parseScheduleTime(scheduleStr);
    let minAllowedDate = cls.scheduleEffectiveFrom || cls.startDate || (cls.createdAt ? cls.createdAt.split('T')[0] : '');

    // Fallback for legacy classes without effective dates
    if (!minAllowedDate) {
      const classSessions = (sessions || []).filter((s) => s && s.classId === cls.id && s.date);
      if (classSessions.length > 0) {
        const sortedDates = classSessions.map((s) => s.date).sort();
        minAllowedDate = sortedDates[0];
      } else {
        minAllowedDate = todayISO;
      }
    }

    // Loop through past 60 days
    for (let i = 0; i <= 60; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      if (minAllowedDate && iso < minAllowedDate) continue;
      if (startDateISO && iso < startDateISO) continue;
      if (endDateISO && iso > endDateISO) continue;

      const dayIdx = d.getDay();
      const matchPattern = dayPatterns.find((p) => p.idx === dayIdx);
      if (!matchPattern || !matchPattern.pattern.test(scheduleStr)) continue;

      // Construct session due deadline (24 hours after session end time)
      const dueDeadline = new Date(`${iso}T${endTimeStr}:00`);
      dueDeadline.setDate(dueDeadline.getDate() + 1); // 24h grace period
      const dueDeadlineStr = `${formatDisplayDate(dueDeadline.toISOString().split('T')[0])} ${endTimeStr}`;

      const targetDateNorm = normalizeDateStr(iso);
      const recordedSession = (sessions || []).find((s) => {
        if (!s || !s.classId || !s.date) return false;
        const isSameClass = String(s.classId) === String(cls.id);
        const isSameDate = normalizeDateStr(s.date) === targetDateNorm;
        return isSameClass && isSameDate;
      });

      const penaltyKey = `penalty_${cls.id}_${iso}`;
      const unrecordedTaskId = `unrecorded_${cls.id}_${iso}`;

      if (dismissedTaskIds.has(penaltyKey) || dismissedTaskIds.has(unrecordedTaskId)) {
        continue;
      }

      const isWaived = waivedKeys.has(penaltyKey);

      if (recordedSession) {
        // Session WAS RECORDED by teacher
        if (recordedSession.isExcusedAbsenceSession || recordedSession.isChargedAbsenceSession) continue;

        const recordedDate = new Date(recordedSession.createdAt || `${iso}T${endTimeStr}:00`);
        if (recordedDate > dueDeadline) {
          const diffMs = recordedDate.getTime() - dueDeadline.getTime();
          const overdueDays = Math.max(1, Math.ceil(diffMs / (1000 * 3600 * 24)));
          const basePenalty = overdueDays * 10000;
          const penaltyAmount = isWaived ? 0 : basePenalty;

          const recordedDateFmt = `${formatDisplayDate(recordedDate.toISOString().split('T')[0])} ${String(recordedDate.getHours()).padStart(2, '0')}:${String(recordedDate.getMinutes()).padStart(2, '0')}`;

          penalties.push({
            id: penaltyKey,
            classId: cls.id,
            className: cls.className,
            teacherId: cls.teacherId,
            teacherName: cls.teacherName,
            dateISO: iso,
            scheduleTimeStr: `${startTimeStr} - ${endTimeStr}`,
            dueDeadlineStr,
            recordedTimeStr: recordedDateFmt,
            overdueDays,
            penaltyAmount,
            status: isWaived ? 'waived' : 'completed',
            isRecorded: true,
            sessionId: recordedSession.id,
          });
        }
      } else {
        // Session HAS NOT BEEN RECORDED YET (🟡 Chưa nhập buổi / 🔴 Quá hạn)
        const sessionEnd = new Date(`${iso}T${endTimeStr}:00`);

        // Task appears once session end time has passed
        if (now > sessionEnd) {
          let overdueDays = 0;
          let penaltyAmount = 0;

          if (now > dueDeadline) {
            const diffMs = now.getTime() - dueDeadline.getTime();
            overdueDays = Math.max(1, Math.ceil(diffMs / (1000 * 3600 * 24)));
            const basePenalty = overdueDays * 10000;
            penaltyAmount = isWaived ? 0 : basePenalty;
          }

          penalties.push({
            id: penaltyKey,
            classId: cls.id,
            className: cls.className,
            teacherId: cls.teacherId,
            teacherName: cls.teacherName,
            dateISO: iso,
            scheduleTimeStr: `${startTimeStr} - ${endTimeStr}`,
            dueDeadlineStr,
            recordedTimeStr: 'Chưa nhập',
            overdueDays,
            penaltyAmount,
            status: isWaived ? 'waived' : 'ongoing',
            isRecorded: false,
          });
        }
      }
    }
  });

  // 4. Merge Custom Fine Records created by Admin / Super Admin
  const customFines = StorageEngine.getCustomFines() || [];
  const targetTeacherLower = teacherIdOrName.toLowerCase().trim();
  customFines.forEach((cf) => {
    if (!cf) return;
    const isTeacherMatch =
      cf.teacherId === teacherIdOrName ||
      (cf.teacherName || '').toLowerCase().trim() === targetTeacherLower ||
      targetTeacherLower.includes((cf.teacherName || '').toLowerCase().trim());

    if (!isTeacherMatch) return;
    const fineDate = cf.createdAt ? cf.createdAt.split('T')[0] : todayISO;
    if (startDateISO && fineDate < startDateISO) return;
    if (endDateISO && fineDate > endDateISO) return;

    const isWaived = cf.status === 'waived' || waivedKeys.has(cf.id);

    penalties.push({
      id: cf.id,
      classId: cf.classId || '',
      className: cf.className || 'Phạt Khác / Admin',
      teacherId: cf.teacherId,
      teacherName: cf.teacherName || teacherIdOrName,
      dateISO: fineDate,
      scheduleTimeStr: cf.reason || 'Tiền phạt từ Admin',
      dueDeadlineStr: fineDate,
      recordedTimeStr: cf.reason,
      overdueDays: 0,
      penaltyAmount: isWaived ? 0 : cf.amount,
      status: isWaived ? 'waived' : 'completed',
      isRecorded: true,
    });
  });

  // Calculate total penalties (ONLY active completed fines that are not waived)
  const totalPenalty = penalties
    .filter((p) => p.status === 'completed' && (p.penaltyAmount || 0) > 0)
    .reduce((sum, item) => sum + item.penaltyAmount, 0);
  const netRevenue = Math.max(0, grossRevenue - totalPenalty);

  return {
    teacherId: teacherIdOrName,
    teacherName: teacherClasses[0]?.teacherName || teacherIdOrName,
    totalSessionsCount: monthTeacherSessions.length,
    grossRevenue,
    totalPenalty,
    netRevenue,
    penalties,
  };
}
