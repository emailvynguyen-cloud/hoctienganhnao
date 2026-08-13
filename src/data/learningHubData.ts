import { Book, Chapter } from '../types';

export const INITIAL_BOOKS: Book[] = [
  {
    id: 'book_ef_beginner',
    title: 'English File Beginner',
    description: 'Giáo trình tiếng Anh căn bản cho người mới bắt đầu (A1)',
    level: 'A1',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    displayOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'book_ef_elementary',
    title: 'English File Elementary',
    description: 'Giáo trình tiếng Anh sơ cấp phát triển toàn diện 4 kỹ năng (A1-A2)',
    level: 'A1-A2',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80',
    displayOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'book_kids_starters',
    title: 'Cambridge Young Learners: Starters',
    description: 'Giáo trình tiếng Anh tương tác sinh động cho học viên thiếu nhi',
    level: 'Starters',
    coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80',
    displayOrder: 3,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_CHAPTERS: Chapter[] = [
  {
    id: 'ch_ef_b_01',
    bookId: 'book_ef_beginner',
    title: 'Chapter 1: Hello & Greetings',
    chapterNumber: 1,
    description: 'Chào hỏi, giới thiệu bản thân, bảng chữ cái & số đếm 1-10',
    displayOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch_ef_b_02',
    bookId: 'book_ef_beginner',
    title: 'Chapter 2: World & Nationalities',
    chapterNumber: 2,
    description: 'Các quốc gia, quốc tịch, số đếm 11-100 & vật dụng hàng ngày',
    displayOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch_ef_b_03',
    bookId: 'book_ef_beginner',
    title: 'Chapter 3: Personal Things & Family',
    chapterNumber: 3,
    description: 'Thành viên gia đình, đồ dùng cá nhân, sở hữu cách & màu sắc',
    displayOrder: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch_ef_b_04',
    bookId: 'book_ef_beginner',
    title: 'Chapter 4: Everyday Life & Routines',
    chapterNumber: 4,
    description: 'Hoạt động hàng ngày, Thì Hiện Tại Đơn & thời gian',
    displayOrder: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ch_ef_elem_01',
    bookId: 'book_ef_elementary',
    title: 'Chapter 1: Welcome & Introductions',
    chapterNumber: 1,
    description: 'Giới thiệu bản thân nâng cao, Động từ To Be & Danh từ',
    displayOrder: 1,
    createdAt: new Date().toISOString(),
  },
];
