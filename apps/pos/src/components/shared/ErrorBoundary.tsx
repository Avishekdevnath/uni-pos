import React, { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  resetKey?: unknown;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromProps(props: Props, state: State & { prevResetKey?: unknown }) {
    if (state.hasError && props.resetKey !== state.prevResetKey) {
      return { hasError: false, message: '', prevResetKey: props.resetKey };
    }
    return { prevResetKey: props.resetKey };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
    this.setState({ hasError: true, message: error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-bg">
          <div
            className="rounded-xl p-8 max-w-sm w-full text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-text1 font-semibold text-lg mb-2">Something went wrong</h2>
            <p className="text-text2 text-sm mb-6" style={{ wordBreak: 'break-word' }}>
              {this.state.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: 'var(--accent)', color: '#ffffff' }}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
