import React, { useState } from 'react';
import { StorageEngine } from '../../lib/storage';
import { DollarSign, Calendar, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { formatVND } from '../../lib/vietqr';

export const MonthlyRevenueWidget: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-07');

  const revenueReport = StorageEngine.calculateMonthlyRevenue(selectedMonth);

  // CALCULATE DAILY REVENUE BREAKDOWN
  const sessions = StorageEngine.getSessions() || [];
  const students = StorageEngine.getStudents() || [];

  const monthSessions = sessions.filter((s) => s && s.date && s.date.startsWith(selectedMonth));

  const dailyMap: Record<string, { date: string; sessionCount: number; revenue: number; details: string[] }> = {};

  monthSessions.forEach((sess) => {
    const dateStr = sess.date;
    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = { date: dateStr, sessionCount: 0, revenue: 0, details: [] };
    }

    dailyMap[dateStr].sessionCount += 1;

    const classStudents = students.filter((s) => s && s.status !== 'soft_deleted' && s.classIds?.includes(sess.classId));

    let sessionRev = 0;
    classStudents.forEach((std) => {
      const pkgPrice = std.tuitionPackagePrice || 2000000;
      const pkgSessions = std.packageSessionCount || 8;
      const perSession = pkgPrice / pkgSessions;
      sessionRev += perSession;
    });

    dailyMap[dateStr].revenue += sessionRev;
    dailyMap[dateStr].details.push(`Buổi #${sess.sessionNumber} (${classStudents.length} học viên)`);
  });

  const dailyList = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
      
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-100 dark:border-slate-800 pb-4">
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
        <div className="flex items-center space-x-2 bg-pink-50 dark:bg-slate-800 p-2 rounded-2xl border border-pink-200">
          <Calendar className="w-4 h-4 text-pink-600" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Tháng:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white dark:bg-slate-900 text-xs font-black text-pink-950 dark:text-white px-3 py-1 rounded-xl border border-pink-200 focus:outline-none"
          >
            <option value="2025-07">Tháng 07 / 2025</option>
            <option value="2025-06">Tháng 06 / 2025</option>
            <option value="2025-05">Tháng 05 / 2025</option>
            <option value="2025-08">Tháng 08 / 2025</option>
          </select>
        </div>
      </div>

      {/* Revenue Result Display Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-200 via-teal-100 to-emerald-100 text-emerald-950 shadow-xs border-2 border-emerald-300 space-y-2">
          <span className="text-xs font-extrabold uppercase text-emerald-900">
            Tổng Doanh Thu Tháng {selectedMonth.split('-')[1]}
          </span>
          <h4 className="text-2xl sm:text-3xl font-black text-emerald-950">
            {formatVND(revenueReport.totalRevenue)}
          </h4>
          <p className="text-[11px] text-emerald-800 font-medium">
            Đã thu từ các buổi dạy thực tế trong tháng
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-pink-50 dark:bg-slate-800 border border-pink-200 space-y-2">
          <span className="text-xs font-bold uppercase text-pink-800 dark:text-pink-300">
            Số Học Viên Đang Học
          </span>
          <h4 className="text-2xl font-black text-pink-950 dark:text-white">
            {revenueReport.studentBreakdown.length} Học Viên
          </h4>
          <p className="text-[11px] text-slate-500 font-medium">
            Tham gia các lớp trực thuộc trung tâm
          </p>
        </div>
      </div>

      {/* MỤC MỚI: DOANH THU MỖI NGÀY TRONG THÁNG */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50/60 via-teal-50/40 to-pink-50/50 border border-emerald-200 dark:bg-slate-900 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 animate-pulse" />
            <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
              📆 Bảng Doanh Thu Chi Tiết Mỗi Ngày Trong Tháng {selectedMonth.split('-')[1]}
            </h4>
          </div>
          <span className="text-xs font-black text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
            {dailyList.length} Ngày Có Ca Dạy
          </span>
        </div>

        {dailyList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {dailyList.map((dayItem) => (
              <div
                key={dayItem.date}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-100 shadow-xs space-y-1.5 hover:border-emerald-300 transition"
              >
                <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                  <span className="text-xs font-black text-pink-950 dark:text-slate-200">
                    🗓️ Ngày {dayItem.date.split('-').reverse().join('/')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 bg-pink-50 px-2 py-0.5 rounded-md">
                    {dayItem.sessionCount} Ca Dạy
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500 font-medium">Doanh thu ngày:</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    +{formatVND(dayItem.revenue)}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 font-medium truncate">
                  {dayItem.details.join(' • ')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center bg-white/80 rounded-2xl text-xs text-slate-500 italic">
            Chưa có thông tin ca dạy nào được ghi nhận trong tháng này.
          </div>
        )}
      </div>

      {/* Breakdown Table */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-xs text-pink-900 dark:text-pink-300 uppercase tracking-wider">
          Chi Tiết Doanh Thu Từng Học Viên Trong Tháng {selectedMonth.split('-')[1]}
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-pink-100 dark:bg-slate-800 text-pink-950 dark:text-white font-black border-b border-pink-200">
                <th className="p-3 rounded-l-2xl">Học Viên</th>
                <th className="p-3">Đơn Giá 1 Buổi</th>
                <th className="p-3">Số Buổi Học Trong Tháng</th>
                <th className="p-3 rounded-r-2xl text-right">Doanh Thu Phân Bổ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-100 dark:divide-slate-800">
              {revenueReport.studentBreakdown.map((row) => (
                <tr key={row.studentId} className="hover:bg-pink-50/50 transition">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {row.studentName}
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                    {formatVND(row.perSessionPrice)} / buổi
                  </td>
                  <td className="p-3 font-bold text-pink-600">
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
