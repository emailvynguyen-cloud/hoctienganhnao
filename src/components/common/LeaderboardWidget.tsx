import React, { useState } from 'react';
import { Student, Session, HomeworkSubmission } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { Trophy, Star, CheckCircle2, Flame, Medal, X, ArrowLeft, Crown, BookOpen, Award } from 'lucide-react';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';
import { getCurrentWeekRange, getCurrentMonthString } from '../../lib/dateUtils';

interface LeaderboardWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
  students: Student[];
  classes?: any[];
  sessions?: Session[];
}

const WEEKLY_TITLES = [
  '🥇 Ngôi Sao Chăm Chỉ 👑',
  '🥈 Ngôi Sao Nỗ Lực ⭐',
  '🥉 Chiến Binh Kiên Trì 💪',
  '🏅 Nhà Chinh Phục 🚀',
  '🌟 Ngôi Sao Tiến Bộ ✨',
];

const MONTHLY_TITLES = [
  '🥇 Huyền Thoại Học Tập 👑',
  '🥈 Nhà Vô Địch Kiên Trì ⭐',
  '🥉 Bậc Thầy Tiến Bộ 💪',
  '🏅 Chiến Binh Bền Bỉ 🚀',
  '✨ Người Truyền Cảm Hứng 🌟',
];

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  isOpen = true,
  onClose,
  students,
  sessions = [],
}) => {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week');

  // FETCH FRESH DATA FROM STORAGEENGINE
  const freshStudentsList = StorageEngine.getStudents() || students || [];
  const activeStudents = freshStudentsList.filter((s) => s && s.status !== 'soft_deleted');
  const allSessions = StorageEngine.getSessions() || sessions || [];
  const allSubmissions: HomeworkSubmission[] = StorageEngine.getHomeworkSubmissions() || [];

  const { mondayStr, sundayStr } = getCurrentWeekRange();
  const currentMonthStr = getCurrentMonthString();

  // RANKING COMPUTATION WITH STRICT REAL-TIME TIME RANGE & FEEDBACKED HOMEWORK ONLY
  const rankedStudents = activeStudents.map((student) => {
    // 1. Get student's sessions strictly occurring in the current week or current month (real time)
    const targetSessions = allSessions.filter((s) => {
      if (!s || !s.date || !student.classIds || !student.classIds.includes(s.classId)) {
        return false;
      }
      if (timeFilter === 'month') {
        return s.date.startsWith(currentMonthStr);
      } else {
        // week filter: strictly within current week (Monday to Sunday)
        return s.date >= mondayStr && s.date <= sundayStr;
      }
    });

    // 2. Homework items in target sessions
    const targetHwItems = targetSessions.flatMap((s) => s.homeworkItems || []);

    // 3. Submissions for this student in target sessions THAT HAVE BEEN FEEDBACK-ED BY TEACHER/ADMIN
    const targetSessionIds = new Set(targetSessions.map((s) => s.id));
    const feedbackedSubmissions = allSubmissions.filter((sub) =>
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

    // Filter target hw items that have teacher feedback
    const feedbackedHwItems = targetHwItems.filter((hw) =>
      feedbackedSubmissions.some((sub) => sub.homeworkTaskId === hw.id || sub.homeworkTitle === hw.title)
    );

    // Total feedbacked homework count (or total feedbacked submissions)
    const totalFeedbackedCount = feedbackedHwItems.length > 0 ? feedbackedHwItems.length : feedbackedSubmissions.length;

    // Completed & feedbacked count
    const completedHomeworkIds = student.completedHomeworkTaskIds || [];
    const completedCount = feedbackedHwItems.length > 0
      ? feedbackedHwItems.filter((hw) =>
          completedHomeworkIds.includes(hw.id) ||
          feedbackedSubmissions.some((sub) => (sub.homeworkTaskId === hw.id || sub.homeworkTitle === hw.title) && (sub.isStudentChecked || sub.completionStatus === 'COMPLETED'))
        ).length
      : feedbackedSubmissions.filter((sub) => sub.isStudentChecked || sub.completionStatus === 'COMPLETED').length;

    // Completion rate % based strictly on feedbacked homework in the period
    const completionRate = totalFeedbackedCount > 0
      ? Math.min(100, Math.round((completedCount / totalFeedbackedCount) * 100))
      : 0;

    // Average feedback stars from feedbacked submissions in this period (null if no data yet)
    const ratedSubs = feedbackedSubmissions.filter((sub) => typeof sub.ratingStars === 'number' && sub.ratingStars > 0);
    const averageStars = ratedSubs.length > 0
      ? parseFloat((ratedSubs.reduce((sum, s) => sum + (s.ratingStars || 5), 0) / ratedSubs.length).toFixed(1))
      : null;

    return {
      student,
      completionRate,
      completedCount,
      totalAssignedCount: totalFeedbackedCount,
      averageStars,
    };
  }).sort((a, b) => {
    // TIE-BREAKER 1: Completion Rate % (Higher first)
    if (b.completionRate !== a.completionRate) {
      return b.completionRate - a.completionRate;
    }
    // TIE-BREAKER 2: Total Completed Homework Count (Higher first)
    if (b.completedCount !== a.completedCount) {
      return b.completedCount - a.completedCount;
    }
    // TIE-BREAKER 3: Quality of Homework (Average Feedback Stars) (Higher first)
    const starsA = a.averageStars || 0;
    const starsB = b.averageStars || 0;
    return starsB - starsA;
  });

  const titlesList = timeFilter === 'week' ? WEEKLY_TITLES : MONTHLY_TITLES;

  const content = (
    <div className="space-y-6">
      
      {/* REDESIGNED CLEAN & ELEGANT HEADER BANNER */}
      <div className="bg-slate-50/80 dark:bg-slate-800/50 p-6 rounded-2xl border border-transparent space-y-4 shadow-2xs">
        
        {/* Top Row: Icon, Main Title & Close Button */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-xl border border-transparent shrink-0">
              <Trophy className="w-5.5 h-5.5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                BẢNG THÀNH TÍCH VINH DANH
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal">
                Vinh danh học viên xuất sắc nhất trung tâm MS. VY ENGLISH
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition border border-transparent shrink-0 cursor-pointer"
              title="Đóng bảng vinh danh"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom Row: Filter Switcher Bar & Total Counter Badge */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2">
            {/* Filter Toggle Buttons */}
            <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-transparent flex items-center space-x-1 shadow-2xs">
              <button
                onClick={() => setTimeFilter('week')}
                className={`h-10 px-4 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  timeFilter === 'week'
                    ? 'bg-rose-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Xếp Hạng Tuần
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`h-10 px-4 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                  timeFilter === 'month'
                    ? 'bg-rose-500 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Xếp Hạng Tháng
              </button>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-500 font-normal hidden md:block">
            Tiêu chí: Tỷ lệ hoàn thành → Số bài đã làm → Điểm sao chất lượng
          </div>

        </div>

      </div>

      {/* LEADERBOARD LIST - RANKED STUDENTS */}
      <div className="space-y-3">
        {rankedStudents.map((item, index) => {
          if (!item || !item.student) return null;
          const isTop1 = index === 0;
          const isTop2 = index === 1;
          const isTop3 = index === 2;
          const honorTitle = index < 5 ? titlesList[index] : null;
          const avatarSrc = resolveAvatarUrl(item.student.avatar);
          // PASTEL BG PER RANK ACCORDING TO SPEC:
          // Rank 1: Pastel Gold/Amber
          // Rank 2: Pastel Silver/Slate
          // Rank 3: Pastel Bronze/Orange
          // Rank 4: Pastel Soft Sky Blue
          // Rank 5: Pastel Soft Emerald Green
          // Rank 6-10: Neutral Soft Slate
          // Rank 11+: Clean White
          const rankPastelBgClass =
            index === 0
              ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200/80 hover:border-amber-300'
              : index === 1
              ? 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-200/80 hover:border-slate-300'
              : index === 2
              ? 'bg-orange-50/90 dark:bg-orange-950/30 border-orange-200/80 hover:border-orange-300'
              : index === 3
              ? 'bg-sky-50/90 dark:bg-sky-950/30 border-sky-200/80 hover:border-sky-300'
              : index === 4
              ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200/80 hover:border-emerald-300'
              : index < 10
              ? 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/60 hover:border-slate-300'
              : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-800';

          return (
            <div
              key={item.student.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs ${rankPastelBgClass}`}
            >
              <div className="flex items-center space-x-4">
                {/* RANK ICON BADGE */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                  {isTop1 ? (
                    <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-bold shadow-2xs text-lg">
                      🥇
                    </div>
                  ) : isTop2 ? (
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center font-bold shadow-2xs text-lg">
                      🥈
                    </div>
                  ) : isTop3 ? (
                    <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shadow-2xs text-lg">
                      🥉
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-medium text-xs">
                      #{index + 1}
                    </div>
                  )}
                </div>

                {/* AVATAR IMAGE CONTAINER */}
                <div className="relative shrink-0 w-12 h-12">
                  <img
                    src={avatarSrc}
                    alt={item.student.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                    }}
                    className="w-12 h-12 rounded-xl object-cover shadow-2xs"
                  />
                </div>

                {/* STUDENT NAME & HONOR NICKNAME BADGE */}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                      {item.student.name}
                    </h4>

                    {/* SHOW HONOR TITLE ONLY FOR TOP 5 WITH HIGH-QUALITY TIER BADGE CARD STYLING */}
                    {honorTitle && (
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold shadow-xs border flex items-center shrink-0 ${
                        index === 0
                          ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border-yellow-200 shadow-amber-500/30 font-black'
                          : index === 1
                          ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/30 font-bold'
                          : index === 2
                          ? 'bg-blue-600 text-white border-blue-400 shadow-blue-500/30 font-bold'
                          : index === 3
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/30 font-bold'
                          : 'bg-slate-700 text-slate-100 border-slate-500 shadow-slate-900/30 font-bold'
                      }`}>
                        {honorTitle}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                    SĐT: {item.student.phone || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              {/* 3 METRIC PILLS: COMPLETION RATE, TOTAL TASKS & QUALITY STARS */}
              <div className="flex flex-wrap items-center gap-2.5 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0 justify-end shrink-0">
                
                {/* METRIC 1: COMPLETION RATE */}
                <div className="px-3.5 py-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-transparent text-center min-w-[100px]">
                  <span className="text-xs uppercase font-medium text-emerald-800 dark:text-emerald-400 block">
                    Hoàn Thành
                  </span>
                  <span className="text-sm font-semibold text-emerald-950 dark:text-emerald-200 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                    {item.completionRate}%
                  </span>
                </div>

                {/* METRIC 2: TOTAL COMPLETED TASKS */}
                <div className="px-3.5 py-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/80 border border-transparent text-center min-w-[90px]">
                  <span className="text-xs uppercase font-medium text-slate-500 dark:text-slate-400 block">
                    Đã Làm
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 mr-1 text-slate-500" />
                    {item.completedCount} Bài
                  </span>
                </div>

                {/* METRIC 3: FEEDBACK QUALITY STARS */}
                <div className="px-3.5 py-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-transparent text-center min-w-[100px]">
                  <span className="text-xs uppercase font-medium text-amber-800 dark:text-amber-400 block">
                    Chất Lượng
                  </span>
                  <span className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center justify-center">
                    {item.averageStars !== null ? (
                      <>
                        <Star className="w-4 h-4 mr-1 fill-current text-amber-500" />
                        {item.averageStars} / 5
                      </>
                    ) : (
                      <span className="text-xs text-slate-400 font-normal italic">
                        Chưa đánh giá
                      </span>
                    )}
                  </span>
                </div>

              </div>

            </div>
          );
        })}
      </div>
    </div>
  );

  if (!isOpen) return null;

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 max-h-[90vh] overflow-y-auto relative">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
