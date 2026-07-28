import { User, Student, Class, Session, HomeworkTask, HomeworkSubmission, Invoice, Badge, StarReward, BankConfig } from '../types';

export const INITIAL_BANK_CONFIG: BankConfig = {
  bankId: 'MB',
  bankName: 'MBBank (Ngân hàng Quân Đội)',
  accountNo: '0388999888',
  accountName: 'MS. VY ENGLISH - MS VY',
  centerLogoUrl: '/logo.jpg',
};

export const INITIAL_USERS: User[] = [
  {
    uid: 'u_super_admin',
    email: 'superadmin@msvyenglish.edu.vn',
    displayName: 'Ms. Vy (Điều Hành Cao Nhất)',
    role: 'super_admin',
    password: 'admin123',
    avatarUrl: '/logo.jpg',
    phoneNumber: '0908123456',
    createdAt: '2025-01-01',
  },
  {
    uid: 'u_admin_01',
    email: 'admin@msvyenglish.edu.vn',
    displayName: 'Quản Trị Viên Ms. Vy English',
    role: 'admin',
    password: 'admin123',
    avatarUrl: '/logo.jpg',
    phoneNumber: '0908889999',
    createdAt: '2025-01-10',
  },
  {
    uid: 'u_teacher_01',
    email: 'alex.smith@msvyenglish.edu.vn',
    displayName: 'Teacher Alex Smith',
    role: 'teacher',
    password: 'teacher123',
    avatarUrl: '/logo.jpg',
    phoneNumber: '0912345678',
    createdAt: '2025-02-01',
  },
  {
    uid: 'u_teacher_02',
    email: 'lan.nguyen@msvyenglish.edu.vn',
    displayName: 'Cô Nguyễn Thị Mai Lan',
    role: 'teacher',
    password: 'teacher123',
    avatarUrl: '/logo.jpg',
    phoneNumber: '0922334455',
    createdAt: '2025-02-15',
  },
];

export const BADGES: Badge[] = [
  { id: 'b_super_star', title: 'Siêu Sao Chăm Học', description: 'Đi học đúng giờ và tích cực bài tập', icon: '⭐', color: 'from-amber-400 to-amber-600' },
  { id: 'b_homework_hero', title: 'Anh Hùng Bài Tập', description: 'Nộp bài tập về nhà đúng hạn 5 lần', icon: '📝', color: 'from-blue-400 to-indigo-600' },
  { id: 'b_pronunciation_master', title: 'Thánh Phát Âm', description: 'Đạt điểm phát âm chuẩn tự nhiên', icon: '🎙️', color: 'from-emerald-400 to-teal-600' },
  { id: 'b_vocab_wizard', title: 'Phù Thủy Từ Vựng', description: 'Ghi nhớ 100 từ vựng cốt lõi', icon: '🧙‍♂️', color: 'from-purple-400 to-purple-600' },
  { id: 'b_top_performer', title: 'Học Viên Xuất Sắc', description: 'Xếp hạng TOP 1 thi đua tháng', icon: '👑', color: 'from-pink-400 to-rose-600' },
];

export const STAR_REWARDS: StarReward[] = [
  { id: 'r_01', title: 'Búp Bê / Gấu Bông Ms. Vy Cute', starsRequired: 30, description: 'Móc khóa gấu bông pastel xinh xắn', icon: '🧸', category: 'gift' },
  { id: 'r_02', title: 'Sổ Tay Từ Vựng Pastel Premium', starsRequired: 20, description: 'Sổ tay từ vựng phong cách cute', icon: '📓', category: 'gift' },
  { id: 'r_03', title: 'Voucher Giảm 10% Học Phí', starsRequired: 50, description: 'Áp dụng cho khóa học kế tiếp tại Ms. Vy English', icon: '🎟️', category: 'voucher' },
  { id: 'r_04', title: '1 Buổi Luyện Speaking 1-on-1', starsRequired: 40, description: '30 phút thực hành nói trực tiếp với GV Bản Ngữ', icon: '🗣️', category: 'privilege' },
];

