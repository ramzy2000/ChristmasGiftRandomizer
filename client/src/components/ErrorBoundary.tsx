import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container">
          <div className="card">
            <h1>Something went wrong</h1>
            <p>We're sorry, but something unexpected happened.</p>
            {this.state.error && (
              <details style={{ marginTop: '1rem' }}>
                <summary>Error details</summary>
                <pre style={{ marginTop: '0.5rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.href = '/';
              }}
              style={{ marginTop: '1rem' }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

