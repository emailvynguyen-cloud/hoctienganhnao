import { Class, Session, Student, User, getStudentQuizletUrl } from '../types';
import { StorageEngine } from './storage';

export interface PendingTaskItem {
  id: string; // Stable canonical ID: unrecorded_${classId}_${dateISO} OR quizlet_${sessionId}
  type: 'unrecorded_session' | 'missing_quizlet';
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  dateISO: string;
  scheduleTimeStr: string;
  overdueDays: number;
  overdueBadgeText: string;
  priorityColor: 'yellow' | 'orange' | 'red';
  missingStudents?: string[];
  sessionId?: string;
  dueDeadlineStr?: string;
  penaltyAmount?: number;
  isOverdue?: boolean;
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

export function formatSessionDate(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function calculateOverdueInfo(todayISO: string, dateISO: string) {
  const t = new Date(todayISO);
  const d = new Date(dateISO);
  const diffTime = t.getTime() - d.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 3600 * 24)));

  let priorityColor: 'yellow' | 'orange' | 'red' = 'yellow';
  if (diffDays >= 4) {
    priorityColor = 'red';
  } else if (diffDays >= 2) {
    priorityColor = 'orange';
  }

  const overdueBadgeText = diffDays === 0 ? 'Hôm nay' : `Quá hạn ${diffDays} ngày`;

  return {
    overdueDays: diffDays,
    overdueBadgeText,
    priorityColor,
  };
}

export function getScheduleTimeStr(scheduleStr: string = '') {
  const rangeMatch = scheduleStr.match(/(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})/);
  const startTimeStr = rangeMatch ? rangeMatch[1].padStart(5, '0') : '18:00';
  const endTimeStr = rangeMatch ? rangeMatch[2].padStart(5, '0') : '19:30';
  return { startTimeStr, endTimeStr };
}

export function isTodayEndTimePassed(scheduleStr: string = ''): boolean {
  const { endTimeStr } = getScheduleTimeStr(scheduleStr);
  const [endHours, endMinutes] = endTimeStr.split(':').map(Number);
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  if (currentHours > endHours) return true;
  if (currentHours === endHours && currentMinutes >= endMinutes) return true;
  return false;
}

export function getPastScheduledDates(cls: Class, daysBack: number = 45): string[] {
  if (!cls || cls.status === 'paused' || cls.status === 'completed' || cls.status === 'archived') {
    return [];
  }

  const result: string[] = [];
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const dayPatterns: { idx: number; pattern: RegExp }[] = [
    { idx: 1, pattern: /T2|THỨ 2|THỨ HAI/i },
    { idx: 2, pattern: /T3|THỨ 3|THỨ BA/i },
    { idx: 3, pattern: /T4|THỨ 4|THỨ TƯ/i },
    { idx: 4, pattern: /T5|THỨ 5|THỨ NĂM/i },
    { idx: 5, pattern: /T6|THỨ 6|THỨ SÁU/i },
    { idx: 6, pattern: /T7|THỨ 7|THỨ BẢY/i },
    { idx: 0, pattern: /CN|CHỦ NHẬT/i },
  ];

  const rawMinDate = cls.scheduleEffectiveFrom || cls.startDate || (cls.createdAt ? cls.createdAt.split('T')[0] : '');

  let minAllowedDateISO = rawMinDate;
  if (!minAllowedDateISO) {
    const existingSessions = StorageEngine.getSessions().filter((s) => s && s.classId === cls.id && s.date);
    if (existingSessions.length > 0) {
      const sortedDates = existingSessions.map((s) => s.date).sort();
      minAllowedDateISO = sortedDates[0];
    } else {
      minAllowedDateISO = todayISO;
    }
  }

  for (let i = 0; i <= daysBack; i++) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (iso < minAllowedDateISO) {
      if (cls.scheduleHistory && cls.scheduleHistory.length > 0) {
        const matchingPastPeriod = cls.scheduleHistory.find((sp) => {
          if (iso < sp.effectiveFrom) return false;
          if (sp.effectiveUntil && iso > sp.effectiveUntil) return false;
          return true;
        });

        if (matchingPastPeriod) {
          const dayIdx = d.getDay();
          const matchPattern = dayPatterns.find((p) => p.idx === dayIdx);
          if (matchPattern && matchPattern.pattern.test(matchingPastPeriod.schedule)) {
            result.push(iso);
          }
        }
      }
      continue;
    }

    const dayIdx = d.getDay();
    const matchPattern = dayPatterns.find((p) => p.idx === dayIdx);
    if (matchPattern && matchPattern.pattern.test(cls.schedule || '')) {
      result.push(iso);
    }
  }

  return result;
}



/**
 * CANONICAL SINGLE SOURCE OF TRUTH PENDING TASKS ENGINE
 * Computes all active pending tasks for classes, sessions, and students,
 * respecting recorded sessions and dismissed task IDs from shared StorageEngine.
 */
