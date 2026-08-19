import React, { useState, useEffect } from 'react';
import { Book, Chapter, User, LearningQuestion, ChapterTest, ChapterTestQuestionSnapshot } from '../../../types';
import { LearningHubService } from '../../../lib/learningHubService';
import { QuestionBankManager } from './QuestionBankManager';
import { AiLearningStudio } from './AiLearningStudio';
import { ChapterContentEditor } from './ChapterContentEditor';
import { AiContentGeneratorModal } from './AiContentGeneratorModal';
import { AiChapterTestGeneratorModal } from './AiChapterTestGeneratorModal';
import { LearningResultsView } from './LearningResultsView';
import { BookOpen, Plus, Sparkles, Layers, FileText, CheckCircle2, Mic, RefreshCw, BarChart2, ShieldAlert, Edit2, PlayCircle, Eye, Lock, Trash2, AlertTriangle, X, Search, Copy, ExternalLink, Filter, ArrowLeft, ChevronRight } from 'lucide-react';

import { LessonWorkspace } from './LessonWorkspace';
import { ExerciseEditorModal } from './ExerciseEditorModal';
import { Lesson, Exercise } from '../../../types';

interface AdminLearningHubProps {
  currentUser?: User | null;
}

export const AdminLearningHub: React.FC<AdminLearningHubProps> = ({ currentUser }) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isTeacher = currentUser?.role === 'teacher';

  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeTab, setActiveTab] = useState<'books' | 'bank' | 'practice' | 'tests' | 'audio' | 'results'>('books');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter Library State
  const [librarySearchQuery, setLibrarySearchQuery] = useState<string>('');
  const [libraryLevelFilter, setLibraryLevelFilter] = useState<string>('all');

  // Hierarchy Navigation State (Book -> Chapter -> Lesson -> Exercise Workspace)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Lessons list for selected Chapter
  const [currentLessons, setCurrentLessons] = useState<Lesson[]>([]);

  // Exercise Editor & Viewer State
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [isExerciseEditorOpen, setIsExerciseEditorOpen] = useState<boolean>(false);
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

  // New Lesson Modal State
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState<boolean>(false);
  const [newLessonTitle, setNewLessonTitle] = useState<string>('');
  const [newLessonDesc, setNewLessonDesc] = useState<string>('');
  const [newLessonNotes, setNewLessonNotes] = useState<string>('');

  // Student Preview Modal State
  const [previewTargetChapter, setPreviewTargetChapter] = useState<Chapter | null>(null);

  // Selected Chapter for Editor
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  // Delete Confirmation Modals State
  const [deleteTargetBook, setDeleteTargetBook] = useState<Book | null>(null);
  const [deleteTargetChapter, setDeleteTargetChapter] = useState<Chapter | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // AI Generator Modals State
  const [aiPracticeModalChapter, setAiPracticeModalChapter] = useState<Chapter | null>(null);
  const [aiPracticeModalContent, setAiPracticeModalContent] = useState<{ vocab: string; grammar: string; notes: string }>({ vocab: '', grammar: '', notes: '' });

  const [aiTestModalChapter, setAiTestModalChapter] = useState<Chapter | null>(null);
  const [aiTestModalContent, setAiTestModalContent] = useState<{ vocab: string; grammar: string; notes: string }>({ vocab: '', grammar: '', notes: '' });

  // New Book Form Modal State
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookLevel, setNewBookLevel] = useState('A1');
  const [newBookDesc, setNewBookDesc] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setIsLoading(true);
    const bList = await LearningHubService.getBooks();
    const cList = await LearningHubService.getChapters();
    setBooks(bList);
    setChapters(cList);
    setIsLoading(false);
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    if (!newBookTitle.trim()) return;

    const newBook: Partial<Book> = {
      id: 'book_' + Date.now(),
      title: newBookTitle.trim(),
      level: newBookLevel,
      description: newBookDesc.trim(),
      displayOrder: books.length + 1,
    };

    await LearningHubService.saveBook(newBook);
    setIsAddBookModalOpen(false);
    setNewBookTitle('');
    setNewBookDesc('');
    loadAdminData();
  };

  const loadChapterLessons = async (ch: Chapter) => {
    setIsLoading(true);
    setSelectedChapter(ch);
    const lessons = await LearningHubService.getLessons(ch.id);
    setCurrentLessons(lessons);
    setIsLoading(false);
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !selectedChapter) return;
    if (!newLessonTitle.trim()) return;

    const newLesson: Partial<Lesson> = {
      id: 'les_' + Date.now(),
      bookId: selectedChapter.bookId,
      chapterId: selectedChapter.id,
      title: newLessonTitle.trim(),
      description: newLessonDesc.trim(),
      teacherNotes: newLessonNotes.trim(),
      order: currentLessons.length + 1,
    };

    const success = await LearningHubService.saveLesson(newLesson, 'super_admin');
    if (success) {
      setIsAddLessonModalOpen(false);
      setNewLessonTitle('');
      setNewLessonDesc('');
      setNewLessonNotes('');
      await loadChapterLessons(selectedChapter);
    } else {
      alert('Không thể tạo bài học. Vui lòng kiểm tra quyền Super Admin.');
    }
  };

  const handleDeleteBookConfirmed = async () => {
    if (!deleteTargetBook || !isSuperAdmin) return;
    setIsDeleting(true);
    const success = await LearningHubService.deleteBook(deleteTargetBook.id);
    if (success) {
      setDeleteTargetBook(null);
      await loadAdminData();
    } else {
      alert('Không thể xóa giáo trình. Vui lòng thử lại sau.');
    }
    setIsDeleting(false);
  };

  const handleDeleteChapterConfirmed = async () => {
    if (!deleteTargetChapter || !isSuperAdmin) return;
    setIsDeleting(true);
    const success = await LearningHubService.deleteChapter(deleteTargetChapter.id);
    if (success) {
      setDeleteTargetChapter(null);
      await loadAdminData();
    } else {
      alert('Không thể xóa Chapter. Vui lòng thử lại sau.');
    }
    setIsDeleting(false);
  };

  const handleDuplicateChapter = async (ch: Chapter) => {
    if (!isSuperAdmin) return;
    const duplicated = await LearningHubService.duplicateChapter(ch);
    if (duplicated) {
      alert(`Đã nhân bản thành công Chapter "${ch.title}" thành "${duplicated.title}" với mã ID độc lập hoàn toàn!`);
      await loadAdminData();
    } else {
      alert('Không thể nhân bản Chapter. Vui lòng thử lại.');
    }
  };

  const handleTriggerAiGenerate = (ch: Chapter, content: { vocab: string; grammar: string; notes: string }) => {
    if (!isSuperAdmin) {
      alert('Chỉ Super Admin mới có quyền chạy AI Generator!');
      return;
    }
    setAiPracticeModalChapter(ch);
    setAiPracticeModalContent(content);
  };

  const handleTriggerAiTestGenerate = (ch: Chapter, content: { vocab: string; grammar: string; notes: string }) => {
    if (!isSuperAdmin) {
      alert('Chỉ Super Admin mới có quyền tạo Chapter Test!');
      return;
    }
    setAiTestModalChapter(ch);
    setAiTestModalContent(content);
  };

  if (editingChapter) {
    const parentBook = books.find((b) => b.id === editingChapter.bookId);
    return (
      <ChapterContentEditor
        chapter={editingChapter}
        book={parentBook}
        currentUser={currentUser}
        onBack={() => setEditingChapter(null)}
        onTriggerAiGenerate={handleTriggerAiGenerate}
        onTriggerAiTestGenerate={handleTriggerAiTestGenerate}
      />
    );
  }

  // LEVEL 4 — LESSON WORKSPACE VIEW
  if (selectedBook && selectedChapter && selectedLesson) {
    return (
      <div className="space-y-6">
        <LessonWorkspace
          book={selectedBook}
          chapter={selectedChapter}
          lesson={selectedLesson}
          isSuperAdmin={isSuperAdmin}
          onBackToChapter={() => setSelectedLesson(null)}
          onOpenExerciseEditor={(ex) => {
            if (!isSuperAdmin) return;
            setEditingExercise(ex || null);
            setIsExerciseEditorOpen(true);
          }}
          onOpenExerciseViewer={(ex) => setViewingExercise(ex)}
        />

        {/* EXERCISE EDITOR MODAL (SUPER ADMIN ONLY) */}
        {isExerciseEditorOpen && (
          <ExerciseEditorModal
            book={selectedBook}
            chapter={selectedChapter}
            lesson={selectedLesson}
            exercise={editingExercise}
            isSuperAdmin={isSuperAdmin}
            onClose={() => {
              setIsExerciseEditorOpen(false);
              setEditingExercise(null);
            }}
            onSaveSuccess={async () => {
              // Trigger reload in LessonWorkspace
              const refreshed = await LearningHubService.getLessons(selectedChapter.id);
              setCurrentLessons(refreshed);
            }}
          />
        )}

        {/* READ ONLY EXERCISE VIEWER MODAL FOR ALL USERS */}
        {viewingExercise && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-sky-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto relative text-slate-900 dark:text-white">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 font-black text-xs uppercase">
                    👁️ NỘI DUNG BÀI TẬP (READ-ONLY)
                  </span>
                </div>
                <button
                  onClick={() => setViewingExercise(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <h2 className="font-black text-xl text-slate-900 dark:text-white">{viewingExercise.title}</h2>
                <p className="text-xs text-slate-500">{viewingExercise.description || 'Chưa có mô tả.'}</p>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                {viewingExercise.questions && viewingExercise.questions.length > 0 ? (
                  viewingExercise.questions.map((q, idx) => (
                    <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2 border border-slate-200 dark:border-slate-700">
                      <p className="font-extrabold text-slate-900 dark:text-white">Câu {idx + 1}: {q.prompt}</p>
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-2 gap-1.5 pl-2">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className={`p-2 rounded-xl text-[11px] font-bold ${opt === q.correctAnswer ? 'bg-emerald-100 text-emerald-800 font-black' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'}`}>
                              {String.fromCharCode(65 + oIdx)}. {opt} {opt === q.correctAnswer && '✓'}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.explanation && (
                        <p className="text-[11px] text-slate-500 italic bg-white dark:bg-slate-900 p-2 rounded-xl">👉 Giải thích: {q.explanation}</p>
                      )}
                    </div>
                  ))
                ) : viewingExercise.richVocabulary && viewingExercise.richVocabulary.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {viewingExercise.richVocabulary.map((v) => (
                      <div key={v.id} className="p-3 rounded-2xl bg-pink-50/50 dark:bg-slate-800 border border-pink-100 dark:border-slate-700 space-y-1">
                        <p className="font-extrabold text-slate-900 dark:text-white">{v.word} <span className="font-mono text-slate-400 text-[11px]">{v.ipa}</span></p>
                        <p className="text-slate-700 dark:text-slate-200 font-bold">👉 {v.meaning}</p>
                        {v.example && <p className="text-[11px] text-slate-500 italic">"{v.example}"</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 italic">Chưa có câu hỏi trong bài tập này.</div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setViewingExercise(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 transition cursor-pointer"
                >
                  Đóng Xem Nội Dung
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MANAGEMENT HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 text-xs font-black mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LEARNING HUB – {isTeacher ? 'CHẾ ĐỘ XEM GIÁO VIÊN (READ-ONLY)' : 'QUẢN TRỊ NỘI DUNG HỌC TẬP'}</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
            📚 Thư Viện Học Tập & Bài Tập AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isTeacher
              ? 'Xem nội dung giáo trình, bài tập đã Publish và điểm số kết quả của học viên.'
              : 'Nhập Vocabulary + Grammar + Notes ➔ AI tự động biến đổi thành hệ thống bài tập hoàn chỉnh.'}
          </p>
        </div>

        {isSuperAdmin ? (
          <button
            onClick={() => setIsAddBookModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs transition shadow-md flex items-center shrink-0 cursor-pointer self-start md:self-center"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Thêm Giáo Trình Mới
          </button>
        ) : isTeacher ? (
          <div className="px-4 py-2 rounded-2xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 flex items-center shrink-0">
            <Lock className="w-4 h-4 mr-1.5" /> Chế độ Read-Only
          </div>
        ) : null}
      </div>

      {/* ADMIN TABS */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('books')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'books'
              ? 'bg-pink-500 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 mr-1" />
          <span>📘 Giáo Trình & Chapter ({books.length})</span>
        </button>

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'bank'
                ? 'bg-pink-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 mr-1" />
            <span>📚 Question Bank</span>
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('audio')}
            className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Mic className="w-4 h-4 mr-1" />
            <span>🎙️ AI Studio & Audio</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'results'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4 mr-1" />
          <span>📊 Kết Quả Học Viên</span>
        </button>
      </div>

      {/* LEVEL 3 — CHAPTER & LESSON LIST LEVEL VIEW */}
      {selectedBook && selectedChapter && !selectedLesson && (
        <div className="space-y-6 animate-fadeIn">
          {/* BREADCRUMB & BACK BUTTON */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <button
              onClick={() => {
                setSelectedChapter(null);
                setCurrentLessons([]);
              }}
              className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Quay lại danh sách Giáo trình</span>
            </button>

            <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
              <span>📚 {selectedBook.title}</span>
              <span>/</span>
              <span className="text-pink-600 font-black">📖 {selectedChapter.title}</span>
            </div>
          </div>

          {/* CHAPTER HEADER CARD */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-lg bg-pink-100 dark:bg-slate-800 text-pink-700 dark:text-pink-300 text-[10px] font-black uppercase">
                Chapter {selectedChapter.chapterNumber}
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">{selectedChapter.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{selectedChapter.description || 'Chưa có mô tả.'}</p>
            </div>

            {isSuperAdmin && (
              <button
                onClick={() => setIsAddLessonModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ THÊM LESSON MỚI</span>
              </button>
            )}
          </div>

          {/* LESSONS LIST GRID */}
          <div className="space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <span>🟢 DANH SÁCH BÀI HỌC (LESSONS)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 text-xs font-bold">
                {currentLessons.length} Lesson
              </span>
            </h3>

            {isLoading ? (
              <div className="p-10 text-center text-xs font-bold text-slate-400 animate-pulse">
                Đang tải danh sách bài học...
              </div>
            ) : currentLessons.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
                <p className="text-xs font-bold text-slate-500">Chưa có bài học nào trong Chapter này.</p>
                {isSuperAdmin && (
                  <button
                    onClick={() => setIsAddLessonModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-pink-500 text-white font-bold text-xs hover:bg-pink-600 cursor-pointer"
                  >
                    + Thêm Lesson Đầu Tiên
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentLessons.map((les, idx) => (
                  <div
                    key={les.id}
                    onClick={() => setSelectedLesson(les)}
                    className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-pink-300 dark:hover:border-pink-900 transition flex items-center justify-between group cursor-pointer"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-pink-600">
                        Lesson {idx + 1}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-pink-600 transition">
                        {les.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{les.description || 'Học từ vựng, bài tập ôn luyện...'}</p>
                    </div>

                    <div className="px-4 py-2 rounded-2xl bg-pink-50 dark:bg-slate-800 text-pink-600 font-extrabold text-xs group-hover:bg-pink-500 group-hover:text-white transition flex items-center space-x-1 shrink-0 ml-3">
                      <span>Mở Lesson</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW LESSON FORM MODAL (SUPER ADMIN ONLY) */}
      {isAddLessonModalOpen && isSuperAdmin && selectedChapter && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateLesson} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-pink-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-fadeIn text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base">🟢 THÊM LESSON MỚI</h3>
              <button type="button" onClick={() => setIsAddLessonModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold">Tên Bài Học (Lesson Title) (*):</label>
                <input
                  type="text"
                  required
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  placeholder="VD: Lesson 1 – Hello & Introductions"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold">Mô Tả Bài Học:</label>
                <input
                  type="text"
                  value={newLessonDesc}
                  onChange={(e) => setNewLessonDesc(e.target.value)}
                  placeholder="VD: Chào hỏi, tự giới thiệu tên tuổi..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold">Teacher Notes (Ghi chú giảng dạy):</label>
                <textarea
                  rows={2}
                  value={newLessonNotes}
                  onChange={(e) => setNewLessonNotes(e.target.value)}
                  placeholder="Ghi chú phương pháp giảng dạy..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddLessonModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-pink-500 text-white font-black text-xs hover:bg-pink-600 shadow-md"
              >
                Tạo Lesson
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH & FILTER LIBRARY BAR (PHASE 4) */}
      {activeTab === 'books' && !selectedChapter && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={librarySearchQuery}
              onChange={(e) => setLibrarySearchQuery(e.target.value)}
              placeholder="Tìm kiếm giáo trình, bài học, từ vựng..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={libraryLevelFilter}
              onChange={(e) => setLibraryLevelFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
            >
              <option value="all">Tất cả Trình độ (Level)</option>
              <option value="A1">Trình độ A1</option>
              <option value="A2">Trình độ A2</option>
              <option value="B1">Trình độ B1</option>
              <option value="B2">Trình độ B2</option>
              <option value="Starters">Starters (Kids)</option>
            </select>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BOOKS & CHAPTERS */}
      {activeTab === 'books' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {books
              .filter((b) => {
                if (libraryLevelFilter !== 'all' && !b.level.toLowerCase().includes(libraryLevelFilter.toLowerCase())) {
                  return false;
                }
                if (librarySearchQuery.trim()) {
                  const q = librarySearchQuery.toLowerCase();
                  const matchBook = b.title.toLowerCase().includes(q) || (b.description || '').toLowerCase().includes(q);
                  const matchChapter = chapters.some(
                    (c) => c.bookId === b.id && (c.title.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q))
                  );
                  return matchBook || matchChapter;
                }
                return true;
              })
              .map((book) => {
              const bookChapters = chapters.filter((c) => c.bookId === book.id);
              return (
                <div
                  key={book.id}
                  className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-xl bg-pink-100 dark:bg-slate-800 text-pink-700 dark:text-pink-300 text-[10px] font-black uppercase">
                        Trình độ: {book.level}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-400">
                          {bookChapters.length} Chapter
                        </span>
                        {isSuperAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTargetBook(book);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Xóa giáo trình này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {book.description || 'Chưa có mô tả cho giáo trình này.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Danh Sách Chapter:</span>
                      <span className="text-pink-600 font-extrabold text-[10px]">Mở để xem Lessons ➔</span>
                    </div>
                    {bookChapters.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">Chưa có Chapter nào.</div>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                        {bookChapters.map((ch) => (
                          <div
                            key={ch.id}
                            onClick={() => {
                              setSelectedBook(book);
                              loadChapterLessons(ch);
                            }}
                            className="p-2.5 rounded-2xl bg-slate-50 hover:bg-pink-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between transition border border-transparent hover:border-pink-200 group cursor-pointer"
                          >
                            <span className="truncate flex-1 group-hover:text-pink-600 transition">
                              {ch.title}
                            </span>
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewTargetChapter(ch);
                                }}
                                className="p-1 text-slate-400 hover:text-sky-600 rounded transition cursor-pointer"
                                title="Xem trước như Học viên"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {isSuperAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateChapter(ch);
                                  }}
                                  className="p-1 text-slate-400 hover:text-amber-600 rounded transition cursor-pointer"
                                  title="Nhân bản Chapter này"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingChapter(ch);
                                }}
                                className="text-pink-600 text-[11px] font-black flex items-center cursor-pointer ml-1 p-1 hover:bg-pink-100 rounded"
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" />
                                {isTeacher ? 'Xem' : 'Soạn AI'}
                              </button>

                              {isSuperAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTargetChapter(ch);
                                  }}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 transition cursor-pointer ml-1"
                                  title="Xóa Chapter này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QUESTION BANK TAB */}
      {activeTab === 'bank' && isSuperAdmin && (
        <QuestionBankManager books={books} chapters={chapters} />
      )}

      {/* AI STUDIO & TTS AUDIO TAB */}
      {activeTab === 'audio' && isSuperAdmin && (
        <AiLearningStudio
          books={books}
          chapters={chapters}
          onAddGeneratedQuestions={(newQs) => {
            alert(`Đã lưu ${newQs.length} câu hỏi AI vào Ngân hàng câu hỏi!`);
          }}
        />
      )}

      {/* RESULTS TAB */}
      {activeTab === 'results' && (
        <LearningResultsView currentUser={currentUser} />
      )}

      {/* AI PRACTICE GENERATOR MODAL */}
      {aiPracticeModalChapter && (
        <AiContentGeneratorModal
          chapter={aiPracticeModalChapter}
          content={aiPracticeModalContent}
          onClose={() => setAiPracticeModalChapter(null)}
          onPublishChapter={(draftQs) => {
            alert(`Đã Publish thành công Chapter "${aiPracticeModalChapter.title}" với ${draftQs.length} câu hỏi! Học viên có thể ôn luyện ngay.`);
          }}
        />
      )}

      {/* AI CHAPTER TEST GENERATOR MODAL */}
      {aiTestModalChapter && (
        <AiChapterTestGeneratorModal
          chapter={aiTestModalChapter}
          content={aiTestModalContent}
          onClose={() => setAiTestModalChapter(null)}
          onPublishTest={(test, snapshots) => {
            alert(`Đã Publish bài Chapter Test v${test.version} cho "${aiTestModalChapter.title}" với ${snapshots.length} frozen câu hỏi!`);
          }}
        />
      )}

      {/* ADD BOOK MODAL */}
      {isAddBookModalOpen && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl animate-fadeIn">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              📘 Thêm Giáo Trình Mới
            </h3>

            <form onSubmit={handleCreateBook} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Tên Giáo Trình *
                </label>
                <input
                  type="text"
                  required
                  value={newBookTitle}
                  onChange={(e) => setNewBookTitle(e.target.value)}
                  placeholder="Ví dụ: English File Intermediate"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Trình Độ (Level)
                </label>
                <select
                  value={newBookLevel}
                  onChange={(e) => setNewBookLevel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="A1">A1 - Beginner</option>
                  <option value="A2">A2 - Elementary / Pre-Intermediate</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper-Intermediate</option>
                  <option value="Starters">Starters (Kids)</option>
                  <option value="Movers">Movers (Kids)</option>
                  <option value="Flyers">Flyers (Kids)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Mô Tả Ngắn
                </label>
                <textarea
                  rows={3}
                  value={newBookDesc}
                  onChange={(e) => setNewBookDesc(e.target.value)}
                  placeholder="Mô tả nội dung chính của giáo trình..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBookModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs shadow-md cursor-pointer"
                >
                  Lưu Giáo Trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE BOOK MODAL */}
      {deleteTargetBook && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl animate-fadeIn relative text-slate-900 dark:text-white">
            <div className="flex items-start space-x-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600 font-black shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
                  Xác Nhận Xóa Giáo Trình
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Hành động này sẽ xóa hoàn toàn dữ liệu giáo trình khỏi hệ thống.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 space-y-2 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                📚 Giáo trình: <strong className="text-rose-600 dark:text-rose-400 font-black">{deleteTargetBook.title}</strong> (Trình độ {deleteTargetBook.level})
              </p>
              <div className="pt-2 border-t border-rose-200/50 dark:border-rose-900/40 space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                <p className="font-extrabold text-rose-700 dark:text-rose-300">⚠️ Các dữ liệu trực thuộc sẽ bị ảnh hưởng:</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  <li>Tất cả <strong>{chapters.filter((c) => c.bookId === deleteTargetBook.id).length} Chapter</strong> trực thuộc giáo trình này.</li>
                  <li>Tất cả bài tập & tài liệu ôn luyện liên quan.</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetBook(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteBookConfirmed}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                <span>{isDeleting ? 'Đang Xóa...' : 'Xóa Giáo Trình Này'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE CHAPTER MODAL */}
      {deleteTargetChapter && isSuperAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-200 dark:border-slate-800 max-w-md w-full space-y-4 shadow-xl animate-fadeIn relative text-slate-900 dark:text-white">
            <div className="flex items-start space-x-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600 font-black shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-600 dark:text-rose-400">
                  Xác Nhận Xóa Chapter
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  Hành động này sẽ xóa Chapter bài học khỏi hệ thống.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 space-y-1.5 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                📖 Chapter: <strong className="text-rose-600 dark:text-rose-400 font-black">{deleteTargetChapter.title}</strong>
              </p>
              <p className="text-[11px] text-slate-500">
                Mô tả: {deleteTargetChapter.description || 'Chưa có mô tả'}
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTargetChapter(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteChapterConfirmed}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                <span>{isDeleting ? 'Đang Xóa...' : 'Xóa Chapter Này'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT PREVIEW MODAL (PHASE 5 - READ ONLY SIMULATION) */}
      {previewTargetChapter && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-sky-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto relative animate-fadeIn text-slate-900 dark:text-white">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-800 font-black text-xs uppercase">
                  👁️ Xem Trước Như Học Viên (Preview Simulation)
                </span>
                <span className="text-xs text-amber-600 font-bold">
                  (Chế độ Read-Only – Không tạo attempt thật)
                </span>
              </div>

              <button
                onClick={() => setPreviewTargetChapter(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 border border-sky-100 dark:border-slate-700 space-y-1">
              <h2 className="font-black text-lg text-slate-900 dark:text-white">
                📖 {previewTargetChapter.title}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {previewTargetChapter.description || 'Chưa có mô tả cho bài học này.'}
              </p>
            </div>

            {/* PREVIEW SECTIONS */}
            <div className="space-y-4 text-xs">
              {/* CLASSIC OR RICH VOCAB */}
              {(previewTargetChapter.richVocabulary && previewTargetChapter.richVocabulary.length > 0) || previewTargetChapter.vocabularyInput ? (
                <div className="p-4 rounded-2xl bg-pink-50/50 dark:bg-slate-800/60 border border-pink-100 dark:border-slate-700 space-y-2">
                  <h4 className="font-extrabold text-pink-700 dark:text-pink-300 flex items-center">
                    📚 Từ Vựng Bài Học
                  </h4>
                  {previewTargetChapter.richVocabulary && previewTargetChapter.richVocabulary.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {previewTargetChapter.richVocabulary.map((v) => (
                        <div key={v.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-pink-100 dark:border-slate-800 space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-white">{v.word} <span className="text-slate-400 font-mono text-[11px]">{v.ipa}</span></p>
                          <p className="text-slate-600 dark:text-slate-300 font-medium">👉 {v.meaning}</p>
                          {v.example && <p className="text-[11px] text-slate-400 italic">"{v.example}"</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-pink-100 dark:border-slate-800">
                      {previewTargetChapter.vocabularyInput}
                    </pre>
                  )}
                </div>
              ) : null}

              {/* GRAMMAR */}
              {(previewTargetChapter.richGrammar && previewTargetChapter.richGrammar.length > 0) || previewTargetChapter.grammarInput ? (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-slate-800/60 border border-amber-100 dark:border-slate-700 space-y-2">
                  <h4 className="font-extrabold text-amber-800 dark:text-amber-300 flex items-center">
                    📐 Chủ Điểm Ngữ Pháp
                  </h4>
                  {previewTargetChapter.richGrammar && previewTargetChapter.richGrammar.length > 0 ? (
                    <div className="space-y-2">
                      {previewTargetChapter.richGrammar.map((g) => (
                        <div key={g.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-800 space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white">{g.topic}</p>
                          {g.formula && <p className="font-mono text-amber-700 dark:text-amber-300 text-[11px]">{g.formula}</p>}
                          {g.usage && <p className="text-slate-600 dark:text-slate-300">{g.usage}</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-100 dark:border-slate-800">
                      {previewTargetChapter.grammarInput}
                    </pre>
                  )}
                </div>
              ) : null}

              {/* READING */}
              {previewTargetChapter.richReading && previewTargetChapter.richReading.length > 0 ? (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-700 space-y-2">
                  <h4 className="font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center">
                    📖 Bài Đọc Reading
                  </h4>
                  {previewTargetChapter.richReading.map((r) => (
                    <div key={r.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">{r.title}</p>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{r.passageText}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* LISTENING */}
              {previewTargetChapter.richListening && previewTargetChapter.richListening.length > 0 ? (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700 space-y-2">
                  <h4 className="font-extrabold text-indigo-800 dark:text-indigo-300 flex items-center">
                    🎧 Bài Nghe Listening
                  </h4>
                  {previewTargetChapter.richListening.map((l) => (
                    <div key={l.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">{l.title}</p>
                      {l.audioUrl && (
                        <audio controls src={l.audioUrl} className="w-full h-8 mt-1" />
                      )}
                      {l.transcript && <p className="text-slate-600 dark:text-slate-300 italic text-[11px] mt-1">{l.transcript}</p>}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* SPEAKING */}
              {previewTargetChapter.richSpeaking && previewTargetChapter.richSpeaking.length > 0 ? (
                <div className="p-4 rounded-2xl bg-violet-50/50 dark:bg-slate-800/60 border border-violet-100 dark:border-slate-700 space-y-2">
                  <h4 className="font-extrabold text-violet-800 dark:text-violet-300 flex items-center">
                    🗣️ Chủ Đề Speaking
                  </h4>
                  {previewTargetChapter.richSpeaking.map((s) => (
                    <div key={s.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-violet-100 dark:border-slate-800 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">{s.topic}</p>
                      <p className="text-slate-700 dark:text-slate-300">{s.promptText}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* WRITING */}
              {previewTargetChapter.richWriting && previewTargetChapter.richWriting.length > 0 ? (
                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-slate-800/60 border border-rose-100 dark:border-slate-700 space-y-2">
                  <h4 className="font-extrabold text-rose-800 dark:text-rose-300 flex items-center">
                    ✍️ Đề Bài Writing
                  </h4>
                  {previewTargetChapter.richWriting.map((w) => (
                    <div key={w.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-100 dark:border-slate-800 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">{w.promptTitle}</p>
                      <p className="text-slate-700 dark:text-slate-300">{w.instructions}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                onClick={() => setPreviewTargetChapter(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-900 cursor-pointer"
              >
                Đóng Xem Trước
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
