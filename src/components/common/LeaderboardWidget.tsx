import React, { useState } from 'react';
import { Student, Session, HomeworkSubmission } from '../../types';
import { StorageEngine } from '../../lib/storage';
import { Trophy, Star, Award, Sparkles, CheckCircle2, Flame, Medal, X, ArrowLeft, Crown } from 'lucide-react';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';

interface LeaderboardWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
  students: Student[];
  sessions: Session[];
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
  sessions,
}) => {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week');

  // DISPLAY ALL ACTIVE STUDENTS IN THE CENTER (NO CAPPING AT TOP 5)
  const activeStudents = (students || []).filter((s) => s && s.status !== 'soft_deleted');
  const allSubmissions: HomeworkSubmission[] = StorageEngine.getHomeworkSubmissions() || [];

  const currentYearMonth = new Date().toISOString().slice(0, 7); // e.g. "2025-07"

  const rankedStudents = activeStudents.map((student) => {
    const studentSubs = allSubmissions.filter((sub) => sub && sub.studentId === student.id);

    let filteredSubs = studentSubs;
    if (timeFilter === 'month') {
      filteredSubs = studentSubs.filter((sub) => sub.submissionDate && sub.submissionDate.startsWith(currentYearMonth));
    }

    const totalSubmitted = Math.max(1, filteredSubs.length);
    const feedbackCount = filteredSubs.filter((sub) => sub.isTeacherFeedbackChecked).length;

    const rate = Math.min(100, Math.round((feedbackCount / totalSubmitted) * 100));

    return {
      student,
      totalSubmitted,
      feedbackCount,
      rate,
    };
  }).sort((a, b) => b.rate - a.rate || b.feedbackCount - a.feedbackCount);

  const titlesList = timeFilter === 'week' ? WEEKLY_TITLES : MONTHLY_TITLES;

  const content = (
    <div className="space-y-6">
      {/* GLORIOUS HIGHLY DECORATED HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-white p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden border-2 border-amber-300">
        
        {/* Floating Background Stars & Crowns */}
        <div className="absolute top-2 right-12 opacity-20 text-4xl animate-pulse">👑</div>
        <div className="absolute bottom-2 right-24 opacity-20 text-3xl animate-bounce">⭐</div>
        <div className="absolute top-4 left-1/3 opacity-20 text-3xl">✨</div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/40 shadow-xl shrink-0">
              <Trophy className="w-9 h-9 text-amber-200 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md">
                  🏆 BẢNG THÀNH TÍCH THI ĐUA VINH DANH
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-white/30 text-white uppercase tracking-wider shadow-sm backdrop-blur-xs">
                  TOÀN BỘ {rankedStudents.length} HỌC VIÊN
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-1 font-extrabold max-w-lg">
                Vinh danh Top 5 danh hiệu cao quý và xếp hạng toàn bộ học viên trung tâm MS. VY ENGLISH
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Time Filter Selector Pills */}
            <div className="bg-black/30 backdrop-blur-md p-1.5 rounded-2xl flex items-center space-x-1 border border-white/30 shadow-inner">
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  timeFilter === 'week'
                    ? 'bg-gradient-to-r from-amber-300 to-amber-500 text-amber-950 shadow-md scale-105'
                    : 'text-amber-100 hover:bg-white/10'
                }`}
              >
                🏆 Xếp Hạng Tuần
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  timeFilter === 'month'
                    ? 'bg-gradient-to-r from-pink-300 to-pink-500 text-pink-950 shadow-md scale-105'
                    : 'text-amber-100 hover:bg-white/10'
                }`}
              >
                👑 Xếp Hạng Tháng
              </button>
            </div>

            {/* EXIT BUTTON */}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-white font-black text-xs transition shadow-md flex items-center shrink-0 border border-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Thoát
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard List - ALL STUDENTS (DISPLAY ENTIRE CENTER STUDENTS) */}
      <div className="space-y-3.5">
        {rankedStudents.map((item, index) => {
          const isTop1 = index === 0;
          const isTop2 = index === 1;
          const isTop3 = index === 2;
          
          // ONLY TOP 5 SHOW HONOR TITLES
          const honorTitle = index < 5 ? titlesList[index] : null;
          const avatarSrc = resolveAvatarUrl(item.student.avatar);

          return (
            <div
              key={item.student.id}
              className={`p-4 sm:p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                isTop1
                  ? 'bg-gradient-to-r from-amber-100/90 via-yellow-100/70 to-pink-100/90 border-amber-400 shadow-xl ring-4 ring-amber-300/40 scale-[1.01]'
                  : isTop2
                  ? 'bg-gradient-to-r from-slate-100/95 via-purple-50/90 to-pink-50/90 border-slate-300 shadow-md'
                  : isTop3
                  ? 'bg-gradient-to-r from-orange-100/80 via-amber-50 to-pink-50 border-orange-300 shadow-sm'
                  : index < 5
                  ? 'bg-gradient-to-r from-purple-50/90 to-pink-50/80 border-purple-200'
                  : 'bg-white dark:bg-slate-900 border-purple-100 dark:border-purple-800/60'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* RANK ICON BADGE */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                  {isTop1 ? (
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-md border-2 border-white animate-bounce text-xl">
                      🥇
                    </div>
                  ) : isTop2 ? (
                    <div className="w-12 h-12 rounded-2xl bg-slate-300 text-slate-900 flex items-center justify-center font-black shadow-md border-2 border-white text-xl">
                      🥈
                    </div>
                  ) : isTop3 ? (
                    <div className="w-12 h-12 rounded-2xl bg-orange-300 text-orange-950 flex items-center justify-center font-black shadow-md border-2 border-white text-xl">
                      🥉
                    </div>
                  ) : index === 3 ? (
                    <div className="w-10 h-10 rounded-xl bg-purple-200 text-purple-900 flex items-center justify-center font-black text-base">
                      🏅
                    </div>
                  ) : index === 4 ? (
                    <div className="w-10 h-10 rounded-xl bg-pink-200 text-pink-900 flex items-center justify-center font-black text-base">
                      🌟
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs font-mono">
                      #{index + 1}
                    </div>
                  )}
                </div>

                {/* AVATAR WITH TOP 1 CROWN OVERLAY */}
                <div className="relative shrink-0">
                  <img
                    src={avatarSrc}
                    alt={item.student.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                    }}
                    className={`w-13 h-13 rounded-2xl object-cover border-2 shadow-md ${
                      isTop1 ? 'border-amber-400 ring-2 ring-amber-300' : 'border-purple-200'
                    }`}
                  />
                  {isTop1 && (
                    <div className="absolute -top-3 -right-2 text-xl animate-pulse">
                      👑
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h4 className="font-black text-base text-slate-900 dark:text-white">
                      {item.student.name}
                    </h4>
                    {/* ONLY TOP 5 SHOW HONOR TITLES */}
                    {honorTitle && (
                      <span className={`px-3 py-1 rounded-full text-xs font-black shadow-xs ${
                        isTop1
                          ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-white border border-amber-300'
                          : 'bg-pink-100 text-pink-800 border border-pink-200'
                      }`}>
                        {honorTitle}
                      </span>
                    )}
                  </div>
                  {/* REMOVED SUBTEXT UNDER STUDENT NAME AS REQUESTED */}
                </div>
              </div>

              {/* PROGRESS BAR & COMPLETION RATE */}
              <div className="sm:w-52 space-y-1.5 shrink-0">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-purple-900 dark:text-purple-200 flex items-center">
                    <Flame className="w-4 h-4 mr-1 text-pink-500 animate-pulse" /> Tỷ lệ hoàn thành bài:
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-black text-sm">{item.rate}%</span>
                </div>

                <div className="w-full bg-purple-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden p-0.5 border border-purple-200">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      item.rate >= 80
                        ? 'bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600'
                        : item.rate >= 50
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                        : 'bg-slate-400'
                    }`}
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Exit Button at bottom */}
      {onClose && (
        <div className="pt-4 text-center">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black text-xs hover:from-purple-700 hover:to-pink-700 shadow-lg inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Thoát Bảng Thi Đua & Quay Về Màn Hình Chính
          </button>
        </div>
      )}
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border-2 border-purple-100 dark:border-purple-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            title="Thoát quay về màn hình chính"
          >
            <X className="w-5 h-5" />
          </button>
          {content}
        </div>
      </div>
    );
  }

  return content;
};
