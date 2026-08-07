import React from 'react';
import { Student, Session, HomeworkSubmission } from '../../types';
import { resolveAvatarUrl, KAKAOTALK_SVG_AVATARS } from '../../lib/kakaotalkAvatars';
import { getStudentAvatarFrameInfo } from '../../lib/rankingUtils';

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
  
  const frameInfo = student
    ? getStudentAvatarFrameInfo(student.id, allStudents, allSessions, allSubmissions)
    : {
        frameId: 'default',
        title: 'Khung Mặc Định',
        tier: 'Common' as const,
        type: 'default' as const,
        rankNumber: 999,
        frameCssClass: 'border-2 border-slate-300 dark:border-slate-700',
        borderStyle: 'border-slate-300',
      };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* AVATAR IMAGE WITH RANKED FRAME */}
      <img
        src={avatarUrl}
        alt={student?.name || 'Học viên'}
        onError={(e) => {
          (e.target as HTMLImageElement).src = KAKAOTALK_SVG_AVATARS.ryan;
        }}
        className={`${sizeClassName} rounded-2xl object-cover transition-transform duration-200 hover:scale-105 shadow-2xs ${frameInfo.frameCssClass}`}
      />

      {/* RANK BADGE OVERLAY ICON (Crown / Diamond / Star) */}
      {showCrownOverlay && frameInfo.badgeOverlayIcon && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 border border-amber-300 flex items-center justify-center text-[10px] shadow-sm z-10 animate-bounce-subtle">
          {frameInfo.badgeOverlayIcon}
        </span>
      )}
    </div>
  );
};
