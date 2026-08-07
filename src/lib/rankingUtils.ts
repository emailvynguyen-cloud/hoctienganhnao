import { Student, Session, HomeworkSubmission } from '../types';
import { getCurrentWeekRange } from './dateUtils';

export interface HonorBadgeInfo {
  title: string;
  badgeColor: string;
  rank: number;
}

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

// ----------------------------------------------------------------------
// ACHIEVEMENT CENTER & AVATAR FRAMES UTILITIES
// ----------------------------------------------------------------------
export type RarityTier = 'Legendary' | 'Epic' | 'Rare' | 'Uncommon' | 'Common';

export interface AchievementBadge {
  id: string;
  title: string;
  category: 'study' | 'ranking';
  groupLabel: string;
  tier: RarityTier;
  tierLabel: string;
  icon: string;
  description: string;
  conditionLabel: string;
  targetCount: number;
  badgeStyle: string;
  glowClass: string;
}

export interface AchievementTitle {
  id: string;
  title: string;
  category: 'title';
  tier: RarityTier;
  tierLabel: string;
  icon: string;
  description: string;
  conditionLabel: string;
  targetCount: number;
  badgeStyle: string;
}

export interface AvatarFrameInfo {
  frameId: string;
  title: string;
  tier: RarityTier;
  type: 'monthly' | 'weekly' | 'default';
  rankNumber: number;
  frameCssClass: string;
  borderStyle: string;
  badgeOverlayIcon?: string;
  description: string;
  ornamentType: 'gold_crown' | 'silver_laurel' | 'bronze_shield' | 'star_crystal' | 'sapphire' | 'royal_wings' | 'diamond_cut' | 'platinum_filigree' | 'crystal_prism' | 'royal_sapphire' | 'default';
}

