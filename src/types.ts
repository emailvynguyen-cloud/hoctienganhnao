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
  status?: 'active' | 'soft_deleted';
  stars: number;
  badges?: string[];
  avatar: string;
  notes?: string;
  internalNotes?: string;
  internalNotesHistory?: InternalNoteEntry[];
  honorNickname?: string;
  equippedTitleId?: string;
  completedHomeworkTaskIds?: string[];
  resourceLinks?: ResourceLink[];
  studentCode?: string;
  studentCodeStatus?: 'ACTIVE' | 'DISABLED';
  joinedDate?: string;
  createdAt?: string;
}

export interface ClassSchedulePeriod {
  id: string;
  schedule: string;
  effectiveFrom: string; // YYYY-MM-DD
  effectiveUntil?: string | null; // YYYY-MM-DD
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
  room?: string;
  courseName: string;
  totalStudents?: number;
  status?: 'active' | 'completed' | 'paused' | 'archived';
  startSessionNumber?: number; // Số thứ tự buổi học bắt đầu khi tạo lớp (mặc định 1)
  zoomLink?: string;
  resourceLinks?: ResourceLink[];
  teacherPayRatePerSession?: number; // Bậc lương từng buổi dạy (VNĐ / buổi học), ví dụ: 150.000đ
  startDate?: string; // Ngày bắt đầu học thực tế của lớp (YYYY-MM-DD)
  createdAt?: string; // Ngày tạo lớp trên hệ thống (YYYY-MM-DD)
  scheduleEffectiveFrom?: string; // Mốc thời gian bắt đầu có hiệu lực của lịch dạy hiện tại (YYYY-MM-DD)
  scheduleHistory?: ClassSchedulePeriod[]; // Lịch sử các đợt đổi lịch dạy trước đó
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
  className?: string;
  sessionNumber: number;
  date: string; // YYYY-MM-DD
  teacherId: string;
  teacherName?: string;
  attendance?: AttendanceRecord[];
  lessonContent: string;
  homeworkItems?: HomeworkTaskItem[]; // Danh sách NỀN NỔI nhiều bài tập về nhà
  studentFeedbacks?: Record<string, StudentFeedback>; // Nhận xét riêng cho từng studentId
  recordLink?: string;
  quizletUrl?: string; // Link Quizlet Học Từ Vựng Buổi Học (legacy hoặc 1 học viên)
  studentQuizlets?: Record<string, string>; // Link Quizlet riêng cho từng studentId
  sessionMaterials?: ResourceLink[];
  isChargedAbsenceSession?: boolean; // Lớp nghỉ tính phí vì nghỉ quá số lần quy định hoặc học viên không vào lớp
  isExcusedAbsenceSession?: boolean; // Lớp nghỉ có phép (không tính phí)
  hasNoHomework?: boolean; // Tùy chọn đánh dấu buổi học không có bài tập về nhà
  hasNoQuizlet?: boolean; // Tùy chọn đánh dấu buổi học không sử dụng/không có link Quizlet
  hasNoRecordLink?: boolean; // Tùy chọn đánh dấu buổi học không cần/không có link Record
  createdAt?: string;
}

export function getStudentQuizletUrl(session: Partial<Session> | undefined | null, studentId: string): string {
  if (!session) return '';
  if (session.studentQuizlets) {
    return session.studentQuizlets[studentId] || '';
  }
  return session.quizletUrl || '';
}

/**
 * OFFICIAL REVENUE & BILLABLE SESSION HELPER
 * 
 * Rules:
 * - Recorded Session + Student Not Excused Absence -> BILLABLE (revenue = 1 session fee).
 * - Excused Absence (`status === 'excused'`) -> NOT BILLABLE (revenue = 0).
 * - Charged Absence (`status === 'unexcused'` or `isChargedAbsenceSession = true`) -> BILLABLE.
 * - Recorded Session with no explicit attendance record -> "Có nhập buổi là có tính" -> Default BILLABLE.
 * - Unrecorded Session -> NOT BILLABLE.
 */
export function isBillableStudentSession(session: Partial<Session> | undefined | null, studentId: string): boolean {
  if (!session || !session.date) return false;
  if (session.isExcusedAbsenceSession) return false;
  if (session.isChargedAbsenceSession) return true;

  if (session.attendance && Array.isArray(session.attendance)) {
    const attRecord = session.attendance.find((a) => a && a.studentId === studentId);
    if (attRecord) {
      if (attRecord.status === 'excused') {
        return false; // Nghỉ có phép -> KHÔNG TÍNH
      }
      return true; // present, late, unexcused -> TÍNH
    }
  }

  return true; // Có nhập buổi là có tính
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
  recipientId?: string;
}

