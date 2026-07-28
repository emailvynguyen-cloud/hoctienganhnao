import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Heart, Smile } from 'lucide-react';

interface MascotWidgetProps {
  studentName?: string;
  starsCount?: number;
}

const QUOTES = [
  'Đừng sợ mắc lỗi. Hãy sợ rằng mình chưa từng thử.',
  'Mỗi ngày tiến bộ một chút, rồi bạn sẽ tạo nên những kết quả lớn.',
  'Phiên bản tương lai của bạn sẽ cảm ơn bạn vì đã bắt đầu từ hôm nay.',
  'Bạn không cần nói tiếng Anh hoàn hảo. Bạn chỉ cần tiếp tục nói.',
  'Bạn không dở tiếng Anh. Bạn chỉ đang trên hành trình học mà thôi.',
  'Không bao giờ là quá muộn để học một ngôn ngữ mới.',
];

export const MascotWidget: React.FC<MascotWidgetProps> = ({
  studentName = 'Học viên',
  starsCount = 0,
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);

  const handleClickMascot = () => {
    setIsBouncing(true);
    setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.8 },
    });
    setTimeout(() => setIsBouncing(false), 800);
  };

  return (
    <div className="relative group bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 dark:from-purple-950/40 dark:via-pink-950/40 dark:to-indigo-950/40 p-4 rounded-3xl border border-purple-200/50 dark:border-purple-800/50 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        {/* Animated Mascot Icon */}
        <button
          onClick={handleClickMascot}
          className={`relative cursor-pointer focus:outline-none transition-transform duration-300 ${
            isBouncing ? 'scale-125 rotate-6' : 'hover:scale-110'
          }`}
          title="Bấm vào linh vật Ms. Vy để đổi câu truyền cảm hứng!"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 overflow-hidden">
            <img src="/logo.jpg" alt="Ms. Vy Mascot" className="w-full h-full object-cover" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500 items-center justify-center text-[10px] text-white font-bold">
              ✨
            </span>
          </span>
        </button>

        {/* Speech Bubble / Quote */}
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Thông Điệp Truyền Cảm Hứng Ms. Vy
            </span>
            <span className="text-xs text-slate-400">• Chào {studentName}!</span>
          </div>
          <p className="text-sm font-semibold text-purple-950 dark:text-slate-100 mt-0.5 italic">
            "{QUOTES[quoteIndex]}"
          </p>
        </div>
      </div>

      {/* Star Counter Pill */}
      {starsCount > 0 && (
        <div className="hidden sm:flex items-center space-x-1.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-full border border-amber-300/60 dark:border-amber-700/60 font-bold text-xs shadow-sm">
          <span className="text-base">⭐</span>
          <span>{starsCount} Sao Thưởng</span>
        </div>
      )}
    </div>
  );
};
