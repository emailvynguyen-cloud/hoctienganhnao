import React, { useState, useEffect } from 'react';
import { ChapterTest, ChapterTestQuestionSnapshot, Student } from '../../../types';
import { LearningHubService } from '../../../lib/learningHubService';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  ArrowLeft,
  Lock,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InteractiveTestPlayerProps {
  chapterTest: ChapterTest;
  testQuestions: ChapterTestQuestionSnapshot[];
  currentStudent?: Student | null;
  onClose: () => void;
}

export const InteractiveTestPlayer: React.FC<InteractiveTestPlayerProps> = ({
  chapterTest,
  testQuestions,
  currentStudent,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [typedInput, setTypedInput] = useState<string>('');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>((chapterTest.timeLimitMinutes || 30) * 60);
  const [startTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [hasAlreadyCompleted, setHasAlreadyCompleted] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
    isPassed: boolean;
    passingScore: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentQ = testQuestions[currentIndex];

  useEffect(() => {
    // Check if student has already completed this test
    checkExistingAttempt();
  }, []);

  const checkExistingAttempt = async () => {
    // Initial client check for attempt lock
  };

  // COUNTDOWN TIMER EFFECT
  useEffect(() => {
    if (isFinished || hasAlreadyCompleted) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitOnTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished, hasAlreadyCompleted]);

  useEffect(() => {
    if (currentQ) {
      const savedAns = userAnswers[currentQ.questionId] || '';
      setSelectedOption(savedAns);
      setTypedInput(savedAns);
    }
  }, [currentIndex]);

  const handleSelectAnswer = (ans: string) => {
    setSelectedOption(ans);
    if (currentQ) {
      setUserAnswers((prev) => ({
        ...prev,
        [currentQ.questionId]: ans,
      }));
    }
  };

  const handleTypedAnswer = (val: string) => {
    setTypedInput(val);
    if (currentQ) {
      setUserAnswers((prev) => ({
        ...prev,
        [currentQ.questionId]: val,
      }));
    }
  };

  const handleAutoSubmitOnTimeOut = () => {
    alert('Hết giờ làm bài! Hệ thống tự động nộp bài thi của bạn.');
    handleSubmitTest();
  };

  const handleSubmitTest = async () => {
    if (!currentStudent?.id || !currentStudent?.studentCode) {
      alert('Không tìm thấy thông tin xác thực mã học viên. Vui lòng đăng nhập lại.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    const res = await LearningHubService.submitChapterTest({
      studentId: currentStudent.id,
      studentCode: currentStudent.studentCode,
      chapterTestId: chapterTest.id,
      timeSpentSeconds,
      answers: userAnswers,
    });

    setIsSubmitting(false);

    if (!res.ok) {
      if (res.error?.includes('đã hoàn thành')) {
        setHasAlreadyCompleted(true);
      } else {
        setErrorMessage(res.error || 'Có lỗi xảy ra khi nộp bài thi.');
      }
      return;
    }

    if (res.data) {
      setTestResult({
        score: res.data.score || 0,
        maxScore: res.data.maxScore || testQuestions.length,
        percentage: res.data.percentage || 0,
        isPassed: !!res.data.isPassed,
        passingScore: res.data.passingScore || chapterTest.passingScorePercent,
      });

      setIsFinished(true);

      if (res.data.isPassed) {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // LOCKED ALREADY COMPLETED SCREEN
  if (hasAlreadyCompleted) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl border border-rose-200 dark:border-slate-800 text-center space-y-4 shadow-md animate-fadeIn my-8">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-slate-800 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          🔒 Bài Kiểm Tra Đã Hoàn Thành
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
          Bạn đã hoàn thành bài kiểm tra chính thức <strong>{chapterTest.title}</strong> (Phiên bản v{chapterTest.version}). Mặc định bài kiểm tra chỉ được làm 1 lần.
        </p>
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs font-bold text-rose-800 dark:text-rose-300">
          Vui lòng liên hệ Giáo Viên hoặc Admin nếu bạn cần xin Reset lượt làm lại!
        </div>
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-2xl bg-rose-600 text-white font-extrabold text-xs shadow-md cursor-pointer"
        >
          Quay Lại Learning Hub
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* TEST HEADER WITH TIMER */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-rose-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Thoát
          </button>
          <div>
            <h2 className="font-black text-sm text-slate-900 dark:text-white">
              {chapterTest.title}
            </h2>
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block">
              Official Chapter Test (v{chapterTest.version})
            </span>
          </div>
        </div>

        {/* TIMER DISPLAY */}
        <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-rose-50 dark:bg-slate-800 border border-rose-200 text-rose-700 dark:text-rose-300 font-black text-xs shrink-0">
          <Clock className="w-4 h-4 animate-pulse text-rose-600" />
          <span>{formatTime(timeLeftSeconds)}</span>
        </div>
      </div>

      {/* FINISHED RESULT SCREEN */}
      {isFinished && testResult ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-6 shadow-md animate-fadeIn">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner ${
              testResult.isPassed
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-rose-100 text-rose-600'
            }`}
          >
            {testResult.isPassed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {testResult.isPassed ? '🎉 CHÚC MỪNG! BẠN ĐÃ ĐẠT (PASSED)' : '❌ CHƯA ĐẠT (FAILED)'}
            </h3>
            <p className="text-xs font-bold text-slate-500">
              Kết quả kiểm tra chính thức đã được ghi nhận bảo mật trên hệ thống.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-sm mx-auto space-y-3">
            <div className="text-4xl font-black text-slate-900 dark:text-white">
              {testResult.percentage}%
            </div>
            <div className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
              Điểm đạt được: <strong>{testResult.score} / {testResult.maxScore}</strong> câu đúng
            </div>
            <div className="text-[11px] font-bold text-slate-400">
              Yêu cầu điểm đạt của Chapter: {testResult.passingScore}%
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-2xl bg-slate-900 dark:bg-pink-500 text-white font-black text-xs shadow-md cursor-pointer"
            >
              Quay Lại Learning Hub
            </button>
          </div>
        </div>
      ) : (
        /* TEST QUESTION RUNNER */
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-rose-100 dark:border-slate-800 space-y-6 shadow-xs">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* QUESTION PROMPT */}
          {currentQ && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Câu hỏi {currentIndex + 1} / {testQuestions.length}</span>
                <span className="text-rose-600 font-black">Điểm: {currentQ.points || 1}</span>
              </div>

              {currentQ.passageText && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed border border-slate-200">
                  {currentQ.passageText}
                </div>
              )}

              <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                {currentQ.prompt}
              </h3>

              {/* OPTIONS OR TYPING INPUT */}
              {currentQ.options && currentQ.options.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedOption === option;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectAnswer(option)}
                        className={`w-full p-4 rounded-2xl border text-left text-xs md:text-sm font-bold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-rose-500 bg-rose-50 dark:bg-slate-800 text-rose-900 dark:text-rose-200'
                            : 'border-slate-200 dark:border-slate-800 hover:border-rose-300 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  type="text"
                  value={typedInput}
                  onChange={(e) => handleTypedAnswer(e.target.value)}
                  placeholder="Nhập câu trả lời của bạn..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs md:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              )}
            </div>
          )}

          {/* QUESTION PALETTE GRID */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] font-bold text-slate-500 mb-2">Danh sách câu hỏi:</div>
            <div className="flex flex-wrap gap-2">
              {testQuestions.map((q, idx) => {
                const isAnswered = !!userAnswers[q.questionId];
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.questionId || idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-8 h-8 rounded-xl font-extrabold text-xs transition flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-rose-500 ring-offset-2 bg-rose-600 text-white'
                        : isAnswered
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-100 disabled:opacity-40 text-slate-700 font-bold text-xs"
            >
              ← Câu Trước
            </button>

            {currentIndex < testQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(testQuestions.length - 1, prev + 1))}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 text-white font-extrabold text-xs shadow-md"
              >
                Câu Tiếp Theo →
              </button>
            ) : (
              <button
                onClick={handleSubmitTest}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg cursor-pointer flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang Nộp Bài...' : 'Nộp Bài Thi Chính Thức'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
