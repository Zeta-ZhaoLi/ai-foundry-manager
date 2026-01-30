import React, { Component, ErrorInfo, ReactNode } from 'react';
import i18n from '../../i18n';

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
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-md w-full bg-background border border-border rounded-lg p-6 shadow-lg">
            <h1 className="text-xl font-semibold text-red-400 mb-4">
              {i18n.t('errorBoundary.title')}
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {i18n.t('errorBoundary.description')}
            </p>
            {this.state.error && (
              <details className="text-xs text-muted-foreground bg-muted p-3 rounded border border-border">
                <summary className="cursor-pointer mb-2">
                  {i18n.t('errorBoundary.details')}
                </summary>
                <pre className="whitespace-pre-wrap">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              {i18n.t('errorBoundary.reload')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
