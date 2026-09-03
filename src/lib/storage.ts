import {
  Student,
  Class,
  Session,
  HomeworkTask,
  HomeworkSubmission,
  Invoice,
  User,
  BankConfig,
  AttendanceRecord,
  ResourceLink,
  MonthlyRevenueReport,
  HomeworkTaskItem,
  StudentFeedback,
  AppNotification,
  AuditLogRecord,
  InternalNoteEntry,
  StudentAbsenceRecord,
  isBillableStudentSession,
  SystemRule,
  FineRecord,
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_CLASSES,
  INITIAL_SESSIONS,
  INITIAL_HOMEWORK_TASKS,
  INITIAL_HOMEWORK_SUBMISSIONS,
  INITIAL_INVOICES,
  INITIAL_USERS,
  INITIAL_BANK_CONFIG,
} from '../data/mockData';
import { generatePublicHash } from './obfuscate';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { KAKAOTALK_SVG_AVATARS } from './kakaotalkAvatars';

const STORAGE_KEYS = {
  STUDENTS: 'vy_students_v4',
  CLASSES: 'vy_classes_v4',
  SESSIONS: 'vy_sessions_v4',
  HOMEWORK_TASKS: 'vy_hw_tasks_v4',
  HOMEWORK_SUBMISSIONS: 'vy_hw_submissions_v4',
  NOTIFICATIONS: 'vy_notifications_v4',
  INVOICES: 'vy_invoices_v4',
  USERS: 'vy_users_v4',
  AUDIT_LOGS: 'vy_audit_logs_v4',
  BANK_CONFIG: 'vy_bank_config_v4',
  CURRENT_USER: 'vy_current_user_v4',
  CLOUD_SYNC_ENABLED: 'vy_cloud_sync_v4',
  CLASS_RULES: 'vy_class_rules_v4',
  DISMISSED_PENDING_TASKS: 'vy_dismissed_pending_tasks_v4',
  WAIVED_PENALTIES: 'vy_waived_penalties_v4',
  CUSTOM_FINES: 'vy_custom_fines_v4',
  LAST_STUDENT_PORTAL_URL: 'vy_last_student_portal_url_v4',
  CURRENT_STUDENT_SESSION: 'vy_current_student_session_v4',
  SYSTEM_RULES: 'vy_system_rules_v1',
};

export function generateStudentCode(existingCodes: string[] = []): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  let attempts = 0;
  const upperExisting = existingCodes.map((c) => (c || '').toUpperCase());
  do {
    let randomStr = '';
    for (let i = 0; i < 4; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `HV${randomStr}`;
    attempts++;
  } while (upperExisting.includes(code) && attempts < 100);

  if (upperExisting.includes(code)) {
    code = `HV${Date.now().toString().slice(-4)}`;
  }
  return code;
}

export const INITIAL_SYSTEM_RULES: SystemRule[] = [
  {
    id: 'rule_class_01',
    type: 'class_rule',
    title: 'Đi học đúng giờ và chuẩn bị thiết bị',
    content: 'Học viên cần tham gia lớp học trước 5-10 phút để kiểm tra micro, camera và mạng internet. Đi trễ quá 15 phút không có lý do hợp lệ sẽ tính nghỉ không phép.',
    order: 1,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'rule_class_02',
    type: 'class_rule',
    title: 'Hoàn thành bài tập về nhà đúng hạn',
    content: 'Hoàn thành và nộp bài tập về nhà trên Học Viên Portal trước buổi học kế tiếp để giáo viên nhận xét và cộng sao tích lũy.',
    order: 2,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'rule_class_03',
    type: 'class_rule',
    title: 'Tương tác tích cực và tôn trọng lớp học',
    content: 'Bật camera trong suốt buổi học online, chủ động giơ tay phát biểu và tôn trọng giáo viên cùng các bạn học.',
    order: 3,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'rule_teacher_01',
    type: 'teacher_rule',
    title: 'Hoàn thành lesson record sau mỗi buổi học',
    content: 'Giáo viên cần nhập đầy đủ nội dung bài dạy, nhận xét học viên và điểm danh ngay sau khi kết thúc buổi học.',
    order: 1,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'rule_teacher_02',
    type: 'teacher_rule',
    title: 'Cập nhật Video Record buổi học',
    content: 'Bổ sung đường dẫn Video Record cho buổi học trên hệ thống trong vòng 24 giờ kể từ khi lớp kết thúc.',
    order: 2,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'rule_teacher_03',
    type: 'teacher_rule',
    title: 'Cập nhật Quizlet và tài nguyên học tập',
    content: 'Gán các bộ từ vựng Quizlet và tài liệu học tập phù hợp theo đúng chương trình dạy của trung tâm.',
    order: 3,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
  {
    id: 'rule_teacher_04',
    type: 'teacher_rule',
    title: 'Thông báo trước khi thay đổi lịch dạy',
    content: 'Báo trước tối thiểu 12 - 24 giờ cho Ban Quản Lý nếu có nhu cầu thay đổi lịch học hoặc xin nghỉ dạy đột xuất.',
    order: 4,
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  },
];

export const INITIAL_CLASS_RULES = `📋 NỘI QUY TRUNG TÂM MS. VY ENGLISH

1. THỜI GIAN HỌC VÀ ĐIỂM DANH:
- Học viên vào lớp đúng giờ. Đi trễ quá 15 phút không có lý do chính đáng sẽ tính là nghỉ không phép.
- Trường hợp nghỉ học, phụ huynh/học viên cần thông báo cho giáo viên trước ít nhất 2 giờ.

2. BÀI TẬP VỀ NHÀ:
- Hoàn thành đầy đủ bài tập được giao trước buổi học tiếp theo.
- Nộp bài đúng hạn trên Portal để được giáo viên nhận xét và tích sao thưởng.

3. TRANG PHỤC VÀ THÁI ĐỘ HỌC TẬP:
- Giữ thái độ tôn trọng giáo viên và các bạn học trong lớp.
- Tích cực phát biểu và tham gia các hoạt động luyện nói.

4. HỌC BÙ VÀ NGHỈ HỌC:
- Các buổi nghỉ có lý do hợp lệ sẽ được sắp xếp học bù hoặc hỗ trợ video record.
- Học phí được tính theo gói buổi học đã đăng ký.`;

const liveMemoryStore: Record<string, any> = {};
const storageChangeSubscribers: Set<() => void> = new Set();

export function getLiveMemoryStore(): Record<string, any> {
  return { ...liveMemoryStore };
}

export function notifyStorageChange() {
  storageChangeSubscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {}
  });
}

export function updateLiveMemoryStore(key: string, value: any) {
  liveMemoryStore[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
  notifyStorageChange();
}

function getItem<T>(key: string, defaultValue: T): T {
  if (key in liveMemoryStore && liveMemoryStore[key] !== undefined && liveMemoryStore[key] !== null) {
    return liveMemoryStore[key] as T;
  }
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed !== undefined && parsed !== null) {
        liveMemoryStore[key] = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
  }
  return defaultValue;
}

