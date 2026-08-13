import React from 'react';
import { Student } from '../../../types';
import { Trophy, Award, Flame, Crown, Sparkles } from 'lucide-react';

interface PracticeLeaderboardViewProps {
  currentStudent?: Student | null;
}

export const PracticeLeaderboardView: React.FC<PracticeLeaderboardViewProps> = ({ currentStudent }) => {
  const leaderboardData = [
    { rank: 1, name: 'Phạm Minh Anh', score: '98%', attempts: 18, badge: '🥇 Top 1 Champion' },
    { rank: 2, name: 'Nguyễn Hoàng Nam', score: '95%', attempts: 15, badge: '🥈 Top 2 Master' },
    { rank: 3, name: 'Lê Bảo Ngọc', score: '92%', attempts: 14, badge: '🥉 Top 3 Elite' },
    { rank: 4, name: 'Trần Đăng Khoa', score: '90%', attempts: 12, badge: '⭐ Top 4' },
    { rank: 5, name: 'Đỗ Thảo Nguyên', score: '88%', attempts: 10, badge: '⭐ Top 5' },
  ];

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
        {leaderboardData.map((item) => {
          const isCurrentStudent = currentStudent && currentStudent.name === item.name;
          return (
            <div
              key={item.rank}
              className={`p-4 rounded-2xl border flex items-center justify-between transition ${
                isCurrentStudent
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 ring-2 ring-purple-500'
                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-slate-800 text-purple-700 font-black text-xs flex items-center justify-center shrink-0">
                  #{item.rank}
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>{item.name}</span>
                    {isCurrentStudent && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-black uppercase">
                        Bạn
                      </span>
                    )}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-400">{item.badge}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-black text-purple-600 dark:text-purple-400">
                  {item.score}
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
