import React, { useState } from 'react';
import { Student, Session } from '../../types';
import { Trophy, Star, Award, Sparkles, CheckCircle2, Flame, Medal, X, ArrowLeft } from 'lucide-react';

interface LeaderboardWidgetProps {
  isOpen?: boolean;
  onClose?: () => void;
  students: Student[];
  sessions: Session[];
}

export const LeaderboardWidget: React.FC<LeaderboardWidgetProps> = ({
  isOpen = true,
  onClose,
  students,
  sessions,
}) => {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week');

  const activeStudents = students.filter((s) => s.status !== 'soft_deleted');

  const rankedStudents = activeStudents.map((student) => {
    const studentSessions = sessions.filter((ses) =>
      ses.attendance.some((att) => att.studentId === student.id)
    );

    const totalCount = Math.max(1, studentSessions.length);
    const completedCount = student.completedHomeworkTaskIds ? student.completedHomeworkTaskIds.length : 0;
    const rate = Math.min(100, Math.round((completedCount / totalCount) * 100));

    let nickname = student.honorNickname || '⭐ Ngôi Sao Tri Thức';
    if (rate >= 80) nickname = '👑 Chiến Thần Chăm Học';
    else if (rate >= 60) nickname = '⚡ Siêu Sao Bài Tập';
    else if (rate >= 40) nickname = '🧙‍♂️ Phù Thủy Từ Vựng';
    else if (rate >= 20) nickname = '🎯 Bậc Thầy Cần Cù';

    return {
      student,
      totalCount,
      completedCount,
      rate,
      nickname,
    };
  }).sort((a, b) => b.rate - a.rate || b.completedCount - a.completedCount);

  const content = (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-400 via-pink-400 to-purple-500 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner shrink-0">
              <Trophy className="w-8 h-8 text-amber-100 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <h3 className="text-xl font-black tracking-tight">
                  Bảng Thành Tích Thi Đua Vinh Danh
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/30 uppercase tracking-wider">
                  HOT TOP 1
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-1 font-medium">
                Xếp hạng tỷ lệ hoàn thành bài tập về nhà từ cao đến thấp của tất cả học viên
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Time Filter Pill Selector */}
            <div className="bg-black/20 backdrop-blur-md p-1 rounded-2xl flex items-center space-x-1 border border-white/20">
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  timeFilter === 'week'
                    ? 'bg-white text-amber-900 shadow-md'
                    : 'text-amber-100 hover:bg-white/10'
                }`}
              >
                Tuần Này
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  timeFilter === 'month'
                    ? 'bg-white text-amber-900 shadow-md'
                    : 'text-amber-100 hover:bg-white/10'
                }`}
              >
                Tháng Này
              </button>
            </div>

            {/* EXIT BUTTON FOR MAIN DASHBOARD INTEGRATION */}
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-2xl bg-slate-900 text-white font-extrabold text-xs hover:bg-slate-800 transition shadow-md flex items-center shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Thoát Màn Hình Chính
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-3">
        {rankedStudents.map((item, index) => {
          const isTop1 = index === 0;
          const isTop2 = index === 1;
          const isTop3 = index === 2;

          return (
            <div
              key={item.student.id}
              className={`p-4 rounded-3xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm ${
                isTop1
                  ? 'bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-pink-50 border-amber-300 shadow-md'
                  : isTop2
                  ? 'bg-gradient-to-r from-slate-100/80 to-purple-50 border-slate-300'
                  : isTop3
                  ? 'bg-gradient-to-r from-orange-50/80 to-pink-50 border-orange-200'
                  : 'bg-white dark:bg-slate-900 border-purple-100 dark:border-purple-800/60'
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-sm">
                  {isTop1 ? (
                    <span className="text-2xl">🥇</span>
                  ) : isTop2 ? (
                    <span className="text-2xl">🥈</span>
                  ) : isTop3 ? (
                    <span className="text-2xl">🥉</span>
                  ) : (
                    <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                      #{index + 1}
                    </span>
                  )}
                </div>

                <img
                  src={item.student.avatar}
                  alt={item.student.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-200 shadow-md shrink-0"
                />

                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h4 className="font-black text-sm text-slate-900 dark:text-white">
                      {item.student.name}
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-pink-100 text-pink-700 border border-pink-200">
                      {item.nickname}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Đã hoàn thành <strong>{item.completedCount}</strong> bài tập về nhà
                  </p>
                </div>
              </div>

              <div className="sm:w-48 space-y-1.5 shrink-0">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-purple-700 flex items-center">
                    <Flame className="w-3.5 h-3.5 mr-1 text-pink-500" /> Tỷ lệ hoàn thành:
                  </span>
                  <span className="text-amber-600 font-extrabold">{item.rate}%</span>
                </div>

                <div className="w-full bg-purple-100 h-3 rounded-full overflow-hidden p-0.5 border border-purple-200/50">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.rate >= 80
                        ? 'bg-gradient-to-r from-amber-400 to-pink-500'
                        : item.rate >= 50
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500'
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

      {/* Exit Button at bottom as well */}
      {onClose && (
        <div className="pt-4 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-purple-600 text-white font-extrabold text-xs hover:bg-purple-700 shadow-md inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Thoát Bảng Thi Đua & Quay Về Tràn Chính
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
