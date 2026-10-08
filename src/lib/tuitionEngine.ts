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
 * Automatically calculates the starting session number for a new tuition receipt.
 * Ensures tuition packages are strictly cumulative based on student's history:
 * nextStart = max(highest invoice endSessionNumber, highest conducted sessionNumber, baseline - 1) + 1
 */
export function getNextStartSessionNumber(
  student: Student | null | undefined,
  invoices: Invoice[] = [],
  sessions: Session[] = [],
  classes: Class[] = []
): number {
  if (!student || !student.id) return 1;

  // 1. Valid non-cancelled invoices for this student
  const studentInvoices = (invoices || []).filter(
    (inv) => inv && inv.studentId === student.id && inv.status !== 'cancelled'
  );

  // Highest end session number across existing invoices
  let maxInvoiceEndSession = 0;
  if (studentInvoices.length > 0) {
    studentInvoices.forEach((inv) => {
      const start = Number(inv.startFromSessionNumber) || 1;
      const count = Number(inv.sessionsPurchased) || 8;
      const end = start + count - 1;
      if (end > maxInvoiceEndSession) {
        maxInvoiceEndSession = end;
      }
    });
  }

  // 2. Highest conducted session number for student's classes
  const studentClassIds = Array.isArray(student.classIds) ? student.classIds : [];
  const studentSessions = (sessions || []).filter(
    (s) => s && s.classId && studentClassIds.includes(s.classId) && isBillableStudentSession(s, student.id)
  );

  let maxConductedSessionNumber = 0;
  if (studentSessions.length > 0) {
    studentSessions.forEach((s) => {
      const sNum = Number(s.sessionNumber) || 0;
      if (sNum > maxConductedSessionNumber) {
        maxConductedSessionNumber = sNum;
      }
    });
  }

  // 3. Baseline starting session from Student or Class
  let baselineStart = Number(student.startSessionNumber) || 1;
  if (baselineStart === 1 && studentClassIds.length > 0) {
    const targetClass = (classes || []).find((c) => c && studentClassIds.includes(c.id));
    if (targetClass?.startSessionNumber && targetClass.startSessionNumber > 1) {
      baselineStart = targetClass.startSessionNumber;
    }
  }

  const highestReached = Math.max(maxInvoiceEndSession, maxConductedSessionNumber);
  if (highestReached > 0) {
    return Math.max(highestReached + 1, baselineStart);
  }

  return baselineStart;
}