export interface StudentAbsenceRecord {
  id: string;
  studentId?: string;
  studentName?: string;
  classId?: string;
  className?: string;
  absenceDate?: string;
  date?: string;
  reason?: string;
  isExcused?: boolean;
  isMakeupCompleted?: boolean;
  createdByUserName?: string;
  createdAt?: string;
}

export interface ChapterTest {
  id: string;
  chapterId: string;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  passingScorePercent: number;
  version: number;
  status: 'draft' | 'published' | 'archived';
  testSnapshot?: ChapterTestQuestionSnapshot[];
  testSnapshots?: ChapterTestQuestionSnapshot[];
  createdAt: string;
}

export interface StudentTestAttempt {
  id: string;
  studentId: string;
  studentCode?: string;
  studentName: string;
  chapterTestId: string;
  chapterId?: string;
  bookId?: string;
  testVersion: number;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  status: 'completed' | 'reset';
  resetBy?: string;
  resetAt?: string;
  resetReason?: string;
  submittedAt?: string;
  completedAt?: string;
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

// ==========================================
// LEARNING HUB TYPES
// ==========================================

export type LearningQuestionType =
  // Listening
  | 'listening_word'
  | 'listening_sentence'
  | 'listening_dictation'
  | 'listening_choice'
  | 'listening_true_false'
  // Vocabulary
  | 'vocab_vi_en'
  | 'vocab_en_vi'
  | 'vocab_audio_type'
  | 'vocab_image_type'
  | 'vocab_match_meaning'
  | 'vocab_match_image'
  | 'vocab_choice'
  | 'vocab_gap_fill'
  // Reading
  | 'reading_true_false'
  | 'reading_choice'
  | 'reading_find_error'
  | 'reading_qa'
  | 'reading_gap_fill'
  // Grammar
  | 'grammar_choice'
  | 'grammar_gap_fill'
  | 'grammar_reorder'
  | 'grammar_find_error'
  | 'grammar_fix_error'
  | 'grammar_correct_sentence'
  | 'grammar_complete'
  // Translation
  | 'trans_vi_en'
  | 'trans_en_vi'
  | 'trans_hint_sentence'
  | 'trans_free'
  // Matching
  | 'match_word_meaning'
  | 'match_word_image'
  | 'match_sentence_meaning';

export interface Book {
  id: string;
  title: string;
  description?: string;
  level: string;
  coverImage?: string;
  displayOrder: number;
  createdAt: string;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  chapterNumber: number;
  description?: string;
  displayOrder: number;
  createdAt: string;
}

export interface AudioAsset {
  id: string;
  sourceText: string;
  language: string;
  accent: string;
  voice: string;
  speed: number;
  provider: string;
  contentHash?: string;
  audioUrl: string;
  storagePath: string;
  durationSeconds?: number;
  status: 'draft' | 'approved' | 'failed';
  createdAt: string;
}

export interface LearningQuestion {
  id: string;
  chapterId?: string;
  questionType: LearningQuestionType;
  prompt: string;
  audioAssetId?: string;
  audioUrl?: string;
  imageUrl?: string;
  passageText?: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'listening' | 'vocabulary' | 'reading' | 'grammar' | 'translation' | 'matching';
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
}

export interface PracticeSet {
  id: string;
  chapterId: string;
  title: string;
  description?: string;
  category: string;
  isPublished: boolean;
  questionIds: string[];
  displayOrder: number;
  createdAt: string;
}

export interface ChapterTest {
  id: string;
  chapterId: string;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  passingScorePercent: number;
  version: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
}

export interface ChapterTestQuestionSnapshot {
  questionId: string;
  questionType: LearningQuestionType;
  prompt: string;
  audioAssetId?: string;
  audioUrl?: string;
  imageUrl?: string;
  passageText?: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
}

export interface ChapterTestQuestionItem {
  id: string;
  chapterTestId: string;
  questionId: string;
  displayOrder: number;
  points: number;
  testSnapshot: ChapterTestQuestionSnapshot;
}

export interface StudentPracticeAttempt {
  id: string;
  studentId: string;
  studentName: string;
  practiceSetId: string;
  chapterId: string;
  bookId: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpentSeconds: number;
  completedAt: string;
}

export interface SystemRule {
  id: string;
  type: 'class_rule' | 'teacher_rule';
  title: string;
  content: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
