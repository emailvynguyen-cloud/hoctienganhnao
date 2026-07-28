import React, { useState } from 'react';
import { StorageEngine } from '../../lib/storage';
import { DollarSign, Calendar } from 'lucide-react';
import { formatVND } from '../../lib/vietqr';

export const MonthlyRevenueWidget: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-07');

  const revenueReport = StorageEngine.calculateMonthlyRevenue(selectedMonth);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-purple-800 shadow-sm p-6 space-y-6">
      
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 dark:border-purple-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-emerald-600 animate-pulse" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Tổng Quan Doanh Thu Học Phí Phân Bổ Theo Tháng
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Doanh thu thực tế tính từ các buổi học đã diễn ra trong tháng
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-950/50 p-2 rounded-2xl border border-purple-200">
          <Calendar className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-bold text-slate-700 dark:text-purple-200">Tháng:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white dark:bg-slate-800 text-xs font-black text-purple-900 dark:text-white px-3 py-1 rounded-xl border border-purple-200 focus:outline-none"
          >
            <option value="2025-07">Tháng 07 / 2025</option>
            <option value="2025-06">Tháng 06 / 2025</option>
            <option value="2025-05">Tháng 05 / 2025</option>
            <option value="2025-08">Tháng 08 / 2025</option>
          </select>
        </div>
      </div>

      {/* Revenue Result Display Box (2 Columns, Formula Removed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg space-y-2">
          <span className="text-xs font-extrabold uppercase text-emerald-100">
            Tổng Doanh Thu Tháng {selectedMonth.split('-')[1]}
          </span>
          <h4 className="text-2xl sm:text-3xl font-black">
            {formatVND(revenueReport.totalRevenue)}
          </h4>
          <p className="text-[11px] text-emerald-100 font-medium">
            Đã thu từ các buổi dạy thực tế trong tháng
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800 space-y-2">
          <span className="text-xs font-bold uppercase text-purple-600 dark:text-purple-300">
            Số Học Viên Đang Học
          </span>
          <h4 className="text-2xl font-black text-purple-900 dark:text-white">
            {revenueReport.studentBreakdown.length} Học Viên
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">
            Tham gia các lớp trực thuộc trung tâm
          </p>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-xs text-purple-900 dark:text-purple-200 uppercase tracking-wider">
          Chi Tiết Doanh Thu Từng Học Viên Trong Tháng {selectedMonth.split('-')[1]}
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 font-black border-b border-purple-100">
                <th className="p-3 rounded-l-2xl">Học Viên</th>
                <th className="p-3">Đơn Giá 1 Buổi</th>
                <th className="p-3">Số Buổi Học Trong Tháng</th>
                <th className="p-3 rounded-r-2xl text-right">Doanh Thu Phân Bổ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100 dark:divide-purple-900/40">
              {revenueReport.studentBreakdown.map((row) => (
                <tr key={row.studentId} className="hover:bg-purple-50/50 transition">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {row.studentName}
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                    {formatVND(row.perSessionPrice)} / buổi
                  </td>
                  <td className="p-3 font-bold text-purple-600">
                    {row.sessionsTaughtInMonth} buổi
                  </td>
                  <td className="p-3 font-black text-emerald-600 dark:text-emerald-400 text-right font-mono">
                    {formatVND(row.monthlyRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