/**
 * CENTRAL SINGLE SOURCE OF TRUTH TUITION & REMAINING SESSION ENGINE
 * Calculates student's total paid sessions, billable sessions conducted, and exact remaining sessions.
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

    // 1. Filter student's valid receipts (paid invoices)
    const studentInvoices = (invoices || []).filter((inv) => {
      if (!inv || !inv.studentId) return false;
      if (inv.studentId !== student.id) return false;
      if (inv.status === 'cancelled') return false;
      return inv.status === 'paid' || !inv.status;
    });

    // 2. Filter sessions for student's classes
    const studentClassIds = targetClassId ? [targetClassId] : Array.isArray(student.classIds) ? student.classIds : [];

    const studentSessions = (sessions || []).filter((s) => {
      if (!s || !s.classId) return false;
      if (studentClassIds.length > 0 && !studentClassIds.includes(s.classId)) return false;
      return isBillableStudentSession(s, student.id);
    });

    // Baseline start threshold
    let baselineStart = Number(student.startSessionNumber) || 1;
    if (baselineStart === 1 && studentClassIds.length > 0) {
      const cls = classes.find((c) => c && studentClassIds.includes(c.id));
      if (cls?.startSessionNumber && cls.startSessionNumber > 1) {
        baselineStart = cls.startSessionNumber;
      }
    }

    // 3. If student has NO receipts, construct virtual fallback from student legacy fields for 100% data preservation
    let effectiveInvoices = [...studentInvoices];
    if (effectiveInvoices.length === 0) {
      const legacyPaid = Number(student.totalPaidSessions) || Number(student.packageSessionCount) || 8;
      const legacyStart = baselineStart;
      const safeIdStr = String(student.id || 'STD');
      effectiveInvoices = [
        {
          id: `legacy_${safeIdStr}`,
          code: `LEGACY-${safeIdStr.slice(-4).toUpperCase()}`,
          studentId: student.id,
          studentName: student.name || 'Học viên',
          studentPhone: student.phone || '',
          amount: student.tuitionPackagePrice || 0,
          sessionsPurchased: legacyPaid,
          startFromSessionNumber: legacyStart,
          status: 'paid',
          paymentDate: student.joinedDate || student.createdAt || '2026-08-01',
          createdDate: student.createdAt || '2026-08-01',
          notes: 'Phiếu thu tự động khởi tạo từ dữ liệu học phí ban đầu',
        },
      ];
    }

    // 4. Sort receipts by paymentDate / createdDate / startFromSessionNumber
    effectiveInvoices.sort((a, b) => {
      const dateA = a.paymentDate || a.paidDate || a.createdDate || '';
      const dateB = b.paymentDate || b.paidDate || b.createdDate || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const startA = Number(a.startFromSessionNumber) || 1;
      const startB = Number(b.startFromSessionNumber) || 1;
      return startA - startB;
    });

    // Ensure sequential non-overlapping package ranges
    let runningStart = baselineStart;
    const resolvedInvoices = effectiveInvoices.map((inv, idx) => {
      let start = Number(inv.startFromSessionNumber);
      if (!start || (idx > 0 && start <= runningStart)) {
        start = runningStart;
      }
      const count = Number(inv.sessionsPurchased) || 8;
      const end = start + count - 1;
      runningStart = end + 1;
      return {
        ...inv,
        resolvedStart: start,
        resolvedEnd: end,
      };
    });

    // 5. Calculate total paid sessions across all valid receipts
    const totalPaidSessions = resolvedInvoices.reduce((sum, inv) => sum + (Number(inv.sessionsPurchased) || 0), 0);

    // 6. Determine overall start threshold (min startFromSessionNumber across packages)
    const minStartSessionNumber = resolvedInvoices.length > 0
      ? Math.min(...resolvedInvoices.map((inv) => inv.resolvedStart))
      : baselineStart;

    // 7. Filter billable sessions conducted with sessionNumber >= minStartSessionNumber
    const billableConductedSessions = studentSessions.filter((s) => {
      const sNum = Number(s.sessionNumber) || 1;
      return sNum >= minStartSessionNumber;
    });

    const totalBillableSessionsConducted = billableConductedSessions.length;

    // 8. Calculate exact remaining sessions
    const remainingSessions = totalPaidSessions - totalBillableSessionsConducted;

    // 9. Breakdown per active package / receipt
    const activePackages: StudentReceiptBreakdown[] = resolvedInvoices.map((inv) => {
      const startNum = inv.resolvedStart;
      const purchased = Number(inv.sessionsPurchased) || 0;
      const endNum = inv.resolvedEnd;

      const conductedForPkg = studentSessions.filter((s) => {
        const sNum = Number(s.sessionNumber) || 1;
        return sNum >= startNum && sNum <= endNum;
      }).length;

      const remainingForPkg = Math.max(0, purchased - conductedForPkg);

      return {
        receiptId: inv.id,
        receiptCode: inv.code,
        paymentDate: inv.paymentDate || inv.paidDate || inv.createdDate || '',
        amount: Number(inv.amount) || 0,
        sessionsPurchased: purchased,
        startFromSessionNumber: startNum,
        endSessionNumber: endNum,
        sessionsConducted: conductedForPkg,
        sessionsRemaining: remainingForPkg,
        notes: inv.notes,
      };
    });

    return {
      studentId: student.id,
      classId: targetClassId,
      totalPaidSessions,
      totalBillableSessionsConducted,
      remainingSessions,
      isOverdue: remainingSessions <= 0,
      isLowBalance: remainingSessions > 0 && remainingSessions <= 2,
      receiptsCount: resolvedInvoices.length,
      activePackages,
    };
  } catch (err) {
    console.warn('[TUITION_ENGINE] Summary calculation notice:', err);
    return {
      studentId: student?.id || '',
      classId: targetClassId,
      totalPaidSessions: Number(student?.totalPaidSessions) || 8,
      totalBillableSessionsConducted: 0,
      remainingSessions: Number(student?.remainingSessions) || 8,
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
