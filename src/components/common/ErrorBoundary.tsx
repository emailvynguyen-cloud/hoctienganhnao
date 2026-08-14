import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  onResetView?: () => void;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[React Error Boundary Caught Exception]:', error, errorInfo);
    (this as any).setState({ error, errorInfo });
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null, errorInfo: null });
    const props = (this as any).props;
    if (props && props.onResetView) {
      props.onResetView();
    } else {
      window.location.reload();
    }
  };

  public render() {
    const state = (this as any).state || {};
    const props = (this as any).props || {};

    if (state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 select-none animate-fadeIn">
          <div className="max-w-lg w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl backdrop-blur-md text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30 shadow-inner">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                {props.fallbackTitle || 'Đã Xảy Ra Lỗi Hiển Thị Giao Diện'}
              </h2>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Hệ thống đã tự động khoanh vùng lỗi để bảo vệ dữ liệu trung tâm. Bạn có thể bấm khôi phục bên dưới để quay lại trạng thái hoạt động bình thường.
              </p>
            </div>

            {state.error && (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left font-mono text-[11px] text-rose-300 space-y-1 overflow-x-auto max-h-36">
                <div className="font-bold flex items-center text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  <span>{state.error.name}: {state.error.message}</span>
                </div>
                {state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-slate-400 whitespace-pre-wrap leading-normal pt-1 border-t border-slate-800/80">
                    {state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center justify-center space-x-3 pt-2">
              {props.onResetView && (
                <button
                  onClick={props.onResetView}
                  className="px-4 py-2.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition flex items-center shadow-md cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Về Trang Chủ
                </button>
              )}

              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black transition flex items-center shadow-lg cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" /> Tải Lại Trang (Reload)
              </button>
            </div>
          </div>
        </div>
      );
    }

    return props.children;
  }
}
