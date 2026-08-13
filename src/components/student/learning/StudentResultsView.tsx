import React from 'react';
import { Student } from '../../../types';
import { Award, CheckCircle2, Clock, Sparkles, Trophy } from 'lucide-react';

interface StudentResultsViewProps {
  currentStudent?: Student | null;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({ currentStudent }) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-pink-100 dark:border-slate-800 space-y-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <span>📊 Kết Quả Học Tập & Ôn Luyện Của Tôi</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Tổng hợp kết quả luyện tập Daily Practice và điểm số bài thi Chapter Test.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-pink-50/60 dark:bg-slate-800/60 border border-pink-100 dark:border-slate-700 space-y-2">
          <span className="text-[10px] font-black text-pink-600 uppercase tracking-widest block">
            Daily Practice Status
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            95% Best Score
          </div>
          <p className="text-xs text-slate-500 font-bold">
            Đã hoàn thành: 12 lượt ôn tập
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-slate-800/60 border border-rose-100 dark:border-slate-700 space-y-2">
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block">
            Official Chapter Test
          </span>
          <div className="text-2xl font-black text-emerald-600 flex items-center space-x-2">
            <span>90%</span>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black">
              PASSED ✅
            </span>
          </div>
          <p className="text-xs text-slate-500 font-bold">
            Thời gian hoàn thành: 7 phút
          </p>
        </div>
      </div>
    </div>
  );
};
