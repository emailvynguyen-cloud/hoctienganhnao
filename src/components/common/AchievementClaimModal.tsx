import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Award, Trophy, Crown } from 'lucide-react';
import { RarityTier } from '../../lib/achievementCenterUtils';

interface AchievementClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tier: RarityTier;
  icon: string;
  description?: string;
  type?: 'badge' | 'title' | 'frame';
}

export const AchievementClaimModal: React.FC<AchievementClaimModalProps> = ({
  isOpen,
  onClose,
  title,
  tier,
  icon,
  description = 'Tiếp tục cố gắng nhé!',
  type = 'badge',
}) => {
  useEffect(() => {
    if (isOpen) {
      // Trigger festive confetti cannons
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tierColors: Record<RarityTier, string> = {
    Legendary: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border-2 border-yellow-200 shadow-yellow-500/50',
    Epic: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-2 border-purple-300 shadow-purple-500/50',
    Rare: 'bg-gradient-to-r from-blue-600 to-sky-500 text-white border-2 border-sky-300 shadow-sky-500/50',
    Uncommon: 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white border-2 border-emerald-300 shadow-emerald-500/50',
    Common: 'bg-slate-800 text-slate-100 border-2 border-slate-600 shadow-slate-900/50',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl border-4 border-amber-300 dark:border-amber-500 p-6 sm:p-7 text-center space-y-5 shadow-2xl relative animate-bounce-subtle text-slate-900 dark:text-white">
        
        {/* TOP GLOW EMBLEM */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-200 flex items-center justify-center text-4xl shadow-lg shadow-amber-400/40 border-2 border-white animate-pulse">
          {icon}
        </div>

        {/* CELEBRATION HEADER */}
        <div className="space-y-1">
          <span className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 mr-1 text-amber-400 animate-spin" /> 🎉 CHÚC MỪNG!
          </span>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Bạn vừa mở khóa {type === 'title' ? 'Danh hiệu' : type === 'frame' ? 'Khung Avatar' : 'Thành tựu'}
          </h3>
        </div>

        {/* CARD TIERS BADGE */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="text-base font-black flex items-center justify-center space-x-1.5">
            <span>{icon}</span>
            <span>{title}</span>
          </div>

          <span className={`inline-block px-3 py-1 rounded-xl text-xs font-extrabold shadow-sm ${tierColors[tier]}`}>
            [{tier}]
          </span>

          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
            {description}
          </p>
        </div>

        {/* CLAIM BUTTON [ NHẬN ] */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-400/40 transition duration-150 transform hover:scale-102 cursor-pointer flex items-center justify-center uppercase tracking-wider"
          >
            🏆 [ NHẬN PHẦN THƯỞNG ]
          </button>
        </div>
      </div>
    </div>
  );
};
