import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODELS = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    desc: 'Tốc độ cực nhanh, phản hồi tức thì (Mặc định)',
    isDefault: true,
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    desc: 'Suy luận chuyên sâu & giải quyết vấn đề phức tạp',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    desc: 'Xử lý ổn định, mượt mà',
  },
];

const STORAGE_KEYS = {
  API_KEY: 'gemini_api_key',
  SELECTED_MODEL: 'gemini_selected_model',
};

const CACHE_KEYS = {
  WORKING_MODEL: 'gemini_cached_working_model',
  CACHE_TIMESTAMP: 'gemini_cached_model_timestamp',
};

export const SYSTEM_PERSONA_INSTRUCTION = `Bạn là Trợ lý AI Hỗ trợ Học tập Tiếng Anh. Hãy tuân thủ nghiêm ngặt các quy tắc trình bày sau:
1. ĐỊNH DẠNG VĂN BẢN THUẦN (PLAIN TEXT):
   - Trả về câu trả lời ở dạng văn bản thuần. CẤM SỬ DỤNG bất kỳ ký tự Markdown nào như **, ***, ##, ###, hoặc __ để in đậm hay làm nổi bật chữ.
   - Chỉ dùng xuống dòng, gạch đầu dòng (-) hoặc đánh số (1., 2.) để phân chia các đoạn cho rõ ràng.
2. Phong cách trả lời: Tự nhiên, ngắn gọn, thẳng thắn và tập trung vào câu hỏi chính. Không viết dài dòng lê thê.
3. Tuyệt đối KHÔNG SẾN:
   - Không xưng hô quá đà (CẤM dùng các từ như "học viên thân yêu", "câu hỏi đáng yêu", "học sinh yêu quý"...).
   - Không tự động thêm lời chào mừng rườm rà hay tên trung tâm vào mỗi câu trả lời trừ khi người dùng yêu cầu.
   - Hạn chế tối đa việc lạm dụng icon (emoji) vô lý (chỉ dùng tối đa 1 emoji nếu thực sự cần thiết).
4. Độ chính xác: Kiểm tra kỹ chính tả tiếng Anh và tiếng Việt trước khi trả về kết quả.
5. Cấu trúc câu trả lời chuẩn:
   - Nghĩa của từ / Giải đáp chính
   - Ví dụ minh họa
   - Mở rộng ngắn gọn (nếu cần).`;

export function stripMarkdownFormatting(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*{2,3}/g, '') // remove ** or ***
    .replace(/_{2,3}/g, '') // remove __ or ___
    .replace(/^#{1,6}\s+/gm, '') // remove # or ## headers
    .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, '')) // remove code backticks
    .trim();
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour Cache TTL

// Built-in Smart Feedback Generator Fallback (No API Key Required)
const SMART_FEEDBACK_TEMPLATES = [
  "Bài làm hoàn thành tốt. Cần tiếp tục ôn luyện từ vựng bài học và duy trì phong độ.",
  "Bài làm khá tốt, nắm vững ngữ pháp chính. Luyện tập thêm phản xạ nói để tự tin hơn.",
  "Bài làm chính xác, trình bày rõ ràng. Tiếp tục duy trì tinh thần học tập.",
  "Kiến thức chắc chắn. Lưu ý một số từ vựng nâng cao đã học để hoàn thiện hơn.",
  "Hoàn thành bài đúng hạn. Tiếp tục luyện tập bài tập về nhà thường xuyên.",
];

