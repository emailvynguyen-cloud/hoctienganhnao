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

  // ALWAYS FETCH FRESH REALTIME STUDENTS FROM STORAGEENGINE
  const freshStudentsList = StorageEngine.getStudents() || students;
  const activeStudents = (freshStudentsList || []).filter((s) => s && s.status !== 'soft_deleted');
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
      score: feedbackCount * 10 + (student.completedHomeworkTaskIds?.length || 0) * 5,
    };
  }).sort((a, b) => b.score - a.score);

  const titlesList = timeFilter === 'week' ? WEEKLY_TITLES : MONTHLY_TITLES;

  const content = (
    <div className="space-y-6">
      {/* SOFT PASTEL HEADER BANNER */}
      <div className="bg-gradient-to-r from-pink-200 via-rose-100 to-sky-100 text-pink-950 p-6 sm:p-8 rounded-3xl shadow-sm relative overflow-hidden border-2 border-pink-300">
        
        {/* Floating Background Stars & Crowns */}
        <div className="absolute top-2 right-12 opacity-20 text-4xl animate-pulse">👑</div>
        <div className="absolute bottom-2 right-24 opacity-20 text-3xl animate-bounce">⭐</div>
        <div className="absolute top-4 left-1/3 opacity-20 text-3xl">✨</div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-3xl bg-white/60 backdrop-blur-md flex items-center justify-center border-2 border-white shadow-xs shrink-0">
              <Trophy className="w-9 h-9 text-amber-500 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-pink-950">
                  🏆 BẢNG THÀNH TÍCH THI ĐUA VINH DANH
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-pink-400 text-white uppercase tracking-wider shadow-xs">
                  TOÀN BỘ {rankedStudents.length} HỌC VIÊN
                </span>
              </div>
              <p className="text-xs text-pink-900 mt-1 font-extrabold max-w-lg">
                Vinh danh Top 5 danh hiệu cao quý và xếp hạng toàn bộ học viên trung tâm MS. VY ENGLISH
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Time Filter Selector Pills */}
            <div className="bg-white/70 backdrop-blur-md p-1.5 rounded-2xl flex items-center space-x-1 border border-pink-200 shadow-xs">
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  timeFilter === 'week'
                    ? 'bg-amber-300 text-amber-950 shadow-xs scale-105 border border-amber-400'
                    : 'text-slate-700 hover:bg-pink-100'
                }`}
              >
                🏆 Xếp Hạng Tuần
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  timeFilter === 'month'
                    ? 'bg-pink-300 text-pink-950 shadow-xs scale-105 border border-pink-400'
                    : 'text-slate-700 hover:bg-pink-100'
                }`}
              >
                👑 Xếp Hạng Tháng
              </button>
            </div>

            {/* EXIT BUTTON */}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition shadow-xs flex items-center shrink-0 border border-slate-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Thoát
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard List - ALL STUDENTS */}
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
              className={`p-4 sm:p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:shadow-md ${
                isTop1
                  ? 'bg-gradient-to-r from-amber-100/90 via-yellow-100/70 to-pink-100/90 border-amber-300 shadow-md ring-4 ring-amber-200/40 scale-[1.01]'
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
                    SĐT: {item.student.phone || 'Chưa cập nhật'} • Tích lũy: <strong>{item.student.completedHomeworkTaskIds?.length || 0} bài đã hoàn thành</strong>
                  </p>
                </div>
              </div>

              {/* SCORE & COMPLETION RATE METRICS */}
              <div className="flex items-center space-x-4 border-t sm:border-t-0 border-pink-100 pt-2 sm:pt-0 justify-between sm:justify-end">
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block">
                    Tỷ Lệ Hoàn Thành
                  </span>
                  <div className="text-sm font-black text-pink-600 dark:text-pink-400 flex items-center justify-end">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-500" />
                    {item.rate}%
                  </div>
                </div>

                <div className="text-right bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl border border-pink-200 shadow-2xs">
                  <span className="text-[10px] uppercase tracking-wider font-black text-pink-700 block">
                    Điểm Thi Đua
                  </span>
                  <span className="text-lg font-black text-pink-950 dark:text-white font-mono">
                    {item.score} <span className="text-xs font-extrabold text-pink-600">ĐTS</span>
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
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border-2 border-pink-100 p-6 max-h-[90vh] overflow-y-auto relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 z-20"
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
