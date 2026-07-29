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
  STUDENTS: 'vy_students_v3',
  CLASSES: 'vy_classes_v3',
  SESSIONS: 'vy_sessions_v3',
  HOMEWORK_TASKS: 'vy_hw_tasks_v3',
  HOMEWORK_SUBMISSIONS: 'vy_hw_submissions_v3',
  NOTIFICATIONS: 'vy_notifications_v3',
  INVOICES: 'vy_invoices_v3',
  USERS: 'vy_users_v3',
  BANK_CONFIG: 'vy_bank_config_v3',
  CURRENT_USER: 'vy_current_user_v3',
  CLOUD_SYNC_ENABLED: 'vy_cloud_sync_v3',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed !== undefined && parsed !== null) return parsed;
    }
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
  }
  return defaultValue;
}

function setItem<T>(key: string, value: T): void {
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

export const StorageEngine = {
  getCurrentUser(): User | null {
    return getItem<User | null>(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
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
    syncCollectionToCloud('users', users);
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
    const users = this.getUsers() || [];
    const updated = users.filter((u) => u && u.uid !== uid);
    this.saveUsers(updated);
  },

  getStudents(): Student[] {
    return getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  },
  saveStudents(students: Student[]) {
    setItem(STORAGE_KEYS.STUDENTS, students);
    syncCollectionToCloud('students', students);
  },

  getClasses(): Class[] {
    return getItem<Class[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  },
  saveClasses(classes: Class[]) {
    setItem(STORAGE_KEYS.CLASSES, classes);
    syncCollectionToCloud('classes', classes);
  },

  getSessions(): Session[] {
    return getItem<Session[]>(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS);
  },
  saveSessions(sessions: Session[]) {
    setItem(STORAGE_KEYS.SESSIONS, sessions);
    syncCollectionToCloud('sessions', sessions);
  },

  getHomeworkTasks(): HomeworkTask[] {
    return getItem<HomeworkTask[]>(STORAGE_KEYS.HOMEWORK_TASKS, INITIAL_HOMEWORK_TASKS);
  },
  saveHomeworkTasks(tasks: HomeworkTask[]) {
    setItem(STORAGE_KEYS.HOMEWORK_TASKS, tasks);
    syncCollectionToCloud('homework_tasks', tasks);
  },

  getHomeworkSubmissions(): HomeworkSubmission[] {
    return getItem<HomeworkSubmission[]>(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, INITIAL_HOMEWORK_SUBMISSIONS);
  },
  saveHomeworkSubmissions(subs: HomeworkSubmission[]) {
    setItem(STORAGE_KEYS.HOMEWORK_SUBMISSIONS, subs);
    syncCollectionToCloud('homework_submissions', subs);
  },

  getNotifications(): AppNotification[] {
    return getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },
  saveNotifications(notifications: AppNotification[]) {
    setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    syncCollectionToCloud('notifications', notifications);
  },
  markNotificationAsRead(id: string) {
    const notifs = this.getNotifications() || [];
    const target = notifs.find((n) => n.id === id);
    if (target) {
      target.isRead = true;
      this.saveNotifications(notifs);
    }
  },

  getInvoices(): Invoice[] {
    return getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  },
  saveInvoices(invoices: Invoice[]) {
    setItem(STORAGE_KEYS.INVOICES, invoices);
    syncCollectionToCloud('invoices', invoices);
  },

  getBankConfig(): BankConfig {
    return getItem<BankConfig>(STORAGE_KEYS.BANK_CONFIG, INITIAL_BANK_CONFIG);
  },
  saveBankConfig(config: BankConfig) {
    setItem(STORAGE_KEYS.BANK_CONFIG, config);
    syncCollectionToCloud('bank_config', [config]);
  },

  resetDatabase() {
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
    syncCollectionToCloud('students', INITIAL_STUDENTS);
    syncCollectionToCloud('classes', INITIAL_CLASSES);
    syncCollectionToCloud('sessions', INITIAL_SESSIONS);
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
};
