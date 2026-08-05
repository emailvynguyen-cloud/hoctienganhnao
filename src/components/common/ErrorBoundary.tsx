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
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[React Error Boundary Caught Exception]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onResetView) {
      this.props.onResetView();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] p-6 flex flex-col items-center justify-center animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-rose-300 dark:border-rose-800 p-8 max-w-lg w-full text-center space-y-5 shadow-2xl relative text-slate-800 dark:text-white">
            
            <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto shadow-sm border border-rose-200 animate-bounce">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 uppercase tracking-wider border border-rose-200">
                ⚠️ HỆ THỐNG PHÁT HIỆN LỖI HIỂN THỊ
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white pt-1">
                {this.props.fallbackTitle || 'Đã Xảy Ra Lỗi Hiển Thị Giao Diện'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Rất tiếc, đã có xung đột dữ liệu hoặc thành phần hiển thị chưa hoàn tất. Hệ thống đã tự động ngăn chặn màn hình trắng.
              </p>
            </div>

            {/* Error Detail Stack for Debugging */}
            {this.state.error && (
              <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-slate-800/80 border border-rose-200 text-left font-mono text-[11px] text-rose-900 dark:text-rose-300 space-y-1 max-h-36 overflow-y-auto">
                <span className="font-bold flex items-center text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Chi tiết lỗi (Log Debug):
                </span>
                <p className="break-words font-semibold">{this.state.error.toString()}</p>
              </div>
            )}

            {/* Action Controls */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" /> Thử Tải Lại Giao Diện
              </button>

              {this.props.onResetView && (
                <button
                  onClick={this.props.onResetView}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-extrabold text-xs border border-slate-300 transition flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay Về Giao Diện Quản Trị
                </button>
              )}
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
