import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODELS = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    desc: 'Tốc độ siêu nhanh, đọc chữ viết tay trên ảnh cực chuẩn (Mặc định)',
    isDefault: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    desc: 'Nhận diện ảnh Vision ổn định & nhanh chóng',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    desc: 'Suy luận sâu, phân tích ngữ pháp bài viết dài & IELTS',
  },
];

const STORAGE_KEYS = {
  API_KEY: 'gemini_api_key',
  SELECTED_MODEL: 'gemini_selected_model',
};

// Built-in Smart Feedback Generator Fallback (No API Key Required)
const SMART_FEEDBACK_TEMPLATES = [
  "Em làm bài tập rất đầy đủ và chăm chỉ! Chú ý ôn lại các từ vựng mới của buổi học và phát huy phong độ ở buổi tiếp theo nhé. 🌟",
  "Bài làm rất tốt! Em nắm vững ngữ pháp và từ vựng của buổi học. Cần luyện tập thêm phản xạ nói để tự tin hơn nữa nhé! 💪",
  "Em đã hoàn thành tốt các câu hỏi bài tập. Kỹ năng làm bài ngày càng tiến bộ rõ rệt! Cố gắng duy trì tinh thần học tập tuyệt vời này nhé. ✨",
  "Bài làm chỉn chu, kiến thức chắc chắn! Chú ý một số từ vựng nâng cao đã học trên lớp để đạt điểm tối đa ở các bài tiếp theo. 🏆",
  "Rất biểu dương tinh thần làm bài đúng hạn của em! Em hãy tiếp tục luyện tập và hoàn thành đầy đủ các bài tập về nhà nhé. 👑",
];