export function calculateGlobalPendingTasks(
  classes: Class[],
  sessions: Session[],
  students: Student[],
  dismissedTaskIds: string[] = []
): PendingTaskItem[] {
  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const tasks: PendingTaskItem[] = [];
  const dismissedSet = new Set(dismissedTaskIds || []);

  // -------------------------------------------------------------------------
  // SOURCE A: UNRECORDED SESSIONS (🔴 CHƯA NHẬP BUỔI HỌC)
  // -------------------------------------------------------------------------
  (classes || []).forEach((cls) => {
    if (!cls || !cls.id || cls.status === 'paused' || cls.status === 'completed' || cls.status === 'archived') {
      return;
    }

    const pastDates = getPastScheduledDates(cls, 45);

    pastDates.forEach((dateISO) => {
      const isToday = dateISO === todayISO;
      const isTimePassed = !isToday || isTodayEndTimePassed(cls.schedule);

      if (isTimePassed) {
        const targetDateNorm = normalizeDateStr(dateISO);
        const recordedSession = (sessions || []).find((s) => {
          if (!s || !s.classId || !s.date) return false;
          const isSameClass = String(s.classId) === String(cls.id);
          const isSameDate = normalizeDateStr(s.date) === targetDateNorm;
          return isSameClass && isSameDate;
        });

        const unrecordedTaskId = `unrecorded_${cls.id}_${dateISO}`;
        const penaltyTaskId = `penalty_${cls.id}_${dateISO}`;

        // Check if task is already recorded OR dismissed in single source of truth
        if (!recordedSession && !dismissedSet.has(unrecordedTaskId) && !dismissedSet.has(penaltyTaskId)) {
          const overdueInfo = calculateOverdueInfo(todayISO, dateISO);
          const { startTimeStr, endTimeStr } = getScheduleTimeStr(cls.schedule);

          tasks.push({
            id: unrecordedTaskId,
            type: 'unrecorded_session',
            classId: cls.id,
            className: cls.className,
            teacherId: cls.teacherId || cls.teacherName || 'u_teacher',
            teacherName: cls.teacherName || 'Giáo viên',
            dateISO,
            scheduleTimeStr: `Lịch cố định (${startTimeStr} - ${endTimeStr}) • Ngày ${formatSessionDate(dateISO)}`,
            ...overdueInfo,
          });
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // SOURCE B: MISSING QUIZLET (🟠 CHƯA THÊM QUIZLET)
  // -------------------------------------------------------------------------
  (sessions || []).forEach((session) => {
    if (!session || !session.classId) return;
    if (session.isExcusedAbsenceSession || session.isChargedAbsenceSession || session.hasNoQuizlet) return;

    const cls = (classes || []).find((c) => String(c.id) === String(session.classId));
    const className = session.className || cls?.className || 'Lớp Học';
    const teacherId = session.teacherId || cls?.teacherId || 'u_teacher';
    const teacherName = session.teacherName || cls?.teacherName || 'Giáo viên';

    const quizletTaskId = `quizlet_${session.id}`;
    if (dismissedSet.has(quizletTaskId)) return;

    const classStudents = (students || []).filter(
      (s) => s && s.classIds && s.classIds.some((cid) => String(cid) === String(session.classId))
    );
    const missingQuizletStudentNames: string[] = [];

    classStudents.forEach((std) => {
      const attRecord = (session.attendance || []).find((a) => String(a.studentId) === String(std.id));
      if (attRecord?.status === 'excused') return;

      const sessionQuizlet = getStudentQuizletUrl(session, std.id);
      const fbObj = session.studentFeedbacks?.[std.id];
      const studentFbUrl = fbObj?.materialUrl;
      const studentFbMaterials = fbObj?.materials || [];

      const hasSessionQuizlet = !!sessionQuizlet && sessionQuizlet.trim().length > 0;
      const hasFbUrlQuizlet = !!studentFbUrl && studentFbUrl.toLowerCase().includes('quizlet');
      const hasFbMaterialsQuizlet = studentFbMaterials.some(
        (m) => (m.url && m.url.toLowerCase().includes('quizlet')) || (m.title && m.title.toLowerCase().includes('quizlet'))
      );
      const hasStudentResourceQuizlet = (std.resourceLinks || []).some(
        (r) => (r.url && r.url.toLowerCase().includes('quizlet')) || (r.title && r.title.toLowerCase().includes('quizlet'))
      );

      const isQuizletCompleted =
        hasSessionQuizlet || hasFbUrlQuizlet || hasFbMaterialsQuizlet || hasStudentResourceQuizlet;

      if (!isQuizletCompleted) {
        missingQuizletStudentNames.push(std.name);
      }
    });

    if (missingQuizletStudentNames.length > 0) {
      const overdueInfo = calculateOverdueInfo(todayISO, session.date);
      tasks.push({
        id: quizletTaskId,
        type: 'missing_quizlet',
        classId: session.classId,
        className,
        teacherId,
        teacherName,
        dateISO: session.date,
        scheduleTimeStr: `Buổi #${session.sessionNumber} • Ngày ${formatSessionDate(session.date)}`,
        missingStudents: missingQuizletStudentNames,
        sessionId: session.id,
        ...overdueInfo,
      });
    }
  });

  tasks.sort((a, b) => {
    if (b.overdueDays !== a.overdueDays) {
      return b.overdueDays - a.overdueDays;
    }
    if (a.type !== b.type) {
      return a.type === 'unrecorded_session' ? -1 : 1;
    }
    return b.dateISO.localeCompare(a.dateISO);
  });

  return tasks;
}
