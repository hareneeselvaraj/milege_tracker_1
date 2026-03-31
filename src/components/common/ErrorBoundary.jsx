import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', this.props.name || 'Unknown', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-6 px-8">
          <div className="w-16 h-16 rounded-3xl bg-danger-soft flex items-center justify-center">
            <AlertTriangle size={32} className="text-danger" />
          </div>
          <div className="text-center">
            <h3 className="font-black text-lg text-primary mb-2">Something went wrong</h3>
            <p className="text-xs text-secondary leading-relaxed max-w-[280px]">
              {this.props.name ? `The ${this.props.name} section` : 'This section'} encountered an error.
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="premium-btn flex items-center gap-2 px-6 py-3 text-sm"
            style={{ color: 'var(--bg-primary)' }}
          >
            <RefreshCcw size={16} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