export const INITIAL_CLASSES: Class[] = [
  {
    id: 'cls_ielts_65',
    className: 'IELTS Intensive 6.5+ (Lớp T2 - T4 - T6)',
    code: 'VY-IELTS-65',
    teacherId: 'u_teacher_01',
    teacherName: 'Teacher Alex Smith',
    schedule: 'Thứ 2 - Thứ 4 - Thứ 6 (18:00 - 19:30)',
    room: 'Phòng Online Zoom Premium 01',
    courseName: 'IELTS Breakthrough Masterclass',
    totalStudents: 2,
    status: 'active',
    zoomLink: 'https://zoom.us/j/99988877766',
    resourceLinks: [
      { id: 'res_01', title: 'Giáo Trình Cambridge IELTS 18 Complete PDF', url: 'https://drive.google.com/file/d/sample_ielts18', addedDate: '2025-07-01' },
      { id: 'res_02', title: 'Kho Từ Vựng C1/C2 Academic Wordlist (Spreadsheet)', url: 'https://docs.google.com/spreadsheets/d/sample_vocab', addedDate: '2025-07-05' }
    ]
  },
  {
    id: 'cls_kids_03',
    className: 'English Communication Starters (Lớp T3 - T5)',
    code: 'VY-KIDS-03',
    teacherId: 'u_teacher_02',
    teacherName: 'Cô Nguyễn Thị Mai Lan',
    schedule: 'Thứ 3 - Thứ 5 (17:30 - 19:00)',
    room: 'Phòng Creative Lab - Tầng 2',
    courseName: 'Smart Young Learners English',
    totalStudents: 2,
    status: 'active',
    zoomLink: 'https://zoom.us/j/11122233344',
    resourceLinks: [
      { id: 'res_03', title: 'Flashcards Từ Vựng Chủ Đề Animals & Nature', url: 'https://quizlet.com/sample_cards', addedDate: '2025-07-10' }
    ]
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std_01',
    publicHash: 'vy_std_minhanh99',
    name: 'Trần Minh Anh',
    email: 'minhanh.tran@gmail.com',
    phone: '0988112233',
    parentPhone: '0903112233',
    classIds: ['cls_ielts_65'],
    remainingSessions: 2,
    totalPaidSessions: 8,
    tuitionPackagePrice: 2000000,
    packageSessionCount: 8,
    status: 'active',
    stars: 35,
    badges: ['b_super_star', 'b_homework_hero', 'b_top_performer'],
    avatar: '/ryan.jpg',
    notes: 'Học sinh rất tích cực, phát âm chuẩn tự tin. Cần chú ý Coherence bài viết Writing.',
    honorNickname: '👑 Vua/ Nữ Hoàng Chăm Chỉ 👑',
    completedHomeworkTaskIds: ['hw_item_101_1', 'hw_item_101_2'],
    createdAt: '2025-06-20',
  },
  {
    id: 'std_02',
    publicHash: 'vy_std_baolong01',
    name: 'Nguyễn Bảo Long',
    email: 'baolong.nguyen@gmail.com',
    phone: '0977223344',
    parentPhone: '0918223344',
    classIds: ['cls_ielts_65'],
    remainingSessions: 4,
    totalPaidSessions: 8,
    tuitionPackagePrice: 2000000,
    packageSessionCount: 8,
    status: 'active',
    stars: 28,
    badges: ['b_vocab_wizard'],
    avatar: '/frodo.jpg',
    notes: 'Kỹ năng Listening xuất sắc. Cần làm thêm bài tập nói hàng tuần.',
    honorNickname: '🥈 Ngôi Sao Nỗ Lực ⭐',
    completedHomeworkTaskIds: ['hw_item_101_1'],
    createdAt: '2025-06-22',
  },
  {
    id: 'std_03',
    publicHash: 'vy_std_namkhanh05',
    name: 'Lê Nam Khánh',
    email: 'namkhanh.le@gmail.com',
    phone: '0966334455',
    parentPhone: '0908334455',
    classIds: ['cls_kids_03'],
    remainingSessions: 1,
    totalPaidSessions: 8,
    tuitionPackagePrice: 1800000,
    packageSessionCount: 8,
    status: 'active',
    stars: 22,
    badges: ['b_super_star'],
    avatar: '/muzi.jpg',
    notes: 'Rất hào hứng tương tác trong lớp, hát bài hát tiếng Anh đúng nhịp.',
    honorNickname: '🥉 Chiến Binh Kiên Trì 💪',
    completedHomeworkTaskIds: ['hw_item_102_1'],
    createdAt: '2025-06-25',
  },
  {
    id: 'std_04',
    publicHash: 'vy_std_thuyle88',
    name: 'Phạm Phương Thảo',
    email: 'phuongthao.pham@gmail.com',
    phone: '0911445566',
    parentPhone: '0902445566',
    classIds: ['cls_kids_03'],
    remainingSessions: 5,
    totalPaidSessions: 8,
    tuitionPackagePrice: 1800000,
    packageSessionCount: 8,
    status: 'active',
    stars: 15,
    badges: ['b_pronunciation_master'],
    avatar: '/apeach.jpg',
    notes: 'Cần mẫn nghe giảng, nhớ từ vựng qua hình ảnh rất nhanh.',
    honorNickname: '🏅 Nhà Chinh Phục 🚀',
    completedHomeworkTaskIds: ['hw_item_102_1'],
    createdAt: '2025-07-01',
  },
];

