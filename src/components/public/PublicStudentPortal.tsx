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
  const matchedStudent = students.find((s) => s.publicHash === publicHash);

  if (!matchedStudent) {
    return (
      <div className="min-h-screen bg-purple-50/50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-purple-200 text-center max-w-md space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Đường Dẫn Học Viên Không Hợp Lệ
          </h2>
          <p className="text-xs text-slate-500">
            Mã băm bảo mật <code className="font-mono text-purple-600">{publicHash}</code> không tồn tại trong hệ thống.
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
