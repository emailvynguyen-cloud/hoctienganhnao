import { StrictMode, Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in MS. VY ENGLISH App:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-purple-50 flex items-center justify-center p-6 text-slate-800">
          <div className="bg-white p-8 rounded-3xl border-2 border-purple-200 shadow-xl max-w-md w-full text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto text-3xl font-black">
              🎀
            </div>
            <h2 className="text-xl font-black text-slate-900">
              Hệ Thống MS. VY ENGLISH
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Ứng dụng vừa khởi chạy dữ liệu phiên bản mới. Vui lòng ấn nút dưới đây để tự động làm mới bộ nhớ đệm.
            </p>

            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-2xl bg-purple-600 text-white font-black text-xs hover:bg-purple-700 transition shadow-lg shadow-purple-500/20"
            >
              🔄 Tải Lại Trang & Khôi Phục Dữ Liệu
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
