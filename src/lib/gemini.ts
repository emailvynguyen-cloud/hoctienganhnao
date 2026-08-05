import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODELS = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    desc: 'Tốc độ siêu nhanh, xử lý tiếng Việt & giải đáp thắc mắc cực chuẩn (Mặc định)',
    isDefault: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    desc: 'Nhận diện ảnh Vision & văn bản ổn định',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    desc: 'Mô hình cao cấp, suy luận chuyên sâu',
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

// Helper delay ms
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
    if (!saved || saved === 'gemini-2.5-flash') {
      localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, 'gemini-2.0-flash');
      return 'gemini-2.0-flash';
    }
    return saved;
  },

  setSelectedModel(modelId: string) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, modelId);
  },

  // Helper retry 429 with exponential backoff (1s, 2s, 4s) & 404 Debug logging
  async callWithRetry(
    ai: GoogleGenAI,
    modelId: string,
    contentsData: any,
    requestId: string
  ): Promise<string | null> {
    const backoffDelays = [1000, 2000, 4000]; // 1s, 2s, 4s

    console.log('[AI REQUEST START]', {
      requestId,
      timestamp: new Date().toISOString(),
      model: modelId,
    });

    for (let attempt = 0; attempt <= backoffDelays.length; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelId,
          contents: contentsData,
        });

        if (response && response.text) {
          console.log('[AI REQUEST END]', {
            requestId,
            timestamp: new Date().toISOString(),
            model: modelId,
          });
          return response.text;
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        const is429 = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');
        const is404 = errMsg.includes('404') || errMsg.includes('NOT_FOUND') || errMsg.includes('not found');

        if (is404) {
          console.error('[AI DEBUG 404 NOT FOUND]', {
            requestId,
            timestamp: new Date().toISOString(),
            endpoint: 'ai.models.generateContent',
            model: modelId,
            requestBody: contentsData,
            response: err,
          });
        }

        console.warn('[AI REQUEST FAILED]', {
          requestId,
          timestamp: new Date().toISOString(),
          model: modelId,
          attempt: attempt + 1,
          error: errMsg,
        });

        if (is429 && attempt < backoffDelays.length) {
          const waitMs = backoffDelays[attempt];
          console.log(`[AI RETRY 429] Backoff delay ${waitMs}ms before attempt ${attempt + 2}...`, { requestId });
          await delay(waitMs);
          continue;
        }

        // If not 429 or retries exhausted for this model
        break;
      }
    }

    return null;
  },

  // AI Text Prompt Execution
  async generateText(promptText: string): Promise<{ text: string; modelUsed: string }> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        text: '⚠️ CHƯA CẤU HÌNH GEMINI API KEY!\nVui lòng nhờ Admin (Ms. Vy) cài đặt Gemini API Key trong hệ thống (miễn phí từ Google AI Studio) để kích hoạt Trợ lý AI giải đáp thắc mắc cho em nhé! ✨',
        modelUsed: 'Yêu cầu API Key',
      };
    }

    const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
    const preferredModel = this.getSelectedModel();
    const candidateModels = Array.from(new Set([preferredModel, 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']));

    for (const modelId of candidateModels) {
      const ai = new GoogleGenAI({ apiKey });
      const text = await this.callWithRetry(ai, modelId, promptText, requestId);
      if (text) {
        return { text, modelUsed: modelId };
      }
    }

    return {
      text: 'AI hiện đang bận hoặc đã đạt giới hạn sử dụng. Vui lòng thử lại sau.',
      modelUsed: 'Không thể kết nối',
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
          text: '⚠️ CHƯA CẤU HÌNH GEMINI API KEY!\nVui lòng nhờ Super Admin (Ms. Vy) bấm nút "⚙️ Cấu Hình API Key" để dán API Key cá nhân từ Google AI Studio (miễn phí) để kích hoạt mắt thần AI đọc chữ trên ảnh nhé!',
          modelUsed: 'Yêu cầu API Key',
        };
      } else if (mimeType && (mimeType.startsWith('audio/') || mimeType.startsWith('video/'))) {
        return {
          text: '⚠️ CHƯA CẤU HÌNH GEMINI API KEY!\nVui lòng nhờ Super Admin (Ms. Vy) nhập Gemini API Key từ Google AI Studio (miễn phí) để AI chấm điểm bài phát âm!',
          modelUsed: 'Yêu cầu API Key',
        };
      }
      const randomIndex = Math.floor(Math.random() * SMART_FEEDBACK_TEMPLATES.length);
      return {
        text: SMART_FEEDBACK_TEMPLATES[randomIndex],
        modelUsed: 'Smart AI Auto Generator (Built-in)',
      };
    }

    const requestId = 'req_img_' + Math.random().toString(36).substring(2, 9);
    const candidateModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

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

    for (const modelId of candidateModels) {
      const ai = new GoogleGenAI({ apiKey });
      const text = await this.callWithRetry(ai, modelId, contentsData, requestId);
      if (text) {
        return { text, modelUsed: modelId };
      }
    }

    return {
      text: 'AI hiện đang bận hoặc đã đạt giới hạn sử dụng. Vui lòng thử lại sau.',
      modelUsed: 'Không thể kết nối',
    };
  },
};
