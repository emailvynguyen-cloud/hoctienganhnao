import React, { useState, useRef, useEffect } from 'react';
import { GeminiEngine } from '../../lib/gemini';
import {
  Sparkles,
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Zap,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const StudentAiChatbotModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Xin chào em! Cô là Trợ Lý AI Ms. Vy. Em có thắc mắc gì về ngữ pháp, từ vựng hay bài tập tiếng Anh hôm nay không? Đặt câu hỏi cho cô ngay nhé! ✨',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const msg = textToSend || inputMsg;
    if (!msg.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: msg.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputMsg('');
    setIsLoading(true);

    try {
      const prompt = `Bạn là Trợ Lý Học Tập AI dễ thương, tận tụy tại trung tâm Ms. Vy English. Hãy giải đáp thắc mắc tiếng Anh cho học viên bằng tiếng Việt một cách dễ hiểu, sinh động, truyền cảm hứng và mang tính giáo dục cao.
Câu hỏi của học viên: "${msg.trim()}"`;

      const res = await GeminiEngine.generateText(prompt);

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: 'Rất tiếc, cô chưa thể trả lời ngay lúc này. Em hãy thử đặt câu hỏi khác hoặc kiểm tra lại kết nối mạng nhé!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    '💡 Giải thích thì Hiện Tại Đơn & Hiện Tại Tiếp Diễn',
    '📝 Sửa lỗi sai câu: "She don\'t like apple"',
    '✨ Đặt 3 ví dụ từ vựng với từ "Confident"',
    '🌐 Dịch câu: "Never stop trying"',
  ];

  return (
    <>
      {/* FLOATING BOT BUTTON AT BOTTOM RIGHT */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3.5 sm:px-5 sm:py-3 rounded-full bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 text-white font-black text-xs shadow-xl hover:scale-105 transition-all duration-300 flex items-center space-x-2 border-2 border-white cursor-pointer group"
          title="Mở Trợ Lý Học Tập AI Ms. Vy 24/7"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-yellow-200 animate-bounce" />
          </div>
          <span className="hidden sm:inline tracking-wide">✨ Trợ Lý Học Tập Ms. Vy AI</span>
          <span className="sm:hidden font-extrabold text-[11px]">AI Trợ Lý</span>
          <span className="w-2.5 h-2.5 bg-emerald-300 rounded-full animate-ping shrink-0" />
        </button>
      )}

      {/* CHATBOT DIALOG MODAL */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] h-[550px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-pink-300 dark:border-slate-800 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black">
                <Bot className="w-5 h-5 text-yellow-200" />
              </div>
              <div>
                <h4 className="font-black text-xs tracking-tight">✨ TRỢ LÝ HỌC TẬP MS. VY AI</h4>
                <span className="text-[10px] opacity-90 font-medium block">Sẵn sàng hỗ trợ học tập 24/7</span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts Carousel */}
          <div className="p-2 bg-pink-50/60 dark:bg-slate-800/60 border-b border-pink-100 dark:border-slate-800 flex items-center space-x-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(qp)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 text-[10px] font-extrabold text-pink-700 dark:text-pink-300 border border-pink-200 shrink-0 hover:bg-pink-100 transition cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Messages List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start space-x-2 ${m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-[10px] ${
                    m.sender === 'user' ? 'bg-pink-500 text-white' : 'bg-amber-400 text-amber-950'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`p-3 rounded-2xl max-w-[80%] leading-relaxed font-medium shadow-2xs whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-pink-500 text-white rounded-tr-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-pink-100 dark:border-slate-700 rounded-tl-none'
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`text-[9px] block mt-1 ${
                      m.sender === 'user' ? 'text-pink-100 text-right' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 text-pink-600 font-bold text-xs p-2 bg-pink-50 dark:bg-slate-800 rounded-xl w-fit">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Ms. Vy AI đang suy nghĩ câu trả lời...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-slate-900 border-t border-pink-100 dark:border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Nhập câu hỏi tiếng Anh của em tại đây..."
              className="flex-1 px-3.5 py-2 rounded-2xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 bg-pink-50/30 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMsg.trim()}
              className="p-2.5 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