function setItem<T>(key: string, value: T): void {
  liveMemoryStore[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
  notifyStorageChange();
}

function setItemSilent<T>(key: string, value: T): void {
  liveMemoryStore[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} silently to storage:`, e);
  }
}

// Background Cloud Sync Helper (Non-blocking)
async function syncCollectionToCloud<T extends { id?: string; uid?: string }>(
  collectionName: string,
  items: T[]
) {
  try {
    if (!db) return;
    for (const item of items) {
      const docId = item.id || item.uid;
      if (docId) {
        await setDoc(doc(db, collectionName, docId), item, { merge: true });
      }
    }
  } catch (err) {
    console.warn(`Cloud sync notice for ${collectionName}:`, err);
  }
}

import { CloudSyncEngine } from './cloudSync';
import { normalizeStudentTuitionData, calculateStudentTuitionSummary } from './tuitionEngine';

export const StorageEngine = {
  getAllData(): Record<string, any> {
    return {
      [STORAGE_KEYS.STUDENTS]: this.getStudents(),
      [STORAGE_KEYS.CLASSES]: this.getClasses(),
      [STORAGE_KEYS.SESSIONS]: this.getSessions(),
      [STORAGE_KEYS.HOMEWORK_TASKS]: this.getHomeworkTasks(),
      [STORAGE_KEYS.HOMEWORK_SUBMISSIONS]: this.getHomeworkSubmissions(),
      [STORAGE_KEYS.NOTIFICATIONS]: this.getNotifications(),
      [STORAGE_KEYS.INVOICES]: this.getInvoices(),
      [STORAGE_KEYS.USERS]: this.getUsers(),
      [STORAGE_KEYS.BANK_CONFIG]: this.getBankConfig(),
      [STORAGE_KEYS.CLASS_RULES]: this.getClassRules(),
      [STORAGE_KEYS.SYSTEM_RULES]: this.getSystemRules(),
      [STORAGE_KEYS.DISMISSED_PENDING_TASKS]: this.getDismissedPendingTaskIds(),
      [STORAGE_KEYS.WAIVED_PENALTIES]: this.getWaivedPenaltyKeys(),
      [STORAGE_KEYS.CUSTOM_FINES]: this.getCustomFines(),
    };
  },

  onDataChange(callback: () => void) {
    storageChangeSubscribers.add(callback);
    return () => {
      storageChangeSubscribers.delete(callback);
    };
  },

  getSystemRules(): SystemRule[] {
    const raw = getItem<SystemRule[]>(STORAGE_KEYS.SYSTEM_RULES, INITIAL_SYSTEM_RULES) || [];
    return raw.sort((a, b) => (a.order || 0) - (b.order || 0));
  },
  saveSystemRules(rules: SystemRule[]) {
    setItem(STORAGE_KEYS.SYSTEM_RULES, [...rules]);
    this.syncAllToCloud();
  },
  addSystemRule(ruleData: Omit<SystemRule, 'id' | 'createdAt' | 'updatedAt'>, actorUser?: User | null): SystemRule {
    const rules = this.getSystemRules();
    const todayISO = new Date().toISOString().split('T')[0];
    const newRule: SystemRule = {
      ...ruleData,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      createdAt: todayISO,
      updatedAt: todayISO,
    };
    rules.push(newRule);
    this.saveSystemRules(rules);
    this.addAuditLog(
      actorUser || null,
      'ADD_SYSTEM_RULE',
      ruleData.type === 'class_rule' ? 'student' : 'teacher',
      newRule.id,
      newRule.title,
      undefined,
      undefined,
      `Thêm nội quy mới (${ruleData.type === 'class_rule' ? 'Lớp học' : 'Giáo viên'}): ${newRule.title}`
    );
    return newRule;
  },
  updateSystemRule(rule: SystemRule, actorUser?: User | null) {
    const rules = this.getSystemRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx !== -1) {
      rules[idx] = {
        ...rule,
        updatedAt: new Date().toISOString().split('T')[0],
      };
      this.saveSystemRules(rules);
      this.addAuditLog(
        actorUser || null,
        'UPDATE_SYSTEM_RULE',
        rule.type === 'class_rule' ? 'student' : 'teacher',
        rule.id,
        rule.title,
        undefined,
        undefined,
        `Cập nhật nội quy: ${rule.title}`
      );
    }
  },
  deleteSystemRule(ruleId: string, actorUser?: User | null) {
    const rules = this.getSystemRules();
    const target = rules.find((r) => r.id === ruleId);
    const updated = rules.filter((r) => r.id !== ruleId);
    this.saveSystemRules(updated);
    if (target) {
      this.addAuditLog(
        actorUser || null,
        'DELETE_SYSTEM_RULE',
        target.type === 'class_rule' ? 'student' : 'teacher',
        target.id,
        target.title,
        undefined,
        undefined,
        `Xóa nội quy: ${target.title}`
      );
    }
  },
  toggleSystemRuleActive(ruleId: string, actorUser?: User | null) {
    const rules = this.getSystemRules();
    const target = rules.find((r) => r.id === ruleId);
    if (target) {
      target.isActive = !target.isActive;
      target.updatedAt = new Date().toISOString().split('T')[0];
      this.saveSystemRules(rules);
    }
  },

  getClassRules(): string {
    const activeClassRules = this.getSystemRules().filter((r) => r.type === 'class_rule' && r.isActive);
    if (activeClassRules.length > 0) {
      return activeClassRules
        .map((r, idx) => `${idx + 1}. ${r.title.toUpperCase()}\n${r.content}`)
        .join('\n\n');
    }
    return getItem<string>(STORAGE_KEYS.CLASS_RULES, INITIAL_CLASS_RULES);
  },
  saveClassRules(rules: string, authorUser?: User | null) {
    setItem(STORAGE_KEYS.CLASS_RULES, rules);
    this.syncAllToCloud();
    this.addAuditLog(
      authorUser || null,
      'UPDATE_CLASS_RULES',
      'student',
      'rules',
      'Nội quy trung tâm',
      undefined,
      undefined,
      'Cập nhật nội quy trung tâm mới'
    );
  },

  syncAllToCloud() {
    CloudSyncEngine.pushToCloud(this.getAllData());
  },

  getCurrentUser(): User | null {
    return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },
  setCurrentUser(user: User | null) {
    if (user) setItem(STORAGE_KEYS.CURRENT_USER, user);
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  getUsers(): User[] {
    const rawUsers = getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS) || [];
    const sanitized = rawUsers.filter((u) => {
      if (!u) return false;
      const name = (u.displayName || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const uid = u.uid || '';
      if (name.includes('alex') || name.includes('smith') || email.includes('alex.smith') || uid === 'u_teacher_01') {
        return false;
      }
      return true;
    });
    if (sanitized.length !== rawUsers.length) {
      setItem(STORAGE_KEYS.USERS, sanitized);
      this.syncAllToCloud();
    }
    return sanitized;
  },
  saveUsers(users: User[]) {
    setItem(STORAGE_KEYS.USERS, users);
    this.syncAllToCloud();
  },
  authenticateUser(emailOrUsername: string, passwordInput: string): User | null {
    const users = this.getUsers() || [];
    const cleanInput = (emailOrUsername || '').trim().toLowerCase();
    return users.find((u) => {
      if (!u || !u.email) return false;
      const matchEmail = (u.email || '').toLowerCase() === cleanInput;
      const matchUsername = (u.email.split('@')[0] || '').toLowerCase() === cleanInput;
      const matchPassword = (u.password || 'admin123') === passwordInput;
      return (matchEmail || matchUsername) && matchPassword;
    }) || null;
  },
  addUser(userData: Omit<User, 'uid' | 'createdAt'>): User {
    const users = this.getUsers() || [];
    const newUser: User = {
      ...userData,
      uid: `u_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  },
  updateUser(user: User) {
    const users = this.getUsers() || [];
    const idx = users.findIndex((u) => u && u.uid === user.uid);
    if (idx !== -1) {
      const updated = [...users];
      updated[idx] = { ...updated[idx], ...user };
      this.saveUsers(updated);
    }
  },
  deleteUser(uid: string) {
    this.deleteTeacher(uid);
  },
  deleteTeacher(teacherIdOrName: string) {
    const users = this.getUsers() || [];
    const targetUser = users.find((u) => u && (u.uid === teacherIdOrName || u.displayName === teacherIdOrName));
    const teacherName = targetUser ? targetUser.displayName : teacherIdOrName;

    // 1. Delete user account
    const updatedUsers = users.filter((u) => u && u.uid !== teacherIdOrName && u.displayName !== teacherIdOrName);
    this.saveUsers(updatedUsers);

    // 2. Unassign from all classes (reassign to Ms. Vy)
    const classes = this.getClasses() || [];
    let classUpdated = false;
    classes.forEach((c) => {
      if (
        c &&
        (c.teacherId === teacherIdOrName ||
          c.teacherName === teacherName ||
          (c.teacherName && c.teacherName.toLowerCase() === teacherName.toLowerCase()))
      ) {
        c.teacherId = 'u_super_admin';
        c.teacherName = 'Ms. Vy';
        classUpdated = true;
      }
    });
    if (classUpdated) {
      this.saveClasses(classes);
    }
  },

  getStudents(): Student[] {
    const rawStudents = getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS) || [];
    let modified = false;
    const existingCodes = rawStudents.map((s) => s && s.studentCode).filter(Boolean) as string[];

    const students = rawStudents.map((std) => {
      if (!std) return std;
      let updated = false;
      let code = std.studentCode;
      let codeStatus = std.studentCodeStatus || 'ACTIVE';

      if (!code) {
        code = generateStudentCode(existingCodes);
        existingCodes.push(code);
        updated = true;
      }
      if (!std.studentCodeStatus) {
        codeStatus = 'ACTIVE';
        updated = true;
      }

      if (updated) {
        modified = true;
        return {
          ...std,
          studentCode: code,
          studentCodeStatus: codeStatus,
        };
      }
      return std;
    });

    if (modified) {
      setItem(STORAGE_KEYS.STUDENTS, students);
    }
    return students;
  },
  saveStudents(students: Student[]) {
    setItem(STORAGE_KEYS.STUDENTS, [...students]);
    this.syncAllToCloud();
  },
  addStudent(studentData: Partial<Student>): Student {
    const students = this.getStudents() || [];
    const newId = studentData.id || `std_${Date.now()}`;
    const initialSessions = Number(studentData.remainingSessions) || Number(studentData.packageSessionCount) || 8;
    const existingCodes = students.map((s) => s && s.studentCode).filter(Boolean) as string[];
    const code = studentData.studentCode || generateStudentCode(existingCodes);

    const newStudent: Student = {
      id: newId,
      name: studentData.name || 'Học viên mới',
      email: studentData.email || `${newId}@gmail.com`,
      phone: studentData.phone || '',
      classIds: studentData.classIds || [],
      // LẦN ĐẦU ĐÓNG HỌC PHÍ: Số buổi còn lại = đúng bằng số buổi học viên đã đóng lần 1
      remainingSessions: initialSessions,
      totalPaidSessions: initialSessions,
      tuitionPackagePrice: Number(studentData.tuitionPackagePrice) || 2000000,
      packageSessionCount: Number(studentData.packageSessionCount) || 8,
      publicHash: `hash_${newId}_${Math.random().toString(36).substr(2, 6)}`,
      studentCode: code,
      studentCodeStatus: studentData.studentCodeStatus || 'ACTIVE',
      joinedDate: new Date().toISOString().split('T')[0],
      stars: 0,
      completedHomeworkTaskIds: [],
      avatar: studentData.avatar || KAKAOTALK_SVG_AVATARS.ryan,
      honorNickname: '',
      status: 'active',
    };
    students.push(newStudent);
    this.saveStudents(students);

    // Note: User account is NOT created automatically per system specifications.
    // Use createStudentUserAccount(student) for explicit account generation.

    return newStudent;
  },
  createStudentUserAccount(student: Student, customPassword?: string): { success: boolean; message: string; user?: User } {
    const users = this.getUsers() || [];
    const existingUser = users.find((u) => u.email === student.email || u.uid === `u_${student.id}`);
    if (existingUser) {
      return { success: false, message: `Tài khoản đăng nhập cho học viên "${student.name}" đã tồn tại! (${existingUser.email})`, user: existingUser };
    }

    const newUser: User = {
      uid: `u_${student.id}`,
      email: student.email || `${student.id}@gmail.com`,
      password: customPassword || student.phone || 'hocvien123',
      displayName: student.name,
      role: 'student',
      createdAt: new Date().toISOString().split('T')[0],
    };

    users.push(newUser);
    this.saveUsers(users);

    return { success: true, message: `Đã tạo tài khoản đăng nhập thành công cho học viên "${student.name}"!`, user: newUser };
  },
  deleteStudent(id: string) {
    this.deleteStudentPermanently(id);
  },
  deleteStudentPermanently(id: string) {
    const students = this.getStudents() || [];
    const targetStudent = students.find((s) => s && s.id === id);
    const updated = students.filter((s) => s && s.id !== id);
    this.saveStudents(updated);

    if (targetStudent) {
      const users = this.getUsers() || [];
      const updatedUsers = users.filter((u) => u.email !== targetStudent.email && u.uid !== `u_${id}`);
      this.saveUsers(updatedUsers);
    }
  },
  removeStudentFromClass(studentId: string, classId: string) {
    const students = this.getStudents() || [];
    const updated = students.map((std) => {
      if (std && std.id === studentId && std.classIds) {
        return {
          ...std,
          classIds: std.classIds.filter((cid) => cid !== classId),
        };
      }
      return std;
    });
    this.saveStudents(updated);
  },
  updateStudent(student: Student) {
    const students = this.getStudents() || [];
    const idx = students.findIndex((s) => s && s.id === student.id);
    if (idx !== -1) {
      const updated = [...students];
      updated[idx] = { ...updated[idx], ...student };
      this.saveStudents(updated);
    }
  },
  updateStudentAvatar(studentId: string, newAvatar: string) {
    const students = this.getStudents() || [];
    const idx = students.findIndex((s) => s && s.id === studentId);
    if (idx !== -1) {
      const updated = [...students];
      updated[idx] = { ...updated[idx], avatar: newAvatar };
      this.saveStudents(updated);
      return true;
    }
    return false;
  },
  updateStudentEquippedTitle(studentId: string, titleId: string) {
    const students = this.getStudents() || [];
    const idx = students.findIndex((s) => s && s.id === studentId);
    if (idx !== -1) {
      const updated = [...students];
      updated[idx] = { ...updated[idx], equippedTitleId: titleId };
      this.saveStudents(updated);
      return true;
    }
    return false;
  },

  addStudentAbsence(studentId: string, date: string, reason?: string, isMakeupCompleted?: boolean, actorUser?: User | null) {
    const students = this.getStudents() || [];
    const std = students.find((s) => s && s.id === studentId);
    if (!std) return;

    if (!std.absences) std.absences = [];
    const newAbsence: StudentAbsenceRecord = {
      id: `abs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date,
      reason: reason || '',
      isMakeupCompleted: !!isMakeupCompleted,
      createdAt: new Date().toISOString(),
      createdByUserName: actorUser?.displayName || 'Giáo viên',
    };

    std.absences.push(newAbsence);
    std.absencesCount = std.absences.length;
    std.makeupSessionsCount = std.absences.filter((a) => a.isMakeupCompleted).length;

    // Recalculate remaining sessions: deduction accounts for un-made-up absences
    const unmadeAbsences = std.absencesCount - std.makeupSessionsCount;
    if (typeof std.remainingSessions === 'number') {
      std.remainingSessions = Math.max(0, (std.totalPaidSessions || 8) - unmadeAbsences);
    }

    this.saveStudents(students);
    this.addAuditLog(
      actorUser || null,
      'ADD_STUDENT_ABSENCE',
      'student',
      studentId,
      std.name,
      undefined,
      undefined,
      `Thêm buổi nghỉ ngày ${date} (Lý do: ${reason || 'Không có'})`
    );
  },

  updateStudentAbsence(studentId: string, absenceId: string, date: string, reason?: string, isMakeupCompleted?: boolean, actorUser?: User | null) {
    const students = this.getStudents() || [];
    const std = students.find((s) => s && s.id === studentId);
    if (!std || !std.absences) return;

    const absIndex = std.absences.findIndex((a) => a.id === absenceId);
    if (absIndex !== -1) {
      std.absences[absIndex] = {
        ...std.absences[absIndex],
        date,
        reason: reason || '',
        isMakeupCompleted: !!isMakeupCompleted,
      };
      std.absencesCount = std.absences.length;
      std.makeupSessionsCount = std.absences.filter((a) => a.isMakeupCompleted).length;

      const unmadeAbsences = std.absencesCount - std.makeupSessionsCount;
      if (typeof std.remainingSessions === 'number') {
        std.remainingSessions = Math.max(0, (std.totalPaidSessions || 8) - unmadeAbsences);
      }

      this.saveStudents(students);
      this.addAuditLog(
        actorUser || null,
        'UPDATE_STUDENT_ABSENCE',
        'student',
        studentId,
        std.name,
        undefined,
        undefined,
        `Chỉnh sửa buổi nghỉ ngày ${date}`
      );
    }
  },

  deleteStudentAbsence(studentId: string, absenceId: string, actorUser?: User | null) {
    const students = this.getStudents() || [];
    const std = students.find((s) => s && s.id === studentId);
    if (!std || !std.absences) return;

    std.absences = std.absences.filter((a) => a.id !== absenceId);
    std.absencesCount = std.absences.length;
    std.makeupSessionsCount = std.absences.filter((a) => a.isMakeupCompleted).length;

    const unmadeAbsences = std.absencesCount - std.makeupSessionsCount;
    if (typeof std.remainingSessions === 'number') {
      std.remainingSessions = Math.max(0, (std.totalPaidSessions || 8) - unmadeAbsences);
    }

    this.saveStudents(students);
    this.addAuditLog(
      actorUser || null,
      'DELETE_STUDENT_ABSENCE',
      'student',
      studentId,
      std.name,
      undefined,
      undefined,
      `Xóa buổi nghỉ khỏi danh sách`
    );
  },

  getClasses(): Class[] {
    const rawClasses = getItem<Class[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES) || [];
    let modified = false;
    const sanitized = rawClasses.map((c) => {
      if (!c) return c;
      const tName = (c.teacherName || '').toLowerCase();
      const tId = c.teacherId || '';
      if (
        tName.includes('alex') ||
        tName.includes('smith') ||
        tId === 'u_teacher_01' ||
        tId === 'u_teacher_02'
      ) {
        modified = true;
        return {
          ...c,
          teacherId: 'u_super_admin',
          teacherName: 'Ms. Vy',
        };
      }
      return c;
    });

    if (modified) {
      setItem(STORAGE_KEYS.CLASSES, sanitized);
      this.syncAllToCloud();
    }
    return sanitized;
  },
  saveClasses(classes: Class[]) {
    setItem(STORAGE_KEYS.CLASSES, [...classes]);
    this.syncAllToCloud();
  },
  addClass(classData: Partial<Class>): Class {
    const classes = this.getClasses() || [];
    const newId = classData.id || `cls_${Date.now()}`;
    const now = new Date();
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const effectiveStart = classData.scheduleEffectiveFrom || classData.startDate || todayISO;

    const newClass: Class = {
      id: newId,
      className: classData.className || 'Lớp Mới',
      code: classData.code || `CLASS-${Date.now()}`,
      teacherName: classData.teacherName || 'Ms. Vy',
      teacherId: classData.teacherId || 'u_admin',
      adminId: classData.adminId || 'u_admin',
      adminName: classData.adminName || 'Admin Trực Thuộc',
      schedule: classData.schedule || 'Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 19:30)',
      courseName: classData.courseName || 'Tiếng Anh Giao Tiếp',
      startSessionNumber: Number(classData.startSessionNumber) || 1,
      teacherPayRatePerSession: typeof classData.teacherPayRatePerSession === 'number' && !isNaN(classData.teacherPayRatePerSession) ? classData.teacherPayRatePerSession : 150000,
      resourceLinks: classData.resourceLinks || [],
      createdAt: classData.createdAt || todayISO,
      startDate: effectiveStart,
      scheduleEffectiveFrom: effectiveStart,
      scheduleHistory: classData.scheduleHistory || [
        {
          id: `sp_${Date.now()}`,
          schedule: classData.schedule || 'Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 19:30)',
          effectiveFrom: effectiveStart,
        },
      ],
    };
    classes.push(newClass);
    this.saveClasses(classes);
    return newClass;
  },
  updateClass(cls: Class) {
    const classes = this.getClasses() || [];
    const idx = classes.findIndex((c) => c && c.id === cls.id);
    if (idx !== -1) {
      const existingClass = classes[idx];
      const now = new Date();
      const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      let updatedHistory = cls.scheduleHistory || existingClass.scheduleHistory || [];
      let updatedEffectiveFrom = cls.scheduleEffectiveFrom || existingClass.scheduleEffectiveFrom || existingClass.startDate || (existingClass.createdAt ? existingClass.createdAt.split('T')[0] : '2026-08-01');

      // If the schedule string is changing:
      if (cls.schedule && cls.schedule !== existingClass.schedule) {
        const newEffectiveFrom = cls.scheduleEffectiveFrom || todayISO;

        if (updatedHistory.length === 0) {
          updatedHistory = [
            {
              id: `sp_${Date.now()}_initial`,
              schedule: existingClass.schedule,
              effectiveFrom: updatedEffectiveFrom,
            },
          ];
        }

        // Close previous active period
        const yesterdayDate = new Date(newEffectiveFrom);
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayISO = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

        updatedHistory = updatedHistory.map((sp) => {
          if (!sp.effectiveUntil) {
            return { ...sp, effectiveUntil: yesterdayISO };
          }
          return sp;
        });

        updatedHistory.push({
          id: `sp_${Date.now()}`,
          schedule: cls.schedule,
          effectiveFrom: newEffectiveFrom,
        });

        updatedEffectiveFrom = newEffectiveFrom;
      }

      const updated = [...classes];
      updated[idx] = {
        ...existingClass,
        ...cls,
        scheduleEffectiveFrom: updatedEffectiveFrom,
        scheduleHistory: updatedHistory,
      };
      this.saveClasses(updated);
    }
  },
  updateClassResourceLinks(classId: string, resourceLinks: ResourceLink[], authorUser?: User | null) {
    const classes = this.getClasses() || [];
    const cls = classes.find((c) => c && c.id === classId);
    if (!cls) return;

    cls.resourceLinks = resourceLinks;
    this.saveClasses(classes);

    this.addAuditLog(
      authorUser || null,
      'UPDATE_RESOURCE_LINKS',
      'class',
      classId,
      cls.className,
      classId,
      cls.className,
      `Cập nhật kho tài liệu tổng (${resourceLinks.length} tài liệu)`
    );
  },
  archiveClass(classId: string) {
    const classes = this.getClasses() || [];
    const updated = classes.map((c) => {
      if (c && c.id === classId) {
        return { ...c, status: 'archived' as const };
      }
      return c;
    });
    this.saveClasses(updated);
  },
  restoreClass(classId: string) {
    const classes = this.getClasses() || [];
    const updated = classes.map((c) => {
      if (c && c.id === classId) {
        return { ...c, status: 'active' as const };
      }
      return c;
    });
    this.saveClasses(updated);
  },
  deleteClass(id: string) {
    const classes = this.getClasses() || [];
    const updated = classes.filter((c) => c && c.id !== id);
    this.saveClasses(updated);

    const students = this.getStudents() || [];
    let studentUpdated = false;
    students.forEach((s) => {
      if (s && s.classIds && s.classIds.includes(id)) {
        s.classIds = s.classIds.filter((cid) => cid !== id);
        studentUpdated = true;
      }
    });
    if (studentUpdated) {
      this.saveStudents(students);
    }
  },

  sortAndReindexSessions(sessions: Session[]): Session[] {
    if (!sessions || !Array.isArray(sessions)) return [];
    const classes = this.getClasses() || [];
    const classMap = new Map<string, Class>();
    classes.forEach((c) => {
      if (c && c.id) classMap.set(c.id, c);
    });

    const classSessionsMap = new Map<string, Session[]>();
    const otherSessions: Session[] = [];

    sessions.forEach((s) => {
      if (s && s.classId) {
        if (!classSessionsMap.has(s.classId)) {
          classSessionsMap.set(s.classId, []);
        }
        classSessionsMap.get(s.classId)!.push(s);
      } else if (s) {
        otherSessions.push(s);
      }
    });

    const reindexedAll: Session[] = [...otherSessions];

    classSessionsMap.forEach((classSessions, classId) => {
      const cls = classMap.get(classId);
      const startNum = cls?.startSessionNumber || 1;

      // Sort chronologically ascending by date (YYYY-MM-DD)
      classSessions.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA !== dateB) {
          return dateA.localeCompare(dateB);
        }
        return (a.id || '').localeCompare(b.id || '');
      });

      // Re-index sessionNumber dynamically based on chronological date order
      classSessions.forEach((s, idx) => {
        s.sessionNumber = startNum + idx;
        reindexedAll.push(s);
      });
    });

    return reindexedAll;
  },

  getSessions(): Session[] {
    const rawSessions = getItem<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS) || [];
    let modified = false;
    const sanitized = rawSessions.map((s) => {
      if (!s) return s;
      const tName = (s.teacherName || '').toLowerCase();
      const tId = s.teacherId || '';
      if (
        tName.includes('alex') ||
        tName.includes('smith') ||
        tId === 'u_teacher_01' ||
        tId === 'u_teacher_02'
      ) {
        modified = true;
        return {
          ...s,
          teacherId: 'u_super_admin',
          teacherName: 'Ms. Vy',
        };
      }
      return s;
    });

    if (modified) {
      setItem(STORAGE_KEYS.SESSIONS, sanitized);
      this.syncAllToCloud();
    }
    return this.sortAndReindexSessions(sanitized);
  },
  saveSessions(sessions: Session[]) {
    const sorted = this.sortAndReindexSessions(sessions);
    setItem(STORAGE_KEYS.SESSIONS, sorted);
    this.normalizeAllTuitionData();
    this.syncAllToCloud();
  },

  getHomeworkTasks(): HomeworkTask[] {
    return getItem<HomeworkTask[]>(STORAGE_KEYS.HOMEWORK_TASKS, INITIAL_HOMEWORK_TASKS);
  },
  saveHomeworkTasks(tasks: HomeworkTask[]) {
    setItem(STORAGE_KEYS.HOMEWORK_TASKS, tasks);
    this.syncAllToCloud();
  },

  getHomeworkSubmissions(): HomeworkSubmission[] {
    return getItem<HomeworkSubmission[]>(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, INITIAL_HOMEWORK_SUBMISSIONS);
  },
  saveHomeworkSubmissions(subs: HomeworkSubmission[]) {
    setItem(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, subs);
    this.syncAllToCloud();
  },

  getNotifications(): AppNotification[] {
    return getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  saveNotifications(notifications: AppNotification[]) {
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    this.syncAllToCloud();
  },

  normalizeAllTuitionData() {
    try {
      const students = getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS) || [];
      const invoices = getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES) || [];
      const sessions = getItem<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS) || [];
      const classes = getItem<Class[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES) || [];

      let hasChanged = false;
      const normalized = students.map((std) => {
        if (!std || std.status === 'soft_deleted') return std;
        const summary = calculateStudentTuitionSummary(std, invoices, sessions, classes);
        if (
          std.remainingSessions !== summary.remainingSessions ||
          std.totalPaidSessions !== summary.totalPaidSessions
        ) {
          hasChanged = true;
          return {
            ...std,
            totalPaidSessions: summary.totalPaidSessions,
            remainingSessions: summary.remainingSessions,
          };
        }
        return std;
      });

      if (hasChanged) {
        liveMemoryStore[STORAGE_KEYS.STUDENTS] = normalized;
        try {
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(normalized));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('[STORAGE][TUITION_NORMALIZE] Error:', e);
    }
  },

  getInvoices(): Invoice[] {
    return getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  },
  saveInvoices(invoices: Invoice[]) {
    setItem(STORAGE_KEYS.INVOICES, invoices);
    this.normalizeAllTuitionData();
    this.syncAllToCloud();
  },
  addInvoice(invData: Partial<Invoice>): Invoice {
    const invoices = this.getInvoices() || [];
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];
    const newId = invData.id || `inv_${Date.now()}`;

    const newInvoice: Invoice = {
      id: newId,
      code: invData.code || `VY-REC-${Date.now().toString().slice(-6)}`,
      studentId: invData.studentId || '',
      studentName: invData.studentName || 'Học viên',
      studentPhone: invData.studentPhone || '',
      classId: invData.classId || '',
      className: invData.className || '',
      amount: Number(invData.amount) || 2000000,
      sessionsPurchased: Number(invData.sessionsPurchased) || 8,
      startFromSessionNumber: Number(invData.startFromSessionNumber) || 1,
      status: invData.status || 'paid',
      dueDate: invData.dueDate || todayDate,
      createdDate: invData.createdDate || todayDate,
      paymentDate: invData.paymentDate || invData.paidDate || todayDate,
      paidDate: invData.paidDate || (invData.status === 'paid' ? todayDate : undefined),
      notes: invData.notes || '',
      qrContent: invData.qrContent || '',
      bankId: invData.bankId || 'MB',
      accountNo: invData.accountNo || '0355176317',
      accountName: invData.accountName || 'MS. VY ENGLISH - MS VY',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    invoices.unshift(newInvoice);
    this.saveInvoices(invoices);
    return newInvoice;
  },
  updateInvoice(invData: Partial<Invoice> & { id: string }): Invoice | null {
    const invoices = this.getInvoices() || [];
    const idx = invoices.findIndex((i) => i && i.id === invData.id);
    if (idx === -1) return null;

    const nowIso = new Date().toISOString();
    const updatedInvoice: Invoice = {
      ...invoices[idx],
      ...invData,
      updatedAt: nowIso,
    };

    invoices[idx] = updatedInvoice;
    this.saveInvoices(invoices);
    return updatedInvoice;
  },
  markInvoiceAsPaid(invoiceId: string) {
    const invoices = this.getInvoices() || [];
    const inv = invoices.find((i) => i && i.id === invoiceId);
    if (!inv) return false;

    const todayDate = new Date().toISOString().split('T')[0];
    inv.status = 'paid';
    inv.paymentDate = inv.paymentDate || todayDate;
    inv.paidDate = todayDate;
    inv.updatedAt = new Date().toISOString();

    this.saveInvoices(invoices);

    return {
      success: true,
      studentName: inv.studentName,
      addedSessions: inv.sessionsPurchased || 8,
      amount: inv.amount,
    };
  },
  deleteInvoice(id: string) {
    const invoices = this.getInvoices() || [];
    const updated = invoices.filter((i) => i && i.id !== id);
    this.saveInvoices(updated);
  },

  getBankConfig(): BankConfig {
    return getItem<BankConfig>(STORAGE_KEYS.BANK_CONFIG, INITIAL_BANK_CONFIG);
  },
  saveBankConfig(config: BankConfig) {
    setItem(STORAGE_KEYS.BANK_CONFIG, config);
    this.syncAllToCloud();
  },

  // EXPORT & DOWNLOAD FULL PRODUCTION DATABASE BACKUP (.JSON)
  exportFullDatabaseBackup() {
    return {
      version: '4.0_PRODUCTION',
      exportedAt: new Date().toISOString(),
      students: this.getStudents(),
      classes: this.getClasses(),
      sessions: this.getSessions(),
      homeworkTasks: this.getHomeworkTasks(),
      homeworkSubmissions: this.getHomeworkSubmissions(),
      invoices: this.getInvoices(),
      users: this.getUsers(),
      bankConfig: this.getBankConfig(),
      notifications: this.getNotifications(),
    };
  },

  downloadDatabaseBackupFile() {
    const backup = this.exportFullDatabaseBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MS_VY_ENGLISH_DATA_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // RESTORE DATABASE FROM BACKUP FILE
  restoreDatabaseFromBackup(backupData: any) {
    if (!backupData) return false;
    if (backupData.students) setItem(STORAGE_KEYS.STUDENTS, backupData.students);
    if (backupData.classes) setItem(STORAGE_KEYS.CLASSES, backupData.classes);
    if (backupData.sessions) setItem(STORAGE_KEYS.SESSIONS, backupData.sessions);
    if (backupData.homeworkTasks) setItem(STORAGE_KEYS.HOMEWORK_TASKS, backupData.homeworkTasks);
    if (backupData.homeworkSubmissions) setItem(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, backupData.homeworkSubmissions);
    if (backupData.invoices) setItem(STORAGE_KEYS.INVOICES, backupData.invoices);
    if (backupData.users) setItem(STORAGE_KEYS.USERS, backupData.users);
    if (backupData.bankConfig) setItem(STORAGE_KEYS.BANK_CONFIG, backupData.bankConfig);
    if (backupData.notifications) setItem(STORAGE_KEYS.NOTIFICATIONS, backupData.notifications);
    this.syncAllToCloud();
    return true;
  },

  // PROTECTED RESET DATABASE (SAFEGUARDED AGAINST ACCIDENTAL WIPES)
  resetDatabase() {
    const confirmCode = prompt('CẢNH BÁO: Việc này sẽ xóa toàn bộ dữ liệu thực! Nhập mã "CONFIRM_RESET_DATA" để thực hiện:');
    if (confirmCode === 'CONFIRM_RESET_DATA') {
      localStorage.clear();
      setItem(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      setItem(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
      setItem(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
      setItem(STORAGE_KEYS.HOMEWORK_TASKS, INITIAL_HOMEWORK_TASKS);
      setItem(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, INITIAL_HOMEWORK_SUBMISSIONS);
      setItem(STORAGE_KEYS.NOTIFICATIONS, []);
      setItem(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
      setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
      setItem(STORAGE_KEYS.BANK_CONFIG, INITIAL_BANK_CONFIG);
      setItem(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
      this.syncAllToCloud();
      alert('Đã khôi phục dữ liệu mẫu ban đầu!');
    }
  },

  // COMPREHENSIVE 2-STATE HOMEWORK COMPLETION & REALTIME NOTIFICATION SYSTEM
  toggleHomeworkTaskItemCheck(studentId: string, sessionId: string, homeworkItemId: string, homeworkTitle: string): boolean {
    const students = this.getStudents() || [];
    const stdIndex = students.findIndex((s) => s && s.id === studentId);
    let isCheckedNow = false;

    if (stdIndex !== -1) {
      const originalStd = students[stdIndex];
      const completedIds = originalStd.completedHomeworkTaskIds ? [...originalStd.completedHomeworkTaskIds] : [];
      const idx = completedIds.indexOf(homeworkItemId);

      if (idx !== -1) {
        completedIds.splice(idx, 1);
        isCheckedNow = false;
      } else {
        completedIds.push(homeworkItemId);
        isCheckedNow = true;
      }

      const updatedStd = {
        ...originalStd,
        completedHomeworkTaskIds: completedIds,
        stars: isCheckedNow ? (originalStd.stars || 0) + 2 : (originalStd.stars || 0),
      };

      const updatedStudents = [...students];
      updatedStudents[stdIndex] = updatedStd;
      this.saveStudents(updatedStudents);

      const subs = this.getHomeworkSubmissions() || [];
      const existingSubIdx = subs.findIndex((sub) => sub && sub.studentId === studentId && sub.homeworkTaskId === homeworkItemId);

      const now = new Date();
      const completionTimeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const todayDateStr = now.toISOString().split('T')[0];

      const classes = this.getClasses() || [];
      const cls = classes.find((c) => c && updatedStd.classIds && updatedStd.classIds.includes(c.id)) || classes[0];

      if (existingSubIdx !== -1) {
        const updatedSub = {
          ...subs[existingSubIdx],
          isStudentChecked: isCheckedNow,
          completionStatus: isCheckedNow ? ('COMPLETED' as const) : ('UNCOMPLETED' as const),
          completionTime: isCheckedNow ? completionTimeStr : subs[existingSubIdx].completionTime,
          submissionDate: isCheckedNow ? todayDateStr : subs[existingSubIdx].submissionDate,
          feedbackStatus: isCheckedNow
            ? (subs[existingSubIdx].feedbackStatus !== 'COMPLETED' ? ('PENDING' as const) : subs[existingSubIdx].feedbackStatus)
            : ('NONE' as const),
        };
        const updatedSubs = [...subs];
        updatedSubs[existingSubIdx] = updatedSub;
        this.saveHomeworkSubmissions(updatedSubs);
      } else if (isCheckedNow) {
        const newSubId = `sub_${Date.now()}`;
        const newSub: HomeworkSubmission = {
          id: newSubId,
          sessionId,
          homeworkTaskId: homeworkItemId,
          homeworkTitle,
          studentId,
          studentName: updatedStd.name || 'Học viên',
          classId: cls?.id,
          className: cls?.className,
          teacherId: cls?.teacherId,
          teacherName: cls?.teacherName,
          isStudentChecked: true,
          isTeacherFeedbackChecked: false,
          completionStatus: 'COMPLETED',
          feedbackStatus: 'PENDING',
          completionTime: completionTimeStr,
          submissionDate: todayDateStr,
        };
        const updatedSubs = [newSub, ...subs];

        const notifs = this.getNotifications() || [];
        const newNotif: AppNotification = {
          id: `notif_${Date.now()}`,
          title: `🔔 ${updatedStd.name} đã hoàn thành bài tập`,
          message: `📚 ${homeworkTitle} • 🕐 Đã hoàn thành lúc ${completionTimeStr}`,
          studentId: updatedStd.id,
          studentName: updatedStd.name,
          classId: cls?.id || '',
          className: cls?.className || 'Lớp Học',
          teacherId: cls?.teacherId || '',
          teacherName: cls?.teacherName || '',
          homeworkTaskId: homeworkItemId,
          homeworkTitle,
          submissionId: newSubId,
          completionTime: completionTimeStr,
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        this.saveNotifications([newNotif, ...notifs]);
        this.saveHomeworkSubmissions(updatedSubs);
      }
    }
    return isCheckedNow;
  },

  // SUBMIT TEACHER FEEDBACK WITH COMPLETED FEEDBACK STATUS
  submitHomeworkFeedback(submissionId: string, feedbackText: string, ratingStars: number, teacherUser?: User | null) {
    const subs = this.getHomeworkSubmissions() || [];
    const subIdx = subs.findIndex((s) => s && s.id === submissionId);
    if (subIdx !== -1) {
      const now = new Date();
      const feedbackTimeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const todayDateStr = now.toISOString().split('T')[0];

      const updatedSub = {
        ...subs[subIdx],
        isTeacherFeedbackChecked: true,
        feedbackStatus: 'COMPLETED' as const,
        feedbackText,
        ratingStars,
        feedbackDate: todayDateStr,
        feedbackTime: feedbackTimeStr,
        feedbackByUserId: teacherUser?.uid || 'admin',
        feedbackByUserName: teacherUser?.displayName || 'Giáo Viên',
      };
      const updatedSubs = [...subs];
      updatedSubs[subIdx] = updatedSub;
      this.saveHomeworkSubmissions(updatedSubs);
      this.markNotificationBySubmissionAsRead(submissionId);

      const students = this.getStudents() || [];
      const stdIdx = students.findIndex((s) => s && s.id === updatedSub.studentId);
      if (stdIdx !== -1) {
        const std = {
          ...students[stdIdx],
          stars: (students[stdIdx].stars || 0) + ratingStars,
        };
        const updatedStudents = [...students];
        updatedStudents[stdIdx] = std;
        this.saveStudents(updatedStudents);
      }
    }
  },

  // ALIAS FOR GRADED SUBMISSIONS
  gradeHomeworkSubmission(submissionId: string, feedbackText: string, ratingStars: number, teacherUser?: User | null) {
    this.submitHomeworkFeedback(submissionId, feedbackText, ratingStars, teacherUser);
  },

  recordBulkSession(sessionData: {
    classId: string;
    teacherId: string;
    teacherName?: string;
    date: string;
    lessonContent: string;
    homeworkItems?: HomeworkTaskItem[];
    studentFeedbacks?: Record<string, StudentFeedback>;
    recordLink?: string;
    quizletUrl?: string;
    studentQuizlets?: Record<string, string>;
    sessionMaterials?: ResourceLink[];
    attendanceList: AttendanceRecord[];
    isChargedAbsenceSession?: boolean;
    isExcusedAbsenceSession?: boolean;
    hasNoHomework?: boolean;
    hasNoQuizlet?: boolean;
  }): Session {
    const sessions = this.getSessions() || [];
    const classes = this.getClasses() || [];
    const targetClass = classes.find((c) => c && c.id === sessionData.classId);

    const existingClassSessions = sessions.filter((s) => s && s.classId === sessionData.classId);
    const startNum = targetClass?.startSessionNumber || 1;
    const sessionNumber = startNum + existingClassSessions.length;

    const newSession: Session = {
      id: `ses_${Date.now()}`,
      classId: sessionData.classId,
      className: targetClass?.className || 'Lớp Học',
      sessionNumber,
      date: sessionData.date,
      teacherId: sessionData.teacherId,
      teacherName: sessionData.teacherName || targetClass?.teacherName,
      attendance: sessionData.attendanceList || [],
      lessonContent: sessionData.lessonContent,
      homeworkItems: sessionData.hasNoHomework ? [] : (sessionData.homeworkItems || []),
      studentFeedbacks: sessionData.studentFeedbacks || {},
      recordLink: sessionData.recordLink,
      quizletUrl: sessionData.hasNoQuizlet ? '' : sessionData.quizletUrl,
      studentQuizlets: sessionData.hasNoQuizlet ? {} : (sessionData.studentQuizlets || {}),
      sessionMaterials: sessionData.sessionMaterials || [],
      isChargedAbsenceSession: sessionData.isChargedAbsenceSession || false,
      isExcusedAbsenceSession: sessionData.isExcusedAbsenceSession || false,
      hasNoHomework: sessionData.hasNoHomework || false,
      hasNoQuizlet: sessionData.hasNoQuizlet || false,
      createdAt: new Date().toISOString(),
    };

    sessions.unshift(newSession);
    this.saveSessions(sessions);

    const students = this.getStudents() || [];
    let updated = false;

    // Remaining sessions deduction: strictly SKIPPED if isExcusedAbsenceSession is true
    (sessionData.attendanceList || []).forEach((att) => {
      if (
        att &&
        !sessionData.isExcusedAbsenceSession &&
        (att.status === 'present' || att.status === 'late' || att.status === 'unexcused' || sessionData.isChargedAbsenceSession)
      ) {
        const std = students.find((s) => s && s.id === att.studentId);
        if (std && std.remainingSessions > 0) {
          std.remainingSessions -= 1;
          std.stars = (std.stars || 0) + 2;
          updated = true;
        }
      }
    });

    if (updated) {
      this.saveStudents(students);
    }

    return newSession;
  },

  // UPDATE AN EXISTING SESSION (FOR SUPER ADMIN & ADMIN)
  updateSession(sessionId: string, updatedData: Partial<Session>): Session | null {
    const sessions = this.getSessions() || [];
    const idx = sessions.findIndex((s) => s && s.id === sessionId);
    if (idx !== -1) {
      sessions[idx] = {
        ...sessions[idx],
        ...updatedData,
      };
      this.saveSessions(sessions);
      return sessions[idx];
    }
    return null;
  },

  calculateMonthlyRevenue(yearMonth: string): MonthlyRevenueReport {
    const sessions = this.getSessions() || [];
    const students = this.getStudents() || [];
    const monthSessions = sessions.filter((s) => s && s.date && s.date.startsWith(yearMonth));

    let totalRevenue = 0;
    const studentBreakdown: {
      studentId: string;
      studentName: string;
      sessionsTaughtInMonth: number;
      perSessionPrice: number;
      monthlyRevenue: number;
    }[] = [];

    students.forEach((std) => {
      if (!std || std.status === 'soft_deleted') return;

      const pkgPrice = std.tuitionPackagePrice || 2000000;
      const pkgCount = std.packageSessionCount || 8;
      const perSessionPrice = Math.round(pkgPrice / pkgCount);

      let countInMonth = 0;
      monthSessions.forEach((ses) => {
        if (ses && std.classIds && std.classIds.includes(ses.classId)) {
          if (isBillableStudentSession(ses, std.id)) {
            countInMonth += 1;
          }
        }
      });

      const monthlyRevenue = countInMonth * perSessionPrice;
      totalRevenue += monthlyRevenue;

      studentBreakdown.push({
        studentId: std.id,
        studentName: std.name || 'Học viên',
        sessionsTaughtInMonth: countInMonth,
        perSessionPrice,
        monthlyRevenue,
      });
    });

    return {
      monthYear: yearMonth,
      totalRevenue,
      studentBreakdown,
    };
  },

  // NOTIFICATION MANAGEMENT FUNCTIONS
  markNotificationAsRead(notifId: string) {
    const notifs = this.getNotifications() || [];
    const target = notifs.find((n) => n && n.id === notifId);
    if (target) {
      target.isRead = true;
      this.saveNotifications(notifs);
    }
  },

  markAllNotificationsAsRead() {
    const notifs = this.getNotifications() || [];
    notifs.forEach((n) => {
      if (n) n.isRead = true;
    });
    this.saveNotifications(notifs);
  },

  markNotificationBySubmissionAsRead(submissionId: string) {
    const notifs = this.getNotifications() || [];
    let updated = false;
    notifs.forEach((n) => {
      if (n && n.submissionId === submissionId) {
        n.isRead = true;
        updated = true;
      }
    });
    if (updated) {
      this.saveNotifications(notifs);
    }
  },

  // AUDIT LOG MANAGEMENT FUNCTIONS
  getAuditLogs(): AuditLogRecord[] {
    return getItem<AuditLogRecord[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },

  saveAuditLogs(logs: AuditLogRecord[]) {
    updateLiveMemoryStore(STORAGE_KEYS.AUDIT_LOGS, logs);
    this.syncAllToCloud();
  },

  addAuditLog(
    actorUser: User | null,
    action: string,
    targetType: AuditLogRecord['targetType'],
    targetId?: string,
    targetName?: string,
    classId?: string,
    className?: string,
    details?: string
  ) {
    const logs = this.getAuditLogs() || [];
    const newLog: AuditLogRecord = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actorUid: actorUser?.uid || 'system',
      actorName: actorUser?.displayName || 'System / Auto',
      actorRole: actorUser?.role || 'super_admin',
      action,
      targetType,
      targetId,
      targetName,
      classId,
      className,
      details: details || '',
    };
    logs.unshift(newLog); // latest logs first
    this.saveAuditLogs(logs.slice(0, 500)); // Keep latest 500 records
  },

  // INTERNAL STUDENT NOTES MANAGEMENT
  updateStudentInternalNotes(studentId: string, notes: string, authorUser?: User | null) {
    const students = this.getStudents() || [];
    const targetStudent = students.find((s) => s && s.id === studentId);
    if (!targetStudent) return;

    targetStudent.internalNotes = notes;
    if (!targetStudent.internalNotesHistory) {
      targetStudent.internalNotesHistory = [];
    }
    targetStudent.internalNotesHistory.unshift({
      id: `note_${Date.now()}`,
      content: notes,
      authorName: authorUser?.displayName || 'Giáo viên / Admin',
      createdAt: new Date().toISOString(),
    });

    this.saveStudents(students);
    this.addAuditLog(
      authorUser || null,
      'UPDATE_INTERNAL_NOTES',
      'note',
      studentId,
      targetStudent.name,
      targetStudent.classIds?.[0],
      undefined,
      `Cập nhật ghi chú nội bộ cho học viên ${targetStudent.name}`
    );
  },

  // ENTERPRISE SCOPE-BASED ACCESS CONTROL (ASSIGN CLASS MANAGERS)
  assignClassManagers(
    classId: string,
    adminId?: string,
    adminName?: string,
    teacherId?: string,
    teacherName?: string,
    coTeacherIds?: string[],
    authorUser?: User | null
  ) {
    const classes = this.getClasses() || [];
    const targetClass = classes.find((c) => c && c.id === classId);
    if (!targetClass) return;

    if (adminId !== undefined) targetClass.adminId = adminId;
    if (adminName !== undefined) targetClass.adminName = adminName;
    if (teacherId !== undefined) targetClass.teacherId = teacherId;
    if (teacherName !== undefined) targetClass.teacherName = teacherName;
    if (coTeacherIds !== undefined) targetClass.coTeacherIds = coTeacherIds;

    this.saveClasses(classes);

    this.addAuditLog(
      authorUser || null,
      'REASSIGN_CLASS_SCOPE',
      'permission',
      classId,
      targetClass.className,
      classId,
      targetClass.className,
      `Cập nhật quyền quản lý lớp: Admin (${adminName || 'Chưa gán'}), GV (${teacherName || 'Chưa gán'})`
    );
  },

  batchAssignClassAdmin(classIds: string[], adminId: string, adminName: string, authorUser?: User | null) {
    const classes = this.getClasses() || [];
    let count = 0;
    classes.forEach((cls) => {
      if (cls && classIds.includes(cls.id)) {
        cls.adminId = adminId;
        cls.adminName = adminName;
        count++;
      }
    });
    if (count > 0) {
      this.saveClasses(classes);
      this.addAuditLog(
        authorUser || null,
        'BATCH_ASSIGN_ADMIN',
        'permission',
        undefined,
        `${count} lớp học`,
        undefined,
        undefined,
        `Gán Admin "${adminName}" phụ trách cho ${count} lớp học hàng loạt`
      );
    }
  },

  updateUserLockStatus(userId: string, isLocked: boolean, authorUser?: User | null) {
    const users = this.getUsers() || [];
    const targetUser = users.find((u) => u && u.uid === userId);
    if (!targetUser) return;

    targetUser.isLocked = isLocked;
    this.saveUsers(users);

    this.addAuditLog(
      authorUser || null,
      isLocked ? 'LOCK_USER_ACCOUNT' : 'UNLOCK_USER_ACCOUNT',
      'user',
      userId,
      targetUser.displayName,
      undefined,
      undefined,
      `${isLocked ? 'Khóa' : 'Mở khóa'} tài khoản người dùng ${targetUser.displayName} (${targetUser.role})`
    );
  },

  // SCOPE FILTERING HELPERS
  isUserAllowedForClass(user: User | null, cls: Class): boolean {
    if (!user) return false;
    if (user.role === 'super_admin') return true;

    if (user.role === 'admin') {
      return cls.adminId === user.uid || (cls.adminName && cls.adminName === user.displayName);
    }

    if (user.role === 'teacher') {
      const isPrimary = cls.teacherId === user.uid || (cls.teacherName && cls.teacherName === user.displayName);
      const isCoTeacher = cls.coTeacherIds && cls.coTeacherIds.includes(user.uid);
      return Boolean(isPrimary || isCoTeacher);
    }

    return false;
  },

  getScopedClasses(user: User | null, classes: Class[]): Class[] {
    if (!user || user.role === 'super_admin') return classes;
    return classes.filter((cls) => cls && this.isUserAllowedForClass(user, cls));
  },

  getScopedStudents(user: User | null, students: Student[], classes: Class[]): Student[] {
    if (!user || user.role === 'super_admin') return students;
    const allowedClassIds = new Set(this.getScopedClasses(user, classes).map((c) => c.id));
    return students.filter((s) => s && s.classIds && s.classIds.some((cid) => allowedClassIds.has(cid)));
  },

  getDismissedPendingTaskIds(): string[] {
    return getItem<string[]>(STORAGE_KEYS.DISMISSED_PENDING_TASKS, []);
  },

  dismissPendingTaskId(taskId: string) {
    console.log('[SYNC][WRITE] dismissPendingTaskId called for taskId:', taskId);
    const dismissed = this.getDismissedPendingTaskIds() || [];
    const idsToAdd: string[] = [taskId];

    if (taskId.startsWith('unrecorded_')) {
      idsToAdd.push(taskId.replace('unrecorded_', 'penalty_'));
    } else if (taskId.startsWith('penalty_')) {
      idsToAdd.push(taskId.replace('penalty_', 'unrecorded_'));
    }

    let changed = false;
    idsToAdd.forEach((id) => {
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        changed = true;
      }
    });

    if (changed) {
      setItem(STORAGE_KEYS.DISMISSED_PENDING_TASKS, dismissed);
      this.syncAllToCloud();
    }
  },

  dismissPendingTaskIdSilent(taskId: string) {
    console.log('[SYNC][WRITE] dismissPendingTaskIdSilent called for taskId:', taskId);
    const dismissed = this.getDismissedPendingTaskIds() || [];
    const idsToAdd: string[] = [taskId];

    if (taskId.startsWith('unrecorded_')) {
      idsToAdd.push(taskId.replace('unrecorded_', 'penalty_'));
    } else if (taskId.startsWith('penalty_')) {
      idsToAdd.push(taskId.replace('penalty_', 'unrecorded_'));
    }

    let changed = false;
    idsToAdd.forEach((id) => {
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        changed = true;
      }
    });

    if (changed) {
      setItemSilent(STORAGE_KEYS.DISMISSED_PENDING_TASKS, dismissed);
      this.syncAllToCloud();
    }
  },

  getWaivedPenaltyKeys(): string[] {
    return getItem<string[]>(STORAGE_KEYS.WAIVED_PENALTIES, []);
  },

  toggleWaivePenalty(key: string) {
    console.log('[SYNC][WRITE] toggleWaivePenalty called for key:', key);
    const waived = this.getWaivedPenaltyKeys() || [];
    const idx = waived.indexOf(key);
    if (idx !== -1) {
      waived.splice(idx, 1);
    } else {
      waived.push(key);
    }
    setItem(STORAGE_KEYS.WAIVED_PENALTIES, waived);
    this.syncAllToCloud();
  },

  toggleWaivePenaltySilent(key: string) {
    console.log('[SYNC][WRITE] toggleWaivePenaltySilent called for key:', key);
    const waived = this.getWaivedPenaltyKeys() || [];
    const idx = waived.indexOf(key);
    if (idx !== -1) {
      waived.splice(idx, 1);
    } else {
      waived.push(key);
    }
    setItemSilent(STORAGE_KEYS.WAIVED_PENALTIES, waived);
    this.syncAllToCloud();
  },

  getCustomFines(): FineRecord[] {
    return getItem<FineRecord[]>(STORAGE_KEYS.CUSTOM_FINES, []);
  },

  saveCustomFines(fines: FineRecord[]) {
    setItem(STORAGE_KEYS.CUSTOM_FINES, [...fines]);
    this.syncAllToCloud();
  },

  addCustomFine(fineData: Omit<FineRecord, 'id' | 'createdAt' | 'updatedAt'>): FineRecord {
    console.log('[SYNC][WRITE] addCustomFine called:', fineData);
    const fines = this.getCustomFines();
    const nowIso = new Date().toISOString();
    const newFine: FineRecord = {
      ...fineData,
      id: `fine_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    fines.push(newFine);
    this.saveCustomFines(fines);
    return newFine;
  },

  deleteCustomFine(fineId: string) {
    console.log('[SYNC][WRITE] deleteCustomFine called for fineId:', fineId);
    const fines = this.getCustomFines();
    const filtered = fines.filter((f) => f.id !== fineId);
    this.saveCustomFines(filtered);
  },

  getLastStudentPortalUrl(): string | null {
    return getItem<string | null>(STORAGE_KEYS.LAST_STUDENT_PORTAL_URL, null);
  },

  setLastStudentPortalUrl(url: string | null) {
    if (url) {
      setItem(STORAGE_KEYS.LAST_STUDENT_PORTAL_URL, url);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LAST_STUDENT_PORTAL_URL);
    }
  },

  getCurrentStudentSession(): string | null {
    return getItem<string | null>(STORAGE_KEYS.CURRENT_STUDENT_SESSION, null);
  },

  setCurrentStudentSession(studentId: string | null) {
    if (studentId) {
      setItem(STORAGE_KEYS.CURRENT_STUDENT_SESSION, studentId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_STUDENT_SESSION);
    }
  },
};
