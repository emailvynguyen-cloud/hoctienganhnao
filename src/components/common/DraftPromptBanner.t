import React from 'react';
import { DraftStorage, FormDraft } from '../../lib/draftStorage';

interface DraftPromptBannerProps {
  draftKey: string;
  onRestore: (draftData: any) => void;
  onDiscard?: () => void;
}

export const DraftPromptBanner: React.FC<DraftPromptBannerProps> = ({ draftKey, onRestore, onDiscard }) => {
  const [draft, setDraft] = React.useState<FormDraft | null>(() => DraftStorage.getDraft(draftKey));

  if (!draft || !draft.data) return null;

  const savedTimeLabel = draft.savedAt
    ? new Date(draft.savedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : 'gần đây';

  const handleRestore = () => {
    onRestore(draft.data);
    setDraft(null);
  };

  const handleDiscard = () => {
    DraftStorage.clearDraft(draftKey);
    setDraft(null);
    if (onDiscard) onDiscard();
  };

  return (
    <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fadeIn">
      <div className="flex items-center space-x-2.5">
        <span className="text-lg shrink-0">📝</span>
        <div>
          <span className="font-extrabold block sm:inline">Phát hiện bản nháp chưa lưu (lúc {savedTimeLabel}).</span>
          <span className="text-amber-800 dark:text-amber-300 font-medium ml-1 block sm:inline">Bạn có muốn khôi phục không?</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
        <button
          type="button"
          onClick={handleRestore}
          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-2xs transition duration-150 cursor-pointer"
        >
          Khôi phục
        </button>
        <button
          type="button"
          onClick={handleDiscard}
          className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition duration-150 cursor-pointer"
        >
          Bỏ
        </button>
      </div>
    </div>
  );
};
