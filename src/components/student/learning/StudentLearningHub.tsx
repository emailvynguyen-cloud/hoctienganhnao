import React, { useState, useEffect } from 'react';
import { Book, Chapter, Student, PracticeSet, LearningQuestion, ChapterTest, ChapterTestQuestionSnapshot } from '../../../types';
import { LearningHubService } from '../../../lib/learningHubService';
import { InteractivePracticePlayer } from './InteractivePracticePlayer';
import { InteractiveTestPlayer } from './InteractiveTestPlayer';
import { StudentResultsView } from './StudentResultsView';
import { PracticeLeaderboardView } from './PracticeLeaderboardView';
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

  // Active Practice & Test State
  const [activePracticeSet, setActivePracticeSet] = useState<PracticeSet | null>(null);
  const [activeQuestions, setActiveQuestions] = useState<LearningQuestion[]>([]);
  const [activeChapterTest, setActiveChapterTest] = useState<ChapterTest | null>(null);
  const [activeTestSnapshots, setActiveTestSnapshots] = useState<ChapterTestQuestionSnapshot[]>([]);

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

  const handleLaunchChapterTest = (ch: Chapter) => {
    const mockTest: ChapterTest = {
      id: 'ct_ch1_v1',
      chapterId: ch.id,
      title: `📝 ${ch.title} – Official Chapter Test`,
      version: 1,
      status: 'published',
      timeLimitMinutes: 30,
      passingScorePercent: 70,
      testSnapshot: [],
      createdAt: new Date().toISOString(),
    };

    const mockSnapshots: ChapterTestQuestionSnapshot[] = [
      {
        questionId: 'q_test_01',
        questionType: 'vocab_vi_en',
        prompt: 'Từ nào có nghĩa là "Xin chào"?',
        options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
        correctAnswer: 'Hello',
        explanation: '"Hello" là câu chào hỏi cơ bản.',
        points: 1,
      },
      {
        questionId: 'q_test_02',
        questionType: 'grammar_choice',
        prompt: 'Hoàn thành câu: They _____ students.',
        options: ['am', 'is', 'are', 'be'],
        correctAnswer: 'are',
        explanation: 'Ngôi thứ 3 số nhiều "They" đi với "are".',
        points: 1,
      },
    ];

    setActiveChapterTest(mockTest);
    setActiveTestSnapshots(mockSnapshots);
  };

  if (activePracticeSet) {
    return (
      <InteractivePracticePlayer
        practiceSet={activePracticeSet}
        questions={activeQuestions}
        currentStudent={currentStudent}
        onClose={() => setActivePracticeSet(null)}
      />
    );
  }

  if (activeChapterTest) {
    return (
      <InteractiveTestPlayer
        chapterTest={activeChapterTest}
        testQuestions={activeTestSnapshots}
        currentStudent={currentStudent}
        onClose={() => setActiveChapterTest(null)}
      />
    );
  }

  const samplePracticeSets: PracticeSet[] = selectedChapter
    ? [
        {
          id: 'ps_vocab_01',
          chapterId: selectedChapter.id,
          title: `🧠 ${selectedChapter.title} – Vocabulary Practice 01`,
          description: 'Ôn tập từ vựng chủ đề chính của Chapter (Không giới hạn lượt làm bài)',
          category: 'vocabulary',
          isPublished: true,
          questionIds: ['q_01', 'q_02'],
          displayOrder: 1,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'ps_grammar_01',
          chapterId: selectedChapter.id,
          title: `📐 ${selectedChapter.title} – Grammar Practice 01`,
          description: 'Luyện tập cấu trúc ngữ pháp & chia động từ',
          category: 'grammar',
          isPublished: true,
          questionIds: ['q_02'],
          displayOrder: 2,
          createdAt: new Date().toISOString(),
        },
      ]
    : [];

  const handleLaunchPractice = (ps: PracticeSet) => {
    const mockPracticeQuestions: LearningQuestion[] = [
      {
        id: 'q_01',
        chapterId: ps.chapterId,
        questionType: 'vocab_vi_en',
        prompt: 'Từ nào trong tiếng Anh có nghĩa là "Xin chào"?',
        options: ['Hello', 'Goodbye', 'Thank you', 'Sorry'],
        correctAnswer: 'Hello',
        explanation: '"Hello" là từ chào hỏi cơ bản nhất trong tiếng Anh.',
        difficulty: 'easy',
        category: 'vocabulary',
        status: 'published',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'q_02',
        chapterId: ps.chapterId,
        questionType: 'grammar_choice',
        prompt: 'Chọn từ đúng để hoàn thành câu: She _____ a student.',
        options: ['am', 'is', 'are', 'be'],
        correctAnswer: 'is',
        explanation: 'Chủ ngữ ngôi thứ 3 số ít "She" đi với động từ to be "is".',
        difficulty: 'easy',
        category: 'grammar',
        status: 'published',
        createdAt: new Date().toISOString(),
      },
    ];

    setActivePracticeSet(ps);
    setActiveQuestions(mockPracticeQuestions);
  };

  if (activePracticeSet) {
    return (
      <InteractivePracticePlayer
        practiceSet={activePracticeSet}
        questions={activeQuestions}
        currentStudent={currentStudent}
        onClose={() => setActivePracticeSet(null)}
      />
    );
  }

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

              <div className="grid grid-cols-1 gap-3">
                {samplePracticeSets.map((ps) => (
                  <div
                    key={ps.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-pink-300 transition"
                  >
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {ps.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {ps.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleLaunchPractice(ps)}
                      className="px-4 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs transition shadow-md shrink-0 flex items-center justify-center cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4 mr-1.5" /> Luyện Tập Ngay
                    </button>
                  </div>
                ))}
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
                <button
                  onClick={() => selectedChapter && handleLaunchChapterTest(selectedChapter)}
                  className="mt-3 px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs transition shadow-md cursor-pointer inline-flex items-center space-x-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Bắt Đầu Làm Bài Kiểm Tra</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <StudentResultsView currentStudent={currentStudent} />
          )}

          {activeTab === 'leaderboard' && (
            <PracticeLeaderboardView currentStudent={currentStudent} />
          )}
        </div>
      )}
    </div>
  );
};
