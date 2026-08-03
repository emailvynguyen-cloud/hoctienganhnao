import React, { useState } from 'react';
import { GeminiEngine } from '../../lib/gemini';
import {
  Sparkles,
  Camera,
  FileText,
  Mic,
  Upload,
  Copy,
  Check,
  Download,
  RefreshCw,
  HelpCircle,
  Award,
  AlertCircle,
  FileSpreadsheet,
  Zap,
  BookOpen,
  Volume2,
  Clipboard,
  Settings,
} from 'lucide-react';
import { GeminiSettingsModal } from '../common/GeminiSettingsModal';

export const AiStudioPortal: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'image' | 'worksheet' | 'speech'>('image');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- TAB 1: IMAGE GRADER STATES ---
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string>(
    'Hãy nhận diện chữ viết tay trong ảnh này. Chỉ ra tất cả các lỗi sai (ngữ pháp, chính tả, dùng từ), GIẢI THÍCH CHI TIẾT TẠI SAO SAI, HƯỚNG DẪN HỌC VIÊN SỬA LẠI CHO ĐÚNG, và đưa ra bài viết sửa hoàn chỉnh cùng câu nhận xét khen ngợi động viên bằng tiếng Việt.'
  );
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [imageCopied, setImageCopied] = useState(false);

  // --- TAB 2: WORKSHEET GENERATOR STATES ---
  const [topic, setTopic] = useState<string>('Present Perfect vs Past Simple');
  const [exerciseType, setExerciseType] = useState<string>('Trắc nghiệm & Điền từ');
  const [difficulty, setDifficulty] = useState<string>('Trung Bình (Intermediate)');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [isWorksheetLoading, setIsWorksheetLoading] = useState(false);
  const [worksheetResult, setWorksheetResult] = useState<string | null>(null);
  const [worksheetCopied, setWorksheetCopied] = useState(false);

  // --- TAB 3: SPEECH ANALYZER STATES ---
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isSpeechLoading, setIsSpeechLoading] = useState(false);
  const [speechResult, setSpeechResult] = useState<string | null>(null);

  // Process Image File/Blob
  const processImageFile = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Image File Upload via Input
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Global Ctrl + V Clipboard Paste Listener
  React.useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeSubTab !== 'image') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const file = new File([blob], `pasted_homework_${Date.now()}.png`, { type: blob.type || 'image/png' });
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [activeSubTab]);

  // Handle Clipboard Paste Button Click
  const handlePasteFromClipboardButton = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const file = new File([blob], `pasted_homework_${Date.now()}.png`, { type: imageType });
            processImageFile(file);
            return;
          }
        }
        alert('Không tìm thấy hình ảnh trong bộ nhớ tạm! Bạn hãy chụp/copy ảnh (Zalo, Snipping Tool, Chrome...) rồi nhấn Ctrl + V nhé!');
      } else {
        alert('Vui lòng sử dụng phím tắt Ctrl + V trên bàn phím để dán ảnh trực tiếp nhé!');
      }
    } catch (err) {
      console.warn(err);
      alert('Vui lòng bấm tổ hợp phím Ctrl + V trên bàn phím để dán ảnh!');
    }
  };

  // Run Image Grader
  const handleRunImageGrader = async () => {
    setIsImageLoading(true);
    setImageResult(null);
    try {
      let base64 = '';
      if (imagePreview) {
        base64 = imagePreview;
      }
      const mime = imageFile?.type || 'image/jpeg';
      const res = await GeminiEngine.generateMultimodal(imagePrompt, base64, mime);
      setImageResult(res.text);
    } catch (err) {
      console.error(err);
      setImageResult('Có lỗi xảy ra khi xử lý ảnh. Vui lòng thử lại!');
    } finally {
      setIsImageLoading(false);
    }
  };

  // Run Worksheet Generator
  const handleGenerateWorksheet = async () => {
    setIsWorksheetLoading(true);
    setWorksheetResult(null);
    try {
      const prompt = `Bạn là chuyên gia thiết kế giáo trình tiếng Anh tại trung tâm Ms. Vy English. Hãy soạn 1 phiếu bài tập tiếng Anh theo yêu cầu:
- Chủ đề: ${topic}
- Dạng bài: ${exerciseType}
- Độ khó: ${difficulty}
- Số lượng câu: ${questionCount} câu

Yêu cầu trình bày gồm 2 phần rõ ràng:
PHẦN 1: PHIẾU BÀI TẬP DÀNH CHO HỌC VIÊN (Có tiêu đề đẹp, hướng dẫn làm bài, các câu hỏi được đánh số thứ tự rõ ràng)
PHẦN 2: ĐÁP ÁN & GIẢI THÍCH CHI TIẾT DÀNH CHO GIÁO VIÊN (Dịch nghĩa câu, giải thích lý do chọn đáp án đúng)`;

      const res = await GeminiEngine.generateText(prompt);
      setWorksheetResult(res.text);
    } catch (err) {
      console.error(err);
      setWorksheetResult('Có lỗi xảy ra khi tạo đề bài tập. Vui lòng thử lại!');
    } finally {
      setIsWorksheetLoading(false);
    }
  };

  // Handle Media Upload
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Speech Analyzer
  const handleRunSpeechAnalyzer = async () => {
    setIsSpeechLoading(true);
    setSpeechResult(null);
    try {
      const prompt = `Bạn là chuyên gia luyện phát âm tiếng Anh. Hãy nghe file âm thanh/video bài nói của học viên và đánh giá chi tiết:
1. Văn bản nhận diện từ bài nói (Transcribed Speech)
2. Điểm số phát âm (Pronunciation Score trên thang điểm 100)
3. Các từ đọc chưa chuẩn & Hướng dẫn sửa khẩu hình/trọng âm
4. Đánh giá Độ trôi chảy (Fluency) & Nhịp điệu (Intonation)
5. Lời khuyên luyện tập cho học viên`;

      let base64 = mediaPreview || '';
      const mime = mediaFile?.type || 'audio/mp3';

      const res = await GeminiEngine.generateMultimodal(prompt, base64, mime);
      setSpeechResult(res.text);
    } catch (err) {
      console.error(err);
      setSpeechResult('Có lỗi xảy ra khi phân tích bài phát âm. Vui lòng thử lại!');
    } finally {
      setIsSpeechLoading(false);
    }
  };

  const copyToClipboard = (text: string, setCopiedFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedFn(true);
    setTimeout(() => setCopiedFn(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-amber-400 text-white shadow-lg space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black">
              <Sparkles className="w-6 h-6 text-yellow-200 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">🤖 AI STUDIO DẠY HỌC DÀNH CHO GIÁO VIÊN</h2>
              <p className="text-xs opacity-90 font-medium">
                Bộ công cụ AI trợ lý thông minh: Chấm bài viết tay qua ảnh, Soạn đề bài tập tự động & Chấm phát âm Audio/Video
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3.5 py-2 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-black text-xs backdrop-blur-md border border-white/30 transition flex items-center space-x-1.5 cursor-pointer shrink-0"
          >
            <Settings className="w-4 h-4 text-yellow-200" />
            <span>⚙️ Cấu Hình API Key</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-pink-100 dark:border-slate-800 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('image')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeSubTab === 'image'
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-pink-50 dark:hover:bg-slate-800'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>📸 1. AI Chấm Bài Viết Tay (Qua Ảnh)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('worksheet')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeSubTab === 'worksheet'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>📝 2. AI Soạn Đề Bài Tập & Phiếu Bài Tập</span>
        </button>

        <button
          onClick={() => setActiveSubTab('speech')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 shrink-0 cursor-pointer ${
            activeSubTab === 'speech'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>🎙️ 3. AI Chấm Phát Âm (Audio / Video)</span>
        </button>
      </div>

      {/* SUB-TAB 1: AI CHẤM BÀI VIẾT TAY QUA ẢNH */}
      {activeSubTab === 'image' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-pink-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center">
              <Camera className="w-5 h-5 mr-2 text-pink-500" />
              📸 AI Chấm Bài Viết Tay & Phân Tích Lỗi Sai Chi Tiết
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Tải ảnh chụp bài làm chữ viết tay của học viên lên. AI sẽ tự động đọc chữ (OCR), giải thích lý do tại sao sai và hướng dẫn cách sửa đúng!
            </p>
          </div>

          {!GeminiEngine.getApiKey() && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-slate-800 border-2 border-amber-300 space-y-2 text-xs">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-black text-amber-900 dark:text-amber-200 block">
                    ⚠️ CHƯA NHẬP GEMINI API KEY CÁ NHÂN!
                  </span>
                  <p className="text-amber-800 dark:text-amber-300 font-medium">
                    Để mắt thần AI đọc và phân tích chính xác từng nét chữ viết tay từ ảnh thực tế của bạn, hãy nhập API Key cá nhân từ Google AI Studio (Miễn phí 100%).
                  </p>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs transition inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>⚙️ Nhập Gemini API Key Ngay (Miễn Phí 100%) →</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: File Upload & Controls */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-pink-200 dark:border-slate-700 rounded-3xl p-6 text-center hover:bg-pink-50/50 dark:hover:bg-slate-800/50 transition relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-pink-100 dark:bg-slate-800 text-pink-600 mx-auto flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                    {imageFile ? imageFile.name : 'Bấm để chọn ảnh bài làm, kéo thả vào đây hoặc dán Ctrl+V'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Hỗ trợ PNG, JPG, WEBP • Nhấn Ctrl + V để dán ngay!</span>
                </div>
              </div>

              {/* Paste from Clipboard Action Button */}
              <button
                type="button"
                onClick={handlePasteFromClipboardButton}
                className="w-full py-2.5 rounded-2xl bg-pink-100 dark:bg-slate-800 hover:bg-pink-200 text-pink-950 dark:text-pink-300 font-extrabold text-xs transition border border-pink-300 flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
              >
                <Clipboard className="w-4 h-4 text-pink-600" />
                <span>📋 Dán Ảnh Từ Bộ Nhớ Tạm (Phím Tắt Ctrl + V)</span>
              </button>

              {imagePreview && (
                <div className="rounded-2xl overflow-hidden border border-pink-200 shadow-xs max-h-60 flex justify-center bg-slate-50">
                  <img src={imagePreview} alt="Bài làm học viên" className="max-h-60 object-contain" />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Yêu cầu phân tích cho AI (Prompt):
                </label>
                <textarea
                  rows={3}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleRunImageGrader}
                disabled={isImageLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 hover:from-pink-600 hover:to-rose-600 text-white font-black text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isImageLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Đang Đọc Chữ & Chấm Bài...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-yellow-200" />
                    <span>🤖 Phân Tích & Chấm Bài Tập Ngay</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: AI Output Result */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                  📋 Kết Quả AI Phân Tích & Nhận Xét Bài Làm:
                </h4>

                {imageResult && (
                  <button
                    onClick={() => copyToClipboard(imageResult, setImageCopied)}
                    className="px-3 py-1 rounded-xl bg-pink-100 dark:bg-slate-800 text-pink-700 dark:text-pink-300 font-extrabold text-[11px] hover:bg-pink-200 transition flex items-center space-x-1 cursor-pointer"
                  >
                    {imageCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{imageCopied ? 'Đã Sao Chép!' : 'Sao Chép Nhận Xét'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-3xl bg-pink-50/50 dark:bg-slate-800/50 border border-pink-200/80 dark:border-slate-700 min-h-[300px] text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                {imageResult ? (
                  imageResult
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 space-y-2">
                    <Sparkles className="w-8 h-8 text-pink-300 animate-pulse" />
                    <span>Vui lòng tải ảnh bài làm lên và bấm nút "Phân Tích & Chấm Bài"</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AI SOẠN ĐỀ BÀI TẬP */}
      {activeSubTab === 'worksheet' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-purple-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-500" />
              📝 AI Soạn Đề Bài Tập & Phiếu Bài Tập Tự Động
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Nhập chủ đề và dạng bài. AI sẽ tự động sinh phiếu bài tập hoàn chỉnh gồm 2 phần: **Đề Bài Tập** và **Đáp Án & Giải Thích Chi Tiết**.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-4 bg-purple-50/50 dark:bg-slate-800/50 p-5 rounded-3xl border border-purple-100 dark:border-slate-700">
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block">Chủ Đề Bài Tập (*)</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                  placeholder="Ví dụ: Present Perfect, Topic Environment, Side By Side 1 Lesson 4..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block">Dạng Bài Tập</label>
                  <select
                    value={exerciseType}
                    onChange={(e) => setExerciseType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="Trắc nghiệm & Điền từ">Trắc Nghiệm & Điền Từ</option>
                    <option value="Chia động từ trong ngoặc">Chia Động Từ Trong Ngoặc</option>
                    <option value="Viết lại câu hoàn chỉnh">Viết Lại Câu Hoàn Chỉnh</option>
                    <option value="Đoạn văn đọc hiểu & Trả lời câu hỏi">Đọc Hiểu & Trả Lời Câu Hỏi</option>
                    <option value="Kiểm tra từ vựng & Đặt câu">Kiểm Tra Từ Vựng & Đặt Câu</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block">Độ Khó</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white dark:bg-slate-900 text-xs font-extrabold text-slate-800 dark:text-white cursor-pointer"
                  >
                    <option value="Cơ Bản (Beginner)">Cơ Bản (Beginner)</option>
                    <option value="Trung Bình (Intermediate)">Trung Bình (Intermediate)</option>
                    <option value="Nâng Cao (Advanced)">Nâng Cao (Advanced)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-200 block">Số Lượng Câu Hỏi ({questionCount} câu)</label>
                <input
                  type="range"
                  min={5}
                  max={20}
                  step={5}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <button
                onClick={handleGenerateWorksheet}
                disabled={isWorksheetLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isWorksheetLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Đang Soạn Đề Bài Tập...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>✨ Tạo Đề Bài Tập Ngay</span>
                  </>
                )}
              </button>
            </div>

            {/* Output */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                  📄 Bộ Đề Bài Tập Hoàn Chỉnh:
                </h4>

                {worksheetResult && (
                  <button
                    onClick={() => copyToClipboard(worksheetResult, setWorksheetCopied)}
                    className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-extrabold text-[11px] hover:bg-purple-200 transition flex items-center space-x-1 cursor-pointer"
                  >
                    {worksheetCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{worksheetCopied ? 'Đã Sao Chép Đề!' : 'Sao Chép Đề Bài'}</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-3xl bg-purple-50/50 dark:bg-slate-800/50 border border-purple-200/80 dark:border-slate-700 min-h-[300px] text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap font-mono">
                {worksheetResult ? (
                  worksheetResult
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 space-y-2 font-sans">
                    <BookOpen className="w-8 h-8 text-purple-300 animate-bounce" />
                    <span>Nhập chủ đề và bấm nút "Tạo Đề Bài Tập Ngay"</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AI CHẤM PHÁT ÂM */}
      {activeSubTab === 'speech' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-100 dark:border-slate-800 shadow-sm p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center">
              <Mic className="w-5 h-5 mr-2 text-amber-500" />
              🎙️ AI Chấm Phát Âm Qua Audio / Video Bài Nói
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Tải file ghi âm hoặc video bài nói của học viên lên. AI sẽ tự động chấm điểm phát âm (/100), nhận diện từ đọc chưa chuẩn và đánh giá độ trôi chảy!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Upload */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-amber-200 dark:border-slate-700 rounded-3xl p-6 text-center hover:bg-amber-50/50 dark:hover:bg-slate-800/50 transition relative">
                <input
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleMediaChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-slate-800 text-amber-600 mx-auto flex items-center justify-center">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                    {mediaFile ? mediaFile.name : 'Bấm để chọn file ghi âm / video bài nói của học viên'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">Hỗ trợ MP3, WAV, M4A, MP4</span>
                </div>
              </div>

              {mediaPreview && (
                <div className="p-3 bg-amber-50 dark:bg-slate-800 rounded-2xl border border-amber-200">
                  <audio controls src={mediaPreview} className="w-full" />
                </div>
              )}

              <button
                onClick={handleRunSpeechAnalyzer}
                disabled={isSpeechLoading}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black text-xs shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSpeechLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>AI Đang Lắng Nghe & Chấm Bài Nói...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-amber-100" />
                    <span>🎧 AI Chấm Điểm Phát Âm Ngay</span>
                  </>
                )}
              </button>
            </div>

            {/* Output */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-white uppercase tracking-wider">
                📊 Kết Quả Đánh Giá Bài Nói & Phát Âm:
              </h4>

              <div className="p-4 rounded-3xl bg-amber-50/50 dark:bg-slate-800/50 border border-amber-200/80 dark:border-slate-700 min-h-[300px] text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap">
                {speechResult ? (
                  speechResult
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 space-y-2">
                    <Mic className="w-8 h-8 text-amber-300 animate-pulse" />
                    <span>Tải file ghi âm/video lên và bấm nút "AI Chấm Điểm Phát Âm Ngay"</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GEMINI API KEY SETTINGS MODAL */}
      <GeminiSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaved={() => {
          setIsSettingsOpen(false);
        }}
      />
    </div>
  );
};
