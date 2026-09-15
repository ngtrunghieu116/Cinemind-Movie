import React from 'react';
import Button from '../ui/Button';
import { RefreshCw, AlertOctagon } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-slate-50">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <AlertOctagon size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Đã xảy ra lỗi giao diện</h2>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Rất tiếc, đã có sự cố không mong muốn trong ứng dụng. Chúng tôi khuyên bạn nên thử lại.
          </p>
          <Button variant="primary" icon={RefreshCw} onClick={this.handleReset}>
            Tải lại trang chủ
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
