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

const STORAGE_KEYS = {
  STUDENTS: 'vy_students_v4',
  CLASSES: 'vy_classes_v4',
  SESSIONS: 'vy_sessions_v4',
  HOMEWORK_TASKS: 'vy_hw_tasks_v4',
  HOMEWORK_SUBMISSIONS: 'vy_hw_submissions_v4',
  NOTIFICATIONS: 'vy_notifications_v4',
  INVOICES: 'vy_invoices_v4',
  USERS: 'vy_users_v4',
  BANK_CONFIG: 'vy_bank_config_v4',
  CURRENT_USER: 'vy_current_user_v4',
  CLOUD_SYNC_ENABLED: 'vy_cloud_sync_v4',
};

const liveMemoryStore: Record<string, any> = {};

export function updateLiveMemoryStore(key: string, value: any) {
  liveMemoryStore[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {}
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
    };
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
    return getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
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
      users[idx] = user;
      this.saveUsers(users);
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
    return getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  },
  saveStudents(students: Student[]) {
    setItem(STORAGE_KEYS.STUDENTS, students);
    this.syncAllToCloud();
  },
  addStudent(studentData: Partial<Student>): Student {
    const students = this.getStudents() || [];
    const newId = studentData.id || `std_${Date.now()}`;
    const newStudent: Student = {
      id: newId,
      name: studentData.name || 'Học viên mới',
      email: studentData.email || `${newId}@gmail.com`,
      phone: studentData.phone || '',
      classIds: studentData.classIds || [],
      remainingSessions: Number(studentData.remainingSessions) || 8,
      totalPaidSessions: Number(studentData.totalPaidSessions) || 8,
      tuitionPackagePrice: Number(studentData.tuitionPackagePrice) || 2000000,
      packageSessionCount: Number(studentData.packageSessionCount) || 8,
      publicHash: `hash_${newId}_${Math.random().toString(36).substr(2, 6)}`,
      joinedDate: new Date().toISOString().split('T')[0],
      stars: 0,
      completedHomeworkTaskIds: [],
      avatar: studentData.avatar || KAKAOTALK_SVG_AVATARS.ryan,
      honorNickname: '🥇 Ngôi Sao Chăm Chỉ 👑',
      status: 'active',
    };
    students.push(newStudent);
    this.saveStudents(students);

    // Auto-create student user account for login
    const users = this.getUsers() || [];
    const existingUser = users.find((u) => u.email === newStudent.email);
    if (!existingUser) {
      const newUser: User = {
        uid: `u_${newId}`,
        email: newStudent.email,
        password: newStudent.phone || 'hocvien123',
        displayName: newStudent.name,
        role: 'student',
        createdAt: new Date().toISOString().split('T')[0],
      };
      users.push(newUser);
      this.saveUsers(users);
    }

    return newStudent;
  },
  updateStudent(student: Student) {
    const students = this.getStudents() || [];
    const idx = students.findIndex((s) => s && s.id === student.id);
    if (idx !== -1) {
      students[idx] = student;
      this.saveStudents(students);
    }
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
    const std = students.find((s) => s && s.id === studentId);
    if (std && std.classIds) {
      std.classIds = std.classIds.filter((cid) => cid !== classId);
      this.saveStudents(students);
    }
  },
  updateStudent(student: Student) {
    const students = this.getStudents() || [];
    const idx = students.findIndex((s) => s && s.id === student.id);
    if (idx !== -1) {
      students[idx] = { ...students[idx], ...student };
      this.saveStudents(students);
    }
  },

  getClasses(): Class[] {
    return getItem<Class[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  },
  saveClasses(classes: Class[]) {
    setItem(STORAGE_KEYS.CLASSES, classes);
    this.syncAllToCloud();
  },
  addClass(classData: Partial<Class>): Class {
    const classes = this.getClasses() || [];
    const newId = classData.id || `cls_${Date.now()}`;
    const newClass: Class = {
      id: newId,
      className: classData.className || 'Lớp Mới',
      code: classData.code || `CLASS-${Date.now()}`,
      teacherName: classData.teacherName || 'Ms. Vy',
      teacherId: classData.teacherId || 'u_admin',
      schedule: classData.schedule || 'Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 19:30)',
      courseName: classData.courseName || 'Tiếng Anh Giao Tiếp',
      zoomLink: classData.zoomLink || '',
      startSessionNumber: Number(classData.startSessionNumber) || 1,
      resourceLinks: classData.resourceLinks || [],
    };
    classes.push(newClass);
    this.saveClasses(classes);
    return newClass;
  },
  updateClass(cls: Class) {
    const classes = this.getClasses() || [];
    const idx = classes.findIndex((c) => c && c.id === cls.id);
    if (idx !== -1) {
      classes[idx] = cls;
      this.saveClasses(classes);
    }
  },
  archiveClass(classId: string) {
    const classes = this.getClasses() || [];
    const cls = classes.find((c) => c && c.id === classId);
    if (cls) {
      cls.status = 'archived';
      this.saveClasses(classes);
    }
  },
  restoreClass(classId: string) {
    const classes = this.getClasses() || [];
    const cls = classes.find((c) => c && c.id === classId);
    if (cls) {
      cls.status = 'active';
      this.saveClasses(classes);
    }
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
    const rawSessions = getItem<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
    return this.sortAndReindexSessions(rawSessions);
  },
  saveSessions(sessions: Session[]) {
    const sorted = this.sortAndReindexSessions(sessions);
    setItem(STORAGE_KEYS.SESSIONS, sorted);
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

  getInvoices(): Invoice[] {
    return getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  },
  saveInvoices(invoices: Invoice[]) {
    setItem(STORAGE_KEYS.INVOICES, invoices);
    this.syncAllToCloud();
  },
  addInvoice(invData: Partial<Invoice>): Invoice {
    const invoices = this.getInvoices() || [];
    const newId = invData.id || `inv_${Date.now()}`;
    const newInvoice: Invoice = {
      id: newId,
      code: invData.code || `VY-REC-${Date.now().toString().slice(-6)}`,
      studentId: invData.studentId || '',
      studentName: invData.studentName || 'Học viên',
      studentPhone: invData.studentPhone || '',
      amount: Number(invData.amount) || 2000000,
      sessionsPurchased: Number(invData.sessionsPurchased) || 8,
      status: invData.status || 'pending',
      dueDate: invData.dueDate || new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString().split('T')[0],
      qrContent: invData.qrContent || '',
      bankId: invData.bankId || 'MB',
      accountNo: invData.accountNo || '0355176317',
      accountName: invData.accountName || 'MS. VY ENGLISH - MS VY',
    };
    invoices.unshift(newInvoice);
    this.saveInvoices(invoices);

    // If initial status is paid, immediately credit student
    if (newInvoice.status === 'paid') {
      const students = this.getStudents() || [];
      const std = students.find((s) => s && s.id === newInvoice.studentId);
      if (std) {
        std.remainingSessions = (std.remainingSessions || 0) + newInvoice.sessionsPurchased;
        std.totalPaidSessions = (std.totalPaidSessions || 0) + newInvoice.sessionsPurchased;
        this.saveStudents(students);
      }
    }

    return newInvoice;
  },
  markInvoiceAsPaid(invoiceId: string) {
    const invoices = this.getInvoices() || [];
    const inv = invoices.find((i) => i && i.id === invoiceId);
    if (!inv || inv.status === 'paid') return false;

    inv.status = 'paid';
    inv.paidDate = new Date().toISOString().split('T')[0];
    this.saveInvoices(invoices);

    // Add sessionsPurchased to student
    const students = this.getStudents() || [];
    const std = students.find((s) => s && s.id === inv.studentId);
    if (std) {
      std.remainingSessions = (std.remainingSessions || 0) + (inv.sessionsPurchased || 8);
      std.totalPaidSessions = (std.totalPaidSessions || 0) + (inv.sessionsPurchased || 8);
      this.saveStudents(students);
    }

    return {
      success: true,
      studentName: std?.name || inv.studentName,
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

  addStudent(studentData: Omit<Student, 'id' | 'publicHash' | 'createdAt' | 'status' | 'stars' | 'badges'>): Student {
    const students = this.getStudents() || [];
    const newStudent: Student = {
      ...studentData,
      id: `std_${Date.now()}`,
      publicHash: generatePublicHash(studentData.name),
      status: 'active',
      stars: 10,
      badges: ['b_super_star'],
      completedHomeworkTaskIds: [],
      resourceLinks: [],
      createdAt: new Date().toISOString().split('T')[0],
    };
    students.push(newStudent);
    this.saveStudents(students);
    return newStudent;
  },

  updateStudent(student: Student) {
    const students = this.getStudents() || [];
    const idx = students.findIndex((s) => s && s.id === student.id);
    if (idx !== -1) {
      students[idx] = student;
      this.saveStudents(students);
    }
  },

  // COMPREHENSIVE 2-STATE HOMEWORK COMPLETION & REALTIME NOTIFICATION SYSTEM
  toggleHomeworkTaskItemCheck(studentId: string, sessionId: string, homeworkItemId: string, homeworkTitle: string): boolean {
    const students = this.getStudents() || [];
    const std = students.find((s) => s && s.id === studentId);
    let isCheckedNow = false;

    if (std) {
      if (!std.completedHomeworkTaskIds) std.completedHomeworkTaskIds = [];
      const idx = std.completedHomeworkTaskIds.indexOf(homeworkItemId);

      if (idx !== -1) {
        std.completedHomeworkTaskIds.splice(idx, 1);
        isCheckedNow = false;
      } else {
        std.completedHomeworkTaskIds.push(homeworkItemId);
        std.stars = (std.stars || 0) + 2;
        isCheckedNow = true;
      }
      this.saveStudents(students);

      const subs = this.getHomeworkSubmissions() || [];
      const existingSub = subs.find((sub) => sub && sub.studentId === studentId && sub.homeworkTaskId === homeworkItemId);

      const now = new Date();
      const completionTimeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const todayDateStr = now.toISOString().split('T')[0];

      // Find student's primary class for notification scoping
      const classes = this.getClasses() || [];
      const cls = classes.find((c) => c && std.classIds && std.classIds.includes(c.id)) || classes[0];

      if (existingSub) {
        existingSub.isStudentChecked = isCheckedNow;
        existingSub.completionStatus = isCheckedNow ? 'COMPLETED' : 'UNCOMPLETED';
        if (isCheckedNow) {
          existingSub.completionTime = completionTimeStr;
          existingSub.submissionDate = todayDateStr;
          if (existingSub.feedbackStatus !== 'COMPLETED') {
            existingSub.feedbackStatus = 'PENDING';
          }
        } else {
          existingSub.feedbackStatus = 'NONE';
        }
      } else if (isCheckedNow) {
        const newSubId = `sub_${Date.now()}`;
        const newSub: HomeworkSubmission = {
          id: newSubId,
          sessionId,
          homeworkTaskId: homeworkItemId,
          homeworkTitle,
          studentId,
          studentName: std.name || 'Học viên',
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
        subs.unshift(newSub);

        // CREATE AUTOMATIC REAL-TIME NOTIFICATION FOR ADMIN/TEACHER
        const notifs = this.getNotifications() || [];
        const newNotif: AppNotification = {
          id: `notif_${Date.now()}`,
          title: `🔔 ${std.name} đã hoàn thành bài tập`,
          message: `📚 ${homeworkTitle} • 🕐 Đã hoàn thành lúc ${completionTimeStr}`,
          studentId: std.id,
          studentName: std.name,
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
        notifs.unshift(newNotif);
        this.saveNotifications(notifs);
      }
      this.saveHomeworkSubmissions(subs);
    }
    return isCheckedNow;
  },

  // SUBMIT TEACHER FEEDBACK WITH COMPLETED FEEDBACK STATUS
  submitHomeworkFeedback(submissionId: string, feedbackText: string, ratingStars: number, teacherUser?: User | null) {
    const subs = this.getHomeworkSubmissions() || [];
    const sub = subs.find((s) => s && s.id === submissionId);
    if (sub) {
      const now = new Date();
      const feedbackTimeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const todayDateStr = now.toISOString().split('T')[0];

      sub.isTeacherFeedbackChecked = true;
      sub.feedbackStatus = 'COMPLETED';
      sub.feedbackText = feedbackText;
      sub.ratingStars = ratingStars;
      sub.feedbackDate = todayDateStr;
      sub.feedbackTime = feedbackTimeStr;
      sub.feedbackByUserId = teacherUser?.uid || 'admin';
      sub.feedbackByUserName = teacherUser?.displayName || 'Giáo Viên';
      this.saveHomeworkSubmissions(subs);
      this.markNotificationBySubmissionAsRead(submissionId);

      const students = this.getStudents() || [];
      const std = students.find((s) => s && s.id === sub.studentId);
      if (std) {
        std.stars = (std.stars || 0) + ratingStars;
        this.saveStudents(students);
      }
    }
  },

  // ALIAS FOR GRADED SUBMISSIONS
  gradeHomeworkSubmission(submissionId: string, feedbackText: string, ratingStars: number, teacherUser?: User | null) {
    this.submitHomeworkFeedback(submissionId, feedbackText, ratingStars, teacherUser);
  },

  addClass(classData: Omit<Class, 'id' | 'totalStudents' | 'status'>): Class {
    const classes = this.getClasses() || [];
    const newClass: Class = {
      ...classData,
      id: `cls_${Date.now()}`,
      totalStudents: 0,
      status: 'active',
      startSessionNumber: classData.startSessionNumber || 1,
      resourceLinks: classData.resourceLinks || [],
    };
    classes.push(newClass);
    this.saveClasses(classes);
    return newClass;
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
    sessionMaterials?: ResourceLink[];
    attendanceList: AttendanceRecord[];
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
      homeworkItems: sessionData.homeworkItems || [],
      studentFeedbacks: sessionData.studentFeedbacks || {},
      recordLink: sessionData.recordLink,
      quizletUrl: sessionData.quizletUrl,
      sessionMaterials: sessionData.sessionMaterials || [],
      createdAt: new Date().toISOString(),
    };

    sessions.unshift(newSession);
    this.saveSessions(sessions);

    const students = this.getStudents() || [];
    let updated = false;

    (sessionData.attendanceList || []).forEach((att) => {
      if (att && (att.status === 'present' || att.status === 'late')) {
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
        if (ses && ses.attendance && Array.isArray(ses.attendance)) {
          const att = ses.attendance.find((a) => a && a.studentId === std.id);
          if (att && (att.status === 'present' || att.status === 'late')) {
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
};