export const SYSTEM_BADGES_CATALOG: AchievementBadge[] = [
  // 📚 NHÓM 1: BADGE HỌC TẬP
  {
    id: 'badge_study_100',
    title: '🌱 Người Khởi Đầu',
    category: 'study',
    groupLabel: '📚 BADGE HỌC TẬP',
    tier: 'Common',
    tierLabel: 'Common (Thường)',
    icon: '🌱',
    description: 'Hoàn thành 100 bài tập về nhà',
    conditionLabel: 'Hoàn thành 100 bài tập',
    targetCount: 100,
    badgeStyle: 'bg-slate-800 text-emerald-300 border border-emerald-600',
    glowClass: 'shadow-emerald-500/20',
  },
  {
    id: 'badge_study_300',
    title: '📚 Chăm Chỉ',
    category: 'study',
    groupLabel: '📚 BADGE HỌC TẬP',
    tier: 'Uncommon',
    tierLabel: 'Uncommon (Khá)',
    icon: '📚',
    description: 'Hoàn thành 300 bài tập về nhà',
    conditionLabel: 'Hoàn thành 300 bài tập',
    targetCount: 300,
    badgeStyle: 'bg-emerald-950 text-emerald-300 border border-emerald-500',
    glowClass: 'shadow-emerald-500/30',
  },
  {
    id: 'badge_study_600',
    title: '🔥 Chiến Binh Bài Tập',
    category: 'study',
    groupLabel: '📚 BADGE HỌC TẬP',
    tier: 'Rare',
    tierLabel: 'Rare (Hiếm)',
    icon: '🔥',
    description: 'Hoàn thành 600 bài tập về nhà',
    conditionLabel: 'Hoàn thành 600 bài tập',
    targetCount: 600,
    badgeStyle: 'bg-sky-950 text-sky-300 border border-sky-400',
    glowClass: 'shadow-sky-500/40',
  },
  {
    id: 'badge_study_1000',
    title: '💎 Bậc Thầy Bài Tập',
    category: 'study',
    groupLabel: '📚 BADGE HỌC TẬP',
    tier: 'Epic',
    tierLabel: 'Epic (Anh Hùng)',
    icon: '💎',
    description: 'Hoàn thành 1000 bài tập về nhà',
    conditionLabel: 'Hoàn thành 1000 bài tập',
    targetCount: 1000,
    badgeStyle: 'bg-purple-950 text-purple-300 border border-purple-400',
    glowClass: 'shadow-purple-500/50',
  },
  {
    id: 'badge_study_2000',
    title: '👑 Huyền Thoại Bài Tập',
    category: 'study',
    groupLabel: '📚 BADGE HỌC TẬP',
    tier: 'Legendary',
    tierLabel: 'Legendary (Huyền Thoại)',
    icon: '👑',
    description: 'Hoàn thành 2000 bài tập về nhà',
    conditionLabel: 'Hoàn thành 2000 bài tập',
    targetCount: 2000,
    badgeStyle: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border-2 border-yellow-200 font-black',
    glowClass: 'shadow-yellow-500/60 animate-pulse',
  },

  // 🏆 NHÓM 2: BADGE XẾP HẠNG
  {
    id: 'badge_rank_top10_week',
    title: '🔷 Top 10 Tuần',
    category: 'ranking',
    groupLabel: '🏆 BADGE XẾP HẠNG',
    tier: 'Common',
    tierLabel: 'Common (Thường)',
    icon: '🔷',
    description: 'Lần đầu lọt Top 10 Bảng Xếp Hạng Tuần',
    conditionLabel: 'Lọt Top 10 Tuần 1 lần',
    targetCount: 1,
    badgeStyle: 'bg-slate-800 text-sky-300 border border-sky-600',
    glowClass: 'shadow-sky-500/20',
  },
  {
    id: 'badge_rank_top5_week',
    title: '⭐ Top 5 Tuần',
    category: 'ranking',
    groupLabel: '🏆 BADGE XẾP HẠNG',
    tier: 'Uncommon',
    tierLabel: 'Uncommon (Khá)',
    icon: '⭐',
    description: 'Lần đầu lọt Top 5 Bảng Xếp Hạng Tuần',
    conditionLabel: 'Lọt Top 5 Tuần 1 lần',
    targetCount: 1,
    badgeStyle: 'bg-amber-950 text-amber-300 border border-amber-500',
    glowClass: 'shadow-amber-500/30',
  },
  {
    id: 'badge_rank_top3_week',
    title: '🥉 Top 3 Tuần',
    category: 'ranking',
    groupLabel: '🏆 BADGE XẾP HẠNG',
    tier: 'Rare',
    tierLabel: 'Rare (Hiếm)',
    icon: '🥉',
    description: 'Lần đầu lọt Top 3 Bảng Xếp Hạng Tuần',
    conditionLabel: 'Lọt Top 3 Tuần 1 lần',
    targetCount: 1,
    badgeStyle: 'bg-orange-950 text-amber-200 border border-amber-400',
    glowClass: 'shadow-amber-500/40',
  },
  {
    id: 'badge_rank_top1_week_1',
    title: '🏆 Quán Quân Tuần',
    category: 'ranking',
    groupLabel: '🏆 BADGE XẾP HẠNG',
    tier: 'Epic',
    tierLabel: 'Epic (Anh Hùng)',
    icon: '🏆',
    description: 'Đạt Hạng 1 Bảng Xếp Hạng Tuần',
    conditionLabel: 'Đạt Top 1 Tuần 1 lần',
    targetCount: 1,
    badgeStyle: 'bg-purple-950 text-amber-300 border border-yellow-400',
    glowClass: 'shadow-yellow-500/50',
  },
  {
    id: 'badge_rank_top1_week_5',
    title: '🏅 Nhà Vô Địch Tuần',
    category: 'ranking',
    groupLabel: '🏆 BADGE XẾP HẠNG',
    tier: 'Epic',
    tierLabel: 'Epic (Anh Hùng)',
    icon: '🏅',
    description: 'Đạt Top 1 Bảng Xếp Hạng Tuần 5 lần',
    conditionLabel: 'Đạt Top 1 Tuần 5 lần',
    targetCount: 5,
    badgeStyle: 'bg-gradient-to-r from-amber-600 to-yellow-500 text-slate-950 border border-yellow-200 font-bold',
    glowClass: 'shadow-amber-500/50',
  },
  {
    id: 'badge_rank_top1_week_10',
    title: '👑 Huyền Thoại Tuần',
    category: 'ranking',
    groupLabel: '🏆 BADGE XẾP HẠNG',
    tier: 'Legendary',
    tierLabel: 'Legendary (Huyền Thoại)',
    icon: '👑',
    description: 'Đạt Top 1 Bảng Xếp Hạng Tuần 10 lần',
    conditionLabel: 'Đạt Top 1 Tuần 10 lần',
    targetCount: 10,
    badgeStyle: 'bg-gradient-to-r from-yellow-500 via-amber-400 to-amber-600 text-slate-950 border-2 border-yellow-100 font-black',
    glowClass: 'shadow-yellow-500/60 animate-pulse',
  },
  {
    id: 'badge_rank_top1_month_1',
    title: '👑 Quán Quân Tháng',
    category: 'ranking',
    groupLabel: '🏆 BADGE XẾP HẠNG',
    tier: 'Epic',
    tierLabel: 'Epic (Anh Hùng)',
    icon: '👑',
    description: 'Đạt Hạng 1 Bảng Xếp Hạng Tháng',
    conditionLabel: 'Đạt Top 1 Tháng 1 lần',
    targetCount: 1,
    badgeStyle: 'bg-gradient-to-r from-purple-700 to-pink-600 text-white border border-pink-300 font-bold',
    glowClass: 'shadow-purple-500/50',
  },
  {
    id: 'badge_rank_top1_month_3',
    title: '⚜️ Nhà Vô Địch Tháng',
    category: 'ranking',
    groupLabel: '🏆 BADGE XẾP HẠNG',
    tier: 'Legendary',
    tierLabel: 'Legendary (Huyền Thoại)',
    icon: '⚜️',
    description: 'Đạt Top 1 Bảng Xếp Hạng Tháng 3 lần',
    conditionLabel: 'Đạt Top 1 Tháng 3 lần',
    targetCount: 3,
    badgeStyle: 'bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 text-white border-2 border-pink-200 font-black',
    glowClass: 'shadow-pink-500/60 animate-pulse',
  },
  {
    id: 'badge_rank_top1_month_6',
    title: '🌈 Huyền Thoại Tháng',
    category: 'ranking',
    groupLabel: '🏆 BADGE XẾP HẠNG',
    tier: 'Legendary',
    tierLabel: 'Legendary (Huyền Thoại)',
    icon: '🌈',
    description: 'Đạt Top 1 Bảng Xếp Hạng Tháng 6 lần',
    conditionLabel: 'Đạt Top 1 Tháng 6 lần',
    targetCount: 6,
    badgeStyle: 'bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500 text-white border-2 border-white font-black',
    glowClass: 'shadow-indigo-500/70 animate-pulse',
  },
];

