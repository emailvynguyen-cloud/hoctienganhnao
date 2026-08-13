import React, { useState, useEffect } from 'react';
import { Book, Chapter, Student } from '../../../types';
import { LearningHubService } from '../../../lib/learningHubService';
import { BookOpen, Award, Trophy, ChevronRight, ArrowLeft, Sparkles, CheckCircle2, FileText, Clock, PlayCircle, Flame } from 'lucide-react';

interface StudentLearningHubProps {
  currentStudent?: Student | null;
  onExit?: () => void;
}

export const StudentLearningHub: React.FC<StudentLearningHubProps> = ({ currentStudent, onExit }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [activeTab, setActiveTab] = useState<'practice' | 'test' | 'results' | 'leaderboard'>('practice');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    setIsLoading(true);
    const bList = await LearningHubService.getBooks();
    const cList = await LearningHubService.getChapters();
    setBooks(bList);
    setChapters(cList);
    setIsLoading(false);
  };

  const filteredChapters = selectedBook
    ? chapters.filter((c) => c.bookId === selectedBook.id)
    : chapters;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* HEADER BAR */}
      <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>LEARNING HUB – THƯ VIỆN HỌC TẬP & ÔN LUYỆN</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              📚 Ôn Tập & Rèn Luyện Tiếng Anh
            </h1>
            <p className="text-xs md:text-sm text-pink-100 font-medium mt-1">
              Tự do chọn giáo trình, luyện tập bài học hàng ngày & thử thách bài kiểm tra Chapter!
            </p>
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition flex items-center shrink-0 self-start md:self-center border border-white/30"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Lại Portal
            </button>
          )}
        </div>
      </div>

      {/* BREADCRUMB & BOOK SELECTOR */}
      {selectedBook && (
        <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => {
              setSelectedBook(null);
              setSelectedChapter(null);
            }}
            className="text-pink-600 hover:underline flex items-center"
          >
            📚 Tất cả giáo trình
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 dark:text-white font-black">{selectedBook.title}</span>
          {selectedChapter && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-rose-600 font-black">{selectedChapter.title}</span>
            </>
          )}
        </div>
      )}

      {/* STEP 1: SELECT BOOK IF NONE SELECTED */}
      {!selectedBook ? (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
            <span>📖 Chọn Giáo Trình Học Tập</span>
          </h2>

          {isLoading ? (
            <div className="p-8 text-center text-xs font-bold text-slate-500 animate-pulse">
              Đang tải danh sách giáo trình...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {books.map((book) => (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className="group bg-white dark:bg-slate-900 p-5 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    <div className="h-40 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-200 dark:from-slate-800 dark:to-slate-800 flex items-center justify-center overflow-hidden relative">
                      {book.coverImage ? (
                        <img src={book.coverImage} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <BookOpen className="w-12 h-12 text-pink-400" />
                      )}
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-slate-950/70 text-white text-[10px] font-black uppercase backdrop-blur-xs">
                        Trình độ: {book.level}
                      </span>
                    </div>

                    <h3 className="font-black text-base text-slate-900 dark:text-white group-hover:text-pink-600 transition">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {book.description || 'Giáo trình chuẩn phát triển năng lực tiếng Anh toàn diện.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-pink-600">
                    <span>Xem danh sách Chapter</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !selectedChapter ? (
        /* STEP 2: SELECT CHAPTER */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
              <span>📌 Các Chapter thuộc: {selectedBook.title}</span>
            </h2>
            <button
              onClick={() => setSelectedBook(null)}
              className="text-xs font-bold text-pink-600 hover:underline"
            >
              ← Chọn giáo trình khác
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChapters.map((ch) => (
              <div
                key={ch.id}
                onClick={() => setSelectedChapter(ch)}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs hover:border-pink-300 transition cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-pink-600 tracking-wider">
                    Chapter {ch.chapterNumber}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-pink-600 transition">
                    {ch.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {ch.description || 'Luyện tập từ vựng, ngữ pháp, nghe & đọc.'}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-pink-50 dark:bg-slate-800 text-pink-600 flex items-center justify-center shrink-0 group-hover:bg-pink-500 group-hover:text-white transition">
                  <PlayCircle className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* STEP 3: CHAPTER CONTENT (DAILY PRACTICE & CHAPTER TEST) */
        <div className="space-y-6">
          {/* TAB NAVIGATION */}
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'practice'
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>🧠 Ôn Tập Hằng Ngày (Daily Practice)</span>
            </button>

            <button
              onClick={() => setActiveTab('test')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'test'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>📝 Bài Kiểm Tra Chapter (Official Test)</span>
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'results'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>📊 Kết Quả Của Tôi</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-4 py-2 rounded-2xl font-black text-xs transition flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>🏆 Bảng Xếp Hạng</span>
            </button>
          </div>

          {/* TAB CONTENTS */}
          {activeTab === 'practice' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-pink-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    🧠 Bài Tập Ôn Luyện Daily Practice
                  </h3>
                  <p className="text-xs text-slate-500">
                    Luyện tập nhiều lần, tự tin làm chủ kiến thức Chapter.
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-pink-50/50 dark:bg-slate-800/50 border border-pink-100 dark:border-slate-700 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-pink-500 mx-auto" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Danh Sách Bài Luyện Tập Cho {selectedChapter.title}
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Các bộ bài tập Ôn Tập Từ Vựng, Ngữ Pháp & Luyện Nghe đang được khởi tạo.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-rose-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>📝 Bài Kiểm Tra Chính Thức Chapter</span>
                    <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-black">1 Lượt Làm</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Đánh giá chính thức kết quả học tập của bạn tại {selectedChapter.title}.
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-rose-50/50 dark:bg-slate-800/50 border border-rose-100 dark:border-slate-700 text-center space-y-3">
                <Clock className="w-10 h-10 text-rose-500 mx-auto" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Bài Kiểm Tra Chapter 1 (Official Test v1)
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Thời gian làm bài: 30 phút • Điểm đạt: 70%. Hệ thống sẽ tự động tính điểm an toàn phía Server.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                📊 Kết Quả Kiểm Tra Của Tôi
              </h3>
              <div className="p-6 text-center text-xs font-medium text-slate-500">
                Chưa có dữ liệu kết quả kiểm tra nào. Hãy hoàn thành bài test Chapter để xem điểm tại đây!
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                🏆 Bảng Xếp Hạng Thi Đua Daily Practice
              </h3>
              <div className="p-6 text-center text-xs font-medium text-slate-500">
                Bảng xếp hạng thi đua ôn tập hàng ngày sẽ cập nhật khi có lượt ôn tập mới.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
