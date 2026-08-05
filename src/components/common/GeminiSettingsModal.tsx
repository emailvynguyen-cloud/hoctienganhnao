import React, { useState } from 'react';
import { GeminiEngine, GEMINI_MODELS } from '../../lib/gemini';
import { Key, Sparkles, ExternalLink, CheckCircle2, AlertTriangle, X, ShieldCheck } from 'lucide-react';

interface GeminiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const GeminiSettingsModal: React.FC<GeminiSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [apiKey, setApiKey] = useState(GeminiEngine.getApiKey());
  const [selectedModel, setSelectedModel] = useState(GeminiEngine.getSelectedModel());
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      alert('Vui lòng nhập API Key của bạn từ Google AI Studio!');
      return;
    }

    GeminiEngine.setApiKey(apiKey);
    GeminiEngine.setSelectedModel(selectedModel);

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onSaved();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-purple-950/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border-2 border-purple-100 dark:border-purple-800 overflow-hidden flex flex-col max-h-[90vh] relative text-slate-800 dark:text-white">
        
        {/* HEADER - Fixed Top */}
        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-b border-purple-100 dark:border-purple-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 pr-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center font-black shadow-md shrink-0">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Cấu Hình Gemini AI & API Key
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Thiết lập API Key để kích hoạt AI trợ lý bài học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM CONTAINER - Scrollable Body & Fixed Footer */}
        <form onSubmit={handleSave} className="flex flex-col min-h-0 flex-1 overflow-hidden">
          
          {/* BODY CONTENT - Scrollable */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-medium">
            
            {/* Link Get Key Guide Banner */}
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-xs">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-rose-800 block">
                    Chưa có API Key? Lấy API Key miễn phí từ Google:
                  </span>
                  <p className="text-rose-700 mt-0.5">
                    Bạn có thể tự tạo API Key cá nhân miễn phí tại Google AI Studio để sử dụng ứng dụng không bị giới hạn quota.
                  </p>
                </div>
              </div>

              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-extrabold text-xs hover:bg-rose-700 transition shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Lấy API Key Tại Google AI Studio →
              </a>
            </div>

            {/* API Key Input */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-purple-200 uppercase mb-1.5">
                Nhập Google Gemini API Key *
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-purple-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/40 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>
            </div>

            {/* Model Selection Cards */}
            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-purple-200 uppercase mb-2">
                Chọn Model AI Mặc Định & Cơ Chế Fallback
              </label>

              <div className="space-y-2">
                {GEMINI_MODELS.map((m) => {
                  const isSelected = selectedModel === m.id;

                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-100/80 dark:bg-purple-950/60 border-purple-500 shadow-sm'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-purple-100 dark:border-purple-900 hover:border-purple-300'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {m.name}
                          </span>
                          {m.isDefault && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-pink-100 text-pink-800 uppercase">
                              Khuyên Dùng
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {m.desc}
                        </p>
                      </div>

                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-xs text-center border border-emerald-200 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" /> Đã lưu API Key và Cấu hình Model thành công!
              </div>
            )}
          </div>

          {/* FOOTER - Fixed Bottom */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-purple-100 dark:border-purple-800 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-extrabold shadow-md hover:from-purple-700 hover:to-pink-700 transition cursor-pointer"
            >
              Lưu Cấu Hình Key
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