export const SYSTEM_TITLES_CATALOG: AchievementTitle[] = [
  {
    id: 'title_starter',
    title: '🌱 Người Khởi Đầu',
    category: 'title',
    tier: 'Common',
    tierLabel: 'Common (Thường)',
    icon: '🌱',
    description: 'Mở khóa khi tham gia khóa học Tiếng Anh',
    conditionLabel: 'Tham gia lớp học',
    targetCount: 0,
    badgeStyle: 'bg-slate-800 text-emerald-300 border border-emerald-500',
  },
  {
    id: 'title_studious',
    title: '📚 Người Chăm Học',
    category: 'title',
    tier: 'Uncommon',
    tierLabel: 'Uncommon (Khá)',
    icon: '📚',
    description: 'Hoàn thành 300 bài tập về nhà xuất sắc',
    conditionLabel: 'Hoàn thành 300 bài tập',
    targetCount: 300,
    badgeStyle: 'bg-emerald-950 text-emerald-200 border border-emerald-400',
  },
  {
    id: 'title_warrior',
    title: '🔥 Chiến Binh Bài Tập',
    category: 'title',
    tier: 'Rare',
    tierLabel: 'Rare (Hiếm)',
    icon: '🔥',
    description: 'Hoàn thành 600 bài tập về nhà xuất sắc',
    conditionLabel: 'Hoàn thành 600 bài tập',
    targetCount: 600,
    badgeStyle: 'bg-sky-950 text-sky-200 border border-sky-400',
  },
  {
    id: 'title_master',
    title: '💎 Bậc Thầy Bài Tập',
    category: 'title',
    tier: 'Epic',
    tierLabel: 'Epic (Anh Hùng)',
    icon: '💎',
    description: 'Hoàn thành 1000 bài tập về nhà xuất sắc',
    conditionLabel: 'Hoàn thành 1000 bài tập',
    targetCount: 1000,
    badgeStyle: 'bg-purple-950 text-purple-200 border border-purple-400',
  },
  {
    id: 'title_weekly_champion',
    title: '🏆 Quán Quân Tuần',
    category: 'title',
    tier: 'Legendary',
    tierLabel: 'Legendary (Huyền Thoại)',
    icon: '🏆',
    description: 'Đạt Hạng Top 1 Bảng Xếp Hạng Tuần',
    conditionLabel: 'Đạt Top 1 BXH Tuần',
    targetCount: 1,
    badgeStyle: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border-2 border-yellow-200 font-black',
  },
  {
    id: 'title_monthly_champion',
    title: '👑 Quán Quân Tháng',
    category: 'title',
    tier: 'Legendary',
    tierLabel: 'Legendary (Huyền Thoại)',
    icon: '👑',
    description: 'Đạt Hạng Top 1 Bảng Xếp Hạng Tháng',
    conditionLabel: 'Đạt Top 1 BXH Tháng',
    targetCount: 1,
    badgeStyle: 'bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 text-white border-2 border-pink-200 font-black',
  },
  {
    id: 'title_veronica_legend',
    title: '🌈 Huyền Thoại Veronica',
    category: 'title',
    tier: 'Legendary',
    tierLabel: 'Legendary (Huyền Thoại)',
    icon: '🌈',
    description: 'Hoàn thành 2000+ bài tập & luôn dẫn đầu thành tích học tập',
    conditionLabel: 'Hoàn thành 2000 bài tập',
    targetCount: 2000,
    badgeStyle: 'bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500 text-white border-2 border-white font-black',
  },
];