// Helper delay ms
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper Error Categorizer & Full Console Error Logger
function analyzeGeminiError(err: any, modelId: string, promptSummary: string) {
  const errMsg = err?.message || String(err);
  const errStatus = err?.status || err?.statusCode || err?.code || (errMsg.includes('401') ? 401 : errMsg.includes('403') ? 403 : errMsg.includes('429') ? 429 : errMsg.includes('404') ? 404 : errMsg.includes('400') ? 400 : 'UNKNOWN');

  let category: 'API_KEY_INVALID' | 'PERMISSION_DENIED' | 'QUOTA_EXHAUSTED' | 'MODEL_NOT_FOUND' | 'BAD_REQUEST' | 'NETWORK_ERROR' | 'UNKNOWN' = 'UNKNOWN';
  let userFriendlyText = `🔴 LỖI API GEMINI (${errStatus}): ${errMsg}`;

  if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid') || errMsg.includes('invalid API key') || errStatus === 401) {
    category = 'API_KEY_INVALID';
    userFriendlyText = `🔴 LỖI API KEY KHÔNG HỢP LỆ (401 API_KEY_INVALID): ${errMsg}`;
  } else if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('forbidden') || errStatus === 403) {
    category = 'PERMISSION_DENIED';
    userFriendlyText = `🔴 LỖI TỪ CHỐI TRUY CẬP (403 PERMISSION_DENIED): ${errMsg}`;
  } else if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errStatus === 429) {
    category = 'QUOTA_EXHAUSTED';
    userFriendlyText = `🔴 HẾT HẠN MỨC QUOTA (429 RESOURCE_EXHAUSTED): ${errMsg}`;
  } else if (errMsg.includes('404') || errMsg.includes('NOT_FOUND') || errStatus === 404) {
    category = 'MODEL_NOT_FOUND';
    userFriendlyText = `🔴 MODEL KHÔNG TỒN TẠI (404 NOT_FOUND - "${modelId}"): ${errMsg}`;
  } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('ENOTFOUND') || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    category = 'NETWORK_ERROR';
    userFriendlyText = `🔴 LỖI KẾT NỐI MẠNG (NETWORK_ERROR): ${errMsg}`;
  } else if (errMsg.includes('400') || errMsg.includes('INVALID_ARGUMENT') || errStatus === 400) {
    category = 'BAD_REQUEST';
    userFriendlyText = `🔴 YÊU CẦU KHÔNG HỢP LỆ (400 INVALID_ARGUMENT): ${errMsg}`;
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
      const validIds = GEMINI_MODELS.map((m) => m.id);
      if (cached && timeStr && validIds.includes(cached)) {
        const age = Date.now() - parseInt(timeStr, 10);
        if (age < CACHE_TTL_MS) {
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

  getApiKeyInfo(): { key: string; source: string } {
    // 1. Check API Key in localStorage (User UI Input)
    try {
      const userKey = localStorage.getItem(STORAGE_KEYS.API_KEY);
      if (userKey) {
        const sanitized = userKey.trim().replace(/^["']|["']$/g, '');
        if (sanitized && sanitized !== 'undefined' && sanitized !== 'null') {
          return {
            key: sanitized,
            source: 'localStorage (User UI Input)',
          };
        }
      }
    } catch (e) {
      // LocalStorage access error fallback
    }

    // 2. Check process.env.GEMINI_API_KEY
    try {
      if (typeof process !== 'undefined' && process.env) {
        const procKey =
          process.env.GEMINI_API_KEY ||
          process.env.VITE_GEMINI_API_KEY ||
          process.env.VITE_API_KEY ||
          process.env.API_KEY;

        if (procKey) {
          const sanitized = String(procKey).trim().replace(/^["']|["']$/g, '');
          if (sanitized && sanitized !== 'undefined' && sanitized !== 'null') {
            return {
              key: sanitized,
              source: 'process.env.GEMINI_API_KEY',
            };
          }
        }
      }
    } catch (e) {
      // Ignore process check error
    }

    // 3. Check import.meta.env
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
            return {
              key: sanitized,
              source: 'import.meta.env.VITE_GEMINI_API_KEY',
            };
          }
        }
      }
    } catch (e) {
      // Ignore import.meta check error
    }

    return { key: '', source: 'Chưa cấu hình (Rỗng)' };
  },

  getApiKey(): string {
    return this.getApiKeyInfo().key;
  },

  setApiKey(key: string) {
    const sanitized = key ? key.trim().replace(/^["']|["']$/g, '') : '';
    if (sanitized) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, sanitized);
      console.log('💾 [SUPER ADMIN API KEY SAVED SUCCESS]: Saved new API Key to LocalStorage.');
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
      console.warn('🗑️ [SUPER ADMIN API KEY REMOVED]: Cleared API Key from LocalStorage.');
    }
  },

  getSelectedModel(): string {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL);
    const validIds = GEMINI_MODELS.map((m) => m.id);
    if (!saved || !validIds.includes(saved)) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, 'gemini-3-flash-preview');
      return 'gemini-3-flash-preview';
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

    const { key: currentApiKey, source: keySource } = this.getApiKeyInfo();
    const maskedKey = currentApiKey.length >= 10
      ? `${currentApiKey.slice(0, 6)}...${currentApiKey.slice(-4)}`
      : currentApiKey
      ? `${currentApiKey.slice(0, 3)}...`
      : '(Key Rỗng / Chưa Cấu Hình)';

    const cachedWorking = this.getCachedWorkingModel();
    const userSelected = this.getSelectedModel();
    const modelSource = modelId === cachedWorking
      ? 'Cached Working Model (1h Memory)'
      : modelId === userSelected
      ? 'User Selected Model'
      : 'Priority Fallback Chain';

    // MANDATORY AUDIT LOG BEFORE CALLING GEMINI API
    console.log('🔑 [GEMINI API KEY & MODEL AUDIT LOG]', {
      timestamp: new Date().toISOString(),
      apiKeySource: keySource,
      maskedApiKey: maskedKey,
      actualModelCalled: modelId,
      modelConfigSource: modelSource,
      requestId,
    });

    for (let attempt = 0; attempt <= backoffDelays.length; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelId,
          contents: contentsData,
        });

        if (response && response.text) {
          console.log('[AI MODEL ATTEMPT SUCCESS]', {
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

        console.warn(`⚠️ [MODEL ATTEMPT WARNING] "${modelId}" attempt ${attempt + 1} failed:`, errMsg);

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
        text: '⚠️ CHƯA CẤU HÌNH GEMINI API KEY!\nVui lòng dán Gemini API Key từ Google AI Studio để kích hoạt Trợ lý AI.',
        modelUsed: 'Yêu cầu API Key',
      };
    }

    const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
    const cachedWorkingModel = this.getCachedWorkingModel();
    const userSelectedModel = this.getSelectedModel();

    // Inject System Persona Instructions into Prompt
    const fullPrompt = promptText.includes('SYSTEM_PERSONA_INSTRUCTION') || promptText.includes('Tuyệt đối KHÔNG SẾN')
      ? promptText
      : `${SYSTEM_PERSONA_INSTRUCTION}\n\n[Nội dung yêu cầu]:\n${promptText}`;

    // Dynamic Fallback Chain Priority:
    // 1. Cached Working Model (if valid)
    // 2. User Selected Model (e.g. gemini-3-flash-preview)
    // 3. Fallback list (gemini-3-flash-preview -> gemini-3-pro-preview -> gemini-2.5-flash -> gemini-2.0-flash -> gemini-1.5-flash)
    const standardFallbackChain = [
      'gemini-3-flash-preview',
      'gemini-3-pro-preview',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ];
    const candidateModels = Array.from(
      new Set([cachedWorkingModel, userSelectedModel, ...standardFallbackChain].filter(Boolean) as string[])
    );

    let lastError: any = null;
    let lastAttemptedModel = candidateModels[0];

    for (let i = 0; i < candidateModels.length; i++) {
      const modelId = candidateModels[i];
      lastAttemptedModel = modelId;

      console.log(`🤖 [AI MODEL FALLBACK CHAIN ${i + 1}/${candidateModels.length}]: Testing model "${modelId}"...`);

      const ai = new GoogleGenAI({ apiKey });
      const { text, lastError: err } = await this.callWithRetry(ai, modelId, fullPrompt, requestId);

      if (text) {
        if (i > 0) {
          console.log(`🎉 [MODEL FALLBACK SUCCESSFUL]: Model "${candidateModels[0]}" was unavailable, successfully fell back to "${modelId}"!`);
        } else {
          console.log(`✅ [AI MODEL IN USE SUCCESS]: Using primary model "${modelId}" for response.`);
        }
        this.setCachedWorkingModel(modelId);
        const cleanedText = stripMarkdownFormatting(text);
        return { text: cleanedText, modelUsed: modelId };
      }

      // Model failed -> Log fallback transition and try next model
      const nextModel = candidateModels[i + 1];
      console.warn(`⏭️ [MODEL FALLBACK SWITCHING]: Model "${modelId}" failed.`, {
        reason: err?.message || 'No text response returned',
        switchingToNextModel: nextModel || 'None (List exhausted)',
      });

      if (modelId === cachedWorkingModel) {
        this.invalidateCachedWorkingModel();
      }

      if (err) lastError = err;
    }

    // ONLY LOG FINAL CONSOLE ERROR IF ALL CANDIDATE MODELS FAILED
    const { userFriendlyText } = analyzeGeminiError(lastError, lastAttemptedModel, fullPrompt);

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
          text: '⚠️ CHƯA CẤU HÌNH GEMINI API KEY!\nVui lòng dán Gemini API Key từ Google AI Studio để kích hoạt mắt thần AI đọc ảnh.',
          modelUsed: 'Yêu cầu API Key',
        };
      } else if (mimeType && (mimeType.startsWith('audio/') || mimeType.startsWith('video/'))) {
        return {
          text: '⚠️ CHƯA CẤU HÌNH GEMINI API KEY!\nVui lòng nhập Gemini API Key từ Google AI Studio để AI chấm phát âm!',
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
    const userSelectedModel = this.getSelectedModel();
    const standardFallbackChain = [
      'gemini-3-flash-preview',
      'gemini-3-pro-preview',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
    ];
    const candidateModels = Array.from(
      new Set([cachedWorkingModel, userSelectedModel, ...standardFallbackChain].filter(Boolean) as string[])
    );

    const fullPromptText = typeof promptText === 'string' && (promptText.includes('SYSTEM_PERSONA_INSTRUCTION') || promptText.includes('Tuyệt đối KHÔNG SẾN'))
      ? promptText
      : `${SYSTEM_PERSONA_INSTRUCTION}\n\n[Nội dung yêu cầu]:\n${promptText}`;

    let contentsData: any = fullPromptText;
    if (fileBase64 && mimeType) {
      let cleanBase64 = fileBase64.includes(',') ? fileBase64.split(',')[1] : fileBase64;
      cleanBase64 = cleanBase64.replace(/\s/g, '');

      let normalizedMime = mimeType.toLowerCase();
      if (normalizedMime === 'image/jpg') normalizedMime = 'image/jpeg';

      contentsData = [
        fullPromptText,
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

      console.log(`🤖 [AI MULTIMODAL FALLBACK CHAIN ${i + 1}/${candidateModels.length}]: Testing model "${modelId}"...`);

      const ai = new GoogleGenAI({ apiKey });
      const { text, lastError: err } = await this.callWithRetry(ai, modelId, contentsData, requestId);

      if (text) {
        if (i > 0) {
          console.log(`🎉 [MULTIMODAL FALLBACK SUCCESSFUL]: Model "${candidateModels[0]}" was unavailable, successfully fell back to "${modelId}"!`);
        } else {
          console.log(`✅ [AI MULTIMODAL SUCCESS]: Using primary model "${modelId}" for response.`);
        }
        this.setCachedWorkingModel(modelId);
        const cleanedText = stripMarkdownFormatting(text);
        return { text: cleanedText, modelUsed: modelId };
      }

      const nextModel = candidateModels[i + 1];
      console.warn(`⏭️ [MULTIMODAL MODEL FALLBACK SWITCHING]: Model "${modelId}" failed.`, {
        reason: err?.message || 'No text response returned',
        switchingToNextModel: nextModel || 'None (List exhausted)',
      });

      if (modelId === cachedWorkingModel) {
        this.invalidateCachedWorkingModel();
      }

      if (err) lastError = err;
    }

    // ONLY LOG FINAL CONSOLE ERROR IF ALL CANDIDATE MODELS FAILED
    const { userFriendlyText } = analyzeGeminiError(lastError, lastAttemptedModel, typeof contentsData === 'string' ? contentsData : 'Multimodal');

    return {
      text: userFriendlyText,
      modelUsed: lastAttemptedModel,
    };
  },
};
