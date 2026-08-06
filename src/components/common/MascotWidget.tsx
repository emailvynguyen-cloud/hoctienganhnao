import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles } from 'lucide-react';

interface MascotWidgetProps {
  studentName?: string;
  starsCount?: number;
}

const QUOTES = [
  'Đừng sợ mắc lỗi. Hãy sợ rằng mình chưa từng thử.',
  'Mỗi ngày tiến bộ 1% thôi, 1 năm sau bạn sẽ tiến xa gấp 37 lần!',
  'Học ngoại ngữ là mở thêm một cánh cửa nhìn ra thế giới 🌍',
  'Ms. Vy tin bạn chắc chắn làm được! 💪✨',
  'Phiên bản tương lai của bạn sẽ cảm ơn bạn vì đã kiên trì hôm nay.',
  'Bạn không cần nói tiếng Anh hoàn hảo, bạn chỉ cần tiếp tục nói.',
  'Không bao giờ là quá muộn để bắt đầu chinh phục ước mơ ⭐',
  'Mỗi bài tập hoàn thành là một bước tiến gần hơn đến mục tiêu 🎯',
];

export const MascotWidget: React.FC<MascotWidgetProps> = ({
  studentName = 'Học viên',
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
      colors: ['#f472b6', '#38bdf8', '#fbbf24', '#34d399', '#a78bfa'],
    });
    setTimeout(() => setIsBouncing(false), 600);
  };

  return (
    <div
      onClick={handleClickMascot}
      className={`relative group bg-gradient-to-r from-pink-100/90 via-rose-100/80 to-amber-100/90 dark:from-slate-800 dark:to-slate-800 p-4.5 sm:p-5 rounded-3xl border-2 border-pink-200/90 dark:border-slate-700 flex items-center justify-between shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden select-none ${
        isBouncing ? 'scale-[1.015]' : 'hover:-translate-y-0.5'
      }`}
      title="Bấm vào bất kỳ đâu trên ô này để đổi thông điệp truyền cảm hứng mới!"
    >
      {/* Decorative Pastel Background Blobs */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-rose-200/40 blur-xl pointer-events-none" />
      <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-sky-200/40 blur-xl pointer-events-none" />

      <div className="flex items-center space-x-4 relative z-10">
        {/* Animated Mascot Icon */}
        <div
          className={`relative shrink-0 transition-transform duration-300 ${
            isBouncing ? 'scale-125 rotate-6' : 'group-hover:scale-110'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-300 to-sky-300 flex items-center justify-center text-white shadow-xs overflow-hidden border-2 border-white">
            <img src="/logo.jpg" alt="Ms. Vy Mascot" className="w-full h-full object-cover" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500 items-center justify-center text-[10px] text-white font-bold">
              ✨
            </span>
          </span>
        </div>

        {/* Speech Bubble / Quote */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-pink-800 dark:text-pink-300 flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1 animate-spin-slow" /> THÔNG ĐIỆP TRUYỀN CẢM HỨNG MS. VY
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">• Chào {studentName}! 👋</span>
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white italic leading-relaxed">
            "{QUOTES[quoteIndex]}"
          </p>
          <span className="text-[11px] font-medium text-pink-700 dark:text-pink-400 block pt-0.5">
            ✨ (Bấm vào ô để đổi thông điệp tiếp theo)
          </span>
        </div>
      </div>

      <div className="hidden sm:flex items-center shrink-0 text-xs font-bold text-pink-700 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-pink-200 shadow-2xs group-hover:bg-pink-500 group-hover:text-white transition-all">
        🔄 Bấm đổi câu khác
      </div>
    </div>
  );
};
