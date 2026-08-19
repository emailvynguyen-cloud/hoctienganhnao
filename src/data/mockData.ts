import { User, Student, Class, Session, HomeworkTask, HomeworkSubmission, Invoice, Badge, StarReward, BankConfig } from '../types';
import { KAKAOTALK_SVG_AVATARS } from '../lib/kakaotalkAvatars';

export const INITIAL_BANK_CONFIG: BankConfig = {
  bankId: 'MB',
  bankName: 'MBBank (Ngân hàng Quân Đội)',
  accountNo: '0355176317',
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
    email: 'ha.nguyen@msvyenglish.edu.vn',
    displayName: 'Cô Nguyễn Thị Thu Hà',
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
    id: 'cls_vy_master',
    className: 'IELTS Advanced Masterclass (Lớp T2 - T4 - T6)',
    code: 'VY-MASTER-01',
    teacherId: 'u_super_admin',
    teacherName: 'Ms. Vy',
    schedule: 'Thứ 2 - Thứ 4 - Thứ 6 (19:30 - 21:00)',
    room: 'Phòng VIP Ms. Vy Online Zoom',
    courseName: 'IELTS Advanced Masterclass',
    totalStudents: 2,
    status: 'active',
    zoomLink: 'https://zoom.us/j/88877766655',
    resourceLinks: [
      { id: 'res_vy_01', title: 'Bộ Từ Vựng Task 2 Band 8.0+ Ms. Vy', url: 'https://drive.google.com', addedDate: '2025-07-01' }
    ]
  },
  {
    id: 'cls_ielts_65',
    className: 'IELTS Intensive 6.5+ (Lớp T2 - T4 - T6)',
    code: 'VY-IELTS-65',
    teacherId: 'u_teacher_01',
    teacherName: 'Cô Nguyễn Thị Thu Hà',
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
    studentCode: 'HV7K29',
    studentCodeStatus: 'ACTIVE',
    name: 'Trần Minh Anh',
    email: 'minhanh.tran@gmail.com',
    phone: '0988112233',
    classIds: ['cls_vy_master', 'cls_ielts_65'],
    remainingSessions: 1,
    totalPaidSessions: 8,
    tuitionPackagePrice: 2000000,
    packageSessionCount: 8,
    honorNickname: '🥇 Ngôi Sao Chăm Chỉ 👑',
    avatar: KAKAOTALK_SVG_AVATARS.apeach,
    stars: 45,
    completedHomeworkTaskIds: ['hw_01', 'hw_02', 'hw_03'],
  },
  {
    id: 'std_02',
    publicHash: 'vy_std_phuongthao88',
    studentCode: 'VE8M42',
    studentCodeStatus: 'ACTIVE',
    name: 'Phạm Phương Thảo',
    email: 'phuongthao.pham@gmail.com',
    phone: '0911445566',
    classIds: ['cls_vy_master', 'cls_kids_03'],
    remainingSessions: 2,
    totalPaidSessions: 8,
    tuitionPackagePrice: 2000000,
    packageSessionCount: 8,
    honorNickname: '🥈 Ngôi Sao Nỗ Lực ⭐',
    avatar: KAKAOTALK_SVG_AVATARS.frodo,
    stars: 32,
    completedHomeworkTaskIds: ['hw_01', 'hw_04'],
  },
  {
    id: 'std_03',
    publicHash: 'vy_std_hoangnam77',
    studentCode: 'VY9N15',
    studentCodeStatus: 'ACTIVE',
    name: 'Nguyen Van A',
    email: 'hoangnam.le@gmail.com',
    phone: '0977889900',
    classIds: ['cls_ielts_65'],
    remainingSessions: 6,
    totalPaidSessions: 8,
    tuitionPackagePrice: 2000000,
    packageSessionCount: 8,
    honorNickname: '🥉 Chiến Binh Kiên Trì 💪',
    avatar: KAKAOTALK_SVG_AVATARS.neo,
    stars: 20,
    completedHomeworkTaskIds: ['hw_01'],
  },
  {
    id: 'std_04',
    publicHash: 'vy_std_thanhha66',
    studentCode: 'HV3P64',
    studentCodeStatus: 'ACTIVE',
    name: 'Đặng Thanh Hà',
    email: 'thanhha.dang@gmail.com',
    phone: '0933221100',
    classIds: ['cls_kids_03'],
    remainingSessions: 8,
    totalPaidSessions: 8,
    tuitionPackagePrice: 2000000,
    packageSessionCount: 8,
    honorNickname: '🏅 Nhà Chinh Phục 🚀',
    avatar: KAKAOTALK_SVG_AVATARS.tube,
    stars: 15,
    completedHomeworkTaskIds: [],
  },
];

export const INITIAL_SESSIONS: Session[] = [
  {
    id: 'sess_01',
    classId: 'cls_vy_master',
    sessionNumber: 1,
    date: '2026-07-28',
    lessonContent: 'IELTS Writing Task 2 - Strategy for Problem & Solution Essay',
    homeworkItems: [
      { id: 'hw_01', title: 'Bài 1: Viết bài Essay Task 2 hoàn chỉnh (250 từ)', content: 'Nộp file doc hoặc chụp ảnh bài viết tay lên drive' },
    ],
    studentFeedbacks: {
      std_01: { strengths: 'Mở bài và Thân bài 1 triển khai ý cực tốt', improvements: 'Chú ý kết bài tổng hợp lại 2 giải pháp' },
    },
    teacherId: 'u_super_admin',
    teacherName: 'Ms. Vy',
  },
];

export const INITIAL_HOMEWORK_TASKS: HomeworkTask[] = [];

export const INITIAL_HOMEWORK_SUBMISSIONS: HomeworkSubmission[] = [];

export const INITIAL_INVOICES: Invoice[] = [];
