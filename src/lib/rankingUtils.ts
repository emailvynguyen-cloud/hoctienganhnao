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

export interface SystemHonorBadgeDef {
  id: string;
  title: string;
  tier: 'Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Common';
  tierLabel: string;
  icon: string;
  description: string;
  badgeStyle: string;
}

export const SYSTEM_HONOR_BADGES_LIST: SystemHonorBadgeDef[] = [
  {
    id: 'legendary_star',
    title: '🥇 Ngôi Sao Chăm Chỉ 👑',
    tier: 'Legendary',
    tierLabel: 'Legendary (Huyền Thoại)',
    icon: '👑',
    description: 'Đạt Hạng 1 tuần toàn trung tâm MS. VY ENGLISH',
    badgeStyle: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black border-2 border-yellow-200 shadow-md shadow-amber-500/30',
  },
  {
    id: 'epic_star',
    title: '🥈 Ngôi Sao Nỗ Lực ⭐',
    tier: 'Epic',
    tierLabel: 'Epic (Anh Hùng)',
    icon: '🔮',
    description: 'Đạt Hạng 2 tuần toàn trung tâm',
    badgeStyle: 'bg-purple-600 text-white font-bold border border-purple-400 shadow-md shadow-purple-500/30',
  },
  {
    id: 'rare_warrior',
    title: '🥉 Chiến Binh Kiên Trì 💪',
    tier: 'Rare',
    tierLabel: 'Rare (Hiếm)',
    icon: '💎',
    description: 'Đạt Hạng 3 tuần toàn trung tâm',
    badgeStyle: 'bg-blue-600 text-white font-bold border border-blue-400 shadow-md shadow-blue-500/30',
  },
  {
    id: 'uncommon_conqueror',
    title: '🏅 Nhà Chinh Phục 🚀',
    tier: 'Uncommon',
    tierLabel: 'Uncommon (Khá)',
    icon: '🌿',
    description: 'Đạt Hạng 4 tuần toàn trung tâm',
    badgeStyle: 'bg-emerald-600 text-white font-bold border border-emerald-400 shadow-md shadow-emerald-500/30',
  },
  {
    id: 'common_progress',
    title: '🌟 Ngôi Sao Tiến Bộ ✨',
    tier: 'Common',
    tierLabel: 'Common (Thường)',
    icon: '🛡️',
    description: 'Đạt Hạng 5 tuần toàn trung tâm',
    badgeStyle: 'bg-slate-700 text-slate-100 font-bold border border-slate-500 shadow-md shadow-slate-900/30',
  },
];

  const index = rankedStudents.findIndex((r) => r.studentId === studentId);
  if (index >= 0 && index < 5) {
    const badgeColors = [
      'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 font-black border-2 border-yellow-200 shadow-md shadow-amber-500/30 animate-pulse-subtle', // Legendary (Vàng Ánh Kim)
      'bg-purple-600 text-white font-bold border border-purple-400 shadow-md shadow-purple-500/30', // Epic (Tím)
      'bg-blue-600 text-white font-bold border border-blue-400 shadow-md shadow-blue-500/30', // Rare (Xanh Dương)
      'bg-emerald-600 text-white font-bold border border-emerald-400 shadow-md shadow-emerald-500/30', // Uncommon (Xanh Lá)
      'bg-slate-700 text-slate-100 font-bold border border-slate-500 shadow-md shadow-slate-900/30', // Common (Xám)
    ];
    return {
      title: WEEKLY_TITLES[index],
      badgeColor: badgeColors[index],
      rank: index + 1,
    };
  }

  return null;
}