export function getStudentAvatarFrameInfo(
  studentId: string,
  allStudents: Student[] = [],
  allSessions: Session[] = [],
  allSubmissions: HomeworkSubmission[] = []
): AvatarFrameInfo {
  if (!studentId || !allStudents || allStudents.length === 0) {
    return {
      frameId: 'default',
      title: 'Khung Mặc Định',
      tier: 'Common',
      type: 'default',
      rankNumber: 999,
      frameCssClass: 'border-2 border-slate-300 dark:border-slate-700',
      borderStyle: 'border-slate-300',
      description: 'Khung avatar mặc định cho học viên',
      ornamentType: 'default',
    };
  }

  const activeStudents = allStudents.filter((s) => s && s.status !== 'soft_deleted');
  const studentScores = activeStudents.map((std) => {
    const stdSessions = allSessions.filter((s) => s && std.classIds && std.classIds.includes(s.classId));
    const targetSessionIds = new Set(stdSessions.map((s) => s.id));
    const stdSubs = allSubmissions.filter((sub) => sub && sub.studentId === std.id && targetSessionIds.has(sub.sessionId));
    const completedHwCount = std.completedHomeworkTaskIds ? std.completedHomeworkTaskIds.length : stdSubs.length;
    const totalStars = std.stars || 0;

    return {
      studentId: std.id,
      score: completedHwCount * 10 + totalStars * 5,
    };
  }).sort((a, b) => b.score - a.score);

  const rankIdx = studentScores.findIndex((s) => s.studentId === studentId);
  const rank = rankIdx !== -1 ? rankIdx + 1 : 999;

  // MONTHLY RANK FRAMES (PRIORITY)
  if (rank === 1) {
    return {
      frameId: 'monthly_top1',
      title: '👑 Top 1 Tháng – Khung Hoàng Gia (Thiên Thần)',
      tier: 'Legendary',
      type: 'monthly',
      rankNumber: 1,
      frameCssClass: 'border-amber-400 shadow-xl shadow-amber-500/40',
      borderStyle: 'border-amber-400',
      badgeOverlayIcon: '👑',
      description: 'Thiết kế cao cấp nhất hệ thống: Vương miện lớn, Cánh thiên thần & hiệu ứng shimmer vàng',
      ornamentType: 'royal_wings',
    };
  }

  if (rank === 2) {
    return {
      frameId: 'monthly_top2',
      title: '💎 Top 2 Tháng – Khung Kim Cương',
      tier: 'Epic',
      type: 'monthly',
      rankNumber: 2,
      frameCssClass: 'border-cyan-300 shadow-lg shadow-cyan-400/40',
      borderStyle: 'border-cyan-300',
      badgeOverlayIcon: '💎',
      description: 'Cạnh cắt kim cương chạm khắc 3D với hiệu ứng phản chiếu ánh sáng',
      ornamentType: 'diamond_cut',
    };
  }

  if (rank === 3) {
    return {
      frameId: 'monthly_top3',
      title: '⚜ Top 3 Tháng – Khung Bạch Kim',
      tier: 'Rare',
      type: 'monthly',
      rankNumber: 3,
      frameCssClass: 'border-slate-200 shadow-md shadow-slate-300/40',
      borderStyle: 'border-slate-200',
      badgeOverlayIcon: '⚜',
      description: 'Tông bạch kim sang trọng với hoa văn chạm khắc tinh xảo',
      ornamentType: 'platinum_filigree',
    };
  }

  if (rank <= 5) {
    return {
      frameId: 'monthly_top4_5',
      title: '✨ Top 4–5 Tháng – Khung Pha Lê',
      tier: 'Uncommon',
      type: 'monthly',
      rankNumber: rank,
      frameCssClass: 'border-indigo-300 shadow-md shadow-indigo-300/30',
      borderStyle: 'border-indigo-300',
      badgeOverlayIcon: '✨',
      description: 'Khung pha lê trong suốt với hiệu ứng phản quang ánh sáng mềm',
      ornamentType: 'crystal_prism',
    };
  }

  if (rank <= 10) {
    return {
      frameId: 'monthly_top6_10',
      title: '🔹 Top 6–10 Tháng – Khung Sapphire Hoàng Gia',
      tier: 'Common',
      type: 'monthly',
      rankNumber: rank,
      frameCssClass: 'border-blue-400 shadow-xs',
      borderStyle: 'border-blue-400',
      badgeOverlayIcon: '🔹',
      description: 'Xanh sapphire kết hợp viền bạc sang trọng cao cấp',
      ornamentType: 'royal_sapphire',
    };
  }

  // WEEKLY RANK FRAMES (FALLBACK)
  if (rank === 1) {
    return {
      frameId: 'weekly_top1',
      title: '🥇 Top 1 Tuần – Khung Vương Miện Vàng',
      tier: 'Epic',
      type: 'weekly',
      rankNumber: 1,
      frameCssClass: 'border-yellow-400 shadow-lg shadow-amber-400/40',
      borderStyle: 'border-yellow-400',
      badgeOverlayIcon: '👑',
      description: 'Viền vàng ánh kim, vương miện 3D phía trên & các ngôi sao lấp lánh',
      ornamentType: 'gold_crown',
    };
  }

  if (rank === 2) {
    return {
      frameId: 'weekly_top2',
      title: '🥈 Top 2 Tuần – Khung Bạc Hoàng Gia',
      tier: 'Rare',
      type: 'weekly',
      rankNumber: 2,
      frameCssClass: 'border-slate-300 shadow-md shadow-slate-400/30',
      borderStyle: 'border-slate-300',
      badgeOverlayIcon: '🌿',
      description: 'Viền bạc chạm khắc tinh tế với họa tiết lá nguyệt quế',
      ornamentType: 'silver_laurel',
    };
  }

  if (rank === 3) {
    return {
      frameId: 'weekly_top3',
      title: '🥉 Top 3 Tuần – Khung Đồng Cổ Điển',
      tier: 'Uncommon',
      type: 'weekly',
      rankNumber: 3,
      frameCssClass: 'border-amber-700 shadow-md shadow-amber-700/30',
      borderStyle: 'border-amber-700',
      badgeOverlayIcon: '🛡️',
      description: 'Chất liệu đồng bóng cổ điển với họa tiết khiên & dải ruy băng',
      ornamentType: 'bronze_shield',
    };
  }

  if (rank <= 5) {
    return {
      frameId: 'weekly_top4_5',
      title: '⭐ Top 4–5 Tuần – Khung Ngôi Sao',
      tier: 'Common',
      type: 'weekly',
      rankNumber: rank,
      frameCssClass: 'border-amber-400 shadow-xs',
      borderStyle: 'border-amber-400',
      badgeOverlayIcon: '⭐',
      description: 'Góc khung gắn ngôi sao pha lê & hiệu ứng lấp lánh nhẹ',
      ornamentType: 'star_crystal',
    };
  }

  if (rank <= 10) {
    return {
      frameId: 'weekly_top6_10',
      title: '🔷 Top 6–10 Tuần – Khung Sapphire',
      tier: 'Common',
      type: 'weekly',
      rankNumber: rank,
      frameCssClass: 'border-sky-400 shadow-xs',
      borderStyle: 'border-sky-400',
      badgeOverlayIcon: '🔷',
      description: 'Tông xanh sapphire sang trọng viền pha lê ánh sáng dịu',
      ornamentType: 'sapphire',
    };
  }

  return {
    frameId: 'default',
    title: 'Khung Mặc Định',
    tier: 'Common',
    type: 'default',
    rankNumber: rank,
    frameCssClass: 'border-2 border-slate-300 dark:border-slate-700',
    borderStyle: 'border-slate-300',
    description: 'Khung avatar mặc định cho học viên',
    ornamentType: 'default',
  };
}

