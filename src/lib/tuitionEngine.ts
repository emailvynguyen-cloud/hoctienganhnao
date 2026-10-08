import { Student, Class, Session, Invoice, isBillableStudentSession } from '../types';

export interface StudentReceiptBreakdown {
  receiptId: string;
  receiptCode: string;
  paymentDate: string;
  amount: number;
  sessionsPurchased: number;
  startFromSessionNumber: number;
  endSessionNumber: number;
  sessionsConducted: number;
  sessionsRemaining: number;
  notes?: string;
}

export interface StudentTuitionSummary {
  studentId: string;
  classId?: string;
  totalPaidSessions: number;
  totalBillableSessionsConducted: number;
  remainingSessions: number;
  isOverdue: boolean; // remainingSessions <= 0
  isLowBalance: boolean; // 0 < remainingSessions <= 2
  receiptsCount: number;
  activePackages: StudentReceiptBreakdown[];
}

/**
 * CENTRAL SINGLE SOURCE OF TRUTH TUITION & REMAINING SESSION ENGINE
 * Calculates student's total paid sessions, billable sessions conducted, and exact remaining sessions.
 * Matches tuition receipts chronologically against actual class sessions (Session.sessionNumber).
 * Shared and consumed identically by ALL portals: Super Admin, Admin, Teacher, and Student.
 */
export function calculateStudentTuitionSummary(
  student: Student | null | undefined,
  invoices: Invoice[] = [],
  sessions: Session[] = [],
  classes: Class[] = [],
  targetClassId?: string
): StudentTuitionSummary {
  try {
    if (!student || !student.id) {
      return {
        studentId: '',
        totalPaidSessions: 0,
        totalBillableSessionsConducted: 0,
        remainingSessions: 0,
        isOverdue: false,
        isLowBalance: false,
        receiptsCount: 0,
        activePackages: [],
      };
    }

    // 1. Filter student's valid receipts (paid/completed invoices)
    const studentInvoices = (invoices || []).filter((inv) => {
      if (!inv || !inv.studentId) return false;
      if (inv.studentId !== student.id) return false;
      if (inv.status === 'cancelled') return false;
      return inv.status === 'paid' || !inv.status;
    });

    // 2. Filter & sort actual billable sessions for student's classes (sorted chronologically)
    const studentClassIds = targetClassId ? [targetClassId] : Array.isArray(student.classIds) ? student.classIds : [];

    const studentSessions = (sessions || []).filter((s) => {
      if (!s || !s.classId) return false;
      if (studentClassIds.length > 0 && !studentClassIds.includes(s.classId)) return false;
      return isBillableStudentSession(s, student.id);
    });

    studentSessions.sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (Number(a.sessionNumber) || 0) - (Number(b.sessionNumber) || 0);
    });

    // Baseline starting threshold if no class sessions recorded yet
    let baselineStart = Number(student.startSessionNumber) || 1;
    if (baselineStart === 1 && studentClassIds.length > 0) {
      const cls = classes.find((c) => c && studentClassIds.includes(c.id));
      if (cls?.startSessionNumber && cls.startSessionNumber > 1) {
        baselineStart = cls.startSessionNumber;
      }
    }

    // 3. Only use actual valid receipts (no virtual fallback receipts)
    let effectiveInvoices = [...studentInvoices];

    // 4. Sort receipts strictly chronologically by paymentDate / paidDate / createdDate / code
    effectiveInvoices.sort((a, b) => {
      const dateA = a.paymentDate || a.paidDate || a.createdDate || '';
      const dateB = b.paymentDate || b.paidDate || b.createdDate || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.code || '').localeCompare(b.code || '');
    });

    // 5. Sequential Chronological Matching against actual class sessions
    let currentBillableIdx = 0;
    let runningProjectedStart = baselineStart;

    const activePackages: StudentReceiptBreakdown[] = effectiveInvoices.map((inv) => {
      const purchased = Number(inv.sessionsPurchased) || 0;
      const sliceStart = currentBillableIdx;
      const sliceEnd = currentBillableIdx + purchased;

      const conductedSessions = studentSessions.slice(sliceStart, sliceEnd);
      const sessionsConducted = conductedSessions.length;
      const sessionsRemaining = Math.max(0, purchased - sessionsConducted);

      let startNum = 0;
      let endNum = 0;

      if (conductedSessions.length > 0) {
        startNum = Number(conductedSessions[0].sessionNumber) || 1;
        const lastConductedNum = Number(conductedSessions[conductedSessions.length - 1].sessionNumber) || startNum;
        if (sessionsRemaining === 0) {
          endNum = lastConductedNum;
        } else {
          // Unrecorded sessions in this package projected after the last recorded session
          endNum = lastConductedNum + sessionsRemaining;
        }
        runningProjectedStart = endNum + 1;
      } else {
        // No recorded sessions in this package slice yet
        startNum = runningProjectedStart;
        endNum = startNum + purchased - 1;
        runningProjectedStart = endNum + 1;
      }

      currentBillableIdx += purchased;

      return {
        receiptId: inv.id,
        receiptCode: inv.code,
        paymentDate: inv.paymentDate || inv.paidDate || inv.createdDate || '',
        amount: Number(inv.amount) || 0,
        sessionsPurchased: purchased,
        startFromSessionNumber: startNum,
        endSessionNumber: endNum,
        sessionsConducted,
        sessionsRemaining,
        notes: inv.notes,
      };
    });

    const totalPaidSessions = effectiveInvoices.reduce((sum, inv) => sum + (Number(inv.sessionsPurchased) || 0), 0);
    const totalBillableSessionsConducted = studentSessions.length;
    const remainingSessions = totalPaidSessions - totalBillableSessionsConducted;

    return {
      studentId: student.id,
      classId: targetClassId,
      totalPaidSessions,
      totalBillableSessionsConducted,
      remainingSessions,
      isOverdue: remainingSessions <= 0,
      isLowBalance: remainingSessions > 0 && remainingSessions <= 2,
      receiptsCount: effectiveInvoices.length,
      activePackages,
    };
  } catch (err) {
    console.warn('[TUITION_ENGINE] Summary calculation notice:', err);
    return {
      studentId: student?.id || '',
      classId: targetClassId,
      totalPaidSessions: 0,
      totalBillableSessionsConducted: 0,
      remainingSessions: 0,
      isOverdue: false,
      isLowBalance: false,
      receiptsCount: 0,
      activePackages: [],
    };
  }
}

/**
 * Normalizes all students' totalPaidSessions and remainingSessions based on central tuition logic.
 * Used during data loading and storage updates to guarantee memory consistency across all views.
 */
export function normalizeStudentTuitionData(
  students: Student[] = [],
  invoices: Invoice[] = [],
  sessions: Session[] = [],
  classes: Class[] = []
): Student[] {
  if (!students || students.length === 0) return [];

  return students.map((std) => {
    if (!std || std.status === 'soft_deleted') return std;
    const summary = calculateStudentTuitionSummary(std, invoices, sessions, classes);
    if (
      std.remainingSessions === summary.remainingSessions &&
      std.totalPaidSessions === summary.totalPaidSessions
    ) {
      return std;
    }
    return {
      ...std,
      totalPaidSessions: summary.totalPaidSessions,
      remainingSessions: summary.remainingSessions,
    };
  });
}
