import React from 'react';
import { Student, Class, Session, HomeworkTask, HomeworkSubmission, Invoice, BankConfig } from '../../types';
import { StudentPortal } from '../student/StudentPortal';
import { Lock } from 'lucide-react';

interface PublicStudentPortalProps {
  publicHash: string;
  students: Student[];
  classes: Class[];
  sessions: Session[];
  homeworkTasks: HomeworkTask[];
  homeworkSubmissions: HomeworkSubmission[];
  invoices: Invoice[];
  bankConfig: BankConfig;
  onRefreshData: () => void;
  onExit: () => void;
}

export const PublicStudentPortal: React.FC<PublicStudentPortalProps> = ({
  publicHash,
  students,
  classes,
  sessions,
  homeworkTasks,
  homeworkSubmissions,
  invoices,
  bankConfig,
  onRefreshData,
  onExit,
}) => {
  const cleanTarget = (publicHash || '').trim().replace(/\s+/g, '').toUpperCase();
  const matchedStudent = students.find((s) => {
    if (!s || s.status === 'soft_deleted') return false;
    const matchHash = s.publicHash && s.publicHash.trim().replace(/\s+/g, '').toUpperCase() === cleanTarget;
    const matchId = s.id && s.id.trim().replace(/\s+/g, '').toUpperCase() === cleanTarget;
    const matchCode = s.studentCode && s.studentCode.trim().replace(/\s+/g, '').toUpperCase() === cleanTarget;
    return matchHash || matchId || matchCode;
  });

  if (!matchedStudent) {
    return (
      <div className="min-h-screen bg-pink-50/30 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-pink-200 text-center max-w-md space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Đường Dẫn Học Viên Không Hợp Lệ
          </h2>
          <p className="text-xs text-slate-500">
            Mã băm bảo mật <code className="font-mono text-pink-600">{publicHash}</code> không tồn tại trong hệ thống.
          </p>
        </div>
      </div>
    );
  }

  return (
    <StudentPortal
      currentStudent={matchedStudent}
      classes={classes}
      sessions={sessions}
      homeworkTasks={homeworkTasks}
      homeworkSubmissions={homeworkSubmissions}
      invoices={invoices}
      bankConfig={bankConfig}
      onRefreshData={onRefreshData}
    />
  );
};
