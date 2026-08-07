export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  password?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  isLocked?: boolean;
  createdAt: string;
}

export type ResourceType = 'drive' | 'docs' | 'sheets' | 'pdf' | 'youtube' | 'quizlet' | 'canva' | 'notion' | 'other';

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  type?: ResourceType;
  icon?: string;
  isHidden?: boolean;
  order?: number;
  addedDate?: string;
}

export interface HomeworkTaskItem {
  id: string;
  title: string;
  content?: string;
  attachmentUrl?: string;
  deadline?: string;
}

export interface StudentFeedback {
  strengths?: string; // Điểm mạnh riêng của học viên này
  improvements?: string; // Điểm cần cải thiện riêng của học viên này
  materialTitle?: string; // Tên tài liệu riêng cho học viên này (legacy)
  materialUrl?: string; // Link dẫn đến tài liệu riêng cho học viên này (legacy)
  materials?: ResourceLink[]; // Danh sách nhiều tài liệu riêng cho học viên này
}

export interface InternalNoteEntry {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface Student {
  id: string;
  publicHash: string;
  name: string;
  email: string;
  phone: string;
  parentPhone?: string;
  classIds: string[];
  remainingSessions: number;
  totalPaidSessions: number;
  tuitionPackagePrice?: number;
  packageSessionCount?: number;
  status: 'active' | 'soft_deleted';
  stars: number;
  badges: string[];
  avatar: string;
  notes?: string;
  internalNotes?: string; // Ghi chú nội bộ học viên (chỉ dành riêng cho Admin/Super Admin/Giáo viên)
  internalNotesHistory?: InternalNoteEntry[];
  honorNickname?: string;
  equippedTitleId?: string; // ID danh hiệu đang được học viên trang bị
  completedHomeworkTaskIds?: string[]; // IDs các homework item mà học viên đã check xong
  resourceLinks?: ResourceLink[];
  createdAt: string;
}

export interface Class {
  id: string;
  className: string;
  code: string;
  teacherId: string;
  teacherName: string;
  coTeacherIds?: string[]; // Danh sách các giáo viên phụ trách cùng
  adminId?: string; // Admin quản lý phụ trách trực tiếp lớp học
  adminName?: string;
  schedule: string;
  room: string;
  courseName: string;
  totalStudents: number;
  status: 'active' | 'completed' | 'paused' | 'archived';
  startSessionNumber?: number; // Số thứ tự buổi học bắt đầu khi tạo lớp (mặc định 1)
  zoomLink?: string;
  resourceLinks?: ResourceLink[];
  teacherPayRatePerSession?: number; // Bậc lương từng buổi dạy (VNĐ / buổi học), ví dụ: 150.000đ
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: 'student' | 'class' | 'session' | 'user' | 'tuition' | 'permission' | 'note';
  targetId?: string;
  targetName?: string;
  classId?: string;
  className?: string;
  details: string;
}

export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late';

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string;
}

export interface Session {
  id: string;
  classId: string;
  className: string;
  sessionNumber: number;
  date: string; // YYYY-MM-DD
  teacherId: string;
  teacherName?: string;
  attendance: AttendanceRecord[];
  lessonContent: string;
  homeworkItems?: HomeworkTaskItem[]; // Danh sách NỀN NỔI nhiều bài tập về nhà
  studentFeedbacks?: Record<string, StudentFeedback>; // Nhận xét riêng cho từng studentId
  recordLink?: string;
  quizletUrl?: string; // Link Quizlet Học Từ Vựng Buổi Học
  sessionMaterials?: ResourceLink[];
  isChargedAbsenceSession?: boolean; // Lớp nghỉ tính phí vì nghỉ quá số lần quy định hoặc học viên không vào lớp
  isExcusedAbsenceSession?: boolean; // Lớp nghỉ có phép (không tính phí)
  hasNoHomework?: boolean; // Tùy chọn đánh dấu buổi học không có bài tập về nhà
  createdAt: string;
}

export interface HomeworkTask {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  title: string;
  content: string;
  attachmentLink?: string;
  deadline?: string;
  createdAt: string;
}

export type CompletionStatus = 'COMPLETED' | 'UNCOMPLETED';
export type FeedbackStatus = 'PENDING' | 'COMPLETED' | 'NONE';

export interface HomeworkSubmission {
  id: string;
  sessionId: string;
  homeworkTaskId: string; // ID bài tập
  homeworkTitle: string;
  studentId: string;
  studentName: string;
  classId?: string;
  className?: string;
  teacherId?: string;
  teacherName?: string;
  isStudentChecked: boolean; // Học viên tích chọn đã làm
  isTeacherFeedbackChecked: boolean; // Admin/Super Admin tích chọn đã feedback
  completionStatus?: CompletionStatus; // 'COMPLETED' | 'UNCOMPLETED'
  feedbackStatus?: FeedbackStatus; // 'PENDING' | 'COMPLETED' | 'NONE'
  completionTime?: string; // e.g. "16:45"
  studentContent?: string;
  feedbackText?: string;
  ratingStars?: number;
  submissionDate?: string;
  feedbackDate?: string;
  feedbackTime?: string;
  feedbackByUserId?: string;
  feedbackByUserName?: string;
  fileUrl?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName?: string;
  homeworkTaskId: string;
  homeworkTitle: string;
  submissionId: string;
  completionTime: string;
  createdAt: string;
  isRead: boolean;
}

export interface Invoice {
  id: string;
  code: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  amount: number;
  sessionsPurchased: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdDate: string;
  paidDate?: string;
  qrContent: string;
  bankId: string;
  accountNo: string;
  accountName: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface StarReward {
  id: string;
  title: string;
  starsRequired: number;
  description: string;
  icon: string;
  category: 'voucher' | 'gift' | 'privilege';
}

export interface BankConfig {
  bankId: string;
  bankName: string;
  accountNo: string;
  accountName: string;
  centerLogoUrl?: string;
}

export interface MonthlyRevenueReport {
  monthYear: string;
  totalRevenue: number;
  studentBreakdown: {
    studentId: string;
    studentName: string;
    sessionsTaughtInMonth: number;
    perSessionPrice: number;
    monthlyRevenue: number;
  }[];
}