export const INITIAL_SESSIONS: Session[] = [
  {
    id: 'ses_101',
    classId: 'cls_ielts_65',
    className: 'IELTS Intensive 6.5+ (Lớp T2 - T4 - T6)',
    sessionNumber: 1,
    date: '2025-07-21',
    teacherId: 'u_teacher_01',
    teacherName: 'Teacher Alex Smith',
    attendance: [
      { studentId: 'std_01', studentName: 'Trần Minh Anh', status: 'present', note: 'Hăng hái phát biểu' },
      { studentId: 'std_02', studentName: 'Nguyễn Bảo Long', status: 'present', note: 'Hoàn thành Listening 8.0' },
    ],
    lessonContent: 'Unit 1: Task 2 Problem & Solution Essay Structure & Advanced Cohesion Markers',
    studentFeedbacks: {
      std_01: {
        strengths: 'Minh Anh áp dụng từ nối C1 rất linh hoạt, dàn bài 4 đoạn xuất sắc.',
        improvements: 'Cần phân bổ thời gian viết mở bài nhanh hơn trong 5 phút.',
      },
      std_02: {
        strengths: 'Bảo Long có ý tưởng giải quyết vấn đề kẹt xe rất thực tế.',
        improvements: 'Lưu ý từ vựng chính tả từ "metropolis" và "infrastructure".',
      },
    },
    homeworkItems: [
      {
        id: 'hw_item_101_1',
        title: 'Bài 1: Viết bài luận 250 từ Task 2',
        content: 'Topic: Urban Traffic Congestion & Solutions',
        attachmentUrl: 'https://drive.google.com/file/d/sample_de_bai_1',
      },
      {
        id: 'hw_item_101_2',
        title: 'Bài 2: Thu thuộc 15 từ vựng Academic Unit 1',
        content: 'Tự ghi âm đọc 15 từ vựng và dán link audio',
        attachmentUrl: 'https://quizlet.com/sample_u1_vocab',
      },
    ],
    recordLink: 'https://zoom.us/rec/play/sample_record_buoi_1',
    sessionMaterials: [
      { id: 'sm_01', title: 'Slide Bài Giảng Unit 1 (PDF)', url: 'https://drive.google.com/file/d/sample_slide_u1' },
    ],
    createdAt: '2025-07-21T19:30:00Z',
  },
  {
    id: 'ses_102',
    classId: 'cls_kids_03',
    className: 'English Communication Starters (Lớp T3 - T5)',
    sessionNumber: 1,
    date: '2025-07-22',
    teacherId: 'u_teacher_02',
    teacherName: 'Cô Nguyễn Thị Mai Lan',
    attendance: [
      { studentId: 'std_03', studentName: 'Lê Nam Khánh', status: 'present', note: 'Đóng vai nhiệt tình' },
      { studentId: 'std_04', studentName: 'Phạm Phương Thảo', status: 'present', note: 'Hát chuẩn từ vựng' },
    ],
    lessonContent: 'Lesson 1: Zoo Animals Vocabulary, Colors & Plural Nouns Game',
    studentFeedbacks: {
      std_03: {
        strengths: 'Nam Khánh phát biểu tự tin, thuộc tên các con vật rất nhanh.',
        improvements: 'Chú ý bật âm đuôi /s/ ở danh từ số nhiều "elephants".',
      },
      std_04: {
        strengths: 'Phương Thảo vẽ tranh minh họa con vật rất đẹp và hát đúng nhịp.',
        improvements: 'Nói to hơn một chút khi đứng trước lớp.',
      },
    },
    homeworkItems: [
      {
        id: 'hw_item_102_1',
        title: 'Bài 1: Ghi âm 3 câu miêu tả con vật yêu thích',
        content: 'Ví dụ: "This is a lion. It is yellow and very strong!"',
        attachmentUrl: 'https://youtube.com/watch?v=sample_kids_song',
      },
    ],
    recordLink: 'https://drive.google.com/file/d/sample_record_kids_b1',
    sessionMaterials: [
      { id: 'sm_03', title: 'Bài Hát Animals Song (Mp3)', url: 'https://soundcloud.com/sample_animals' }
    ],
    createdAt: '2025-07-22T19:00:00Z',
  },
];

