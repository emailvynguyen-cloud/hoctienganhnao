export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  password?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  addedDate?: string;
}

export interface HomeworkTaskItem {
  id: string;
  title: string;
  content?: string;
  attachmentUrl?: string;
}

export interface StudentFeedback {
  strengths?: string; // Điểm mạnh riêng của học viên này
  improvements?: string; // Điểm cần cải thiện riêng của học viên này
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
  honorNickname?: string;
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
  schedule: string;
  room: string;
  courseName: string;
  totalStudents: number;
  status: 'active' | 'completed' | 'paused';
  startSessionNumber?: number; // Số thứ tự buổi học bắt đầu khi tạo lớp (mặc định 1)
  zoomLink?: string;
  resourceLinks?: ResourceLink[];
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
  sessionMaterials?: ResourceLink[];
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
  deadline: string;
  createdAt: string;
}

export interface HomeworkSubmission {
  id: string;
  sessionId: string;
  homeworkTaskId: string; // ID bài tập
  homeworkTitle: string;
  studentId: string;
  studentName: string;
  isStudentChecked: boolean; // Học viên tích chọn đã làm
  isTeacherFeedbackChecked: boolean; // Admin/Super Admin tích chọn đã feedback
  studentContent?: string;
  feedbackText?: string;
  ratingStars?: number;
  submissionDate?: string;
  feedbackDate?: string;
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
