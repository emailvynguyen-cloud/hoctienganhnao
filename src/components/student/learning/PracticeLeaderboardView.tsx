import React from 'react';
import { Student } from '../../../types';
import { StorageEngine } from '../../../lib/storage';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../../lib/kakaotalkAvatars';

interface PracticeLeaderboardViewProps {
  currentStudent?: Student | null;
}

export const PracticeLeaderboardView: React.FC<PracticeLeaderboardViewProps> = ({ currentStudent }) => {
  const allStudents = StorageEngine.getStudents() || [];
  const allSubmissions = StorageEngine.getHomeworkSubmissions() || [];

  const activeStudents = allStudents.filter((s) => s && s.status !== 'soft_deleted');

  const rankedData = activeStudents
    .map((std) => {
      const completedHwCount = (std.completedHomeworkTaskIds || []).length;
      const subs = allSubmissions.filter(
        (s) => s && s.studentId === std.id && (s.isStudentChecked || s.completionStatus === 'COMPLETED')
      );
      const attempts = completedHwCount || subs.length || 0;

      return {
        studentId: std.id,
        name: std.name || 'Học viên',
        avatar: std.avatar || '',
        stars: std.stars || 0,
        attempts,
      };
    })
    .sort((a, b) => {
      if (b.stars !== a.stars) return b.stars - a.stars;
      return b.attempts - a.attempts;
    });

  return (
    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-purple-100 dark:border-slate-800 space-y-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <span>🏆 Bảng Xếp Hạng Ôn Luyện Daily Practice</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Thi đua tỷ lệ chính xác và số lượt luyện tập chăm chỉ hàng ngày.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {rankedData.slice(0, 10).map((item, idx) => {
          const rank = idx + 1;
          const isCurrentStudent =
            currentStudent && (currentStudent.id === item.studentId || currentStudent.name === item.name);
          const badgeText =
            rank === 1
              ? '🥇 Top 1 Champion'
              : rank === 2
              ? '🥈 Top 2 Master'
              : rank === 3
              ? '🥉 Top 3 Elite'
              : `⭐ Top ${rank}`;

          return (
            <div
              key={item.studentId}
              className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                isCurrentStudent
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 ring-2 ring-purple-500'
                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-black text-xs flex items-center justify-center shrink-0">
                  #{rank}
                </span>
                <img
                  src={resolveAvatarUrl(item.avatar)}
                  alt={item.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
                  }}
                  className="w-9 h-9 rounded-xl object-cover border border-purple-200"
                />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>{item.name}</span>
                    {isCurrentStudent && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-black uppercase">
                        Bạn
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-400">{badgeText}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-black text-purple-600 dark:text-purple-400">
                  ⭐ {item.stars} sao
                </div>
                <div className="text-[11px] font-bold text-slate-400">
                  {item.attempts} bài hoàn thành
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
