import React, { useState, useEffect } from 'react';
import { LearningQuestion, PracticeSet, Student } from '../../../types';
import { LearningHubService } from '../../../lib/learningHubService';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Volume2,
  HelpCircle,
  Award,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InteractivePracticePlayerProps {
  practiceSet: PracticeSet;
  questions: LearningQuestion[];
  currentStudent?: Student | null;
  onClose: () => void;
}

export const InteractivePracticePlayer: React.FC<InteractivePracticePlayerProps> = ({
  practiceSet,
  questions,
  currentStudent,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [typedInput, setTypedInput] = useState<string>('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [startTime] = useState<number>(Date.now());
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [resultSummary, setResultSummary] = useState<{
    score: number;
    maxScore: number;
    percentage: number;
  } | null>(null);

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    // Reset local selection when moving to next question
    setSelectedOption('');
    setTypedInput('');
    setIsAnswerSubmitted(false);
  }, [currentIndex]);

  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 space-y-4">
        <p className="text-xs font-bold text-slate-500">Chưa có câu hỏi nào trong bài luyện tập này.</p>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-pink-500 text-white font-bold text-xs"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const handleCheckAnswer = () => {
    const finalAnswer = (selectedOption || typedInput).trim();
    if (!finalAnswer) return;

    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: finalAnswer,
    }));
    setIsAnswerSubmitted(true);

    const isCorrect = finalAnswer.toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
    if (isCorrect) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#34d399', '#f472b6', '#fbbf24', '#38bdf8'],
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishPractice();
    }
  };

  const finishPractice = async () => {
    const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    // Calculate score locally for instant practice feedback
    let score = 0;
    questions.forEach((q) => {
      const userAns = (userAnswers[q.id] || (q.id === currentQuestion.id ? (selectedOption || typedInput) : '')).trim().toLowerCase();
      if (userAns === q.correctAnswer.trim().toLowerCase()) {
        score += 1;
      }
    });

    const maxScore = questions.length;
    const percentage = Math.round((score / maxScore) * 100);

    setResultSummary({ score, maxScore, percentage });
    setIsFinished(true);

    if (percentage >= 80) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    }

    // Submit practice attempt via server service
    if (currentStudent?.id && currentStudent?.studentCode) {
      await LearningHubService.submitPracticeAttempt({
        studentId: currentStudent.id,
        studentCode: currentStudent.studentCode,
        practiceSetId: practiceSet.id,
        timeSpentSeconds,
        answers: userAnswers,
      });
    }
  };

  const isCurrentCorrect =
    (selectedOption || typedInput).trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* HEADER & PROGRESS STRIP */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Thoát Bài Ôn Tập
          </button>
          <span className="text-xs font-black text-pink-600 dark:text-pink-400">
            Câu {currentIndex + 1} / {questions.length}
          </span>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-pink-500 to-rose-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* FINISHED SUMMARY SCREEN */}
      {isFinished && resultSummary ? (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-pink-100 dark:border-slate-800 text-center space-y-6 shadow-md animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-pink-100 dark:bg-slate-800 text-pink-500 flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              🎉 Hoàn Thành Bài Ôn Tập!
            </h2>
            <p className="text-xs font-bold text-slate-500">
              {practiceSet.title}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-pink-50/60 dark:bg-slate-800/60 border border-pink-100 dark:border-slate-700 max-w-sm mx-auto space-y-2">
            <div className="text-3xl font-black text-pink-600 dark:text-pink-400">
              {resultSummary.percentage}%
            </div>
            <div className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
              Trả lời đúng: {resultSummary.score} / {resultSummary.maxScore} câu
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => {
                setCurrentIndex(0);
                setIsFinished(false);
                setResultSummary(null);
                setUserAnswers({});
              }}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 mr-1.5" /> Luyện Tập Lại
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-black text-xs shadow-md cursor-pointer"
            >
              Hoàn Tất
            </button>
          </div>
        </div>
      ) : (
        /* QUESTION CARD */
        <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-pink-100 dark:border-slate-800 space-y-6 shadow-xs">
          {/* PROMPT & PASSAGE */}
          <div className="space-y-3">
            {currentQuestion.passageText && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed border border-slate-200 dark:border-slate-700">
                {currentQuestion.passageText}
              </div>
            )}

            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
              {currentQuestion.prompt}
            </h3>
          </div>

          {/* INPUT AREA: OPTIONS OR TYPING */}
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrectOption = option.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();

                let btnStyle = 'border-slate-200 dark:border-slate-800 hover:border-pink-300 text-slate-800 dark:text-slate-200';
                if (isSelected) {
                  btnStyle = 'border-pink-500 bg-pink-50 dark:bg-slate-800 text-pink-900 dark:text-pink-200 font-black';
                }

                if (isAnswerSubmitted) {
                  if (isCorrectOption) {
                    btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-black';
                  } else if (isSelected && !isCurrentCorrect) {
                    btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-black';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerSubmitted}
                    onClick={() => setSelectedOption(option)}
                    className={`w-full p-4 rounded-2xl border text-left text-xs md:text-sm transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{option}</span>
                    {isAnswerSubmitted && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {isAnswerSubmitted && isSelected && !isCurrentCorrect && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              <input
                type="text"
                disabled={isAnswerSubmitted}
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                placeholder="Nhập đáp án của bạn tại đây..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs md:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          )}

          {/* FEEDBACK & EXPLANATION BANNER */}
          {isAnswerSubmitted && (
            <div
              className={`p-4 rounded-2xl border space-y-2 animate-fadeIn ${
                isCurrentCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center space-x-2 font-black text-xs">
                {isCurrentCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Chính Xác! Tuyệt Vời 🌸</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Chưa Đúng Rồi. Đáp án đúng là: <strong>{currentQuestion.correctAnswer}</strong></span>
                  </>
                )}
              </div>

              {currentQuestion.explanation && (
                <p className="text-xs font-medium opacity-90">
                  💡 <strong>Giải thích:</strong> {currentQuestion.explanation}
                </p>
              )}
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            {!isAnswerSubmitted ? (
              <button
                onClick={handleCheckAnswer}
                disabled={!selectedOption && !typedInput.trim()}
                className="px-6 py-3 rounded-2xl bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-black text-xs transition shadow-md cursor-pointer flex items-center"
              >
                <span>Kiểm Tra Đáp Án</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 rounded-2xl bg-slate-900 dark:bg-pink-500 hover:opacity-90 text-white font-black text-xs transition shadow-md cursor-pointer flex items-center"
              >
                <span>{currentIndex < questions.length - 1 ? 'Câu Tiếp Theo →' : 'Xem Kết Quả Hoàn Thành'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
