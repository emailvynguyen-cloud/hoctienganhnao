import { supabase } from './supabaseEngine';
import {
  Book,
  Chapter,
  Lesson,
  Exercise,
  LearningQuestion,
  PracticeSet,
  ChapterTest,
  StudentPracticeAttempt,
  StudentTestAttempt,
} from '../types';
import { INITIAL_BOOKS, INITIAL_CHAPTERS, INITIAL_LESSONS, INITIAL_EXERCISES } from '../data/learningHubData';

const LOCAL_BOOKS_KEY = 'vy_learning_books_v1';
const LOCAL_CHAPTERS_KEY = 'vy_learning_chapters_v1';
const LOCAL_LESSONS_KEY = 'vy_learning_lessons_v1';
const LOCAL_EXERCISES_KEY = 'vy_learning_exercises_v1';

const LOCAL_DELETED_BOOKS_KEY = 'vy_deleted_book_ids_v1';
const LOCAL_DELETED_CHAPTERS_KEY = 'vy_deleted_chapter_ids_v1';
const LOCAL_DELETED_LESSONS_KEY = 'vy_deleted_lesson_ids_v1';
const LOCAL_DELETED_EXERCISES_KEY = 'vy_deleted_exercise_ids_v1';

function getLocalDeletedBookIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_BOOKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalDeletedChapterIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_CHAPTERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalDeletedLessonIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_LESSONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getLocalDeletedExerciseIds(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_DELETED_EXERCISES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalDeletedBookId(bookId: string) {
  try {
    const deleted = getLocalDeletedBookIds();
    if (!deleted.includes(bookId)) {
      deleted.push(bookId);
      localStorage.setItem(LOCAL_DELETED_BOOKS_KEY, JSON.stringify(deleted));
    }
  } catch {}
}

function saveLocalDeletedChapterId(chapterId: string) {
  try {
    const deleted = getLocalDeletedChapterIds();
    if (!deleted.includes(chapterId)) {
      deleted.push(chapterId);
      localStorage.setItem(LOCAL_DELETED_CHAPTERS_KEY, JSON.stringify(deleted));
    }
  } catch {}
}

function saveLocalDeletedLessonId(lessonId: string) {
  try {
    const deleted = getLocalDeletedLessonIds();
    if (!deleted.includes(lessonId)) {
      deleted.push(lessonId);
      localStorage.setItem(LOCAL_DELETED_LESSONS_KEY, JSON.stringify(deleted));
    }
  } catch {}
}

function saveLocalDeletedExerciseId(exerciseId: string) {
  try {
    const deleted = getLocalDeletedExerciseIds();
    if (!deleted.includes(exerciseId)) {
      deleted.push(exerciseId);
      localStorage.setItem(LOCAL_DELETED_EXERCISES_KEY, JSON.stringify(deleted));
    }
  } catch {}
}

function getLocalBooks(): Book[] {
  try {
    const raw = localStorage.getItem(LOCAL_BOOKS_KEY);
    const books: Book[] = raw ? JSON.parse(raw) : INITIAL_BOOKS;
    const deletedIds = getLocalDeletedBookIds();
    return books.filter((b) => b && !deletedIds.includes(b.id));
  } catch {
    const deletedIds = getLocalDeletedBookIds();
    return INITIAL_BOOKS.filter((b) => b && !deletedIds.includes(b.id));
  }
}

function setLocalBooks(books: Book[]) {
  try {
    localStorage.setItem(LOCAL_BOOKS_KEY, JSON.stringify(books));
  } catch {}
}

function getLocalChapters(): Chapter[] {
  try {
    const raw = localStorage.getItem(LOCAL_CHAPTERS_KEY);
    const chapters: Chapter[] = raw ? JSON.parse(raw) : INITIAL_CHAPTERS;
    const deletedBookIds = getLocalDeletedBookIds();
    const deletedChapterIds = getLocalDeletedChapterIds();
    return chapters.filter(
      (c) => c && !deletedBookIds.includes(c.bookId) && !deletedChapterIds.includes(c.id)
    );
  } catch {
    const deletedBookIds = getLocalDeletedBookIds();
    const deletedChapterIds = getLocalDeletedChapterIds();
    return INITIAL_CHAPTERS.filter(
      (c) => c && !deletedBookIds.includes(c.bookId) && !deletedChapterIds.includes(c.id)
    );
  }
}

function setLocalChapters(chapters: Chapter[]) {
  try {
    localStorage.setItem(LOCAL_CHAPTERS_KEY, JSON.stringify(chapters));
  } catch {}
}

function getLocalLessons(): Lesson[] {
  try {
    const raw = localStorage.getItem(LOCAL_LESSONS_KEY);
    const lessons: Lesson[] = raw ? JSON.parse(raw) : INITIAL_LESSONS;
    const deletedLessonIds = getLocalDeletedLessonIds();
    const deletedChapterIds = getLocalDeletedChapterIds();
    return lessons.filter((l) => l && !deletedLessonIds.includes(l.id) && !deletedChapterIds.includes(l.chapterId));
  } catch {
    const deletedLessonIds = getLocalDeletedLessonIds();
    const deletedChapterIds = getLocalDeletedChapterIds();
    return INITIAL_LESSONS.filter((l) => l && !deletedLessonIds.includes(l.id) && !deletedChapterIds.includes(l.chapterId));
  }
}

function setLocalLessons(lessons: Lesson[]) {
  try {
    localStorage.setItem(LOCAL_LESSONS_KEY, JSON.stringify(lessons));
  } catch {}
}

function getLocalExercises(): Exercise[] {
  try {
    const raw = localStorage.getItem(LOCAL_EXERCISES_KEY);
    const exercises: Exercise[] = raw ? JSON.parse(raw) : INITIAL_EXERCISES;
    const deletedExerciseIds = getLocalDeletedExerciseIds();
    const deletedLessonIds = getLocalDeletedLessonIds();
    return exercises.filter((e) => e && !deletedExerciseIds.includes(e.id) && !deletedLessonIds.includes(e.lessonId));
  } catch {
    const deletedExerciseIds = getLocalDeletedExerciseIds();
    const deletedLessonIds = getLocalDeletedLessonIds();
    return INITIAL_EXERCISES.filter((e) => e && !deletedExerciseIds.includes(e.id) && !deletedLessonIds.includes(e.lessonId));
  }
}

function setLocalExercises(exercises: Exercise[]) {
  try {
    localStorage.setItem(LOCAL_EXERCISES_KEY, JSON.stringify(exercises));
  } catch {}
}

export class LearningHubService {
  // ==========================================
  // BOOKS
  // ==========================================
  static async getBooks(): Promise<Book[]> {
    const localBooks = getLocalBooks();
    try {
      const { data, error } = await supabase
        .from('learning_books')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        const deletedIds = getLocalDeletedBookIds();
        const remoteBooks: Book[] = data
          .map((b: any) => ({
            id: b.id,
            title: b.title,
            description: b.description || '',
            level: b.level || 'A1',
            coverImage: b.cover_image || '',
            displayOrder: b.display_order || 0,
            createdAt: b.created_at || new Date().toISOString(),
          }))
          .filter((b) => !deletedIds.includes(b.id));

        const mergedMap = new Map<string, Book>();
        localBooks.forEach((b) => mergedMap.set(b.id, b));
        remoteBooks.forEach((b) => mergedMap.set(b.id, b));
        const finalBooks = Array.from(mergedMap.values()).filter((b) => !deletedIds.includes(b.id));
        setLocalBooks(finalBooks);
        return finalBooks;
      }
    } catch {}
    return localBooks;
  }

  static async saveBook(book: Partial<Book>): Promise<boolean> {
    if (!book.id || !book.title) return false;
    const fullBook: Book = {
      id: book.id,
      title: book.title,
      description: book.description || '',
      level: book.level || 'A1',
      coverImage: book.coverImage || '',
      displayOrder: book.displayOrder || 1,
      createdAt: book.createdAt || new Date().toISOString(),
    };

    // Save locally
    const currentLocal = getLocalBooks().filter((b) => b.id !== fullBook.id);
    const updatedLocal = [...currentLocal, fullBook];
    setLocalBooks(updatedLocal);

    // Sync to Supabase
    try {
      const dbPayload = {
        id: fullBook.id,
        title: fullBook.title,
        description: fullBook.description,
        level: fullBook.level,
        cover_image: fullBook.coverImage,
        display_order: fullBook.displayOrder,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('learning_books').upsert(dbPayload);
    } catch {}

    return true;
  }

  static async deleteBook(bookId: string): Promise<boolean> {
    // 1. Mark as deleted locally and update cache
    saveLocalDeletedBookId(bookId);
    const currentLocalBooks = getLocalBooks().filter((b) => b.id !== bookId);
    setLocalBooks(currentLocalBooks);

    // Delete chapters belonging to this book
    const chaptersToDelete = getLocalChapters().filter((c) => c.bookId === bookId);
    chaptersToDelete.forEach((ch) => saveLocalDeletedChapterId(ch.id));
    const currentLocalChapters = getLocalChapters().filter((c) => c.bookId !== bookId);
    setLocalChapters(currentLocalChapters);

    // 2. Sync deletion to Supabase
    try {
      await supabase.from('learning_chapters').delete().eq('book_id', bookId);
      await supabase.from('learning_books').delete().eq('id', bookId);
    } catch {}

    return true;
  }

  // ==========================================
  // CHAPTERS
  // ==========================================
  static async getChapters(bookId?: string): Promise<Chapter[]> {
    const localChapters = getLocalChapters();
    const filteredLocal = bookId ? localChapters.filter((c) => c.bookId === bookId) : localChapters;
    try {
      let query = supabase.from('learning_chapters').select('*').order('display_order', { ascending: true });
      if (bookId) {
        query = query.eq('book_id', bookId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const deletedBookIds = getLocalDeletedBookIds();
        const deletedChapterIds = getLocalDeletedChapterIds();
        const remoteChapters: Chapter[] = data
          .map((c: any) => ({
            id: c.id,
            bookId: c.book_id,
            title: c.title,
            chapterNumber: c.chapter_number,
            description: c.description || '',
            displayOrder: c.display_order || 0,
            createdAt: c.created_at || new Date().toISOString(),
            vocabularyInput: c.vocabulary_input || c.vocabularyInput || '',
            grammarInput: c.grammar_input || c.grammarInput || '',
            notesInput: c.notes_input || c.notesInput || '',
            richVocabulary: c.rich_vocabulary || c.richVocabulary,
            richGrammar: c.rich_grammar || c.richGrammar,
            richReading: c.rich_reading || c.richReading,
            richListening: c.rich_listening || c.richListening,
            richSpeaking: c.rich_speaking || c.richSpeaking,
            richWriting: c.rich_writing || c.richWriting,
          }))
          .filter((c) => !deletedBookIds.includes(c.bookId) && !deletedChapterIds.includes(c.id));

        const mergedMap = new Map<string, Chapter>();
        localChapters.forEach((c) => mergedMap.set(c.id, c));
        remoteChapters.forEach((c) => mergedMap.set(c.id, c));
        const finalChapters = Array.from(mergedMap.values()).filter(
          (c) => !deletedBookIds.includes(c.bookId) && !deletedChapterIds.includes(c.id)
        );
        setLocalChapters(finalChapters);
        return bookId ? finalChapters.filter((c) => c.bookId === bookId) : finalChapters;
      }
    } catch {}
    return filteredLocal;
  }

  static async saveChapter(chapter: Partial<Chapter>): Promise<boolean> {
    if (!chapter.id || !chapter.bookId || !chapter.title) return false;
    const fullChapter: Chapter = {
      id: chapter.id,
      bookId: chapter.bookId,
      title: chapter.title,
      chapterNumber: chapter.chapterNumber || 1,
      description: chapter.description || '',
      displayOrder: chapter.displayOrder || 1,
      createdAt: chapter.createdAt || new Date().toISOString(),
      vocabularyInput: chapter.vocabularyInput,
      grammarInput: chapter.grammarInput,
      notesInput: chapter.notesInput,
      richVocabulary: chapter.richVocabulary,
      richGrammar: chapter.richGrammar,
      richReading: chapter.richReading,
      richListening: chapter.richListening,
      richSpeaking: chapter.richSpeaking,
      richWriting: chapter.richWriting,
    };

    // Save locally
    const currentLocal = getLocalChapters().filter((c) => c.id !== fullChapter.id);
    const updatedLocal = [...currentLocal, fullChapter];
    setLocalChapters(updatedLocal);

    // Sync to Supabase
    try {
      const dbPayload = {
        id: fullChapter.id,
        book_id: fullChapter.bookId,
        title: fullChapter.title,
        chapter_number: fullChapter.chapterNumber,
        description: fullChapter.description,
        display_order: fullChapter.displayOrder,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('learning_chapters').upsert(dbPayload);
    } catch {}

    return true;
  }

  static async deleteChapter(chapterId: string): Promise<boolean> {
    // Mark as deleted locally
    saveLocalDeletedChapterId(chapterId);
    const currentLocalChapters = getLocalChapters().filter((c) => c.id !== chapterId);
    setLocalChapters(currentLocalChapters);

    // Sync to Supabase
    try {
      await supabase.from('learning_chapters').delete().eq('id', chapterId);
    } catch {}

    return true;
  }

  static async duplicateChapter(sourceChapter: Chapter, targetBookId?: string): Promise<Chapter | null> {
    try {
      const newChapterId = 'ch_copy_' + Date.now();
      const duplicatedChapter: Chapter = {
        ...sourceChapter,
        id: newChapterId,
        bookId: targetBookId || sourceChapter.bookId,
        title: `${sourceChapter.title} (Bản sao)`,
        createdAt: new Date().toISOString(),
        richVocabulary: sourceChapter.richVocabulary
          ? sourceChapter.richVocabulary.map((v) => ({ ...v, id: 'vocab_' + Math.random().toString(36).substring(2, 9) }))
          : undefined,
        richGrammar: sourceChapter.richGrammar
          ? sourceChapter.richGrammar.map((g) => ({ ...g, id: 'gram_' + Math.random().toString(36).substring(2, 9) }))
          : undefined,
        richReading: sourceChapter.richReading
          ? sourceChapter.richReading.map((r) => ({ ...r, id: 'read_' + Math.random().toString(36).substring(2, 9) }))
          : undefined,
        richListening: sourceChapter.richListening
          ? sourceChapter.richListening.map((l) => ({ ...l, id: 'listen_' + Math.random().toString(36).substring(2, 9) }))
          : undefined,
        richSpeaking: sourceChapter.richSpeaking
          ? sourceChapter.richSpeaking.map((s) => ({ ...s, id: 'speak_' + Math.random().toString(36).substring(2, 9) }))
          : undefined,
        richWriting: sourceChapter.richWriting
          ? sourceChapter.richWriting.map((w) => ({ ...w, id: 'write_' + Math.random().toString(36).substring(2, 9) }))
          : undefined,
      };

      await LearningHubService.saveChapter(duplicatedChapter);

      // Duplicate lessons of source chapter as well
      const sourceLessons = await LearningHubService.getLessons(sourceChapter.id);
      for (const les of sourceLessons) {
        await LearningHubService.duplicateLesson(les, 'super_admin', newChapterId);
      }

      return duplicatedChapter;
    } catch {
      return null;
    }
  }

  // ==========================================
  // LESSONS
  // ==========================================
  static async getLessons(chapterId: string): Promise<Lesson[]> {
    const allLessons = getLocalLessons();
    let lessons = allLessons.filter((l) => l.chapterId === chapterId);

    // LEGACY MIGRATION FALLBACK:
    // If a chapter has no explicit lessons, synthesize "Lesson 1 – Lesson Tổng Hợp"
    // to absorb legacy rich skills or legacy content so NO data is ever lost.
    if (lessons.length === 0) {
      const defaultLessonId = 'les_legacy_' + chapterId;
      const defaultLesson: Lesson = {
        id: defaultLessonId,
        bookId: '',
        chapterId: chapterId,
        title: 'Lesson 1 – Lesson Tổng Hợp',
        description: 'Tài liệu ôn luyện tổng hợp từ Chapter',
        order: 1,
        createdAt: new Date().toISOString(),
      };
      lessons = [defaultLesson];
    }

    return lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  static async saveLesson(lesson: Partial<Lesson>, userRole?: string): Promise<boolean> {
    if (userRole !== 'super_admin') {
      console.warn('Permission denied: Only Super Admin can save lessons.');
      return false;
    }
    if (!lesson.id || !lesson.chapterId || !lesson.title) return false;

    const fullLesson: Lesson = {
      id: lesson.id,
      bookId: lesson.bookId || '',
      chapterId: lesson.chapterId,
      title: lesson.title,
      description: lesson.description || '',
      teacherNotes: lesson.teacherNotes || '',
      order: lesson.order || 1,
      createdAt: lesson.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = getLocalLessons().filter((l) => l.id !== fullLesson.id);
    const updated = [...current, fullLesson];
    setLocalLessons(updated);
    return true;
  }

  static async deleteLesson(lessonId: string, userRole?: string): Promise<boolean> {
    if (userRole !== 'super_admin') {
      console.warn('Permission denied: Only Super Admin can delete lessons.');
      return false;
    }

    saveLocalDeletedLessonId(lessonId);
    const currentLessons = getLocalLessons().filter((l) => l.id !== lessonId);
    setLocalLessons(currentLessons);

    // Delete exercises inside this lesson
    const exercisesInLesson = getLocalExercises().filter((e) => e.lessonId === lessonId);
    exercisesInLesson.forEach((ex) => saveLocalDeletedExerciseId(ex.id));
    const currentExercises = getLocalExercises().filter((e) => e.lessonId !== lessonId);
    setLocalExercises(currentExercises);

    return true;
  }

  static async duplicateLesson(sourceLesson: Lesson, userRole?: string, targetChapterId?: string): Promise<Lesson | null> {
    if (userRole !== 'super_admin') {
      console.warn('Permission denied: Only Super Admin can duplicate lessons.');
      return null;
    }

    try {
      const newLessonId = 'les_copy_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const duplicatedLesson: Lesson = {
        ...sourceLesson,
        id: newLessonId,
        chapterId: targetChapterId || sourceLesson.chapterId,
        title: `${sourceLesson.title} (Bản sao)`,
        createdAt: new Date().toISOString(),
      };

      await LearningHubService.saveLesson(duplicatedLesson, userRole);

      // Duplicate contained exercises
      const sourceExercises = await LearningHubService.getExercises(sourceLesson.id);
      for (const ex of sourceExercises) {
        await LearningHubService.duplicateExercise(ex, userRole, newLessonId);
      }

      return duplicatedLesson;
    } catch {
      return null;
    }
  }

  // ==========================================
  // EXERCISES
  // ==========================================
  static async getExercises(lessonId: string): Promise<Exercise[]> {
    const allExercises = getLocalExercises();
    return allExercises
      .filter((e) => e.lessonId === lessonId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  static async saveExercise(exercise: Partial<Exercise>, userRole?: string): Promise<boolean> {
    if (userRole !== 'super_admin') {
      console.warn('Permission denied: Only Super Admin can save exercises.');
      return false;
    }
    if (!exercise.id || !exercise.lessonId || !exercise.title || !exercise.type) return false;

    const fullExercise: Exercise = {
      id: exercise.id,
      bookId: exercise.bookId || '',
      chapterId: exercise.chapterId || '',
      lessonId: exercise.lessonId,
      title: exercise.title,
      type: exercise.type,
      description: exercise.description || '',
      order: exercise.order || 1,
      questions: exercise.questions || [],
      questionIds: exercise.questionIds || (exercise.questions || []).map((q) => q.id),
      richVocabulary: exercise.richVocabulary,
      richGrammar: exercise.richGrammar,
      richReading: exercise.richReading,
      richListening: exercise.richListening,
      richSpeaking: exercise.richSpeaking,
      richWriting: exercise.richWriting,
      createdAt: exercise.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const current = getLocalExercises().filter((e) => e.id !== fullExercise.id);
    const updated = [...current, fullExercise];
    setLocalExercises(updated);
    return true;
  }

  static async saveExerciseWithQuestions(
    exercise: Partial<Exercise>,
    questions: LearningQuestion[],
    userRole?: string
  ): Promise<boolean> {
    if (userRole !== 'super_admin') {
      console.warn('Permission denied: Only Super Admin can save exercises with questions.');
      return false;
    }

    const fullQuestions = questions.map((q, index) => ({
      ...q,
      id: q.id || `q_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      bookId: exercise.bookId,
      chapterId: exercise.chapterId,
      lessonId: exercise.lessonId,
      exerciseId: exercise.id,
    }));

    return await LearningHubService.saveExercise(
      {
        ...exercise,
        questions: fullQuestions,
        questionIds: fullQuestions.map((q) => q.id),
      },
      userRole
    );
  }

  static async deleteExercise(exerciseId: string, userRole?: string): Promise<boolean> {
    if (userRole !== 'super_admin') {
      console.warn('Permission denied: Only Super Admin can delete exercises.');
      return false;
    }

    saveLocalDeletedExerciseId(exerciseId);
    const currentExercises = getLocalExercises().filter((e) => e.id !== exerciseId);
    setLocalExercises(currentExercises);
    return true;
  }

  static async duplicateExercise(sourceExercise: Exercise, userRole?: string, targetLessonId?: string): Promise<Exercise | null> {
    if (userRole !== 'super_admin') {
      console.warn('Permission denied: Only Super Admin can duplicate exercises.');
      return null;
    }

    try {
      const newExerciseId = 'ex_copy_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const duplicatedQuestions = (sourceExercise.questions || []).map((q) => ({
        ...q,
        id: 'q_copy_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        exerciseId: newExerciseId,
        lessonId: targetLessonId || sourceExercise.lessonId,
      }));

      const duplicatedExercise: Exercise = {
        ...sourceExercise,
        id: newExerciseId,
        lessonId: targetLessonId || sourceExercise.lessonId,
        title: `${sourceExercise.title} (Bản sao)`,
        questions: duplicatedQuestions,
        questionIds: duplicatedQuestions.map((q) => q.id),
        createdAt: new Date().toISOString(),
      };

      await LearningHubService.saveExercise(duplicatedExercise, userRole);
      return duplicatedExercise;
    } catch {
      return null;
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
