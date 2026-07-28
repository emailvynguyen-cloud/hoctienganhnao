import { GoogleGenAI } from '@google/genai';

export const GEMINI_MODELS = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    desc: 'Tốc độ nhanh, phản hồi tức thì cho từ vựng & nhận xét (Mặc định)',
    isDefault: true,
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    desc: 'Suy luận sâu, phân tích ngữ pháp & chữa bài viết IELTS',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    desc: 'Model ổn định, tiết kiệm quota',
  },
];

const STORAGE_KEYS = {
  API_KEY: 'gemini_api_key',
  SELECTED_MODEL: 'gemini_selected_model',
};

export const GeminiEngine = {
  getApiKey(): string {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  },
  setApiKey(key: string) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
  },

  getSelectedModel(): string {
    return localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) || 'gemini-3-flash-preview';
  },
  setSelectedModel(modelId: string) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, modelId);
  },

  // AI Prompt Execution with Fallback & Retry Logic
  async generateText(promptText: string): Promise<{ text: string; modelUsed: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Chưa thiết lập Gemini API Key! Vui lòng nhập API Key để sử dụng.');
    }

    const preferredModel = this.getSelectedModel();
    const fallbackList = [
      preferredModel,
      ...GEMINI_MODELS.map((m) => m.id).filter((id) => id !== preferredModel),
    ];

    let lastError: any = null;

    for (const modelId of fallbackList) {
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
        lastError = err;
      }
    }

    const rawErrorStr = lastError?.message || lastError?.toString() || '429 RESOURCE_EXHAUSTED';
    throw new Error(rawErrorStr);
  },
};