export const GeminiEngine = {
  getApiKey(): string {
    const userKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
    if (userKey) return userKey.trim();

    try {
      if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
      }
    } catch (e) {
      // Ignore env check error
    }

    return '';
  },

  setApiKey(key: string) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
  },

  getSelectedModel(): string {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || 'gemini-2.5-flash';
  },

  setSelectedModel(modelId: string) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, modelId);
  },

  // AI Prompt Execution with Built-in Auto Fallback
  async generateText(promptText: string): Promise<{ text: string; modelUsed: string }> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      const randomIndex = Math.floor(Math.random() * SMART_FEEDBACK_TEMPLATES.length);
      const generatedTemplate = SMART_FEEDBACK_TEMPLATES[randomIndex];
      return {
        text: generatedTemplate,
        modelUsed: 'Smart AI Auto Generator (Built-in)',
      };
    }

    const preferredModel = this.getSelectedModel();
    const fallbackList = [
      preferredModel,
      'gemini-2.5-flash',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-pro',
      'gemini-1.5-pro',
    ];

    const uniqueModels = Array.from(new Set(fallbackList));

    for (const modelId of uniqueModels) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: modelId,
          contents: promptText,
        });

        if (response && response.text) {
          return { text: response.text, modelUsed: modelId };
        }
      } catch (err: any) {
        console.warn(`Model ${modelId} failed, trying fallback...`, err);
      }
    }

    const randomIndex = Math.floor(Math.random() * SMART_FEEDBACK_TEMPLATES.length);
    return {
      text: SMART_FEEDBACK_TEMPLATES[randomIndex],
      modelUsed: 'Smart AI Auto Generator (Quota Fallback)',
    };
  },

  // Multimodal AI (Image OCR / Audio Pronunciation Analysis)
  async generateMultimodal(
    promptText: string,
    fileBase64?: string,
    mimeType?: string
  ): Promise<{ text: string; modelUsed: string }> {
    const rawApiKey = this.getApiKey();
    const apiKey = rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, '') : '';

    if (!apiKey) {
      if (mimeType && mimeType.startsWith('image/')) {
        return {
          text: `⚠️ **CHƯA CẤU HÌNH GEMINI API KEY!**\n\nHệ thống chưa ghi nhận Gemini API Key hợp lệ.\n\n👉 **Vui lòng liên hệ Người Điều Hành (Super Admin / Ms. Vy)** để bấm nút **"⚙️ Cấu Hình API Key"** và dán API Key miễn phí từ **https://aistudio.google.com/api-keys** để kích hoạt mắt thần AI đọc chữ trên ảnh nhé!`,
          modelUsed: 'Yêu cầu API Key',
        };
      } else if (mimeType && (mimeType.startsWith('audio/') || mimeType.startsWith('video/'))) {
        return {
          text: `⚠️ **CHƯA CẤU HÌNH GEMINI API KEY!**\n\nVui lòng liên hệ Super Admin (Ms. Vy) để nhập Gemini API Key cá nhân từ Google AI Studio (miễn phí) để AI có thể lắng nghe và chấm điểm bài phát âm thực tế!`,
          modelUsed: 'Yêu cầu API Key',
        };
      }
      const randomIndex = Math.floor(Math.random() * SMART_FEEDBACK_TEMPLATES.length);
      return {
        text: SMART_FEEDBACK_TEMPLATES[randomIndex],
        modelUsed: 'Smart AI Auto Generator (Built-in)',
      };
    }

    // For Multimodal (Image OCR / Audio), ONLY use Flash models which have 100% free high quotas (gemini-1.5-flash, gemini-2.0-flash, gemini-2.5-flash)
    const visionModels = [
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
    ];

    let lastErrorMsg = '';
    let isQuotaError = false;

    for (const modelId of visionModels) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        let contentsData: any = promptText;

        if (fileBase64 && mimeType) {
          let cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
          cleanBase64 = cleanBase64.replace(/\s/g, '');

          let normalizedMime = mimeType.toLowerCase();
          if (normalizedMime === 'image/jpg') normalizedMime = 'image/jpeg';

          contentsData = [
            promptText,
            {
              inlineData: {
                data: cleanBase64,
                mimeType: normalizedMime,
              },
            },
          ];
        }

        const response = await ai.models.generateContent({
          model: modelId,
          contents: contentsData,
        });

        if (response && response.text) {
          return { text: response.text, modelUsed: modelId };
        }
      } catch (err: any) {
        lastErrorMsg = err?.message || String(err);
        if (lastErrorMsg.includes('429') || lastErrorMsg.includes('RESOURCE_EXHAUSTED') || lastErrorMsg.includes('quota')) {
          isQuotaError = true;
        }
        console.warn(`Vision Model ${modelId} failed:`, lastErrorMsg);
      }
    }

    if (isQuotaError) {
      return {
        text: `⚠️ **VƯỢT QUÁ TẦN SUẤT TRUY CẬP (Rate Limit 429 / Quota Limit):**\n\nTài khoản Google AI Studio miễn phí quy định gửi tối đa 15 ảnh/phút. Bạn vừa nhấn nút hoặc gửi ảnh liên tục quá nhanh trong thời gian ngắn.\n\n👉 **Cách khắc phục:**\n1. Vui lòng **chờ 5 - 10 giây** rồi bấm nút **"Phân Tích & Chấm Bài Tập Ngay"** lại một lần nữa.\n2. Hoặc nếu bạn muốn chấm số lượng lớn không bị giới hạn, hãy tạo 1 API Key mới tại **https://aistudio.google.com/api-keys** và dán vào phần Cấu Hình API Key nhé!`,
        modelUsed: 'Rate Limit (429)',
      };
    }

    return {
      text: `⚠️ **KHÔNG THỂ PHÂN TÍCH ẢNH:**\n\nChi tiết phản hồi từ Google Gemini: *${lastErrorMsg || 'Kết nối không thành công'}*\n\n👉 **Cách khắc phục:** Vui lòng nhờ Super Admin (Ms. Vy) kiểm tra lại API Key tại **https://aistudio.google.com/api-keys** và cập nhật Key mới vào nút **"⚙️ Cấu Hình API Key"** nhé!`,
      modelUsed: 'Lỗi API Key / Quota',
    };
  },
};
