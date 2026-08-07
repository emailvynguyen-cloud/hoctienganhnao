import React, { useState } from 'react';
import { Student, Session, HomeworkSubmission } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { Trophy, Star, CheckCircle2, Flame, Medal, X, ArrowLeft, Crown, BookOpen, Award } from 'lucide-react';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';
import { getCurrentWeekRange, getCurrentMonthString, getPreviousWeekRange, getPreviousMonthString } from '../../lib/dateUtils';
import { StudentAvatarWithFrame } from './StudentAvatarWithFrame';
import { getEquippedTitleInfo } from '../../lib/rankingUtils';

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

  // PREVIOUS PERIOD CHAMPION COMPUTATION (RANK 1 OF LAST WEEK / LAST MONTH)
  const { prevMondayStr, prevSundayStr } = getPreviousWeekRange();
  const prevWeekRanked = activeStudents.map((student) => {
    const targetSessions = allSessions.filter((s) => s && s.date && student.classIds?.includes(s.classId) && s.date >= prevMondayStr && s.date <= prevSundayStr);
    const targetSessionIds = new Set(targetSessions.map((s) => s.id));
    const targetHwItems = targetSessions.flatMap((s) => s.homeworkItems || []);
    const feedbackedSubmissions = allSubmissions.filter((sub) => sub && sub.studentId === student.id && sub.sessionId && targetSessionIds.has(sub.sessionId) && (sub.isTeacherFeedbackChecked || sub.feedbackStatus === 'COMPLETED' || (typeof sub.ratingStars === 'number' && sub.ratingStars > 0) || (sub.feedbackText && sub.feedbackText.trim() !== '')));
    const feedbackedHwItems = targetHwItems.filter((hw) => feedbackedSubmissions.some((sub) => sub.homeworkTaskId === hw.id || sub.homeworkTitle === hw.title));
    const totalCount = feedbackedHwItems.length > 0 ? feedbackedHwItems.length : feedbackedSubmissions.length;
    const completedHomeworkIds = student.completedHomeworkTaskIds || [];
    const completedCount = feedbackedHwItems.length > 0 ? feedbackedHwItems.filter((hw) => completedHomeworkIds.includes(hw.id) || feedbackedSubmissions.some((sub) => (sub.homeworkTaskId === hw.id || sub.homeworkTitle === hw.title) && (sub.isStudentChecked || sub.completionStatus === 'COMPLETED'))).length : feedbackedSubmissions.filter((sub) => sub.isStudentChecked || sub.completionStatus === 'COMPLETED').length;
    const completionRate = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;
    const ratedSubs = feedbackedSubmissions.filter((sub) => typeof sub.ratingStars === 'number' && sub.ratingStars > 0);
    const averageStars = ratedSubs.length > 0 ? parseFloat((ratedSubs.reduce((sum, s) => sum + (s.ratingStars || 5), 0) / ratedSubs.length).toFixed(1)) : null;
    return { studentId: student.id, completionRate, completedCount, averageStars };
  }).sort((a, b) => {
    if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
    if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
    return (b.averageStars || 0) - (a.averageStars || 0);
  });
  const prevWeekChampionId = (prevWeekRanked.length > 0 && prevWeekRanked[0].completionRate > 0) ? prevWeekRanked[0].studentId : null;

  const prevMonthStr = getPreviousMonthString();
  const prevMonthRanked = activeStudents.map((student) => {
    const targetSessions = allSessions.filter((s) => s && s.date && student.classIds?.includes(s.classId) && s.date.startsWith(prevMonthStr));
    const targetSessionIds = new Set(targetSessions.map((s) => s.id));
    const targetHwItems = targetSessions.flatMap((s) => s.homeworkItems || []);
    const feedbackedSubmissions = allSubmissions.filter((sub) => sub && sub.studentId === student.id && sub.sessionId && targetSessionIds.has(sub.sessionId) && (sub.isTeacherFeedbackChecked || sub.feedbackStatus === 'COMPLETED' || (typeof sub.ratingStars === 'number' && sub.ratingStars > 0) || (sub.feedbackText && sub.feedbackText.trim() !== '')));
    const feedbackedHwItems = targetHwItems.filter((hw) => feedbackedSubmissions.some((sub) => sub.homeworkTaskId === hw.id || sub.homeworkTitle === hw.title));
    const totalCount = feedbackedHwItems.length > 0 ? feedbackedHwItems.length : feedbackedSubmissions.length;
    const completedHomeworkIds = student.completedHomeworkTaskIds || [];
    const completedCount = feedbackedHwItems.length > 0 ? feedbackedHwItems.filter((hw) => completedHomeworkIds.includes(hw.id) || feedbackedSubmissions.some((sub) => (sub.homeworkTaskId === hw.id || sub.homeworkTitle === hw.title) && (sub.isStudentChecked || sub.completionStatus === 'COMPLETED'))).length : feedbackedSubmissions.filter((sub) => sub.isStudentChecked || sub.completionStatus === 'COMPLETED').length;
    const completionRate = totalCount > 0 ? Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;
    const ratedSubs = feedbackedSubmissions.filter((sub) => typeof sub.ratingStars === 'number' && sub.ratingStars > 0);
    const averageStars = ratedSubs.length > 0 ? parseFloat((ratedSubs.reduce((sum, s) => sum + (s.ratingStars || 5), 0) / ratedSubs.length).toFixed(1)) : null;
    return { studentId: student.id, completionRate, completedCount, averageStars };
  }).sort((a, b) => {
    if (b.completionRate !== a.completionRate) return b.completionRate - a.completionRate;
    if (b.completedCount !== a.completedCount) return b.completedCount - a.completedCount;
    return (b.averageStars || 0) - (a.averageStars || 0);
  });
  const prevMonthChampionId = (prevMonthRanked.length > 0 && prevMonthRanked[0].completionRate > 0) ? prevMonthRanked[0].studentId : null;

  // RANKING COMPUTATION WITH STRICT REAL-TIME TIME RANGE & FEEDBACKED HOMEWORK ONLY
  const rankedStudents = activeStudents.map((student) => {
    const targetSessions = allSessions.filter((s) => {
      if (!s || !s.date || !student.classIds || !student.classIds.includes(s.classId)) {
        return false;
      }
      if (timeFilter === 'month') {
        return s.date.startsWith(currentMonthStr);
      } else {
        return s.date >= mondayStr && s.date <= sundayStr;
      }
    });

    const targetHwItems = targetSessions.flatMap((s) => s.homeworkItems || []);
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
      : null;

    return {
      student,
      completionRate,
      completedCount,
      totalAssignedCount: totalFeedbackedCount,
      averageStars,
    };
  }).sort((a, b) => {
    if (b.completionRate !== a.completionRate) {
      return b.completionRate - a.completionRate;
    }
    if (b.completedCount !== a.completedCount) {
      return b.completedCount - a.completedCount;
    }
    const starsA = a.averageStars || 0;
    const starsB = b.averageStars || 0;
    return starsB - starsA;
  });

  const titlesList = timeFilter === 'week' ? WEEKLY_TITLES : MONTHLY_TITLES;

  const content = (
    <div className="space-y-6">
      
      {/* REDESIGNED LUXURY VINH DANH HEADER BANNER WITH DECORATIVE ACCENTS */}
      <div className="relative bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-indigo-500/20 dark:from-amber-950/50 dark:via-rose-950/40 dark:to-indigo-950/50 p-6 sm:p-7 rounded-3xl border-2 border-amber-300/70 dark:border-amber-700/60 shadow-lg shadow-amber-500/10 space-y-5 overflow-hidden">
        
        {/* DECORATIVE LIGHT RAYS & STARS BACKGROUND ACCENTS */}
        <div className="absolute -top-6 -right-6 text-7xl opacity-20 pointer-events-none select-none">
          ✨
        </div>
        <div className="absolute -bottom-8 -left-8 text-7xl opacity-15 pointer-events-none select-none">
          🌟
        </div>

        {/* Top Row: Icon, Main Title & Close Button */}
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 flex items-center justify-center font-black text-2xl shadow-md border-2 border-yellow-200 shrink-0 transform hover:rotate-6 transition duration-200">
              🏆
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  BẢNG THÀNH TÍCH VINH DANH
                </h3>
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-400 text-amber-950 border border-yellow-300 shadow-2xs">
                  🌿 TOP EXCELLENCE 🌿
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-1">
                Tuyên dương & vinh danh những học viên xuất sắc nhất trung tâm MS. VY ENGLISH
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-white text-slate-500 hover:text-slate-800 dark:hover:text-white transition border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer shadow-2xs"
              title="Đóng bảng vinh danh"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Bottom Row: Filter Switcher Bar & Total Counter Badge */}
        <div className="pt-4 border-t border-amber-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          
          <div className="flex items-center space-x-2">
            {/* Filter Toggle Buttons */}
            <div className="bg-white/90 dark:bg-slate-800 p-1.5 rounded-2xl border border-amber-200/70 dark:border-slate-700 flex items-center space-x-1 shadow-2xs">
              <button
                onClick={() => setTimeFilter('week')}
                className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 cursor-pointer flex items-center ${
                  timeFilter === 'week'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-300" /> Xếp Hạng Tuần
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`h-10 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-150 cursor-pointer flex items-center ${
                  timeFilter === 'month'
                    ? 'bg-rose-500 text-white shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Crown className="w-3.5 h-3.5 mr-1.5 text-amber-300" /> Xếp Hạng Tháng
              </button>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-semibold bg-white/70 dark:bg-slate-800/70 px-3.5 py-2 rounded-xl border border-amber-200/50 dark:border-slate-700/60 shrink-0">
            📊 Tiêu chí: Tỷ lệ hoàn thành → Số bài đã làm → Điểm sao chất lượng
          </div>

        </div>

      </div>

      {/* LEADERBOARD LIST - RANKED STUDENTS WITH TIER BACKGROUNDS */}
      <div className="space-y-3.5">
        {rankedStudents.map((item, index) => {
          if (!item || !item.student) return null;
          const isTop1 = index === 0;
          const isTop2 = index === 1;
          const isTop3 = index === 2;
          const honorTitle = index < 5 ? titlesList[index] : null;
          const avatarSrc = resolveAvatarUrl(item.student.avatar);
          
          // Calculate Previous Period Champion Caption
          let championCaption = null;
          if (item.student.id === prevWeekChampionId && item.student.id === prevMonthChampionId) {
            championCaption = '🏆 Quán quân tuần trước • 👑 Quán quân tháng trước';
          } else if (item.student.id === prevWeekChampionId) {
            championCaption = '🏆 Quán quân tuần trước';
          } else if (item.student.id === prevMonthChampionId) {
            championCaption = '👑 Quán quân tháng trước';
          }

          // LUXURY NON-PLAIN-WHITE BACKGROUND PER RANK ACCORDING TO SPEC:
          // Rank 1: Luxury Gold / Metallic Amber Gradient
          // Rank 2: Sleek Silver Metallic Gradient
          // Rank 3: Warm Bronze / Copper Gradient
          // Rank 4: Deep Sapphire Blue Gradient
          // Rank 5: Vibrant Emerald Green Gradient
          // Rank 6-10: Soft Harmonious Slate/Indigo
          // Rank 11+: Soft Neutral Slate
          const rankRowStyleClass =
            index === 0
              ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border-2 border-yellow-200 shadow-md shadow-amber-500/30 transform hover:-translate-y-1 hover:shadow-xl transition-all duration-200 font-extrabold'
              : index === 1
              ? 'bg-gradient-to-r from-slate-200 via-slate-100 to-slate-300 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 text-slate-900 dark:text-white border-2 border-slate-300 dark:border-slate-600 shadow-md shadow-slate-400/20 transform hover:-translate-y-1 hover:shadow-xl transition-all duration-200'
              : index === 2
              ? 'bg-gradient-to-r from-amber-100 via-orange-100 to-amber-200 dark:from-amber-950/60 dark:via-orange-950/50 dark:to-amber-900/60 text-amber-950 dark:text-amber-100 border-2 border-amber-300 dark:border-amber-700 shadow-md shadow-orange-500/20 transform hover:-translate-y-1 hover:shadow-xl transition-all duration-200'
              : index === 3
              ? 'bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/40 dark:via-blue-950/30 dark:to-indigo-950/40 text-slate-900 dark:text-white border border-sky-300 dark:border-sky-800 shadow-xs transform hover:-translate-y-1 hover:shadow-md transition-all duration-200'
              : index === 4
              ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-900/40 text-slate-900 dark:text-white border border-emerald-300 dark:border-emerald-800 shadow-xs transform hover:-translate-y-1 hover:shadow-md transition-all duration-200'
              : index < 10
              ? 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-2xs hover:-translate-y-0.5 hover:border-slate-300 transition-all duration-200'
              : 'bg-slate-50/90 dark:bg-slate-850/60 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:-translate-y-0.5 transition-all duration-200';

          return (
            <div
              key={item.student.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${rankRowStyleClass}`}
            >
              <div className="flex items-center space-x-4">
                {/* RANK ICON BADGE */}
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0">
                  {isTop1 ? (
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 flex items-center justify-center font-black shadow-md border-2 border-yellow-100 text-xl">
                      👑
                    </div>
                  ) : isTop2 ? (
                    <div className="w-11 h-11 rounded-2xl bg-slate-300 text-slate-900 flex items-center justify-center font-black shadow-md border border-slate-200 text-xl">
                      🥈
                    </div>
                  ) : isTop3 ? (
                    <div className="w-11 h-11 rounded-2xl bg-amber-300 text-amber-950 flex items-center justify-center font-black shadow-md border border-amber-200 text-xl">
                      🥉
                    </div>
                  ) : index < 5 ? (
                    <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-black text-sm shadow-xs">
                      #{index + 1}
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                      #{index + 1}
                    </div>
                  )}
                </div>

                {/* AVATAR IMAGE CONTAINER WITH RANK FRAME */}
                <div className="relative shrink-0">
                  <StudentAvatarWithFrame
                    student={item.student}
                    allStudents={freshStudentsList}
                    allSessions={allSessions}
                    allSubmissions={allSubmissions}
                    sizeClassName="w-12 h-12"
                  />
                </div>

                {/* STUDENT NAME, EQUIPPED TITLE & HONOR NICKNAME BADGE */}
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base sm:text-lg font-extrabold leading-tight">
                      {item.student.name}
                    </h4>

                    {/* EQUIPPED TITLE OR HONOR BADGE */}
                    {(() => {
                      const equippedTitle = getEquippedTitleInfo(item.student.equippedTitleId);
                      if (equippedTitle) {
                        return (
                          <span className={`px-3 py-1 rounded-xl text-xs font-black shadow-2xs border ${equippedTitle.badgeStyle}`}>
                            {equippedTitle.title}
                          </span>
                        );
                      }
                      return honorTitle ? (
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
                      ) : null;
                    })()}
                  </div>

                  {/* PREVIOUS PERIOD CHAMPION CAPTION (IF APPLICABLE) */}
                  {championCaption && (
                    <div className="flex items-center space-x-1.5 mt-1.5">
                      <span className="text-[10px] font-bold text-amber-950 dark:text-amber-100 bg-amber-200/80 dark:bg-amber-900/80 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700">
                        {championCaption}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3 METRIC PILLS: COMPLETION RATE, TOTAL TASKS & QUALITY STARS */}
              <div className="flex flex-wrap items-center gap-2.5 border-t sm:border-t-0 border-black/10 dark:border-white/10 pt-3 sm:pt-0 justify-end shrink-0">
                
                {/* METRIC 1: COMPLETION RATE */}
                <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 dark:bg-emerald-950/50 border border-emerald-500/30 text-center min-w-[100px]">
                  <span className="text-[10px] uppercase font-black opacity-90 block tracking-wider">
                    Hoàn Thành
                  </span>
                  <span className="text-sm font-black flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600 dark:text-emerald-400" />
                    {item.completionRate}%
                  </span>
                </div>

                {/* METRIC 2: TOTAL COMPLETED TASKS */}
                <div className="px-3.5 py-2 rounded-xl bg-black/10 dark:bg-white/10 border border-black/10 text-center min-w-[90px]">
                  <span className="text-[10px] uppercase font-black opacity-90 block tracking-wider">
                    Đã Làm
                  </span>
                  <span className="text-sm font-black flex items-center justify-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    {item.completedCount} Bài
                  </span>
                </div>

                {/* METRIC 3: FEEDBACK QUALITY STARS */}
                <div className="px-3.5 py-2 rounded-xl bg-amber-500/20 dark:bg-amber-950/50 border border-amber-500/30 text-center min-w-[100px]">
                  <span className="text-[10px] uppercase font-black opacity-90 block tracking-wider">
                    Chất Lượng
                  </span>
                  <span className="text-sm font-black flex items-center justify-center">
                    {item.averageStars !== null ? (
                      <>
                        <Star className="w-4 h-4 mr-1 fill-current text-amber-500" />
                        {item.averageStars} / 5
                      </>
                    ) : (
                      <span className="text-xs opacity-75 font-medium italic">
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border-2 border-amber-300/80 dark:border-amber-700/80 p-6 sm:p-8 max-h-[92vh] overflow-y-auto relative">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