export function getEquippedTitleInfo(equippedTitleId?: string): AchievementTitle | null {
  if (!equippedTitleId) return null;
  return SYSTEM_TITLES_CATALOG.find((t) => t.id === equippedTitleId) || null;
}

// ----------------------------------------------------------------------
// 🏛 ĐẠI SẢNH DANH VỌNG (HALL OF FAME) COMPUTATION ENGINE
// ----------------------------------------------------------------------
export interface HallOfFameRecord {
  categoryKey: 'badge_king' | 'title_king' | 'weekly_king' | 'monthly_king';
  categoryTitle: string;
  categoryIcon: string;
  student: Student | null;
  metricValue: number;
  metricLabel: string;
  badgeLabel: string;
  sinceDate?: string;
}

export interface HallOfFameData {
  badgeRecord: HallOfFameRecord;
  titleRecord: HallOfFameRecord;
  weeklyKingRecord: HallOfFameRecord;
  monthlyKingRecord: HallOfFameRecord;
}

export function computeHallOfFameRecords(
  allStudents: Student[] = [],
  allSessions: Session[] = [],
  allSubmissions: HomeworkSubmission[] = []
): HallOfFameData {
  const activeStudents = (allStudents || []).filter((s) => s && s.status !== 'soft_deleted');

  // Compute real-time weekly rank Top 1 student
  const studentScores = activeStudents.map((std) => {
    const stdSessions = (allSessions || []).filter((s) => s && std.classIds && std.classIds.includes(s.classId));
    const targetSessionIds = new Set(stdSessions.map((s) => s.id));
    const stdSubs = (allSubmissions || []).filter((sub) => sub && sub.studentId === std.id && targetSessionIds.has(sub.sessionId));
    const completedHwCount = std.completedHomeworkTaskIds ? std.completedHomeworkTaskIds.length : stdSubs.length;
    const totalStars = std.stars || 0;

    return {
      student: std,
      completedHwCount,
      totalStars,
      score: completedHwCount * 10 + totalStars * 5,
    };
  }).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.student.name.localeCompare(b.student.name);
  });

  const weeklyTop1StudentId = studentScores.length > 0 && studentScores[0].score > 0 ? studentScores[0].student.id : null;
  const monthlyTop1StudentId = studentScores.length > 0 && studentScores[0].score > 0 ? studentScores[0].student.id : null;

  // 1. Calculate REAL UNLOCKED BADGES count for a student
  const getRealBadgeCount = (s: Student) => {
    const hwCount = s.completedHomeworkTaskIds ? s.completedHomeworkTaskIds.length : 0;
    const isTop1 = s.id === weeklyTop1StudentId;
    const isTop10 = studentScores.findIndex((item) => item.student.id === s.id) <= 9;
    const isTop5 = studentScores.findIndex((item) => item.student.id === s.id) <= 4;
    const isTop3 = studentScores.findIndex((item) => item.student.id === s.id) <= 2;

    return SYSTEM_BADGES_CATALOG.filter((b) => {
      if (b.category === 'study') return hwCount >= b.targetCount;
      if (b.id.includes('top10_week')) return isTop10;
      if (b.id.includes('top5_week')) return isTop5;
      if (b.id.includes('top3_week')) return isTop3;
      if (b.id.includes('top1_week')) return isTop1;
      if (b.id.includes('top1_month')) return s.id === monthlyTop1StudentId;
      return false;
    }).length;
  };

  // 2. Calculate REAL UNLOCKED TITLES count for a student
  const getRealTitleCount = (s: Student) => {
    const hwCount = s.completedHomeworkTaskIds ? s.completedHomeworkTaskIds.length : 0;
    return SYSTEM_TITLES_CATALOG.filter((t) => {
      if (t.targetCount === 0) return true;
      if (t.id.includes('weekly_champion')) return s.id === weeklyTop1StudentId;
      if (t.id.includes('monthly_champion')) return s.id === monthlyTop1StudentId;
      return hwCount >= t.targetCount;
    }).length;
  };

  // 3. Calculate REAL WEEKLY TOP 1 WINS count for a student
  const getRealWeeklyWinsCount = (s: Student) => {
    return s.id === weeklyTop1StudentId ? 1 : 0;
  };

  // 4. Calculate REAL MONTHLY TOP 1 WINS count for a student
  const getRealMonthlyWinsCount = (s: Student) => {
    return s.id === monthlyTop1StudentId ? 1 : 0;
  };

  // 1. 🏅 Kỷ Lục Gia Badge
  const sortedByBadge = [...activeStudents].sort((a, b) => {
    const countA = getRealBadgeCount(a);
    const countB = getRealBadgeCount(b);
    if (countB !== countA) return countB - countA;
    return a.name.localeCompare(b.name);
  });

  const topBadgeStudent = sortedByBadge[0] || null;
  const topBadgeCount = topBadgeStudent ? getRealBadgeCount(topBadgeStudent) : 0;

  // 2. 👑 Kỷ Lục Gia Danh Hiệu
  const sortedByTitle = [...activeStudents].sort((a, b) => {
    const countA = getRealTitleCount(a);
    const countB = getRealTitleCount(b);
    if (countB !== countA) return countB - countA;
    return a.name.localeCompare(b.name);
  });

  const topTitleStudent = sortedByTitle[0] || null;
  const topTitleCount = topTitleStudent ? getRealTitleCount(topTitleStudent) : 0;

  // 3. 🥇 Vua Top Tuần
  const sortedByWeekly = [...activeStudents].sort((a, b) => {
    const countA = getRealWeeklyWinsCount(a);
    const countB = getRealWeeklyWinsCount(b);
    if (countB !== countA) return countB - countA;
    return a.name.localeCompare(b.name);
  });

  const topWeeklyStudent = sortedByWeekly[0] || null;
  const topWeeklyCount = topWeeklyStudent ? getRealWeeklyWinsCount(topWeeklyStudent) : 0;

  // 4. 🏆 Vua Top Tháng
  const sortedByMonthly = [...activeStudents].sort((a, b) => {
    const countA = getRealMonthlyWinsCount(a);
    const countB = getRealMonthlyWinsCount(b);
    if (countB !== countA) return countB - countA;
    return a.name.localeCompare(b.name);
  });

  const topMonthlyStudent = sortedByMonthly[0] || null;
  const topMonthlyCount = topMonthlyStudent ? getRealMonthlyWinsCount(topMonthlyStudent) : 0;

  return {
    badgeRecord: {
      categoryKey: 'badge_king',
      categoryTitle: 'Kỷ Lục Gia Badge',
      categoryIcon: '🏅',
      student: topBadgeCount > 0 ? topBadgeStudent : null,
      metricValue: topBadgeCount,
      metricLabel: `${topBadgeCount} Badge`,
      badgeLabel: '👑 KỶ LỤC HIỆN TẠI',
      sinceDate: topBadgeCount > 0 ? '01/08/2026' : undefined,
    },
    titleRecord: {
      categoryKey: 'title_king',
      categoryTitle: 'Kỷ Lục Gia Danh Hiệu',
      categoryIcon: '👑',
      student: topTitleCount > 0 ? topTitleStudent : null,
      metricValue: topTitleCount,
      metricLabel: `${topTitleCount} Danh Hiệu`,
      badgeLabel: '👑 KỶ LỤC HIỆN TẠI',
      sinceDate: topTitleCount > 0 ? '01/08/2026' : undefined,
    },
    weeklyKingRecord: {
      categoryKey: 'weekly_king',
      categoryTitle: 'Vua Top Tuần',
      categoryIcon: '🥇',
      student: topWeeklyCount > 0 ? topWeeklyStudent : null,
      metricValue: topWeeklyCount,
      metricLabel: `${topWeeklyCount} Lần Top 1 Tuần`,
      badgeLabel: '👑 KỶ LỤC HIỆN TẠI',
      sinceDate: topWeeklyCount > 0 ? '01/08/2026' : undefined,
    },
    monthlyKingRecord: {
      categoryKey: 'monthly_king',
      categoryTitle: 'Vua Top Tháng',
      categoryIcon: '🏆',
      student: topMonthlyCount > 0 ? topMonthlyStudent : null,
      metricValue: topMonthlyCount,
      metricLabel: `${topMonthlyCount} Lần Top 1 Tháng`,
      badgeLabel: '👑 KỶ LỤC HIỆN TẠI',
      sinceDate: topMonthlyCount > 0 ? '01/08/2026' : undefined,
    },
  };
}
