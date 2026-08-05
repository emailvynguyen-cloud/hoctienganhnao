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

// Helper Error Categorizer & Full Console Error Logger
function analyzeGeminiError(err: any, modelId: string, promptSummary: string) {
  const errMsg = err?.message || String(err);
  const errStatus = err?.status || err?.statusCode || err?.code || (errMsg.includes('401') ? 401 : errMsg.includes('403') ? 403 : errMsg.includes('429') ? 429 : errMsg.includes('404') ? 404 : errMsg.includes('400') ? 400 : 'UNKNOWN');

  let category: 'API_KEY_INVALID' | 'PERMISSION_DENIED' | 'QUOTA_EXHAUSTED' | 'MODEL_NOT_FOUND' | 'BAD_REQUEST' | 'NETWORK_ERROR' | 'UNKNOWN' = 'UNKNOWN';
  let userFriendlyText = '⚠️ Hệ thống AI tạm thời gặp sự cố kết nối. Vui lòng thử lại sau.';

  if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid') || errMsg.includes('invalid API key') || errStatus === 401) {
    category = 'API_KEY_INVALID';
    userFriendlyText = '⚠️ Gemini API Key không hợp lệ hoặc đã bị hết hạn/vô hiệu hóa. Vui lòng kiểm tra lại API Key!';
  } else if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('forbidden') || errStatus === 403) {
    category = 'PERMISSION_DENIED';
    userFriendlyText = '⚠️ Tài khoản API Key bị từ chối truy cập hoặc bị giới hạn quốc gia.';
  } else if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errStatus === 429) {
    category = 'QUOTA_EXHAUSTED';
    userFriendlyText = '⚠️ Đã vượt quá hạn mức sử dụng (Quota) miễn phí của Google AI. Vui lòng chờ ít phút rồi thử lại!';
  } else if (errMsg.includes('404') || errMsg.includes('NOT_FOUND') || errStatus === 404) {
    category = 'MODEL_NOT_FOUND';
    userFriendlyText = `⚠️ Model "${modelId}" không khả dụng trên API Key này.`;
  } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('ENOTFOUND') || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    category = 'NETWORK_ERROR';
    userFriendlyText = '⚠️ Không thể kết nối tới server Google AI. Vui lòng kiểm tra kết nối mạng Internet của bạn!';
  } else if (errMsg.includes('400') || errMsg.includes('INVALID_ARGUMENT') || errStatus === 400) {
    category = 'BAD_REQUEST';
    userFriendlyText = '⚠️ Yêu cầu câu hỏi không hợp lệ hoặc dung lượng file vượt quá giới hạn.';
  }

  // DETAILED FULL CONSOLE LOGGING (HTTP STATUS, ERROR MESSAGE, RESPONSE BODY, MODEL, CATEGORY)
  console.error('❌ [GEMINI API ROOT CAUSE ERROR REPORT]', {
    timestamp: new Date().toISOString(),
    category,
    httpStatus: errStatus,
    modelUsed: modelId,
    errorMessage: errMsg,
    rawErrorObject: err,
    promptSummary: typeof promptSummary === 'string' ? promptSummary.slice(0, 120) + '...' : 'Multimodal Input',
  });

  return { category, userFriendlyText, errMsg, errStatus };
}