export const INITIAL_HOMEWORK_SUBMISSIONS: HomeworkSubmission[] = [
  {
    id: 'sub_301',
    sessionId: 'ses_101',
    homeworkTaskId: 'hw_item_101_1',
    homeworkTitle: 'Bài 1: Viết bài luận 250 từ Task 2',
    studentId: 'std_01',
    studentName: 'Trần Minh Anh',
    isStudentChecked: true,
    isTeacherFeedbackChecked: false, // Cần Admin/Super Admin chấm & feedback!
    studentContent: 'Con đã hoàn thành bài viết essay 280 từ trên file Google Docs.',
    submissionDate: '2025-07-24',
  },
  {
    id: 'sub_302',
    sessionId: 'ses_101',
    homeworkTaskId: 'hw_item_101_2',
    homeworkTitle: 'Bài 2: Thu thuộc 15 từ vựng Academic Unit 1',
    studentId: 'std_01',
    studentName: 'Trần Minh Anh',
    isStudentChecked: true,
    isTeacherFeedbackChecked: true,
    studentContent: 'Đã học thuộc và đọc ghi âm chuẩn 15 từ.',
    feedbackText: 'Minh Anh phát âm 15 từ rất chuẩn! Thưởng cho con 3 sao nhé.',
    ratingStars: 3,
    submissionDate: '2025-07-24',
    feedbackDate: '2025-07-25',
  },
  {
    id: 'sub_303',
    sessionId: 'ses_102',
    homeworkTaskId: 'hw_item_102_1',
    homeworkTitle: 'Bài 1: Ghi âm 3 câu miêu tả con vật yêu thích',
    studentId: 'std_03',
    studentName: 'Lê Nam Khánh',
    isStudentChecked: true,
    isTeacherFeedbackChecked: false, // Cần Admin/Super Admin chấm & feedback!
    studentContent: 'Con đã thu âm: "This is a lion. It is yellow and very strong!"',
    submissionDate: '2025-07-23',
  },
];

export const INITIAL_HOMEWORK_TASKS: HomeworkTask[] = [];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_401',
    code: 'VY-INV-2025-081',
    studentId: 'std_01',
    studentName: 'Trần Minh Anh',
    studentPhone: '0988112233',
    amount: 2000000,
    sessionsPurchased: 8,
    status: 'paid',
    dueDate: '2025-07-05',
    createdDate: '2025-06-20',
    paidDate: '2025-06-20',
    qrContent: 'VY HOCPHI TRAN MINH ANH STD01',
    bankId: 'MB',
    accountNo: '0388999888',
    accountName: 'MS. VY ENGLISH - MS VY',
  },
  {
    id: 'inv_402',
    code: 'VY-INV-2025-082',
    studentId: 'std_03',
    studentName: 'Lê Nam Khánh',
    studentPhone: '0966334455',
    amount: 1800000,
    sessionsPurchased: 8,
    status: 'paid',
    dueDate: '2025-07-10',
    createdDate: '2025-06-25',
    paidDate: '2025-06-25',
    qrContent: 'VY HOCPHI LE NAM KHANH STD03',
    bankId: 'MB',
    accountNo: '0388999888',
    accountName: 'MS. VY ENGLISH - MS VY',
  },
];
