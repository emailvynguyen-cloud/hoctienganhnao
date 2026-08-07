import React, { useState } from 'react';
import { Student, Session, HomeworkSubmission } from '../../types';
import { StorageEngine } from '../../lib/storage';
import {
  SYSTEM_BADGES_CATALOG,
  SYSTEM_TITLES_CATALOG,
  getStudentAvatarFrameInfo,
  getEquippedTitleInfo,
  AchievementBadge,
  AchievementTitle,
} from '../../lib/achievementCenterUtils';
import { StudentAvatarWithFrame } from './StudentAvatarWithFrame';
import { AchievementClaimModal } from './AchievementClaimModal';
import { Award, Trophy, Crown, Sparkles, CheckCircle2, Lock, Filter, Star, X, Check } from 'lucide-react';

interface AchievementCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  allStudents?: Student[];
  allSessions?: Session[];
  allSubmissions?: HomeworkSubmission[];
  onRefreshData?: () => void;
}

export const AchievementCenterModal: React.FC<AchievementCenterModalProps> = ({
  isOpen,
  onClose,
  student,
  allStudents = [],
  allSessions = [],
  allSubmissions = [],
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'badge' | 'title' | 'frame'>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'owned' | 'unowned' | 'near'>('all');
  const [claimModalData, setClaimModalData] = useState<{
    isOpen: boolean;
    title: string;
    tier: any;
    icon: string;
    description?: string;
    type?: 'badge' | 'title' | 'frame';
  } | null>(null);

  if (!isOpen) return null;

  // CALCULATE STUDENT PROGRESS METRICS
  const completedHwCount = student.completedHomeworkTaskIds ? student.completedHomeworkTaskIds.length : 0;
  const totalStars = student.stars || 0;
  const equippedTitle = getEquippedTitleInfo(student.equippedTitleId);
  const currentFrame = getStudentAvatarFrameInfo(student.id, allStudents, allSessions, allSubmissions);

  // Evaluate Badges Unlocked
  const evaluatedBadges = SYSTEM_BADGES_CATALOG.map((b) => {
    let currentProgress = 0;
    if (b.id.includes('first_step') || b.id.includes('hw_master')) {
      currentProgress = completedHwCount;
    } else if (b.id.includes('star_collector')) {
      currentProgress = totalStars;
    } else if (b.id.includes('perfect_attendance')) {
      currentProgress = Math.min(b.targetCount, Math.floor(completedHwCount / 2) + 1);
    } else if (b.id.includes('top_rank')) {
      currentProgress = currentFrame.rankNumber === 1 ? 1 : 0;
    }

    const isUnlocked = currentProgress >= b.targetCount;
    const progressPercent = Math.min(100, Math.round((currentProgress / b.targetCount) * 100));

    return {
      ...b,
      currentProgress,
      isUnlocked,
      progressPercent,
    };
  });

  // Evaluate Titles Unlocked
  const evaluatedTitles = SYSTEM_TITLES_CATALOG.map((t) => {
    let currentProgress = 0;
    if (t.id === 'title_starter') {
      currentProgress = 1;
    } else if (t.id.includes('studious') || t.id.includes('warrior') || t.id.includes('excellent')) {
      currentProgress = completedHwCount;
    } else if (t.id.includes('star_student') || t.id.includes('veronica_legend')) {
      currentProgress = totalStars;
    } else if (t.id.includes('diligence')) {
      currentProgress = Math.min(5, Math.floor(completedHwCount / 2) + 1);
    } else if (t.id.includes('weekly_champion')) {
      currentProgress = currentFrame.rankNumber === 1 ? 1 : 0;
    } else if (t.id.includes('monthly_champion')) {
      currentProgress = currentFrame.type === 'monthly' && currentFrame.rankNumber === 1 ? 1 : 0;
    }

    const isUnlocked = t.targetCount === 0 || currentProgress >= t.targetCount;
    const progressPercent = t.targetCount === 0 ? 100 : Math.min(100, Math.round((currentProgress / t.targetCount) * 100));
    const isEquipped = student.equippedTitleId === t.id;

    return {
      ...t,
      currentProgress,
      isUnlocked,
      progressPercent,
      isEquipped,
    };
  });

  const totalBadgesCount = evaluatedBadges.length;
  const unlockedBadgesCount = evaluatedBadges.filter((b) => b.isUnlocked).length;
  const totalTitlesCount = evaluatedTitles.length;
  const unlockedTitlesCount = evaluatedTitles.filter((t) => t.isUnlocked).length;
  const unlockedFramesCount = currentFrame.type !== 'default' ? 1 : 0;

  const totalRewardsCount = totalBadgesCount + totalTitlesCount + 5;
  const totalUnlockedCount = unlockedBadgesCount + unlockedTitlesCount + unlockedFramesCount;
  const totalProgressPercent = Math.min(100, Math.round((totalUnlockedCount / totalRewardsCount) * 100));

  // Top 3 Rewards Closest to Completion ("Sắp mở khóa")
  const nearUnlockList = [...evaluatedBadges.filter((b) => !b.isUnlocked), ...evaluatedTitles.filter((t) => !t.isUnlocked)]
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 3);

  // Equip Title Handler
  const handleEquipTitle = (titleObj: any) => {
    StorageEngine.updateStudentEquippedTitle(student.id, titleObj.id);
    setClaimModalData({
      isOpen: true,
      title: titleObj.title,
      tier: titleObj.tier,
      icon: titleObj.icon,
      description: `Đã trang bị danh hiệu "${titleObj.title}" cho hồ sơ thành công!`,
      type: 'title',
    });
    if (onRefreshData) onRefreshData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border-2 border-amber-300 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative text-slate-800 dark:text-white">
        
        {/* HEADER BAR */}
        <div className="p-5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3.5">
            <StudentAvatarWithFrame student={student} allStudents={allStudents} allSessions={allSessions} allSubmissions={allSubmissions} sizeClassName="w-12 h-12" />
            <div>
              <h2 className="font-black text-lg sm:text-xl tracking-tight flex items-center">
                🏆 ACHIEVEMENT CENTER
              </h2>
              <p className="text-xs font-bold text-slate-900 opacity-90">
                Hồ sơ thành tựu & phần thưởng học tập của {student.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-950/15 hover:bg-slate-950/30 text-slate-950 transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROGRESS METRICS BAR & EQUIPPED SUMMARY */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5 text-amber-500 animate-pulse" /> Đã mở khóa {totalUnlockedCount}/{totalRewardsCount} phần thưởng
            </span>
            <span className="text-amber-600 dark:text-amber-400">{totalProgressPercent}%</span>
          </div>

          <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${totalProgressPercent}%` }}
            />
          </div>

          {/* ACTIVE EQUIPPED TITLE BANNER */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-500">Danh hiệu đang mang:</span>
              {equippedTitle ? (
                <span className={`px-3 py-1 rounded-xl text-xs font-black shadow-2xs ${equippedTitle.badgeStyle}`}>
                  {equippedTitle.title}
                </span>
              ) : (
                <span className="text-slate-400 italic">Chưa trang bị</span>
              )}
            </div>

            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
              👑 Khung Avatar: {currentFrame.title}
            </span>
          </div>
        </div>

        {/* NEAR UNLOCK MOTIVATION SECTION ("SẮP MỞ KHÓA") */}
        {nearUnlockList.length > 0 && (
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 space-y-2 shrink-0">
            <h4 className="text-xs font-black text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center">
              <Zap className="w-3.5 h-3.5 mr-1 text-amber-500 animate-bounce" /> 🔥 SẮP MỞ KHÓA (Gần Đạt Nhất)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {nearUnlockList.map((item) => (
                <div key={item.id} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-800 space-y-1 text-xs shadow-2xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="truncate">{item.icon} {item.title}</span>
                    <span className="text-[10px] text-amber-600 font-black">{item.progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${item.progressPercent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TABS & FILTERS */}
        <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* MAIN TABS */}
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'all' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setActiveTab('badge')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'badge' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              🏅 Badge ({unlockedBadgesCount}/{totalBadgesCount})
            </button>
            <button
              onClick={() => setActiveTab('title')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'title' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              👑 Danh Hiệu ({unlockedTitlesCount}/{totalTitlesCount})
            </button>
            <button
              onClick={() => setActiveTab('frame')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'frame' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              🖼 Khung Avatar
            </button>
          </div>

          {/* SUB FILTERS */}
          <div className="flex items-center space-x-1 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${activeFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setActiveFilter('owned')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${activeFilter === 'owned' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Đã sở hữu
            </button>
            <button
              onClick={() => setActiveFilter('unowned')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${activeFilter === 'unowned' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              Chưa mở
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-6">
          {/* BADGES SECTION */}
          {(activeTab === 'all' || activeTab === 'badge') && (
            <div className="space-y-3">
              <h3 className="font-black text-xs uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center">
                🏅 BỘ SƯU TẬP BADGE VECTOR ({unlockedBadgesCount}/{totalBadgesCount})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evaluatedBadges
                  .filter((b) => {
                    if (activeFilter === 'owned') return b.isUnlocked;
                    if (activeFilter === 'unowned') return !b.isUnlocked;
                    return true;
                  })
                  .map((badge) => (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 hover:scale-103 space-y-2.5 relative shadow-xs ${
                        badge.isUnlocked
                          ? 'bg-white dark:bg-slate-800/90 border-amber-300 dark:border-amber-600/80 shadow-amber-500/10'
                          : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${badge.badgeStyle} ${badge.glowClass}`}>
                          {badge.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-black text-xs text-slate-900 dark:text-white truncate">
                              {badge.title}
                            </h4>
                            <span className="text-[10px] font-bold text-amber-600">[{badge.tier}]</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
                            {badge.description}
                          </p>
                        </div>
                      </div>

                      {/* PROGRESS BAR / UNLOCKED CHECK */}
                      {badge.isUnlocked ? (
                        <div className="flex items-center justify-between text-[11px] font-black text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> ✓ Đã sở hữu
                          </span>
                          <span className="text-slate-400 font-normal">Mở khóa vĩnh viễn</span>
                        </div>
                      ) : (
                        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                            <span>Tiến trình: {badge.currentProgress}/{badge.targetCount}</span>
                            <span>{badge.progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${badge.progressPercent}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TITLES SECTION */}
          {(activeTab === 'all' || activeTab === 'title') && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center">
                👑 BỘ SƯU TẬP DANH HIỆU ({unlockedTitlesCount}/{totalTitlesCount})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evaluatedTitles
                  .filter((t) => {
                    if (activeFilter === 'owned') return t.isUnlocked;
                    if (activeFilter === 'unowned') return !t.isUnlocked;
                    return true;
                  })
                  .map((titleItem) => (
                    <div
                      key={titleItem.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 hover:scale-103 space-y-3 shadow-xs ${
                        titleItem.isUnlocked
                          ? 'bg-white dark:bg-slate-800/90 border-purple-300 dark:border-purple-600/80'
                          : 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-xl text-xs font-black shadow-2xs ${titleItem.badgeStyle}`}>
                          {titleItem.title}
                        </span>
                        <span className="text-[10px] font-bold text-purple-600">[{titleItem.tier}]</span>
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium">
                        {titleItem.description}
                      </p>

                      {titleItem.isUnlocked ? (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Đã mở khóa
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEquipTitle(titleItem)}
                            disabled={titleItem.isEquipped}
                            className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${
                              titleItem.isEquipped
                                ? 'bg-emerald-100 text-emerald-800 cursor-default'
                                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-2xs'
                            }`}
                          >
                            {titleItem.isEquipped ? '✓ Đang Trang Bị' : 'Trang Bị ↗'}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                            <span>Yêu cầu: {titleItem.conditionLabel}</span>
                            <span>{titleItem.progressPercent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${titleItem.progressPercent}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* AVATAR FRAMES SECTION */}
          {(activeTab === 'all' || activeTab === 'frame') && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-xs uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center">
                🖼 HỆ THỐNG KHUNG AVATAR TỰ ĐỘNG THEO XẾP HẠNG
              </h3>

              <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 text-xs space-y-2">
                <p className="font-bold text-sky-950 dark:text-sky-200">
                  📌 Khung Avatar được tự động cấp theo vị trí Bảng Xếp Hạng Tuần & Tháng của bạn. Không cần chọn thủ công.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  <div>• 🥇 Top 1 Tuần/Tháng: Khung Hoàng Gia / Vương Miện Vàng 👑</div>
                  <div>• 🥈 Top 2 Tuần/Tháng: Khung Kim Cương / Bạc 💎</div>
                  <div>• 🥉 Top 3 Tuần/Tháng: Khung Bạch Kim / Đồng 🔮</div>
                  <div>• ⭐ Top 4-5: Khung Pha Lê / Ngôi Sao ⭐</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GAME CELEBRATION CLAIM MODAL */}
      {claimModalData && (
        <AchievementClaimModal
          isOpen={claimModalData.isOpen}
          onClose={() => setClaimModalData(null)}
          title={claimModalData.title}
          tier={claimModalData.tier}
          icon={claimModalData.icon}
          description={claimModalData.description}
          type={claimModalData.type}
        />
      )}
    </div>
  );
};
