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

    // Average feedback stars from feedbacked submissions in this period
    const ratedSubs = feedbackedSubmissions.filter((sub) => typeof sub.ratingStars === 'number' && sub.ratingStars > 0);
    const averageStars = ratedSubs.length > 0
      ? parseFloat((ratedSubs.reduce((sum, s) => sum + (s.ratingStars || 5), 0) / ratedSubs.length).toFixed(1))
      : 5.0;

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
    return b.averageStars - a.averageStars;
  });

  const titlesList = timeFilter === 'week' ? WEEKLY_TITLES : MONTHLY_TITLES;

  const content = (
    <div className="space-y-6">
      
      {/* REDESIGNED CLEAN & ELEGANT HEADER BANNER */}
      <div className="bg-gradient-to-r from-pink-100/90 via-rose-50 to-sky-100/90 dark:from-slate-900 dark:to-slate-900 p-6 sm:p-7 rounded-3xl border-2 border-pink-200 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Top Row: Icon, Main Title & Close Button */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-300 to-yellow-400 text-amber-950 flex items-center justify-center font-black text-xl shadow-xs border-2 border-white shrink-0">
              🏆
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                BẢNG THÀNH TÍCH VINH DANH
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                Vinh danh học viên xuất sắc nhất trung tâm MS. VY ENGLISH
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-pink-100 text-slate-500 hover:text-pink-600 transition shadow-xs border border-pink-200 dark:border-slate-700 shrink-0"
              title="Đóng bảng vinh danh"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom Row: Filter Switcher Bar & Total Counter Badge */}
        <div className="pt-2 border-t border-pink-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          <div className="flex items-center space-x-2">
            {/* Filter Toggle Buttons */}
            <div className="bg-white/90 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-pink-200 dark:border-slate-700 flex items-center space-x-1 shadow-2xs">
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  timeFilter === 'week'
                    ? 'bg-amber-300 text-amber-950 shadow-xs border border-amber-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50'
                }`}
              >
                🏆 Xếp Hạng Tuần
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  timeFilter === 'month'
                    ? 'bg-pink-300 text-pink-950 shadow-xs border border-pink-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50'
                }`}
              >
                👑 Xếp Hạng Tháng
              </button>
            </div>

            <span className="px-3 py-1.5 rounded-2xl text-xs font-black bg-pink-100 text-pink-950 border border-pink-200 shrink-0">
              Toàn bộ {rankedStudents.length} Học Viên
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-bold hidden md:block">
            💡 Tiêu chí xét hạng: Tỷ lệ hoàn thành → Số bài đã làm → Điểm sao chất lượng
          </div>

        </div>

      </div>

      {/* LEADERBOARD LIST - RANKED STUDENTS */}
      <div className="space-y-3.5">
        {rankedStudents.map((item, index) => {
          const isTop1 = index === 0;
          const isTop2 = index === 1;
          const isTop3 = index === 2;
          
          // TOP 5 HONOR TITLES
          const honorTitle = index < 5 ? titlesList[index] : null;
          const avatarSrc = resolveAvatarUrl(item.student.avatar);

          return (
            <div
              key={item.student.id}
              className={`p-4 sm:p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
                isTop1
                  ? 'bg-gradient-to-r from-amber-100/90 via-yellow-50 to-pink-100/90 border-amber-300 shadow-md ring-4 ring-amber-200/40 scale-[1.01]'
                  : isTop2
                  ? 'bg-gradient-to-r from-slate-100/95 via-pink-50/90 to-sky-50/90 border-slate-300 shadow-xs'
                  : isTop3
                  ? 'bg-gradient-to-r from-amber-50/80 via-yellow-50 to-pink-50 border-amber-200 shadow-xs'
                  : index < 5
                  ? 'bg-gradient-to-r from-pink-50/90 to-sky-50/80 border-pink-200'
                  : 'bg-white dark:bg-slate-900 border-pink-100 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* RANK ICON BADGE */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                  {isTop1 ? (
                    <div className="w-12 h-12 rounded-2xl bg-amber-300 text-amber-950 flex items-center justify-center font-black shadow-xs border-2 border-white animate-bounce text-xl">
                      🥇
                    </div>
                  ) : isTop2 ? (
                    <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-900 flex items-center justify-center font-black shadow-xs border-2 border-white text-xl">
                      🥈
                    </div>
                  ) : isTop3 ? (
                    <div className="w-12 h-12 rounded-2xl bg-amber-200 text-amber-950 flex items-center justify-center font-black shadow-xs border-2 border-white text-xl">
                      🥉
                    </div>
                  ) : index === 3 ? (
                    <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-900 flex items-center justify-center font-black text-base">
                      🏅
                    </div>
                  ) : index === 4 ? (
                    <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-900 flex items-center justify-center font-black text-base">
                      🌟
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-900 flex items-center justify-center font-black text-xs font-mono">
                      #{index + 1}
                    </div>
                  )}
                </div>

                {/* AVATAR IMAGE CONTAINER */}
                <div className="relative shrink-0 w-14 h-14 min-w-[56px] min-h-[56px]">
                  <img
                    src={avatarSrc}
                    alt={item.student.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                    }}
                    className={`w-14 h-14 min-w-[56px] min-h-[56px] rounded-2xl object-cover border-2 shadow-xs ${
                      isTop1 ? 'border-amber-400 ring-2 ring-amber-300' : 'border-pink-200'
                    }`}
                  />
                  {isTop1 && (
                    <div className="absolute -top-3 -right-2 text-xl animate-pulse">
                      👑
                    </div>
                  )}
                </div>

                {/* STUDENT NAME & HONOR NICKNAME BADGE */}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      {item.student.name}
                    </h4>

                    {/* SHOW HONOR TITLE ONLY FOR TOP 5 */}
                    {honorTitle && (
                      <span className={`px-3 py-1 rounded-full text-xs font-black shadow-xs ${
                        isTop1
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border border-amber-300 animate-pulse'
                          : isTop2
                          ? 'bg-gradient-to-r from-slate-200 to-slate-300 text-slate-900 border border-slate-300'
                          : isTop3
                          ? 'bg-gradient-to-r from-orange-200 to-amber-300 text-amber-950 border border-amber-300'
                          : 'bg-pink-100 text-pink-950 border border-pink-200'
                      }`}>
                        {honorTitle}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
                    SĐT: {item.student.phone || 'Chưa cập nhật'}
                  </p>
                </div>
              </div>

              {/* 3 METRIC PILLS: COMPLETION RATE, TOTAL TASKS & QUALITY STARS */}
              <div className="flex flex-wrap items-center gap-2.5 border-t sm:border-t-0 border-pink-100 pt-3 sm:pt-0 justify-end shrink-0">
                
                {/* METRIC 1: COMPLETION RATE */}
                <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 text-center min-w-[100px]">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                    Tỷ Lệ Hoàn Thành
                  </span>
                  <span className="text-sm font-black text-emerald-950 dark:text-emerald-200 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    {item.completionRate}%
                  </span>
                </div>

                {/* METRIC 2: TOTAL COMPLETED TASKS */}
                <div className="px-3.5 py-2 rounded-2xl bg-pink-50 dark:bg-slate-800 border border-pink-200 text-center min-w-[90px]">
                  <span className="text-[10px] uppercase font-bold text-pink-800 dark:text-pink-300 block">
                    Số Bài Đã Làm
                  </span>
                  <span className="text-sm font-black text-pink-950 dark:text-white font-mono flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5 mr-1 text-pink-500" />
                    {item.completedCount} Bài
                  </span>
                </div>

                {/* METRIC 3: FEEDBACK QUALITY STARS */}
                <div className="px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-amber-200 text-center min-w-[95px]">
                  <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                    Chất Lượng
                  </span>
                  <span className="text-sm font-black text-amber-950 dark:text-white font-mono flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 mr-1 fill-current text-amber-500" />
                    {item.averageStars} / 5
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border-2 border-pink-100 p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
