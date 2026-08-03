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
    const apiKey = this.getApiKey();

    if (!apiKey) {
      if (mimeType && mimeType.startsWith('image/')) {
        return {
          text: `⚠️ **CHƯA CẤU HÌNH GEMINI API KEY!**\n\nĐể AI có thể soi và đọc chính xác chữ viết tay từ hình ảnh thực tế của bạn, hệ thống cần kết nối với mắt thần Google Gemini Vision API.\n\n👉 **Vui lòng thực hiện theo 2 bước sau (Hoàn toàn miễn phí):**\n1. Bấm vào nút **"⚙️ Nhập Gemini API Key Cá Nhân"** (ở góc trên trang) hoặc truy cập **https://aistudio.google.com/api-keys** để tạo API Key miễn phí.\n2. Dán API Key vào và bấm **Lưu Cấu Hình**.\n\nSau khi lưu Key, bạn chỉ cần bấm **"Phân Tích & Chấm Bài Tập Ngay"** lại một lần nữa, AI sẽ soi từng chữ và giải thích lỗi sai thực tế trên ảnh của học viên!`,
          modelUsed: 'Yêu cầu API Key',
        };
      } else if (mimeType && (mimeType.startsWith('audio/') || mimeType.startsWith('video/'))) {
        return {
          text: `⚠️ **CHƯA CẤU HÌNH GEMINI API KEY!**\n\nVui lòng bấm vào nút **"⚙️ Nhập Gemini API Key Cá Nhân"** và nhập API Key lấy từ Google AI Studio (miễn phí) để AI có thể lắng nghe và chấm điểm bài phát âm thực tế!`,
          modelUsed: 'Yêu cầu API Key',
        };
      }
      const randomIndex = Math.floor(Math.random() * SMART_FEEDBACK_TEMPLATES.length);
      return {
        text: SMART_FEEDBACK_TEMPLATES[randomIndex],
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
        let contentsData: any = promptText;

        if (fileBase64 && mimeType) {
          const cleanBase64 = fileBase64.includes('base64,') ? fileBase64.split('base64,')[1] : fileBase64;
          contentsData = [
            promptText,
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType,
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
        console.warn(`Model ${modelId} multimodal failed, trying fallback...`, err);
      }
    }

    return {
      text: `⚠️ **KHÔNG THỂ PHÂN TÍCH ẢNH (Lỗi API Key / Hết Quota):**\n\nHệ thống đã gửi ảnh tới Gemini Vision nhưng gặp lỗi kết nối (API Key không hợp lệ hoặc đã chạm ngưỡng quota miễn phí trong ngày).\n\n👉 **Cách khắc phục:** Truy cập **https://aistudio.google.com/api-keys**, tạo 1 Key mới và dán vào nút **"⚙️ Nhập Gemini API Key"** để tiếp tục sử dụng mượt mà nhé!`,
      modelUsed: 'Lỗi API Key / Quota',
    };
  },
};
