import { supabase } from './supabaseEngine';
import {
  Book,
  Chapter,
  LearningQuestion,
  PracticeSet,
  ChapterTest,
  StudentPracticeAttempt,
  StudentTestAttempt,
} from '../types';
import { INITIAL_BOOKS, INITIAL_CHAPTERS } from '../data/learningHubData';

export class LearningHubService {
  // ==========================================
  // BOOKS
  // ==========================================
  static async getBooks(): Promise<Book[]> {
    try {
      const { data, error } = await supabase
        .from('learning_books')
        .select('*')
        .order('display_order', { ascending: true });

      if (error || !data || data.length === 0) {
        return INITIAL_BOOKS;
      }

      return data.map((b: any) => ({
        id: b.id,
        title: b.title,
        description: b.description || '',
        level: b.level || 'A1',
        coverImage: b.cover_image || '',
        displayOrder: b.display_order || 0,
        createdAt: b.created_at || new Date().toISOString(),
      }));
    } catch {
      return INITIAL_BOOKS;
    }
  }

  static async saveBook(book: Partial<Book>): Promise<boolean> {
    try {
      const dbPayload = {
        id: book.id,
        title: book.title,
        description: book.description,
        level: book.level,
        cover_image: book.coverImage,
        display_order: book.displayOrder || 0,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('learning_books').upsert(dbPayload);
      return !error;
    } catch {
      return false;
    }
  }

  // ==========================================
  // CHAPTERS
  // ==========================================
  static async getChapters(bookId?: string): Promise<Chapter[]> {
    try {
      let query = supabase.from('learning_chapters').select('*').order('display_order', { ascending: true });
      if (bookId) {
        query = query.eq('book_id', bookId);
      }

      const { data, error } = await query;
      if (error || !data || data.length === 0) {
        return bookId ? INITIAL_CHAPTERS.filter((c) => c.bookId === bookId) : INITIAL_CHAPTERS;
      }

      return data.map((c: any) => ({
        id: c.id,
        bookId: c.book_id,
        title: c.title,
        chapterNumber: c.chapter_number,
        description: c.description || '',
        displayOrder: c.display_order || 0,
        createdAt: c.created_at || new Date().toISOString(),
      }));
    } catch {
      return bookId ? INITIAL_CHAPTERS.filter((c) => c.bookId === bookId) : INITIAL_CHAPTERS;
    }
  }

  static async saveChapter(chapter: Partial<Chapter>): Promise<boolean> {
    try {
      const dbPayload = {
        id: chapter.id,
        book_id: chapter.bookId,
        title: chapter.title,
        chapter_number: chapter.chapterNumber,
        description: chapter.description,
        display_order: chapter.displayOrder || 0,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('learning_chapters').upsert(dbPayload);
      return !error;
    } catch {
      return false;
    }
  }

  // ==========================================
  // SERVER RPC SUBMISSION CALLS
  // ==========================================
  static async submitChapterTest(payload: {
    studentId: string;
    studentCode: string;
    chapterTestId: string;
    timeSpentSeconds: number;
    answers: Record<string, string>;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('submit_chapter_test', {
        p_student_id: payload.studentId,
        p_student_code: payload.studentCode,
        p_chapter_test_id: payload.chapterTestId,
        p_time_spent_seconds: payload.timeSpentSeconds,
        p_answers: payload.answers,
      });

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Có lỗi xảy ra khi nộp bài kiểm tra.' };
    }
  }

  static async submitPracticeAttempt(payload: {
    studentId: string;
    studentCode: string;
    practiceSetId: string;
    timeSpentSeconds: number;
    answers: Record<string, string>;
  }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('submit_practice_attempt', {
        p_student_id: payload.studentId,
        p_student_code: payload.studentCode,
        p_practice_set_id: payload.practiceSetId,
        p_time_spent_seconds: payload.timeSpentSeconds,
        p_answers: payload.answers,
      });

      if (error) {
        return { ok: false, error: error.message };
      }
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Có lỗi xảy ra khi nộp bài luyện tập.' };
    }
  }
}