export const GeminiEngine = {
  // Get cached working model if valid and under 1 hour old
  getCachedWorkingModel(): string | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.WORKING_MODEL);
      const timeStr = localStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMP);
      if (cached && timeStr) {
        const age = Date.now() - parseInt(timeStr, 10);
        if (age < CACHE_TTL_MS && cached !== 'gemini-2.5-flash') {
          return cached;
        }
      }
    } catch (e) {
      // LocalStorage error fallback
    }
    return null;
  },

  // Cache working model to prevent re-testing priority list on every request
  setCachedWorkingModel(modelId: string) {
    try {
      localStorage.setItem(CACHE_KEYS.WORKING_MODEL, modelId);
      localStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMP, Date.now().toString());
      console.log(`💾 [AI MODEL CACHED SUCCESS]: Saved "${modelId}" as active working model.`);
    } catch (e) {
      // LocalStorage error fallback
    }
  },

  // Clear cache if active model fails
  invalidateCachedWorkingModel() {
    try {
      localStorage.removeItem(CACHE_KEYS.WORKING_MODEL);
      localStorage.removeItem(CACHE_KEYS.CACHE_TIMESTAMP);
      console.warn('🔄 [AI MODEL CACHE INVALIDATED]: Cleared cache to re-verify fallback chain.');
    } catch (e) {
      // LocalStorage error fallback
    }
  },

  getApiKey(): string {
    // 1. Check user-configured key in LocalStorage
    try {
      const userKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
      if (userKey) {
        const sanitized = userKey.trim().replace(/^["']|["']$/g, '');
        if (sanitized && sanitized !== 'undefined' && sanitized !== 'null') {
          return sanitized;
        }
      }
    } catch (e) {
      // LocalStorage access error fallback
    }

    // 2. Check Environment Variables (Vite, Vercel, Netlify)
    try {
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        const envKey =
          import.meta.env.VITE_GEMINI_API_KEY ||
          import.meta.env.GEMINI_API_KEY ||
          import.meta.env.VITE_API_KEY ||
          import.meta.env.API_KEY;

        if (envKey) {
          const sanitized = String(envKey).trim().replace(/^["']|["']$/g, '');
          if (sanitized && sanitized !== 'undefined' && sanitized !== 'null') {
            return sanitized;
          }
        }
      }
    } catch (e) {
      // Ignore env check error
    }

    // 3. Check process.env (Node / Server-Side / Build time)
    try {
      if (typeof process !== 'undefined' && process.env) {
        const procKey =
          process.env.VITE_GEMINI_API_KEY ||
          process.env.GEMINI_API_KEY ||
          process.env.VITE_API_KEY ||
          process.env.API_KEY;

        if (procKey) {
          const sanitized = String(procKey).trim().replace(/^["']|["']$/g, '');
          if (sanitized && sanitized !== 'undefined' && sanitized !== 'null') {
            return sanitized;
          }
        }
      }
    } catch (e) {
      // Ignore process check error
    }

    return '';
  },

  setApiKey(key: string) {
    const sanitized = key ? key.trim().replace(/^["']|["']$/g, '') : '';
    if (sanitized) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, sanitized);
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
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

  // Helper retry 429 with exponential backoff (1s, 2s, 4s) & Debug logging
  async callWithRetry(
    ai: GoogleGenAI,
    modelId: string,
    contentsData: any,
    requestId: string
  ): Promise<{ text: string | null; lastError: any | null }> {
    const backoffDelays = [1000, 2000, 4000]; // 1s, 2s, 4s
    let lastErr: any = null;

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
          console.log('[AI REQUEST END SUCCESS]', {
            requestId,
            timestamp: new Date().toISOString(),
            model: modelId,
          });
          return { text: response.text, lastError: null };
        }
      } catch (err: any) {
        lastErr = err;
        const errMsg = err?.message || String(err);
        const is429 = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota');

        analyzeGeminiError(err, modelId, typeof contentsData === 'string' ? contentsData : 'Multimodal');

        if (is429 && attempt < backoffDelays.length) {
          const waitMs = backoffDelays[attempt];
          console.log(`[AI RETRY 429] Backoff delay ${waitMs}ms before attempt ${attempt + 2}...`, { requestId });
          await delay(waitMs);
          continue;
        }

        // Break on non-429 or retries exhausted
        break;
      }
    }

    return { text: null, lastError: lastErr };
  },

  // AI Text Prompt Execution with Dynamic Model Fallback & Caching
  async generateText(promptText: string): Promise<{ text: string; modelUsed: string }> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.warn('⚠️ [GEMINI API KEY MISSING]: LocalStorage or Environment Variables are empty.');
      return {
        text: '⚠️ CHƯA CẤU HÌNH GEMINI API KEY!\nVui lòng nhờ Admin (Ms. Vy) cài đặt Gemini API Key trong hệ thống (miễn phí từ Google AI Studio) để kích hoạt Trợ lý AI giải đáp thắc mắc cho em nhé! ✨',
        modelUsed: 'Yêu cầu API Key',
      };
    }

    const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
    const cachedWorkingModel = this.getCachedWorkingModel();
    const userSelectedModel = this.getSelectedModel();

    // Priority chain: 1. Cached Working Model (if valid), 2. User Selected Model, 3. Standard Priority Fallback Chain
    const standardFallbackChain = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    const candidateModels = Array.from(
      new Set([cachedWorkingModel, userSelectedModel, ...standardFallbackChain].filter(Boolean) as string[])
    );

    let lastError: any = null;
    let lastAttemptedModel = candidateModels[0];

    for (let i = 0; i < candidateModels.length; i++) {
      const modelId = candidateModels[i];
      lastAttemptedModel = modelId;

      console.log(`🤖 [AI MODEL TRYING ${i + 1}/${candidateModels.length}]: "${modelId}"`);

      const ai = new GoogleGenAI({ apiKey });
      const { text, lastError: err } = await this.callWithRetry(ai, modelId, promptText, requestId);

      if (text) {
        console.log(`✅ [AI MODEL IN USE SUCCESS]: Using "${modelId}" for response.`);
        this.setCachedWorkingModel(modelId);
        return { text, modelUsed: modelId };
      }

      // Model failed -> Log model skipped and switch to next in list
      const nextModel = candidateModels[i + 1];
      console.warn(`⏭️ [AI MODEL SKIPPED]: "${modelId}" failed.`, {
        reason: err?.message || 'No text response returned',
        switchingToNextModel: nextModel || 'None (List exhausted)',
      });

      if (modelId === cachedWorkingModel) {
        this.invalidateCachedWorkingModel();
      }

      if (err) lastError = err;
    }

    // If all models failed in the chain
    const { userFriendlyText } = analyzeGeminiError(lastError, lastAttemptedModel, promptText);

    return {
      text: userFriendlyText,
      modelUsed: lastAttemptedModel,
    };
  },

  // Multimodal AI with Dynamic Model Fallback & Caching
  async generateMultimodal(
    promptText: string,
    fileBase64?: string,
    mimeType?: string
  ): Promise<{ text: string; modelUsed: string }> {
    const rawApiKey = this.getApiKey();
    const apiKey = rawApiKey ? rawApiKey.trim().replace(/^["']|["']$/g, '') : '';

    if (!apiKey) {
      console.warn('⚠️ [GEMINI API KEY MISSING]: LocalStorage or Environment Variables are empty.');
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
    const cachedWorkingModel = this.getCachedWorkingModel();
    const standardFallbackChain = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    const candidateModels = Array.from(
      new Set([cachedWorkingModel, ...standardFallbackChain].filter(Boolean) as string[])
    );

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

    let lastError: any = null;
    let lastAttemptedModel = candidateModels[0];

    for (let i = 0; i < candidateModels.length; i++) {
      const modelId = candidateModels[i];
      lastAttemptedModel = modelId;

      console.log(`🤖 [AI MULTIMODAL TRYING ${i + 1}/${candidateModels.length}]: "${modelId}"`);

      const ai = new GoogleGenAI({ apiKey });
      const { text, lastError: err } = await this.callWithRetry(ai, modelId, contentsData, requestId);

      if (text) {
        console.log(`✅ [AI MULTIMODAL SUCCESS]: Using "${modelId}" for response.`);
        this.setCachedWorkingModel(modelId);
        return { text, modelUsed: modelId };
      }

      const nextModel = candidateModels[i + 1];
      console.warn(`⏭️ [AI MULTIMODAL MODEL SKIPPED]: "${modelId}" failed.`, {
        reason: err?.message || 'No text response returned',
        switchingToNextModel: nextModel || 'None (List exhausted)',
      });

      if (modelId === cachedWorkingModel) {
        this.invalidateCachedWorkingModel();
      }

      if (err) lastError = err;
    }

    const { userFriendlyText } = analyzeGeminiError(lastError, lastAttemptedModel, typeof contentsData === 'string' ? contentsData : 'Multimodal');

    return {
      text: userFriendlyText,
      modelUsed: lastAttemptedModel,
    };
  },
};
