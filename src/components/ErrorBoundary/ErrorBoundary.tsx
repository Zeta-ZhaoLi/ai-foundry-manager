import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200 p-6">
          <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-400 mb-4">
              出错了
            </h1>
            <p className="text-sm text-gray-400 mb-4">
              应用程序遇到了一个错误。请刷新页面重试。
            </p>
            {this.state.error && (
              <details className="text-xs text-gray-500 bg-gray-950 p-3 rounded border border-gray-800">
                <summary className="cursor-pointer mb-2">错误详情</summary>
                <pre className="whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
