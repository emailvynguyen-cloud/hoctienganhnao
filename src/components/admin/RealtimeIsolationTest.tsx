import React, { useState, useEffect, useRef } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_KEY } from '../../lib/supabaseEngine';
import { Send, RefreshCw, CheckCircle, AlertTriangle, Zap, MessageSquare } from 'lucide-react';

export interface TestLogItem {
  id: string;
  time: string;
  type: 'STATUS' | 'INSERT' | 'UPDATE' | 'DELETE' | 'BROADCAST' | 'ERROR';
  message: string;
  payload?: any;
}

export interface TestMessage {
  id: string;
  sender_role: string;
  sender_name: string;
  content: string;
  status: string;
  created_at: string;
}

export const RealtimeIsolationTest: React.FC = () => {
  const [role, setRole] = useState<'super_admin' | 'teacher'>('super_admin');
  const [senderName, setSenderName] = useState<string>('Super Admin');
  const [inputContent, setInputContent] = useState<string>('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('CONNECTING');
  const [testLogs, setTestLogs] = useState<TestLogItem[]>([]);
  const [messages, setMessages] = useState<TestMessage[]>([]);

  const channelRef = useRef<any>(null);

  const addLog = (type: TestLogItem['type'], message: string, payload?: any) => {
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const logItem: TestLogItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      time: nowStr,
      type,
      message,
      payload,
    };
    console.log(`[REALTIME ISOLATION TEST][${type}] ${message}`, payload || '');
    setTestLogs((prev) => [logItem, ...prev.slice(0, 99)]);
  };

  // Setup Supabase Realtime Subscription Channel
  useEffect(() => {
    addLog('STATUS', 'Khởi tạo kênh Supabase Realtime Channel: isolation_test_channel');

    // 1. Direct Supabase Postgres Changes & Broadcast Channel
    const channel = supabase
      .channel('isolation_test_channel', {
        config: {
          broadcast: { self: true },
        },
      })
      // A. Listen to DB Postgres Changes on table 'realtime_test_messages'
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'realtime_test_messages',
        },
        (payload: any) => {
          addLog('STATUS', `Nhận event postgres_changes [${payload.eventType}]`, payload);
          if (payload.eventType === 'INSERT' && payload.new) {
            addLog('INSERT', `Nhận message mới từ DB: "${payload.new.content}"`, payload.new);
            setMessages((prev) => [payload.new, ...prev.filter((m) => m.id !== payload.new.id)]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            addLog('UPDATE', `Nhận cập nhật message DB ID=${payload.new.id}: status="${payload.new.status}"`, payload.new);
            setMessages((prev) =>
              prev.map((m) => (m.id === payload.new.id ? payload.new : m))
            );
          }
        }
      )
      // B. Listen to Direct WebSocket Broadcast messages (Fallback & Instant Sync)
      .on('broadcast', { event: 'test_message' }, (payload: any) => {
        addLog('BROADCAST', `Nhận message trực tiếp qua Realtime WebSocket Broadcast`, payload);
        if (payload?.payload?.message) {
          const msg = payload.payload.message;
          setMessages((prev) => [msg, ...prev.filter((m) => m.id !== msg.id)]);
        }
      })
      .subscribe((status: string, err?: any) => {
        setSubscriptionStatus(status);
        addLog('STATUS', `Trạng thái Supabase Realtime Channel: ${status}`, err || null);
      });

    channelRef.current = channel;

    // Initial fetch from DB table (if table exists)
    fetchInitialMessages();

    return () => {
      addLog('STATUS', 'Hủy đăng ký Supabase Realtime Channel');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const fetchInitialMessages = async () => {
    try {
      addLog('STATUS', 'Đang tải danh sách tin nhắn thử nghiệm từ Supabase DB...');
      const { data, error } = await supabase
        .from('realtime_test_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data) {
        setMessages(data);
        addLog('STATUS', `Đã tải ${data.length} tin nhắn từ Supabase DB.`);
      } else {
        // Fallback REST fetch if table or PostgREST schema cache is refreshing
        const restRes = await fetch(`${SUPABASE_URL}/rest/v1/realtime_test_messages?select=*&order=created_at.desc&limit=20`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        });
        if (restRes.ok) {
          const restData = await restRes.json();
          setMessages(restData || []);
          addLog('STATUS', `Đã tải ${restData?.length || 0} tin nhắn qua REST API fallback.`);
        } else {
          addLog('ERROR', 'Không thể query table realtime_test_messages (có thể table chưa được tạo hoặc RLS chặn)', error?.message);
        }
      }
    } catch (e: any) {
      addLog('ERROR', 'Ngoại lệ khi fetch initial messages:', e?.message || e);
    }
  };

  // SEND INSERT EVENT (Send Message to DB + Broadcast)
  const handleSendMessage = async () => {
    if (!inputContent.trim()) return;

    const newMsg: TestMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sender_role: role,
      sender_name: role === 'super_admin' ? 'Super Admin' : 'Teacher A',
      content: inputContent.trim(),
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    addLog('INSERT', `[SEND INSERT] Đang gửi message: "${newMsg.content}"...`);
    setInputContent('');

    // Update local state instantly
    setMessages((prev) => [newMsg, ...prev]);

    // 1. Direct WebSocket Broadcast via Supabase Realtime Engine
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'test_message',
        payload: { message: newMsg },
      });
      addLog('BROADCAST', '[SEND BROADCAST] Đã gửi broadcast event qua Supabase WebSocket Channel');
    }

    // 2. Write to Supabase DB Table 'realtime_test_messages'
    try {
      const { error } = await supabase
        .from('realtime_test_messages')
        .insert([newMsg]);

      if (error) {
        addLog('ERROR', `Lỗi SDK Insert vào table: ${error.message}. Đang thử REST API...`, error);
        await fetch(`${SUPABASE_URL}/rest/v1/realtime_test_messages`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(newMsg),
        });
      } else {
        addLog('STATUS', '[INSERT SUCCESS] Bản ghi đã ghi thành công vào Supabase DB table!');
      }
    } catch (e: any) {
      addLog('ERROR', `Ngoại lệ Insert DB: ${e?.message || e}`);
    }
  };

  // SEND UPDATE EVENT (Update Status of a Message in DB + Broadcast)
  const handleUpdateStatus = async (msgId: string, newStatus: string) => {
    addLog('UPDATE', `[SEND UPDATE] Đang đổi trạng thái ID=${msgId} thành "${newStatus}"...`);

    // Update local state instantly
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, status: newStatus } : m))
    );

    // 1. Direct WebSocket Broadcast update
    const targetMsg = messages.find((m) => m.id === msgId);
    if (targetMsg && channelRef.current) {
      const updated = { ...targetMsg, status: newStatus };
      channelRef.current.send({
        type: 'broadcast',
        event: 'test_message',
        payload: { message: updated },
      });
    }

    // 2. Write UPDATE to Supabase DB Table
    try {
      const { error } = await supabase
        .from('realtime_test_messages')
        .update({ status: newStatus })
        .eq('id', msgId);

      if (error) {
        addLog('ERROR', `Lỗi Update DB SDK: ${error.message}`);
        await fetch(`${SUPABASE_URL}/rest/v1/realtime_test_messages?id=eq.${msgId}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });
      } else {
        addLog('STATUS', `[UPDATE SUCCESS] Đã update trạng thái ID=${msgId} trên Supabase DB!`);
      }
    } catch (e: any) {
      addLog('ERROR', `Ngoại lệ Update DB: ${e?.message || e}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 bg-slate-900 text-slate-100 min-h-screen font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-800 border border-slate-700 shadow-lg">
        <div>
          <div className="flex items-center space-x-3">
            <Zap className="w-7 h-7 text-amber-400 animate-pulse" />
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              ⚡ SUPABASE REALTIME ISOLATION TEST
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Trang kiểm tra độc lập kết nối & sự kiện Realtime trực tiếp từ Supabase PostgreSQL (Không dùng LocalStorage/master_store)
          </p>
        </div>

        {/* CONNECTION BADGE */}
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-400">Trạng thái Kênh:</span>
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border flex items-center space-x-1.5 ${
              subscriptionStatus === 'SUBSCRIBED'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                : 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
            }`}
          >
            {subscriptionStatus === 'SUBSCRIBED' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
            <span>{subscriptionStatus}</span>
          </span>
        </div>
      </div>

      {/* ROLE SWITCHER & INPUT CONTROL PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PANEL 1: ROLE SELECTION & MESSAGE SEND */}
        <div className="md:col-span-1 p-5 rounded-3xl bg-slate-800 border border-slate-700 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-300 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>1. Chọn Vai Trò & Thử Nghiệm</span>
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-400">Đang Giả Lập Role Nào:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRole('super_admin');
                  setSenderName('Super Admin');
                }}
                className={`p-3 rounded-2xl font-black text-xs transition border cursor-pointer ${
                  role === 'super_admin'
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-650'
                }`}
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('teacher');
                  setSenderName('Teacher A');
                }}
                className={`p-3 rounded-2xl font-black text-xs transition border cursor-pointer ${
                  role === 'teacher'
                    ? 'bg-sky-600 text-white border-sky-400 shadow-md'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-650'
                }`}
              >
                👩‍🏫 Teacher A
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-xs font-extrabold text-slate-400">Nội dung tin nhắn test:</label>
            <textarea
              rows={3}
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={role === 'super_admin' ? 'Nhập tin nhắn từ Super Admin...' : 'Nhập tin nhắn phản hồi từ Teacher...'}
              className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!inputContent.trim()}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center space-x-2 shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>GỬI TEST REALTIME (INSERT)</span>
          </button>
        </div>

        {/* PANEL 2: MESSAGES LIST (INSERT & UPDATE VERIFICATION) */}
        <div className="md:col-span-2 p-5 rounded-3xl bg-slate-800 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-sky-300 flex items-center space-x-2">
              <span>💬 2. Danh Sách Message Realtime Đã Nhận ({messages.length})</span>
            </h2>
            <button
              onClick={fetchInitialMessages}
              className="p-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
              title="Tải lại thủ công từ Supabase DB"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {messages.length > 0 ? (
            <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    msg.sender_role === 'super_admin'
                      ? 'bg-rose-950/30 border-rose-800/60 text-rose-100'
                      : 'bg-sky-950/30 border-sky-800/60 text-sky-100'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          msg.sender_role === 'super_admin'
                            ? 'bg-rose-800 text-rose-100'
                            : 'bg-sky-800 text-sky-100'
                        }`}
                      >
                        {msg.sender_role === 'super_admin' ? 'Super Admin' : 'Teacher'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(msg.created_at).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-white">{msg.content}</p>
                    <div className="flex items-center space-x-2 text-[10px]">
                      <span className="text-slate-400">Status:</span>
                      <span
                        className={`font-black uppercase px-2 py-0.5 rounded ${
                          msg.status === 'completed'
                            ? 'bg-emerald-900 text-emerald-200'
                            : msg.status === 'waived'
                            ? 'bg-slate-700 text-slate-200'
                            : 'bg-amber-900 text-amber-200'
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS TO TEST UPDATE EVENT */}
                  <div className="flex items-center space-x-1.5 shrink-0 pt-2 sm:pt-0">
                    <button
                      onClick={() => handleUpdateStatus(msg.id, 'completed')}
                      className="px-2.5 py-1 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-extrabold text-[10px] border border-emerald-600 transition cursor-pointer"
                    >
                      🟢 Completed (UPDATE)
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(msg.id, 'waived')}
                      className="px-2.5 py-1 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-extrabold text-[10px] border border-slate-500 transition cursor-pointer"
                    >
                      ⚪ Waived (UPDATE)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-700 text-xs text-slate-400 font-medium">
              Chưa có message nào. Hãy nhập nội dung và bấm [GỬI TEST REALTIME (INSERT)].
            </div>
          )}
        </div>

      </div>

      {/* PANEL 3: REALTIME LIVE EVENT AUDIT LOGS */}
      <div className="p-5 rounded-3xl bg-slate-800 border border-slate-700 space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center space-x-2">
          <span>📋 3. Log Sự Kiện Realtime Chi Tiết ({testLogs.length})</span>
        </h2>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 max-h-60 overflow-y-auto font-mono text-[11px] space-y-1.5">
          {testLogs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2">
              <span className="text-slate-500 shrink-0">[{log.time}]</span>
              <span
                className={`font-black shrink-0 px-1.5 py-0.5 rounded text-[10px] ${
                  log.type === 'INSERT'
                    ? 'bg-emerald-900 text-emerald-300'
                    : log.type === 'UPDATE'
                    ? 'bg-sky-900 text-sky-300'
                    : log.type === 'BROADCAST'
                    ? 'bg-purple-900 text-purple-300'
                    : log.type === 'ERROR'
                    ? 'bg-rose-900 text-rose-300'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {log.type}
              </span>
              <span className="text-slate-200">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
