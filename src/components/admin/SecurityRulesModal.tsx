import React from 'react';
import { Shield, X, Copy, Check, Lock, Code } from 'lucide-react';
import { copyToClipboard } from '../../lib/vietqr';

interface SecurityRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIREBASE_RULES_CODE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() && request.auth.token.admin == true;
    }

    function isTeacher() {
      return isAuthenticated() && (request.auth.token.teacher == true || request.auth.token.admin == true);
    }

    function isStudent() {
      return isAuthenticated() && request.auth.token.student == true;
    }

    // Collections
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /students/{studentId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || isTeacher();
    }

    match /classes/{classId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    match /sessions/{sessionId} {
      allow read: if isAuthenticated();
      allow create, update: if isTeacher();
      allow delete: if isAdmin();
    }

    match /homework_tasks/{taskId} {
      allow read: if isAuthenticated();
      allow write: if isTeacher();
    }

    match /homework_submissions/{submissionId} {
      allow read: if isAuthenticated();
      allow create, update: if isAuthenticated();
    }

    match /invoices/{invoiceId} {
      allow read: if isAdmin() || (isAuthenticated() && resource.data.studentId == request.auth.uid);
      allow write: if isAdmin();
    }
  }
}`;

export const SecurityRulesModal: React.FC<SecurityRulesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    copyToClipboard(FIREBASE_RULES_CODE, () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Firestore Security Rules & Custom Claims
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cấu hình phân quyền bảo mật 3 tầng: Admin, Teacher & Student
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 space-y-1">
            <p className="font-semibold flex items-center">
              <Lock className="w-4 h-4 mr-1.5" /> Phân quyền Custom Claims (Firebase Auth):
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li><strong className="text-purple-700 dark:text-purple-300">Admin:</strong> Toàn quyền CRUD dữ liệu học viên, lớp học, học phí VietQR và cài đặt hệ thống.</li>
              <li><strong className="text-purple-700 dark:text-purple-300">Teacher:</strong> Điểm danh hàng loạt (Bulk Attendance), nhập nội dung bài học, nộp bài tập và cho sao/huy hiệu.</li>
              <li><strong className="text-purple-700 dark:text-purple-300">Student:</strong> Xem tiến độ học tập, nộp bài tập cá nhân, theo dõi hóa đơn và truy cập qua Obfuscated NanoID Hash.</li>
            </ul>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-mono flex items-center">
                <Code className="w-3.5 h-3.5 mr-1" /> firestore.rules
              </span>
              <button
                onClick={handleCopy}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Đã sao chép
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Sao chép Rules
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {FIREBASE_RULES_CODE}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
