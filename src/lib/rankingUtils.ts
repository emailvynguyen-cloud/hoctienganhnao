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
  category: 'badge';
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
}

export const SYSTEM_BADGES_CATALOG: AchievementBadge[] = [
  {
    id: 'badge_first_step',
    title: '🌱 Khởi Đầu Mạnh Mẽ',
    category: 'badge',
    tier: 'Common',
    tierLabel: 'Common (Thường)',
    icon: '🌱',
    description: 'Hoàn thành 1 bài tập về nhà đầu tiên',
    conditionLabel: 'Hoàn thành 1 bài tập',
    targetCount: 1,
    badgeStyle: 'bg-slate-800 text-slate-100 border border-slate-600',
    glowClass: 'shadow-slate-500/20',
  },
  {
    id: 'badge_hw_master_5',
    title: '📚 Học Giả Siêu Cấp',
    category: 'badge',
    tier: 'Uncommon',
    tierLabel: 'Uncommon (Khá)',
    icon: '📚',
    description: 'Hoàn thành 5 bài tập về nhà xuất sắc',
    conditionLabel: 'Hoàn thành 5 bài tập',
    targetCount: 5,
    badgeStyle: 'bg-emerald-950 text-emerald-300 border border-emerald-500',
    glowClass: 'shadow-emerald-500/30',
  },
  {
    id: 'badge_hw_master_15',
    title: '🔥 Thách Thức Mọi Bài Tập',
    category: 'badge',
    tier: 'Rare',
    tierLabel: 'Rare (Hiếm)',
    icon: '🔥',
    description: 'Hoàn thành 15 bài tập về nhà xuất sắc',
    conditionLabel: 'Hoàn thành 15 bài tập',
    targetCount: 15,
    badgeStyle: 'bg-sky-950 text-sky-300 border border-sky-400',
    glowClass: 'shadow-sky-500/40',
  },
  {
    id: 'badge_hw_master_30',
    title: '💎 Huyền Thoại Bài Tập',
    category: 'badge',
    tier: 'Epic',
    tierLabel: 'Epic (Anh Hùng)',
    icon: '💎',
    description: 'Hoàn thành 30 bài tập về nhà xuất sắc',
    conditionLabel: 'Hoàn thành 30 bài tập',
    targetCount: 30,
    badgeStyle: 'bg-purple-950 text-purple-300 border border-purple-400',
    glowClass: 'shadow-purple-500/50',
  },
  {
    id: 'badge_star_collector_10',
    title: '⭐ Thu Hoạch Ngôi Sao',
    category: 'badge',
    tier: 'Uncommon',
    tierLabel: 'Uncommon (Khá)',
    icon: '⭐',
    description: 'Tích lũy đạt 10 ngôi sao chăm chỉ',
    conditionLabel: 'Tích lũy 10 ngôi sao',
    targetCount: 10,
    badgeStyle: 'bg-amber-950 text-amber-300 border border-amber-500',
    glowClass: 'shadow-amber-500/30',
  },
  {
    id: 'badge_star_collector_50',
    title: '👑 Thần Đồng Tiếng Anh',
    category: 'badge',
    tier: 'Legendary',
    tierLabel: 'Legendary (Huyền Thoại)',
    icon: '👑',
    description: 'Tích lũy đạt 50 ngôi sao thưởng từ giáo viên',
    conditionLabel: 'Tích lũy 50 ngôi sao',
    targetCount: 50,
    badgeStyle: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border-2 border-yellow-200',
    glowClass: 'shadow-yellow-500/60 animate-pulse',
  },
  {
    id: 'badge_perfect_attendance_5',
    title: '🛡️ Chuyên Cần Kiên Trì',
    category: 'badge',
    tier: 'Common',
    tierLabel: 'Common (Thường)',
    icon: '🛡️',
    description: 'Tham gia đầy đủ 5 buổi học liên tiếp',
    conditionLabel: 'Đi học đủ 5 buổi',
    targetCount: 5,
    badgeStyle: 'bg-slate-800 text-slate-200 border border-slate-500',
    glowClass: 'shadow-slate-500/20',
  },
  {
    id: 'badge_top_rank_weekly',
    title: '🏆 Quán Quân Tuần',
    category: 'badge',
    tier: 'Legendary',
    tierLabel: 'Legendary (Huyền Thoại)',
    icon: '🏆',
    description: 'Đạt Hạng 1 Bảng Xếp Hạng Tuần toàn trung tâm',
    conditionLabel: 'Đạt Top 1 Bảng Xếp Hạng Tuần',
    targetCount: 1,
    badgeStyle: 'bg-gradient-to-r from-yellow-500 via-amber-400 to-orange-500 text-slate-950 border-2 border-yellow-100',
    glowClass: 'shadow-amber-500/60',
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
    description: 'Hoàn thành 3 bài tập về nhà xuất sắc',
    conditionLabel: 'Hoàn thành 3 bài tập',
    targetCount: 3,
    badgeStyle: 'bg-emerald-950 text-emerald-200 border border-emerald-400',
  },
  {
    id: 'title_warrior',
    title: '🔥 Chiến Binh Kiên Trì',
    category: 'title',
    tier: 'Rare',
    tierLabel: 'Rare (Hiếm)',
    icon: '🔥',
    description: 'Hoàn thành 10 bài tập về nhà đạt chất lượng cao',
    conditionLabel: 'Hoàn thành 10 bài tập',
    targetCount: 10,
    badgeStyle: 'bg-sky-950 text-sky-200 border border-sky-400',
  },
  {
    id: 'title_diligence',
    title: '⭐ Chuyên Cần',
    category: 'title',
    tier: 'Uncommon',
    tierLabel: 'Uncommon (Khá)',
    icon: '⭐',
    description: 'Tham gia học tập đầy đủ không nghỉ buổi nào',
    conditionLabel: 'Tham gia 5 buổi học',
    targetCount: 5,
    badgeStyle: 'bg-amber-950 text-amber-200 border border-amber-400',
  },
  {
    id: 'title_star_student',
    title: '💎 Ngôi Sao Học Tập',
    category: 'title',
    tier: 'Rare',
    tierLabel: 'Rare (Hiếm)',
    icon: '💎',
    description: 'Tích lũy 15 ngôi sao thưởng từ giáo viên',
    conditionLabel: 'Đạt 15 ngôi sao',
    targetCount: 15,
    badgeStyle: 'bg-blue-950 text-blue-200 border border-blue-400',
  },
  {
    id: 'title_excellent',
    title: '🎓 Học Viên Xuất Sắc',
    category: 'title',
    tier: 'Epic',
    tierLabel: 'Epic (Anh Hùng)',
    icon: '🎓',
    description: 'Hoàn thành 20 bài tập về nhà & đạt đánh giá cao',
    conditionLabel: 'Hoàn thành 20 bài tập',
    targetCount: 20,
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
    description: 'Tích lũy 30+ ngôi sao & luôn dẫn đầu thành tích học tập',
    conditionLabel: 'Đạt 30 ngôi sao',
    targetCount: 30,
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
      description: 'Khung avatar mặc định',
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

  if (rank === 1) {
    return {
      frameId: 'monthly_top1',
      title: '🥇 Khung Hoàng Gia (Top 1 Tháng)',
      tier: 'Legendary',
      type: 'monthly',
      rankNumber: 1,
      frameCssClass: 'ring-4 ring-purple-500 ring-offset-2 ring-offset-slate-900 border-2 border-amber-300 animate-pulse shadow-lg shadow-purple-500/50',
      borderStyle: 'border-purple-500',
      badgeOverlayIcon: '👑',
      description: 'Tự động mở khóa khi đứng Hạng 1 Bảng Xếp Hạng Tháng',
    };
  }

  if (rank === 2) {
    return {
      frameId: 'monthly_top2',
      title: '🥈 Khung Kim Cương (Top 2 Tháng)',
      tier: 'Epic',
      type: 'monthly',
      rankNumber: 2,
      frameCssClass: 'ring-4 ring-cyan-400 ring-offset-2 border-2 border-white shadow-lg shadow-cyan-400/50',
      borderStyle: 'border-cyan-400',
      badgeOverlayIcon: '💎',
      description: 'Tự động mở khóa khi đứng Hạng 2 Bảng Xếp Hạng Tháng',
    };
  }

  if (rank === 3) {
    return {
      frameId: 'monthly_top3',
      title: '🥉 Khung Bạch Kim (Top 3 Tháng)',
      tier: 'Rare',
      type: 'monthly',
      rankNumber: 3,
      frameCssClass: 'ring-4 ring-slate-300 ring-offset-2 border-2 border-slate-100 shadow-md shadow-slate-400/40',
      borderStyle: 'border-slate-300',
      badgeOverlayIcon: '🔮',
      description: 'Tự động mở khóa khi đứng Hạng 3 Bảng Xếp Hạng Tháng',
    };
  }

  if (rank <= 5) {
    return {
      frameId: 'weekly_top5',
      title: '⭐ Khung Pha Lê / Ngôi Sao (Top 4-5)',
      tier: 'Uncommon',
      type: 'weekly',
      rankNumber: rank,
      frameCssClass: 'ring-4 ring-amber-400 ring-offset-2 border-2 border-yellow-200 shadow-md shadow-amber-400/40',
      borderStyle: 'border-amber-400',
      badgeOverlayIcon: '⭐',
      description: 'Tự động mở khóa khi thuộc Top 4-5 Bảng Xếp Hạng',
    };
  }

  if (rank <= 10) {
    return {
      frameId: 'weekly_top10',
      title: '🔷 Khung Sapphire / Xanh (Top 6-10)',
      tier: 'Common',
      type: 'weekly',
      rankNumber: rank,
      frameCssClass: 'ring-2 ring-sky-500 border-2 border-sky-300 shadow-xs',
      borderStyle: 'border-sky-500',
      badgeOverlayIcon: '🔷',
      description: 'Tự động mở khóa khi thuộc Top 6-10 Bảng Xếp Hạng',
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
  };
}

export function getEquippedTitleInfo(equippedTitleId?: string): AchievementTitle | null {
  if (!equippedTitleId) return null;
  return SYSTEM_TITLES_CATALOG.find((t) => t.id === equippedTitleId) || null;
}
