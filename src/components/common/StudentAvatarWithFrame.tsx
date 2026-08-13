import React from 'react';
import { Student, Session, HomeworkSubmission } from '../../types';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';
import { getStudentAvatarFrameInfo, AvatarFrameInfo } from '../../lib/rankingUtils';

interface StudentAvatarWithFrameProps {
  student?: Student | null;
  allStudents?: Student[];
  allSessions?: Session[];
  allSubmissions?: HomeworkSubmission[];
  sizeClassName?: string;
  showCrownOverlay?: boolean;
  customAvatarUrl?: string;
  className?: string;
}

export const StudentAvatarWithFrame: React.FC<StudentAvatarWithFrameProps> = ({
  student,
  allStudents = [],
  allSessions = [],
  allSubmissions = [],
  sizeClassName = 'w-11 h-11',
  showCrownOverlay = true,
  customAvatarUrl,
  className = '',
}) => {
  const avatarUrl = resolveAvatarUrl(customAvatarUrl || student?.avatar || KAKAOTALK_SVG_AVATARS.ryan);

  const frameInfo: AvatarFrameInfo = student
    ? getStudentAvatarFrameInfo(student.id, allStudents, allSessions, allSubmissions)
    : {
        frameId: 'default',
        title: 'Khung Mặc Định',
        tier: 'Common',
        type: 'default',
        rankNumber: 999,
        frameCssClass: 'border-2 border-slate-300 dark:border-slate-700',
        borderStyle: 'border-slate-300',
        description: 'Khung avatar mặc định',
        ornamentType: 'default',
      };

  // MULTI-LAYER GAME FRAME ORNAMENT STYLES & SVG EMBLEMS
  const renderFrameOrnaments = () => {
    switch (frameInfo.ornamentType) {
      // 👑 TOP 1 THÁNG – KHUNG HOÀNG GIA (CÁNH THIÊN THẦN & VƯƠNG MIỆN CAO CẤP NHẤT)
      case 'royal_wings':
        return (
          <>
            <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 opacity-80 blur-xs animate-pulse -z-10" />
            <div className="absolute -inset-1 rounded-2xl border-2 border-amber-300 ring-2 ring-yellow-400/80 shadow-lg shadow-amber-500/50 pointer-events-none" />
            
            {/* Top Royal Crown Emblem */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 animate-bounce-subtle pointer-events-none drop-shadow-md">
              <span className="text-base sm:text-lg">👑</span>
            </div>

            {/* Left & Right Laurel/Wing Accents */}
            <div className="absolute -top-1 -left-2 text-[10px] text-amber-300 z-10 font-bold select-none pointer-events-none">✨</div>
            <div className="absolute -top-1 -right-2 text-[10px] text-amber-300 z-10 font-bold select-none pointer-events-none">✨</div>
          </>
        );

      // 💎 TOP 2 THÁNG – KHUNG KIM CƯƠNG PHẢN QUANG
      case 'diamond_cut':
        return (
          <>
            <div className="absolute -inset-1 rounded-2xl border-2 border-cyan-200 ring-2 ring-cyan-400/90 shadow-md shadow-cyan-400/40 pointer-events-none" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-md">
              <span className="text-xs sm:text-sm">💎</span>
            </div>
            <div className="absolute -bottom-1 -right-1 text-[9px] z-10 pointer-events-none select-none">✨</div>
          </>
        );

      // ⚜ TOP 3 THÁNG – KHUNG BẠCH KIM HOẠ VĂN
      case 'platinum_filigree':
        return (
          <>
            <div className="absolute -inset-1 rounded-2xl border-2 border-slate-200 ring-2 ring-slate-400/80 shadow-md shadow-slate-300/40 pointer-events-none" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-md">
              <span className="text-xs sm:text-sm">⚜️</span>
            </div>
          </>
        );

      // ✨ TOP 4-5 THÁNG – KHUNG PHA LÊ
      case 'crystal_prism':
        return (
          <>
            <div className="absolute -inset-1 rounded-2xl border-2 border-indigo-300 ring-1 ring-purple-300/70 shadow-md shadow-indigo-300/30 pointer-events-none" />
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <span className="text-xs">✨</span>
            </div>
          </>
        );

      // 🔹 TOP 6-10 THÁNG – KHUNG SAPPHIRE HOÀNG GIA
      case 'royal_sapphire':
        return (
          <>
            <div className="absolute -inset-1 rounded-2xl border-2 border-blue-400 ring-1 ring-sky-300/70 shadow-xs pointer-events-none" />
            <div className="absolute -top-2.5 right-0 z-20 pointer-events-none">
              <span className="text-[10px]">🔹</span>
            </div>
          </>
        );

      // 🥇 TOP 1 TUẦN – KHUNG VƯƠNG MIỆN VÀNG
      case 'gold_crown':
        return (
          <>
            <div className="absolute -inset-1 rounded-2xl border-2 border-yellow-300 ring-2 ring-amber-400 shadow-md shadow-amber-400/40 pointer-events-none" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 animate-bounce-subtle pointer-events-none drop-shadow-sm">
              <span className="text-xs sm:text-sm">👑</span>
            </div>
            <div className="absolute -top-1 -right-1 text-[9px] pointer-events-none">⭐</div>
          </>
        );

      // 🥈 TOP 2 TUẦN – KHUNG BẠC HOÀNG GIA (NGUYỆT QUẾ)
      case 'silver_laurel':
        return (
          <>
            <div className="absolute -inset-1 rounded-2xl border-2 border-slate-300 ring-1 ring-slate-200 shadow-sm pointer-events-none" />
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <span className="text-xs">🌿</span>
            </div>
          </>
        );

      // 🥉 TOP 3 TUẦN – KHUNG ĐỒNG CỔ ĐIỂN
      case 'bronze_shield':
        return (
          <>
            <div className="absolute -inset-1 rounded-2xl border-2 border-amber-700 ring-1 ring-amber-600 shadow-sm pointer-events-none" />
            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <span className="text-xs">🛡️</span>
            </div>
          </>
        );

      // ⭐ TOP 4-5 TUẦN – KHUNG NGÔI SAO
      case 'star_crystal':
        return (
          <>
            <div className="absolute -inset-1 rounded-2xl border-2 border-amber-400 ring-1 ring-yellow-300 shadow-xs pointer-events-none" />
            <div className="absolute -top-2 -right-1 z-20 pointer-events-none">
              <span className="text-[10px]">⭐</span>
            </div>
          </>
        );

      // 🔷 TOP 6-10 TUẦN – KHUNG SAPPHIRE
      case 'sapphire':
        return (
          <>
            <div className="absolute -inset-1 rounded-2xl border-2 border-sky-400 ring-1 ring-blue-300 shadow-2xs pointer-events-none" />
            <div className="absolute -top-2 -right-1 z-20 pointer-events-none">
              <span className="text-[10px]">🔷</span>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* MULTI-LAYER GAME FRAME DECORATIONS */}
      {renderFrameOrnaments()}

      {/* AVATAR IMAGE */}
      <img
        src={avatarUrl}
        alt={student?.name || 'Học viên'}
        onError={(e) => {
          (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
        }}
        className={`${sizeClassName} rounded-2xl object-cover transition-transform duration-200 hover:scale-105 shadow-2xs relative z-0`}
      />

      {/* RANK OVERLAY CORNER ICON */}
      {showCrownOverlay && frameInfo.badgeOverlayIcon && frameInfo.ornamentType === 'default' && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 border border-amber-300 flex items-center justify-center text-[10px] shadow-sm z-20 animate-bounce-subtle">
          {frameInfo.badgeOverlayIcon}
        </span>
      )}
    </div>
  );
};
