import { Student, Session, HomeworkSubmission } from '../types';
import { getCurrentWeekRange, getCurrentMonthString } from './dateUtils';

export interface HonorBadgeInfo {
  title: string;
  badgeColor: string;
  rank: number;
}

const WEEKLY_TITLES = [
  '🥇 Ngôi Sao Chăm Chỉ 👑',
  '🥈 Ngôi Sao Nỗ Lực ⭐',
  '🥉 Chiến Binh Kiên Trì 💪',
  '🏅 Nhà Chinh Phục 🚀',
  '🌟 Ngôi Sao Tiến Bộ ✨',
];

/**
 * SINGLE SOURCE OF TRUTH FOR STUDENT HONOR BADGES & RANKING
 * Computes current real-time ranking and returns badge info ONLY if student is in Top 5.
 * Returns null if student is not in Top 5.
 */
export function getStudentHonorBadge(
  studentId: string,
  allStudents: Student[],
  allSessions: Session[],
  allSubmissions: HomeworkSubmission[]
): HonorBadgeInfo | null {
  if (!studentId || !allStudents || allStudents.length === 0) return null;

  const activeStudents = allStudents.filter((s) => s && s.status !== 'soft_deleted');
  const { mondayStr, sundayStr } = getCurrentWeekRange();

  const rankedStudents = activeStudents.map((student) => {
    // 1. Get student's sessions occurring in current week
    const targetSessions = (allSessions || []).filter((s) => {
      if (!s || !s.date || !student.classIds || !student.classIds.includes(s.classId)) {
        return false;
      }
      return s.date >= mondayStr && s.date <= sundayStr;
    });

    const targetHwItems = targetSessions.flatMap((s) => s.homeworkItems || []);
    const targetSessionIds = new Set(targetSessions.map((s) => s.id));

    const feedbackedSubmissions = (allSubmissions || []).filter((sub) =>
      sub &&
      sub.studentId === student.id &&
      sub.sessionId &&
      targetSessionIds.has(sub.sessionId) &&
      (
        sub.isTeacherFeedbackChecked ||
        sub.feedbackStatus === 'COMPLETED' ||
        (typeof sub.ratingStars === 'number' && sub.ratingStars > 0) ||
        (sub.feedbackText && sub.feedbackText.trim() !== '')
      )
    );

    const feedbackedHwItems = targetHwItems.filter((hw) =>
      feedbackedSubmissions.some((sub) => sub.homeworkTaskId === hw.id || sub.homeworkTitle === hw.title)
    );

    const totalFeedbackedCount = feedbackedHwItems.length > 0 ? feedbackedHwItems.length : feedbackedSubmissions.length;
    const completedHomeworkIds = student.completedHomeworkTaskIds || [];
    const completedCount = feedbackedHwItems.length > 0
      ? feedbackedHwItems.filter((hw) =>
          completedHomeworkIds.includes(hw.id) ||
          feedbackedSubmissions.some((sub) => (sub.homeworkTaskId === hw.id || sub.homeworkTitle === hw.title) && (sub.isStudentChecked || sub.completionStatus === 'COMPLETED'))
        ).length
      : feedbackedSubmissions.filter((sub) => sub.isStudentChecked || sub.completionStatus === 'COMPLETED').length;

    const completionRate = totalFeedbackedCount > 0
      ? Math.min(100, Math.round((completedCount / totalFeedbackedCount) * 100))
      : 0;

    const ratedSubs = feedbackedSubmissions.filter((sub) => typeof sub.ratingStars === 'number' && sub.ratingStars > 0);
    const averageStars = ratedSubs.length > 0
      ? parseFloat((ratedSubs.reduce((sum, s) => sum + (s.ratingStars || 5), 0) / ratedSubs.length).toFixed(1))
      : 0;

    return {
      studentId: student.id,
      completionRate,
      completedCount,
      averageStars,
    };
  }).sort((a, b) => {
    if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
    if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
    return b.averageStars - a.averageStars;
  });

  const index = rankedStudents.findIndex((r) => r.studentId === studentId);
  if (index >= 0 && index < 5) {
    const badgeColors = [
      'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border-amber-300',
      'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 border-slate-300',
      'bg-gradient-to-r from-orange-200 to-amber-300 text-amber-950 border-amber-300',
      'bg-sky-100 text-sky-950 border-sky-200',
      'bg-pink-100 text-pink-950 border-pink-200',
    ];
    return {
      title: WEEKLY_TITLES[index],
      badgeColor: badgeColors[index],
      rank: index + 1,
    };
  }

  return null;
}
